import {
  BatchWriteCommand,
  DynamoDBDocumentClient,
} from "@aws-sdk/lib-dynamodb";
import {
  PublishBatchCommand,
  PublishBatchRequestEntry,
  SNSClient,
} from "@aws-sdk/client-sns";
import { z } from "zod";

import type { ConfigRecord } from "@supplier-config/file-store";

import { pkForEntity, skForId } from "./keys";
import { mapToEvents } from "../record-mapper";

const persistedRecordShapeSchema = z.looseObject({
  id: z.string(),
});

function itemForRecord(record: ConfigRecord): Record<string, unknown> {
  const base = persistedRecordShapeSchema.parse(record.data);

  return {
    pk: pkForEntity(record.entity),
    sk: skForId(record.id),
    ...base,
  };
}

function delay(milliseconds: number): Promise<void> {
  return new Promise((resolveDelay) => {
    setTimeout(resolveDelay, milliseconds);
  });
}

export async function publishRecords(params: {
  ddb: DynamoDBDocumentClient;
  tableName: string;
  records: ConfigRecord[];
}): Promise<void> {
  const chunks: ConfigRecord[][] = [];
  for (let i = 0; i < params.records.length; i += 25) {
    chunks.push(params.records.slice(i, i + 25));
  }

  for (const chunk of chunks) {
    let unprocessed = chunk.map((r) => ({
      PutRequest: {
        Item: itemForRecord(r),
      },
    }));

    // Retry unprocessed items with simple backoff
    for (let attempt = 0; attempt < 5 && unprocessed.length > 0; attempt += 1) {
      const result = await params.ddb.send(
        new BatchWriteCommand({
          RequestItems: {
            [params.tableName]: unprocessed,
          },
        }),
      );

      // Unprocessed items are always a subset of the original batch ({PutRequest}[]), so we skip a
      // type check for the result and just cast to the expected shape.
      unprocessed = (result.UnprocessedItems?.[params.tableName] ??
        []) as any[];

      if (unprocessed.length > 0) {
        await delay(50 * 2 ** attempt);
      }
    }

    if (unprocessed.length > 0) {
      throw new Error(
        `Failed to write ${unprocessed.length} items after retries (BatchWrite unprocessed).`,
      );
    }
  }
}

function buildMessage(
  event: { id: string },
  index: number,
): PublishBatchRequestEntry {
  return {
    Id: `${event.id}-${index}`,
    Message: JSON.stringify(event),
  };
}

export async function publishRecords2(params: {
  sns: SNSClient;
  topicArn: string;
  records: ConfigRecord[];
}): Promise<void> {
  const chunks: ConfigRecord[][] = [];
  for (let i = 0; i < params.records.length; i += 10) {
    chunks.push(params.records.slice(i, i + 10));
  }

  for (const chunk of chunks) {
    let unprocessed = mapToEvents(chunk).map((event, index) =>
      buildMessage(event, index),
    );

    // Retry unprocessed items with simple backoff
    for (let attempt = 0; attempt < 5 && unprocessed.length > 0; attempt += 1) {
      const result = await params.sns.send(
        new PublishBatchCommand({
          TopicArn: params.topicArn,
          PublishBatchRequestEntries: unprocessed,
        }),
      );

      const unprocessedIds = new Set(
        (result.Failed ?? []).map((errorEntry) => errorEntry.Id),
      );
      unprocessed = unprocessed.filter((entry) => unprocessedIds.has(entry.Id));
      if (unprocessed.length > 0) {
        await delay(50 * 2 ** attempt);
      }
    }

    if (unprocessed.length > 0) {
      throw new Error(
        `Failed to write ${unprocessed.length} items after retries (BatchWrite unprocessed).`,
      );
    }
  }
}
