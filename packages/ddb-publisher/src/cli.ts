#!/usr/bin/env node

import yargs from "yargs";
import { hideBin } from "yargs/helpers";

import runPublisher from "./run";

yargs(hideBin(process.argv))
  .scriptName("supplier-config-publish")
  .option("source", {
    type: "string",
    demandOption: true,
    describe: "Path to config store root directory",
  })
  .option("env", {
    type: "string",
    demandOption: true,
    describe: "Target environment label (e.g. draft/int/prod)",
  })
  .option("table", {
    type: "string",
    demandOption: true,
    describe: "DynamoDB table name",
  })
  .option("topic-arn", {
    type: "string",
    demandOption: true,
    describe: "ARN of the SNS topic that the event will be published to",
  })
  .option("force", {
    type: "boolean",
    default: false,
    describe:
      "Bypass audit safety check if non-DISABLED records exist in DDB but not in local config",
  })
  .option("dry-run", {
    type: "boolean",
    default: false,
    describe:
      "Validate config store against schemas without requiring AWS credentials or publishing",
  })
  .strict()
  .help()
  .parseAsync()
  .then(async (args) => {
    await runPublisher({
      sourcePath: args.source,
      env: args.env,
      tableName: args.table,
      topicArn: args.topicArn,
      force: args.force,
      dryRun: args.dryRun,
    });
  })
  .catch((error: unknown) => {
    console.error(error);
    process.exitCode = 1;
  });
