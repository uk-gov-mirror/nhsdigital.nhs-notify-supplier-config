import { z } from "zod";
import * as fs from "node:fs";
import {
  $LetterVariant,
  $PackSpecification,
  $Supplier,
  $SupplierAllocation,
  $SupplierPack,
  $VolumeGroup,
} from "../domain";
import {
  $LetterVariantEvent,
  letterVariantEvents,
} from "../events/letter-variant-events";
import {
  $PackSpecificationEvent,
  packSpecificationEvents,
} from "../events/pack-specification-events";
import {
  $SupplierAllocationEvent,
  supplierAllocationEvents,
} from "../events/supplier-allocation-events";
import {
  $SupplierPackEvent,
  supplierPackEvents,
} from "../events/supplier-pack-events";
import { $SupplierEvent, supplierEvents } from "../events/supplier-events";
import {
  $VolumeGroupEvent,
  volumeGroupEvents,
} from "../events/volume-group-events";

/**
 * Generate JSON schema for a single Zod schema and write to file
 */
function generateJsonSchema(
  schema: z.ZodTypeAny,
  outputPath: string,
  schemaName: string,
): void {
  const jsonSchema = z.toJSONSchema(schema, {
    io: "input",
    target: "openapi-3.0",
    reused: "ref",
  });
  // eslint-disable-next-line security/detect-non-literal-fs-filename
  fs.writeFileSync(outputPath, JSON.stringify(jsonSchema, null, 2));
  console.info(`Wrote JSON schema for ${schemaName} to ${outputPath}`);
}

/**
 * Generate JSON schemas for domain models
 */
function generateDomainSchemas(domainModels: Record<string, z.ZodTypeAny>) {
  fs.mkdirSync("schemas/domain", { recursive: true });
  for (const [key, schema] of Object.entries(domainModels)) {
    const outFile = `schemas/domain/${key}.schema.json`;
    generateJsonSchema(schema, outFile, key);
  }
}

/**
 * Generate JSON schemas for event types
 */
function generateEventSchemas(eventSchemas: Record<string, z.ZodTypeAny>) {
  fs.mkdirSync("schemas/events", { recursive: true });
  for (const [key, schema] of Object.entries(eventSchemas)) {
    const outFile = `schemas/events/${key}.schema.json`;
    generateJsonSchema(schema, outFile, key);
  }
}

/**
 * Generate a generic "any" event schema that matches any status for a given event type
 */
function generateAnyEventSchema(schema: z.ZodTypeAny, eventTypeName: string) {
  fs.mkdirSync("schemas/events", { recursive: true });
  const outFile = `schemas/events/${eventTypeName}.any.schema.json`;
  generateJsonSchema(schema, outFile, `${eventTypeName}.any`);
}

// Generate domain schemas
generateDomainSchemas({
  "letter-variant": $LetterVariant,
  "pack-specification": $PackSpecification,
  "supplier-pack": $SupplierPack,
  "volume-group": $VolumeGroup,
  "supplier-allocation": $SupplierAllocation,
  supplier: $Supplier,
});

// Generate event schemas for letter variants
generateEventSchemas(letterVariantEvents);
generateAnyEventSchema($LetterVariantEvent, "letter-variant");

// Generate event schemas for pack specifications
generateEventSchemas(packSpecificationEvents);
generateAnyEventSchema($PackSpecificationEvent, "pack-specification");

// Generate event schemas for supplier allocations
generateEventSchemas(supplierAllocationEvents);
generateAnyEventSchema($SupplierAllocationEvent, "supplier-allocation");

// Generate event schemas for supplier packs
generateEventSchemas(supplierPackEvents);
generateAnyEventSchema($SupplierPackEvent, "supplier-pack");

// Generate event schemas for suppliers
generateEventSchemas(supplierEvents);
generateAnyEventSchema($SupplierEvent, "supplier");

// Generate event schemas for volume groups
generateEventSchemas(volumeGroupEvents);
generateAnyEventSchema($VolumeGroupEvent, "volume-group");
