import type { z } from "zod";

export type DomainEntityName =
  | "volume-group"
  | "letter-variant"
  | "pack-specification"
  | "supplier"
  | "supplier-allocation"
  | "supplier-pack";

export type ConfigRecord = {
  entity: DomainEntityName;
  /** File path the record was loaded from (absolute). */
  sourceFilePath: string;
  /** Record identifier (usually filename without extension). */
  id: string;
  /** Parsed JSON object. */
  data: unknown;
};

export type LoadedConfigStore = {
  rootPath: string;
  records: ConfigRecord[];
};

export type ValidationIssue = {
  entity: DomainEntityName;
  sourceFilePath: string;
  message: string;
  path?: (string | number)[];
};

export type ValidationResult = {
  ok: boolean;
  issues: ValidationIssue[];
};

export type EntitySchemaMap = Record<DomainEntityName, z.ZodTypeAny>;
