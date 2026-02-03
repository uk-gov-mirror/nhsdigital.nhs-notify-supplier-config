#!/usr/bin/env ts-node
/* eslint-disable no-console */
import { hideBin } from "yargs/helpers";
import yargs from "yargs";
import {
  type ParseArgs,
  type PublishArgs,
  handleParse,
  handlePublish,
} from "./eventbus-publisher";

/* istanbul ignore next */
async function cliParse(args: ParseArgs): Promise<void> {
  const result = await handleParse(args);
  console.log(`Parsing Excel file: ${args.file}`);
  console.log(JSON.stringify(result, null, 2));
  console.log(`Parsed ${Object.keys(result.packs).length} pack specifications`);
  console.log(`Parsed ${Object.keys(result.variants).length} letter variants`);
  console.log(
    `Parsed ${Object.keys(result.volumeGroups).length} volume groups`,
  );
  console.log(`Parsed ${Object.keys(result.suppliers).length} suppliers`);
  console.log(
    `Parsed ${Object.keys(result.allocations).length} supplier allocations`,
  );
  console.log(
    `Parsed ${Object.keys(result.supplierPacks).length} supplier packs`,
  );
}

/* istanbul ignore next */
async function cliPublish(args: PublishArgs): Promise<void> {
  console.log(`Reading all entities from: ${args.file}`);

  const result = await handlePublish(args);

  if (args.dryRun) {
    console.log(
      `--dry-run specified; events will NOT be sent. Built ${result.eventCount} events.`,
    );
    return;
  }

  if (!result.success) {
    console.error(result.error);
    process.exitCode = 1;
    return;
  }

  console.log(
    `Successfully published ${result.eventCount} events to bus ${args.bus}`,
  );
}

/* istanbul ignore next */
async function main(): Promise<void> {
  const parser = yargs(hideBin(process.argv))
    .scriptName("eventbus-publish")
    .demandCommand(1, "Specify a command")
    .strict()
    .recommendCommands()
    .version(false)
    .help()
    .command<ParseArgs>(
      "parse",
      "Parse excel and output JSON to stdout",
      (cmd) =>
        cmd.option("file", {
          alias: "f",
          describe: "Excel file path",
          type: "string",
          default: "specifications.xlsx",
        }),
      async (argv) => {
        await cliParse({ file: argv.file });
      },
    )
    .command<PublishArgs>(
      "publish",
      "Publish all supplier config events to EventBridge",
      (cmd) =>
        cmd
          .option("file", {
            alias: "f",
            describe: "Excel file path",
            type: "string",
            default: "specifications.xlsx",
          })
          .option("bus", {
            alias: "b",
            type: "string",
            describe: "EventBridge event bus name",
            demandOption: true,
          })
          .option("region", {
            alias: "r",
            type: "string",
            describe: "AWS region (fallback AWS_REGION env)",
          })
          .option("dry-run", {
            type: "boolean",
            describe: "Build events but do not send",
            default: false,
          }),
      async (argv) => {
        await cliPublish(argv);
      },
    )
    .example("$0 parse -f specs.xlsx", "Parse a spreadsheet and print JSON")
    .example(
      "$0 publish -f specs.xlsx -b my-bus -r eu-west-2",
      "Publish events to EventBridge",
    );

  try {
    await parser.parseAsync();
  } catch (error) {
    console.error((error as Error).message);
    process.exitCode = 1;
  }
}

/* istanbul ignore next */
if (require.main === module) {
  main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
}
