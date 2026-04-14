import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";

import {
  loadConfigStore,
  validateConfigStore,
} from "@supplier-config/file-store";
import type {
  ConfigRecord,
  ValidationIssue,
} from "@supplier-config/file-store";

import { auditBeforeLoad } from "./ddb/audit";
import { publishRecords } from "./ddb/publish";
import type { LoadPlan } from "./types";

function issueLabel(i: {
  entity: string;
  sourceFilePath: string;
  path?: (string | number)[];
  message: string;
}): string {
  const pathPart = i.path?.length ? `:${i.path.join(".")}` : "";
  return `${i.entity} ${i.sourceFilePath}${pathPart} - ${i.message}`;
}

function logStep(message: string): void {
  // We're not using a ContextLogger here as we don't expect to run this CLI tool in a lambda and don't need
  // structured logs - just feedback on the upload process.
  process.stdout.write(`[ddb-publisher] ${message}\n`);
}

function isLocalDynamoEndpoint(endpoint: string): boolean {
  try {
    const { hostname } = new URL(endpoint);
    return ["localhost", "127.0.0.1", "::1", "0.0.0.0"].includes(hostname);
  } catch {
    return false;
  }
}

function summarizeEntities(records: ConfigRecord[]): string {
  const counts = new Map<string, number>();

  for (const r of records) {
    counts.set(r.entity, (counts.get(r.entity) ?? 0) + 1);
  }

  return [...counts.entries()]
    .toSorted(([a], [b]) => a.localeCompare(b))
    .map(([entity, count]) => `${entity}=${count}`)
    .join(", ");
}

async function runPublisher(plan: LoadPlan): Promise<void> {
  logStep(
    `Starting publish run source='${plan.sourcePath}' env='${plan.env}' table='${plan.tableName}' force=${plan.force} dryRun=${plan.dryRun}`,
  );

  logStep("Loading config store from disk...");
  const store = await loadConfigStore(plan.sourcePath);
  const entitySummary =
    store.records.length > 0 ? ` (${summarizeEntities(store.records)})` : "";
  logStep(`Loaded ${store.records.length} records${entitySummary}.`);

  logStep("Validating loaded records against schemas...");
  const validation = validateConfigStore(store);

  if (!validation.ok) {
    logStep(`Validation failed with ${validation.issues.length} issue(s).`);

    const summary = validation.issues
      .slice(0, 20)
      .map((i: ValidationIssue) => issueLabel(i))
      .join("\n");

    throw new Error(
      `Config store validation failed with ${validation.issues.length} issue(s).\n${summary}`,
    );
  }

  logStep("Validation passed.");

  if (plan.dryRun) {
    logStep("Dry-run enabled; skipping DynamoDB audit and publish.");
    return;
  }

  const endpointOverride = process.env.SUPPLIER_CONFIG_DDB_ENDPOINT_URL;

  if (endpointOverride) {
    logStep(`Using custom DynamoDB endpoint '${endpointOverride}'.`);
  }

  logStep("Initialising DynamoDB client...");
  const clientConfig: ConstructorParameters<typeof DynamoDBClient>[0] = {
    endpoint: endpointOverride,
  };

  if (endpointOverride && isLocalDynamoEndpoint(endpointOverride)) {
    clientConfig.region = process.env.AWS_REGION ?? "eu-west-2";
    clientConfig.credentials = {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID ?? "fakeMyKeyId",
      secretAccessKey:
        process.env.AWS_SECRET_ACCESS_KEY ?? "fakeSecretAccessKey",
    };
    logStep(
      `Using local DynamoDB defaults with region='${clientConfig.region}'.`,
    );
  }

  const client = new DynamoDBClient(clientConfig);
  const ddb = DynamoDBDocumentClient.from(client, {
    marshallOptions: {
      removeUndefinedValues: true,
    },
  });

  logStep("Auditing existing DynamoDB records...");
  const audit = await auditBeforeLoad({
    ddb,
    tableName: plan.tableName,
    localRecords: store.records,
  });
  logStep(`Audit completed. blockingRecords=${audit.blockingRecords.length}`);

  if (audit.blockingRecords.length > 0 && !plan.force) {
    logStep("Blocking records found and --force not set; aborting publish.");

    const examples = audit.blockingRecords
      .slice(0, 20)
      .map(
        (r: { pk: string; sk: string; status?: string }) =>
          `${r.pk} ${r.sk} status=${r.status ?? "<missing>"}`,
      )
      .join("\n");

    throw new Error(
      `Upload blocked: found ${audit.blockingRecords.length} existing DynamoDB record(s) that are not DISABLED and not present in local config.\nRe-run with --force to proceed.\n${examples}`,
    );
  }

  if (audit.blockingRecords.length > 0 && plan.force) {
    logStep("Blocking records found but --force enabled; continuing.");
  }

  logStep(`Publishing ${store.records.length} record(s) to DynamoDB...`);
  await publishRecords({
    ddb,
    tableName: plan.tableName,
    records: store.records,
  });

  logStep("Publish completed successfully.");
}

export default runPublisher;
