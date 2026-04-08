import {
  CreateTableCommand,
  DeleteTableCommand,
  DynamoDBClient,
  waitUntilTableExists,
} from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";
import { GenericContainer, Wait } from "testcontainers";
import type { StartedTestContainer } from "testcontainers";

export type DbTestContext = {
  container: StartedTestContainer;
  ddbClient: DynamoDBClient;
  docClient: DynamoDBDocumentClient;
  endpoint: string;
};

const credentials = {
  accessKeyId: "fakeMyKeyId",
  secretAccessKey: "fakeSecretAccessKey",
};

export async function setupDynamoDBContainer(): Promise<DbTestContext> {
  process.env.TESTCONTAINERS_RYUK_DISABLED ??= "true";

  const container = await new GenericContainer("amazon/dynamodb-local:3.3.0")
    .withExposedPorts(8000)
    .withWaitStrategy(Wait.forListeningPorts())
    .start();

  const endpoint = `http://${container.getHost()}:${container.getMappedPort(8000)}`;

  const ddbClient = new DynamoDBClient({
    region: "eu-west-2",
    endpoint,
    credentials,
  });

  const docClient = DynamoDBDocumentClient.from(ddbClient);

  return {
    container,
    ddbClient,
    docClient,
    endpoint,
  };
}

export async function createPublisherTable(
  context: DbTestContext,
  tableName: string,
): Promise<void> {
  await context.ddbClient.send(
    new CreateTableCommand({
      TableName: tableName,
      BillingMode: "PAY_PER_REQUEST",
      KeySchema: [
        { AttributeName: "pk", KeyType: "HASH" },
        { AttributeName: "sk", KeyType: "RANGE" },
      ],
      AttributeDefinitions: [
        { AttributeName: "pk", AttributeType: "S" },
        { AttributeName: "sk", AttributeType: "S" },
      ],
    }),
  );

  await waitUntilTableExists(
    { client: context.ddbClient, maxWaitTime: 60 },
    { TableName: tableName },
  );
}

export async function deletePublisherTable(
  context: DbTestContext,
  tableName: string,
): Promise<void> {
  await context.ddbClient.send(
    new DeleteTableCommand({
      TableName: tableName,
    }),
  );
}
