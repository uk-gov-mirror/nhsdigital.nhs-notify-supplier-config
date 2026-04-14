# ddb-publisher CLI

`ddb-publisher` reads supplier config JSON files from a directory, validates them against the event schemas, audits existing records in DynamoDB, then publishes the records into the target table.

It is used by the `publish-config` GitHub Action, and can also be run locally for testing and development.

## Run the publisher

From this package directory:

```bash
npm run cli -- \
  --source ../../tests/example-config-store \
  --env draft \
  --table supplier-config-draft \
  --dry-run
```

## Run the integration test

From the repo root:

```bash
npm run test:integration --workspace @supplier-config/ddb-publisher
```

The test starts DynamoDB Local with Testcontainers, creates the `supplier-config-it` table, bundles the CLI, and publishes the shared example config store from `tests/example-config-store`.

If you are using Colima and the test cannot start Docker correctly, retry with:

```bash
TESTCONTAINERS_RYUK_DISABLED=true npm run test:integration --workspace @supplier-config/ddb-publisher
```

If needed, you can also try:

```bash
TESTCONTAINERS_DOCKER_SOCKET_OVERRIDE=/var/run/docker.sock npm run test:integration --workspace @supplier-config/ddb-publisher
```

## Local DynamoDB

Start DynamoDB Local in Docker:

```bash
docker run --rm -d \
  --name supplier-config-ddb-local \
  -p 8000:8000 \
  amazon/dynamodb-local
```

Create the config table with the AWS CLI:

```bash
AWS_ACCESS_KEY_ID=fakeMyKeyId \
AWS_SECRET_ACCESS_KEY=fakeSecretAccessKey \
AWS_REGION=eu-west-2 \
aws dynamodb create-table \
  --endpoint-url http://localhost:8000 \
  --table-name supplier-config-draft \
  --billing-mode PAY_PER_REQUEST \
  --attribute-definitions AttributeName=pk,AttributeType=S AttributeName=sk,AttributeType=S \
  --key-schema AttributeName=pk,KeyType=HASH AttributeName=sk,KeyType=RANGE
```

Then publish to the local table:

```bash
SUPPLIER_CONFIG_DDB_ENDPOINT_URL=http://localhost:8000 \
npm run cli -- \
  --source ../../tests/example-config-store \
  --env draft \
  --table supplier-config-draft
```

Stop the local container when you're done:

```bash
docker stop supplier-config-ddb-local
```

## Useful flags

- `--dry-run` validates local config and schemas without AWS calls
- `--force` bypasses the audit safety check
- `--help` shows all options
