import type { ScanCommandInput } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";

import type { ConfigRecord } from "@supplier-config/file-store";

import { auditBeforeLoad } from "packages/ddb-publisher/src/ddb/audit";
import { pkForEntity, skForId } from "packages/ddb-publisher/src/ddb/keys";

function fakeDdb(items: any[]): DynamoDBDocumentClient {
  return {
    send: async (command: any) => {
      const input = command.input as ScanCommandInput;
      if (input.ExclusiveStartKey) {
        return { Items: [], LastEvaluatedKey: undefined };
      }
      return { Items: items, LastEvaluatedKey: undefined };
    },
  } as unknown as DynamoDBDocumentClient;
}

function fakePagedDdb(pages: any[]): DynamoDBDocumentClient {
  let call = 0;
  return {
    send: async () => {
      const page =
        call < pages.length
          ? pages.at(call)
          : { Items: [], LastEvaluatedKey: undefined };
      call += 1;
      return page ?? { Items: [], LastEvaluatedKey: undefined };
    },
  } as unknown as DynamoDBDocumentClient;
}

describe("auditBeforeLoad", () => {
  it("should flag blocking records that are not DISABLED and are not present locally", async () => {
    const local: ConfigRecord[] = [
      {
        entity: "supplier",
        sourceFilePath: "/tmp/supplier/1.json",
        id: "1",
        data: {},
      },
    ];

    const items = [
      { pk: pkForEntity("supplier"), sk: skForId("1"), status: "ACTIVE" }, // present locally
      { pk: pkForEntity("supplier"), sk: skForId("2"), status: "ACTIVE" }, // blocking
      { pk: pkForEntity("supplier"), sk: skForId("3"), status: "DISABLED" }, // ok
    ];

    const result = await auditBeforeLoad({
      ddb: fakeDdb(items),
      tableName: "tbl",
      localRecords: local,
    });

    expect(result.blockingRecords).toHaveLength(1);
    expect(result.blockingRecords[0]).toMatchObject({
      pk: pkForEntity("supplier"),
      sk: skForId("2"),
      status: "ACTIVE",
    });
  });

  it("should scan multiple pages", async () => {
    const local: ConfigRecord[] = [
      {
        entity: "supplier",
        sourceFilePath: "/tmp/supplier/1.json",
        id: "1",
        data: {},
      },
    ];

    const pages = [
      {
        Items: [
          { pk: pkForEntity("supplier"), sk: skForId("1"), status: "ACTIVE" },
          { pk: pkForEntity("supplier"), sk: skForId("2"), status: "ACTIVE" },
          { pk: pkForEntity("supplier"), sk: skForId("3"), status: "DISABLED" },
        ],
        LastEvaluatedKey: { pk: "next" },
      },
      {
        Items: [
          { pk: pkForEntity("supplier"), sk: skForId("4"), status: "ACTIVE" },
        ],
        LastEvaluatedKey: undefined,
      },
    ];

    const result = await auditBeforeLoad({
      ddb: fakePagedDdb(pages),
      tableName: "tbl",
      localRecords: local,
    });

    const actual = result.blockingRecords
      .map((b) => b.sk)
      .toSorted((a, b) => a.localeCompare(b));

    expect(actual).toEqual(
      [skForId("2"), skForId("4")].toSorted((a, b) => a.localeCompare(b)),
    );
  });

  it("should treat missing Items as empty", async () => {
    const ddb = {
      send: async () => {
        return { LastEvaluatedKey: undefined };
      },
    } as unknown as DynamoDBDocumentClient;

    const result = await auditBeforeLoad({
      ddb,
      tableName: "tbl",
      localRecords: [],
    });

    expect(result.blockingRecords).toEqual([]);
  });

  it("should not block when a record exists locally even if it is not DISABLED", async () => {
    const local: ConfigRecord[] = [
      {
        entity: "supplier",
        sourceFilePath: "/tmp/supplier/1.json",
        id: "1",
        data: {},
      },
    ];

    const ddb = {
      send: async () => {
        return {
          Items: [
            {
              pk: pkForEntity("supplier"),
              sk: skForId("1"),
              status: "ACTIVE",
            },
          ],
          LastEvaluatedKey: undefined,
        };
      },
    } as unknown as DynamoDBDocumentClient;

    const result = await auditBeforeLoad({
      ddb,
      tableName: "tbl",
      localRecords: local,
    });

    expect(result.blockingRecords).toEqual([]);
  });

  it("should treat missing status as not disabled and therefore blocking when not local", async () => {
    const result = await auditBeforeLoad({
      ddb: fakeDdb([{ pk: "ENTITY#supplier", sk: "ID#1" }]),
      tableName: "tbl",
      localRecords: [],
    });

    expect(result.blockingRecords).toEqual([
      { pk: "ENTITY#supplier", sk: "ID#1", status: undefined },
    ]);
  });

  it("should throw when pk/sk are not strings", async () => {
    await expect(
      auditBeforeLoad({
        ddb: fakeDdb([{ pk: 123, sk: 456, status: "ACTIVE" }]),
        tableName: "tbl",
        localRecords: [],
      }),
    ).rejects.toThrow("Invalid DynamoDB record encountered during audit scan");
  });

  it("should throw if a scanned item is missing pk or sk", async () => {
    const ddb = {
      send: async () => {
        return {
          Items: [{ pk: "", sk: "ID#1", status: "ACTIVE" }],
          LastEvaluatedKey: undefined,
        };
      },
    } as unknown as DynamoDBDocumentClient;

    await expect(
      auditBeforeLoad({
        ddb,
        tableName: "tbl",
        localRecords: [],
      }),
    ).rejects.toThrow("Invalid DynamoDB record encountered during audit scan");
  });

  it("should include <missing> when pk/sk properties are absent", async () => {
    const ddb = {
      send: async () => {
        return {
          Items: [{ status: "ACTIVE" }],
          LastEvaluatedKey: undefined,
        };
      },
    } as unknown as DynamoDBDocumentClient;

    await expect(
      auditBeforeLoad({
        ddb,
        tableName: "tbl",
        localRecords: [],
      }),
    ).rejects.toThrow("Invalid DynamoDB record encountered during audit scan");
  });
});
