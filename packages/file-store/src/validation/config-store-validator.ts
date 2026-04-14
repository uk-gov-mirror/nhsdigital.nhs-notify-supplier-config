import {
  $LetterVariant,
  $PackSpecification,
  $Supplier,
  $SupplierAllocation,
  $SupplierPack,
  $VolumeGroup,
} from "@nhsdigital/nhs-notify-event-schemas-supplier-config";

import type {
  DomainEntityName,
  EntitySchemaMap,
  LoadedConfigStore,
  ValidationIssue,
  ValidationResult,
} from "@supplier-config/file-store";

const schemaByEntity: EntitySchemaMap = {
  "volume-group": $VolumeGroup,
  "letter-variant": $LetterVariant,
  "pack-specification": $PackSpecification,
  supplier: $Supplier,
  "supplier-allocation": $SupplierAllocation,
  "supplier-pack": $SupplierPack,
};

export function normalizeIssuePath(path: PropertyKey[]): (string | number)[] {
  return path
    .filter(
      (p): p is string | number =>
        typeof p === "string" || typeof p === "number",
    )
    .map((p) => p);
}

function validateRecordId(record: {
  entity: DomainEntityName;
  sourceFilePath: string;
  id: string;
  data: { id: string };
}): ValidationIssue[] {
  return record.data.id === record.id
    ? []
    : [
        {
          entity: record.entity,
          sourceFilePath: record.sourceFilePath,
          message: `Record id '${record.data.id}' does not match filename id '${record.id}'.`,
          path: ["id"],
        },
      ];
}

/**
 * Parses and validates all records in a config store against their respective schemas, returning a list of any issues found.
 * The validation is performed on all records and all issues are collected before returning, so that a single run can report
 * multiple problems in the config store.
 *
 * It is expected that additional business rules will be added to the function in the future,
 * such as checks for duplicate IDs across entities or cross-references between records.
 * @param store
 */
export function validateConfigStore(
  store: LoadedConfigStore,
): ValidationResult {
  const issues: ValidationIssue[] = [];

  for (const record of store.records) {
    const schema = schemaByEntity[record.entity];
    const parsed = schema.safeParse(record.data);

    if (parsed.success) {
      issues.push(
        ...validateRecordId({
          ...record,
          data: parsed.data as { id: string },
        }),
      );
    } else {
      for (const issue of parsed.error.issues) {
        issues.push({
          entity: record.entity,
          sourceFilePath: record.sourceFilePath,
          message: issue.message,
          path: normalizeIssuePath(issue.path),
        });
      }
    }
  }

  return {
    ok: issues.length === 0,
    issues,
  };
}
