import { execFile } from "node:child_process";
import path from "node:path";
import { promisify } from "node:util";

import { PutItemCommand, ScanCommand } from "@aws-sdk/client-dynamodb";

import {
  createPublisherTable,
  deletePublisherTable,
  setupDynamoDBContainer,
} from "./dynamodb-local";
import type { DbTestContext } from "./dynamodb-local";

const execFileAsync = promisify(execFile);
const { resolve } = path;

const repoRoot = resolve(__dirname, "../../../..");
const exampleConfigStoreRoot = resolve(repoRoot, "tests/example-config-store");
const bundlePath = resolve(
  repoRoot,
  "packages/ddb-publisher/artifacts/ddb-publish/index.cjs",
);
const tableName = "supplier-config-it";
const expectedRecords = [
  {
    pk: "ENTITY#volume-group",
    sk: "ID#vg-1",
    id: "vg-1",
  },
  {
    pk: "ENTITY#letter-variant",
    sk: "ID#lv-1",
    id: "lv-1",
  },
  {
    pk: "ENTITY#pack-specification",
    sk: "ID#pack-spec-1",
    id: "pack-spec-1",
  },
  {
    pk: "ENTITY#supplier",
    sk: "ID#sup-1",
    id: "sup-1",
  },
  {
    pk: "ENTITY#supplier-allocation",
    sk: "ID#alloc-1",
    id: "alloc-1",
  },
  {
    pk: "ENTITY#supplier-pack",
    sk: "ID#sp-1",
    id: "sp-1",
  },
] as const;

let context: DbTestContext | null = null;

async function run(
  command: string,
  args: string[],
  cwd = repoRoot,
  env: NodeJS.ProcessEnv = process.env,
): Promise<{ stdout: string; stderr: string }> {
  return execFileAsync(command, args, { cwd, env });
}

function activeContext(): DbTestContext {
  if (!context) {
    throw new Error("DynamoDB test context was not initialised.");
  }

  return context;
}

async function runBundle(extraArgs: string[] = []): Promise<{
  stdout: string;
  stderr: string;
}> {
  return run(
    "node",
    [
      bundlePath,
      "--source",
      exampleConfigStoreRoot,
      "--env",
      "draft",
      "--table",
      tableName,
      ...extraArgs,
    ],
    repoRoot,
    {
      ...process.env,
      SUPPLIER_CONFIG_DDB_ENDPOINT_URL: activeContext().endpoint,
    },
  );
}

async function scanTable() {
  return activeContext().ddbClient.send(
    new ScanCommand({ TableName: tableName }),
  );
}

function expectExpectedRecords(
  items: NonNullable<Awaited<ReturnType<typeof scanTable>>["Items"]>,
): void {
  expect(items).toHaveLength(expectedRecords.length);

  for (const expectedRecord of expectedRecords) {
    const actual = items.find(
      (item) =>
        item.pk?.S === expectedRecord.pk && item.sk?.S === expectedRecord.sk,
    );

    expect(actual).toBeDefined();
    expect(actual?.id?.S).toBe(expectedRecord.id);
  }
}

describe("publish action integration (DynamoDB Local)", () => {
  beforeAll(async () => {
    try {
      context = await setupDynamoDBContainer();
      await createPublisherTable(context, tableName);
      await run("npm", [
        "run",
        "bundle:release",
        "--workspace",
        "@supplier-config/ddb-publisher",
      ]);
    } catch (error) {
      const reason = error instanceof Error ? error.message : String(error);
      const isVmModulesError = reason.includes(
        "ERR_VM_DYNAMIC_IMPORT_CALLBACK_MISSING_FLAG",
      );
      throw new Error(
        isVmModulesError
          ? [
              "Failed to start testcontainers DynamoDB Local.",
              `Reason: ${reason}`,
              "",
              "This is a Jest/VM modules startup issue rather than a Docker socket issue.",
              "Run the integration tests via the npm script so NODE_OPTIONS=--experimental-vm-modules is applied:",
              "npm run test:integration --workspace @supplier-config/ddb-publisher",
            ].join("\n")
          : [
              "Failed to start testcontainers DynamoDB Local.",
              `Reason: ${reason}`,
              "",
              "If using Colima, this is often socket-mount related.",
              "Try setting one of the following before running tests:",
              "- TESTCONTAINERS_DOCKER_SOCKET_OVERRIDE=/var/run/docker.sock",
              "",
              "Then rerun: npm run test:integration --workspace @supplier-config/ddb-publisher",
            ].join("\n"),
      );
    }
  });

  afterAll(async () => {
    if (!context) return;

    try {
      await deletePublisherTable(context, tableName);
    } finally {
      await context.container.stop();
      context = null;
    }
  });

  it("publishes records via the bundled action runtime into local DynamoDB", async () => {
    await runBundle();

    const scanned = await scanTable();

    expect(scanned.Items).toBeDefined();
    expectExpectedRecords(scanned.Items ?? []);
  });

  it("blocks a reload when extra active records exist, then allows it with --force", async () => {
    await activeContext().ddbClient.send(
      new PutItemCommand({
        TableName: tableName,
        Item: {
          pk: { S: "ENTITY#supplier" },
          sk: { S: "ID#stale-supplier" },
          id: { S: "stale-supplier" },
          status: { S: "DRAFT" },
          name: { S: "Stale Supplier" },
          channelType: { S: "LETTER" },
          dailyCapacity: { N: "1" },
        },
      }),
    );

    const error = await runBundle().then(
      () => null,
      (caughtError) => caughtError as { stdout?: string; stderr?: string },
    );

    expect(error).toBeDefined();

    const stdout = String(error?.stdout ?? "");
    const stderr = String(error?.stderr ?? "");
    const combined = `${stdout}\n${stderr}`;

    expect(combined).toContain("Upload blocked");
    expect(combined).toContain("ID#stale-supplier");

    await runBundle(["--force"]);

    const scanned = await scanTable();

    expect(scanned.Items).toBeDefined();
    expect(scanned.Items).toHaveLength(expectedRecords.length + 1);
    expectExpectedRecords(
      (scanned.Items ?? []).filter(
        (item) => item.sk?.S !== "ID#stale-supplier",
      ),
    );

    const stale = scanned.Items?.find(
      (item) =>
        item.pk?.S === "ENTITY#supplier" && item.sk?.S === "ID#stale-supplier",
    );

    expect(stale).toBeDefined();
    expect(stale?.status?.S).toBe("DRAFT");
  });
});
