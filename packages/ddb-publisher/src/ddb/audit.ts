import type { AttributeValue } from "@aws-sdk/client-dynamodb";
import {
  DynamoDBDocumentClient,
  ScanCommand,
  ScanCommandOutput,
} from "@aws-sdk/lib-dynamodb";
import { z } from "zod";

import type { ConfigRecord } from "@supplier-config/file-store";

import type {
  AuditRecord,
  AuditResult,
} from "packages/ddb-publisher/src/types";
import { pkForEntity, skForId } from "packages/ddb-publisher/src/ddb/keys";

function localKeySet(records: ConfigRecord[]): Set<string> {
  const set = new Set<string>();
  for (const r of records) {
    set.add(`${pkForEntity(r.entity)}|${skForId(r.id)}`);
  }
  return set;
}

/**
 * Schema matching the DDB scan projection used in the audit.
 */
const scannedItemSchema = z.object({
  pk: z.string().min(1),
  sk: z.string().min(1),
  status: z.string().optional(),
});

function parseScannedItem(rawItem: unknown): AuditRecord {
  const parsed = scannedItemSchema.safeParse(rawItem);

  if (!parsed.success) {
    throw new Error(
      `Invalid DynamoDB record encountered during audit scan. ${parsed.error.message}`,
    );
  }

  return parsed.data;
}

function isBlockingRecord(
  record: AuditRecord,
  localKeys: Set<string>,
): boolean {
  const key = `${record.pk}|${record.sk}`;
  return record.status !== "DISABLED" && !localKeys.has(key);
}

/**
 * Find any records in DynamoDB that would block loading the provided local records
 * (i.e. records that exist in DynamoDB and are not disabled, but not in the local set at all).
 * @param params
 */
export async function auditBeforeLoad(params: {
  ddb: DynamoDBDocumentClient;
  tableName: string;

  /** Local records to load into ddb/tableName */
  localRecords: ConfigRecord[];
}): Promise<AuditResult> {
  const local = localKeySet(params.localRecords);

  const blockingRecords: AuditRecord[] = [];

  let lastEvaluatedKey: Record<string, AttributeValue> | null = null;

  // Scan all records in the table (projecting only keys used for validation)
  do {
    const page: ScanCommandOutput = await params.ddb.send(
      new ScanCommand({
        TableName: params.tableName,
        ExclusiveStartKey: lastEvaluatedKey ?? undefined,
        ProjectionExpression: "pk, sk, #status",
        ExpressionAttributeNames: {
          "#status": "status",
        },
      }),
    );

    for (const rawItem of page.Items ?? []) {
      const scannedItem = parseScannedItem(rawItem);

      if (isBlockingRecord(scannedItem, local)) {
        blockingRecords.push(scannedItem);
      }
    }

    lastEvaluatedKey = page.LastEvaluatedKey ?? null;
  } while (lastEvaluatedKey);

  return { blockingRecords };
}
