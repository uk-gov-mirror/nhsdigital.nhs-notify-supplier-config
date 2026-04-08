export type LoadPlan = {
  /** The location of the JSON source files to load. */
  sourcePath: string;
  /** The environment to which the records will be published. */
  env: string;
  /** The name of the DynamoDB table to which records will be published. */
  tableName: string;
  /** If true, do not write to DynamoDB and do not require AWS credentials. */
  dryRun: boolean;
  /** If true, bypass safety checks that would otherwise block upload. */
  force: boolean;
};

export type AuditRecord = {
  pk: string;
  sk: string;
  status?: string;
};

export type AuditResult = {
  /** Records currently in DDB which are not DISABLED and not present in local config */
  blockingRecords: AuditRecord[];
};
