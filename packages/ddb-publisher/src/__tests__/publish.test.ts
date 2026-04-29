import type { ConfigRecord } from "@supplier-config/file-store";

import { PublishBatchCommand } from "@aws-sdk/client-sns";
import { publishRecords, publishRecords2 } from "../ddb/publish";

function makeRecords(count: number): ConfigRecord[] {
  return Array.from({ length: count }, (_, i) => ({
    entity: "supplier",
    sourceFilePath: `/tmp/supplier/${i}.json`,
    id: String(i),
    data: { id: String(i), ok: true },
  }));
}

function fakeDdb() {
  const calls: any[] = [];
  return {
    calls,
    ddb: {
      send: async (command: any) => {
        calls.push(command.input);
        return { UnprocessedItems: {} };
      },
    },
  };
}

function fakeSns() {
  const calls: any[] = [];
  return {
    calls,
    sns: {
      send: async (command: PublishBatchCommand) => {
        calls.push(command.input);
        return { Successful: command.input.PublishBatchRequestEntries };
      },
    },
  };
}

describe("publishRecords", () => {
  beforeEach(() => {
    jest.spyOn(globalThis, "setTimeout").mockImplementation((fn: any) => {
      fn();
      return 0 as any;
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("should do nothing when records is empty", async () => {
    const send = jest.fn();

    await publishRecords({
      ddb: { send } as any,
      tableName: "tbl",
      records: [],
    });

    expect(send).not.toHaveBeenCalled();
  });

  it("should batch writes in chunks of 25", async () => {
    const { calls, ddb } = fakeDdb();

    await publishRecords({
      ddb: ddb as any,
      tableName: "tbl",
      records: makeRecords(26),
    });

    expect(calls).toHaveLength(2);
    expect(Object.values(calls[0].RequestItems)[0]).toHaveLength(25);
    expect(Object.values(calls[1].RequestItems)[0]).toHaveLength(1);
  });

  it("should write the expected DDB item shape", async () => {
    const { calls, ddb } = fakeDdb();

    await publishRecords({
      ddb: ddb as any,
      tableName: "tbl",
      records: [
        {
          entity: "supplier",
          sourceFilePath: "/tmp/supplier/sup-1.json",
          id: "sup-1",
          data: {
            id: "sup-1",
            name: "Example Supplier",
            status: "DRAFT",
            dailyCapacity: 100,
          },
        },
      ],
    });

    expect(calls[0].RequestItems.tbl).toEqual([
      {
        PutRequest: {
          Item: {
            pk: "ENTITY#supplier",
            sk: "ID#sup-1",
            id: "sup-1",
            name: "Example Supplier",
            status: "DRAFT",
            dailyCapacity: 100,
          },
        },
      },
    ]);
  });

  it("should retry unprocessed items until they are all processed", async () => {
    let call = 0;

    const ddb = {
      send: async () => {
        call += 1;

        if (call === 1) {
          return {
            UnprocessedItems: {
              tbl: [{ PutRequest: { Item: { pk: "p", sk: "s" } } }],
            },
          };
        }

        return { UnprocessedItems: {} };
      },
    };

    await publishRecords({
      ddb: ddb as any,
      tableName: "tbl",
      records: makeRecords(1),
    });

    expect(call).toBe(2);
  });

  it("should throw when unprocessed items remain after retries", async () => {
    const ddb = {
      send: async () => {
        return {
          UnprocessedItems: {
            tbl: [{ PutRequest: { Item: { pk: "p", sk: "s" } } }],
          },
        };
      },
    };

    await expect(
      publishRecords({
        ddb: ddb as any,
        tableName: "tbl",
        records: makeRecords(1),
      }),
    ).rejects.toThrow("Failed to write");
  });

  it("should reject records that are not objects with an id string", async () => {
    const { ddb } = fakeDdb();

    await expect(
      publishRecords({
        ddb: ddb as any,
        tableName: "tbl",
        records: [
          {
            entity: "supplier",
            sourceFilePath: "/tmp/supplier/sup-1.json",
            id: "sup-1",
            data: "not-an-object",
          },
        ],
      }),
    ).rejects.toThrow();
  });
});

describe("publishRecords2", () => {
  beforeEach(() => {
    jest.spyOn(globalThis, "setTimeout").mockImplementation((fn: any) => {
      fn();
      return 0 as any;
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("should do nothing when records is empty", async () => {
    const send = jest.fn();

    await publishRecords2({
      sns: { send } as any,
      topicArn: "topic:arn",
      records: [],
    });

    expect(send).not.toHaveBeenCalled();
  });

  it("should batch writes in chunks of 10", async () => {
    const { calls, sns } = fakeSns();

    await publishRecords2({
      sns: sns as any,
      topicArn: "topic:arn",
      records: makeRecords(26),
    });

    expect(calls).toHaveLength(3);
    expect(Object.values(calls[0].PublishBatchRequestEntries)).toHaveLength(10);
    expect(Object.values(calls[1].PublishBatchRequestEntries)).toHaveLength(10);
    expect(Object.values(calls[2].PublishBatchRequestEntries)).toHaveLength(6);
  });

  it("should write the expected SNS item shape", async () => {
    const { calls, sns } = fakeSns();

    await publishRecords2({
      sns: sns as any,
      topicArn: "topic:arn",
      records: [
        {
          entity: "supplier",
          sourceFilePath: "/tmp/supplier/sup-1.json",
          id: "sup-1",
          data: {
            id: "sup-1",
            name: "Example Supplier",
            channelType: "LETTER",
            status: "DRAFT",
            dailyCapacity: 100,
          },
        },
      ],
    });

    expect(calls[0].TopicArn).toBe("topic:arn");
    expect(calls[0].PublishBatchRequestEntries).toHaveLength(1);

    const entry = calls[0].PublishBatchRequestEntries[0];
    expect(entry.Id).toMatch(/-0$/);

    const message = JSON.parse(calls[0].PublishBatchRequestEntries[0].Message);
    expect(message).toMatchObject({
      subject: "supplier/sup-1",
      type: "uk.nhs.notify.supplier-config.supplier",
      data: {
        id: "sup-1",
        name: "Example Supplier",
        channelType: "LETTER",
        status: "DRAFT",
        dailyCapacity: 100,
      },
    });
  });

  it("should retry unprocessed items until they are all processed", async () => {
    let call = 0;

    const sns = {
      send: async (command: PublishBatchCommand) => {
        call += 1;

        if (call === 1) {
          return {
            Failed: command.input.PublishBatchRequestEntries,
          };
        }

        return { Successful: command.input.PublishBatchRequestEntries };
      },
    };

    await publishRecords2({
      sns: sns as any,
      topicArn: "topicArn",
      records: makeRecords(1),
    });

    expect(call).toBe(2);
  });

  it("should throw when unprocessed items remain after retries", async () => {
    const sns = {
      send: async (command: PublishBatchCommand) => {
        return {
          Failed: command.input.PublishBatchRequestEntries,
        };
      },
    };

    await expect(
      publishRecords2({
        sns: sns as any,
        topicArn: "topicArn",
        records: makeRecords(1),
      }),
    ).rejects.toThrow("Failed to write");
  });
});
