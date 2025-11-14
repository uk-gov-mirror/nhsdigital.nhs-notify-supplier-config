import {
  BatchWriteItemCommand,
  DynamoDBClient,
  type WriteRequest,
} from "@aws-sdk/client-dynamodb";
import { marshall } from "@aws-sdk/util-dynamodb";
import type { ParseResult } from "./parse-excel";

/**
 * Single-table design for supplier config.
 *
 * PK and SK patterns:
 * - VolumeGroup:        PK = "VOLUME_GROUP"       SK = "<volumeGroupId>"
 * - Supplier:           PK = "SUPPLIER"           SK = "<supplierId>"
 * - PackSpecification:  PK = "PACK_SPEC"          SK = "<packSpecificationId>"
 * - LetterVariant:      PK = "LETTER_VARIANT"     SK = "<letterVariantId>"
 * - SupplierAllocation: PK = "SUPPLIER_ALLOC"     SK = "<allocationId>"
 * - SupplierPack:       PK = "SUPPLIER_PACK"      SK = "<supplierPackId>"
 */

type EntityType =
  | "VOLUME_GROUP"
  | "SUPPLIER"
  | "PACK_SPECIFICATION"
  | "LETTER_VARIANT"
  | "SUPPLIER_ALLOCATION"
  | "SUPPLIER_PACK";

interface DynamoDBItem {
  PK: string;
  SK: string;
  entityType: EntityType;
  data: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

function buildItems(data: ParseResult): DynamoDBItem[] {
  const items: DynamoDBItem[] = [];
  const now = new Date().toISOString();

  // Volume Groups
  for (const volumeGroup of Object.values(data.volumeGroups)) {
    items.push({
      PK: "VOLUME_GROUP",
      SK: volumeGroup.id,
      entityType: "VOLUME_GROUP",
      data: volumeGroup as unknown as Record<string, unknown>,
      createdAt: now,
      updatedAt: now,
    });
  }

  // Suppliers
  for (const supplier of Object.values(data.suppliers)) {
    items.push({
      PK: "SUPPLIER",
      SK: supplier.id,
      entityType: "SUPPLIER",
      data: supplier as unknown as Record<string, unknown>,
      createdAt: now,
      updatedAt: now,
    });
  }

  // Pack Specifications
  for (const pack of Object.values(data.packs)) {
    items.push({
      PK: "PACK_SPECIFICATION",
      SK: pack.id,
      entityType: "PACK_SPECIFICATION",
      data: pack as unknown as Record<string, unknown>,
      createdAt: pack.createdAt,
      updatedAt: pack.updatedAt,
    });
  }

  // Letter Variants
  for (const variant of Object.values(data.variants)) {
    items.push({
      PK: "LETTER_VARIANT",
      SK: variant.id,
      entityType: "LETTER_VARIANT",
      data: variant as unknown as Record<string, unknown>,
      createdAt: now,
      updatedAt: now,
    });
  }

  // Supplier Allocations
  for (const allocation of Object.values(data.allocations)) {
    items.push({
      PK: "SUPPLIER_ALLOCATION",
      SK: allocation.id,
      entityType: "SUPPLIER_ALLOCATION",
      data: allocation as unknown as Record<string, unknown>,
      createdAt: now,
      updatedAt: now,
    });
  }

  // Supplier Packs
  for (const supplierPack of Object.values(data.supplierPacks)) {
    items.push({
      PK: "SUPPLIER_PACK",
      SK: supplierPack.id,
      entityType: "SUPPLIER_PACK",
      data: supplierPack as unknown as Record<string, unknown>,
      createdAt: now,
      updatedAt: now,
    });
  }

  return items;
}

function chunkArray<T>(arr: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < arr.length; i += size) {
    chunks.push(arr.slice(i, i + size));
  }
  return chunks;
}

export interface PopulateOptions {
  tableName: string;
  region?: string;
  dryRun?: boolean;
}

export interface PopulateResult {
  itemCount: number;
  tableName: string;
  summary: Record<EntityType, number>;
}

export async function populateDynamoDB(
  data: ParseResult,
  options: PopulateOptions,
): Promise<PopulateResult> {
  const items = buildItems(data);

  const summary: Record<EntityType, number> = {
    VOLUME_GROUP: 0,
    SUPPLIER: 0,
    PACK_SPECIFICATION: 0,
    LETTER_VARIANT: 0,
    SUPPLIER_ALLOCATION: 0,
    SUPPLIER_PACK: 0,
  };

  for (const item of items) {
    summary[item.entityType] += 1;
  }

  if (options.dryRun) {
    console.log("Dry run mode - items would be written:");
    console.log(JSON.stringify(items.slice(0, 3), null, 2));
    if (items.length > 3) {
      console.log(`... and ${items.length - 3} more items`);
    }
    return {
      itemCount: items.length,
      tableName: options.tableName,
      summary,
    };
  }

  const region =
    options.region || process.env.AWS_REGION || process.env.AWS_DEFAULT_REGION;

  if (!region) {
    throw new Error(
      "AWS region not specified (--region flag or AWS_REGION env)",
    );
  }

  const client = new DynamoDBClient({ region });

  // DynamoDB BatchWriteItem supports max 25 items per call
  const batches = chunkArray(items, 25);

  for (const batch of batches) {
    const writeRequests: WriteRequest[] = batch.map((item) => ({
      PutRequest: {
        Item: marshall(
          {
            PK: item.PK,
            SK: item.SK,
            entityType: item.entityType,
            ...item.data,
            _createdAt: item.createdAt,
            _updatedAt: item.updatedAt,
          },
          { removeUndefinedValues: true },
        ),
      },
    }));

    const command = new BatchWriteItemCommand({
      RequestItems: {
        [options.tableName]: writeRequests,
      },
    });

    try {
      const response = await client.send(command);

      // Handle unprocessed items (retry logic could be added here)
      const unprocessed = response.UnprocessedItems?.[options.tableName];
      if (unprocessed && unprocessed.length > 0) {
        console.warn(
          `Warning: ${unprocessed.length} items were not processed in this batch`,
        );
      }
    } catch (error) {
      throw new Error(
        `Failed to write batch to DynamoDB: ${(error as Error).message}`,
      );
    }
  }

  return {
    itemCount: items.length,
    tableName: options.tableName,
    summary,
  };
}
