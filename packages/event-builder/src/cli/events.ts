#!/usr/bin/env ts-node
import path from "node:path";
import fs from "node:fs";
import { hideBin } from "yargs/helpers";
import yargs from "yargs";
import {
  EventBridgeClient,
  PutEventsCommand,
} from "@aws-sdk/client-eventbridge";
import { parseExcelFile } from "event-builder/src/lib/parse-excel";
import { buildLetterVariantEvents } from "event-builder/src/letter-variant-event-builder";
import { buildPackSpecificationEvents } from "event-builder/src/pack-specification-event-builder";
import { buildVolumeGroupEvents } from "event-builder/src/volume-group-event-builder";
import { buildSupplierEvents } from "event-builder/src/supplier-event-builder";
import { buildSupplierAllocationEvents } from "event-builder/src/supplier-allocation-event-builder";
import { buildSupplierPackEvents } from "event-builder/src/supplier-pack-event-builder";
import { nextSequence } from "event-builder/src/lib/envelope-helpers";
import generateTemplateExcel from "../lib/template";
import { generateSupplierReports } from "../lib/supplier-report";
import { populateDynamoDB } from "../lib/dynamodb-populate";

interface CommonArgs {
  file: string;
}
interface PublishArgs extends CommonArgs {
  bus: string;
  region?: string;
  dryRun?: boolean;
}
interface TemplateArgs {
  out: string;
  force?: boolean;
}
interface ReportArgs extends CommonArgs {
  out: string;
  excludeDrafts?: boolean;
}
interface DynamoDBArgs extends CommonArgs {
  table: string;
  region?: string;
  dryRun?: boolean;
}

function ensureFile(file: string): string {
  const resolved = path.isAbsolute(file)
    ? file
    : path.join(process.cwd(), file);
  // Basic allowlist check: must end with .xlsx
  if (!/\.xlsx$/i.test(resolved)) {
    throw new Error(`Input file must be an .xlsx file: ${resolved}`);
  }
  try {
    // eslint-disable-next-line security/detect-non-literal-fs-filename
    fs.statSync(resolved);
  } catch {
    throw new Error(`Input file not found: ${resolved}`);
  }
  return resolved;
}

async function handleParse(args: CommonArgs): Promise<void> {
  const inputFile = ensureFile(args.file);
  console.log(`Parsing Excel file: ${inputFile}`);
  const result = parseExcelFile(inputFile);
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

function chunk<T>(arr: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

async function handlePublish(args: PublishArgs): Promise<void> {
  const inputFile = ensureFile(args.file);
  const {
    allocations,
    packs,
    supplierPacks,
    suppliers,
    variants,
    volumeGroups,
  } = parseExcelFile(inputFile);
  console.log(`Reading all entities from: ${inputFile}`);

  // Build events in sequence: volume groups, suppliers, packs, supplier-packs, variants, allocations
  let counter = 1;

  const volumeGroupEventsRaw = buildVolumeGroupEvents(volumeGroups, counter);
  const volumeGroupEvents = volumeGroupEventsRaw.filter(
    (e): e is NonNullable<typeof e> => e !== undefined,
  );
  counter += volumeGroupEventsRaw.length; // maintain sequence spacing including skipped drafts

  const supplierEvents = buildSupplierEvents(suppliers, counter);
  counter += supplierEvents.length;

  const packEvents = buildPackSpecificationEvents(packs, counter);
  counter += packEvents.length;

  const supplierPackEvents = buildSupplierPackEvents(supplierPacks, counter);
  counter += supplierPackEvents.length;

  const variantEvents = buildLetterVariantEvents(variants).map((ev, idx) => {
    return { ...ev, sequence: nextSequence(counter + idx) };
  });
  counter += variantEvents.length;

  const allocationEvents = buildSupplierAllocationEvents(allocations).map(
    (ev, idx) => {
      return { ...ev, sequence: nextSequence(counter + idx) };
    },
  );

  const events = [
    ...volumeGroupEvents,
    ...supplierEvents,
    ...packEvents,
    ...supplierPackEvents,
    ...variantEvents,
    ...allocationEvents,
  ];

  console.log(
    `Built ${volumeGroupEvents.length} VolumeGroup events, ${supplierEvents.length} Supplier events, ${packEvents.length} PackSpecification events, ${supplierPackEvents.length} SupplierPack events, ${variantEvents.length} LetterVariant events, and ${allocationEvents.length} SupplierAllocation events`,
  );

  if (args.dryRun) {
    console.log(
      "--dry-run specified; events will NOT be sent. Showing first event:",
    );
    if (events[0]) console.log(JSON.stringify(events[0], null, 2));
    return;
  }

  const region =
    args.region || process.env.AWS_REGION || process.env.AWS_DEFAULT_REGION;
  if (!region)
    throw new Error("AWS region not specified (flag or AWS_REGION env)");

  const client = new EventBridgeClient({ region });
  for (const batch of chunk(events, 10)) {
    const Entries = batch.map((e) => ({
      DetailType: e.type,
      Source: e.source,
      EventBusName: args.bus,
      Time: new Date(e.time),
      Detail: JSON.stringify(e.data),
      Resources: [e.subject],
    }));
    try {
      const resp = await client.send(new PutEventsCommand({ Entries }));
      if (resp.FailedEntryCount && resp.FailedEntryCount > 0) {
        console.error(`PutEvents had ${resp.FailedEntryCount} failed entries`);
        console.error(JSON.stringify(resp, null, 2));
        process.exitCode = 1;
        return;
      }
    } catch (error) {
      console.error("Error sending events batch", error);
      process.exitCode = 1;
      return;
    }
  }
  console.log(
    `Successfully published ${events.length} events to bus ${args.bus}`,
  );
}

async function handleTemplate(args: TemplateArgs): Promise<void> {
  const output = generateTemplateExcel(args.out, args.force);
  console.log(`Template Excel written: ${output}`);
}

async function handleReport(args: ReportArgs): Promise<void> {
  const inputFile = ensureFile(args.file);
  console.log(`Reading Excel file: ${inputFile}`);
  const data = parseExcelFile(inputFile);

  const result = generateSupplierReports(data, args.out, {
    excludeDrafts: args.excludeDrafts,
  });

  console.log(
    `\nGenerated ${result.reports.length} supplier reports in: ${result.outputDir}\n`,
  );
  for (const report of result.reports) {
    console.log(
      `  - ${report.supplierName}: ${report.packCount} pack(s) -> ${report.filePath}`,
    );
  }
}

async function handleDynamoDB(args: DynamoDBArgs): Promise<void> {
  const inputFile = ensureFile(args.file);
  console.log(`Reading Excel file: ${inputFile}`);
  const data = parseExcelFile(inputFile);

  console.log(`Populating DynamoDB table: ${args.table}`);
  const result = await populateDynamoDB(data, {
    tableName: args.table,
    region: args.region,
    dryRun: args.dryRun,
  });

  console.log(`\nPopulation summary:`);
  console.log(`  Table: ${result.tableName}`);
  console.log(`  Total items: ${result.itemCount}`);
  console.log(`  By type:`);
  for (const [type, count] of Object.entries(result.summary)) {
    if (count > 0) {
      console.log(`    - ${type}: ${count}`);
    }
  }
}

async function main(): Promise<void> {
  const parser = yargs(hideBin(process.argv))
    .scriptName("events")
    .demandCommand(1, "Specify a command")
    .strict()
    .recommendCommands()
    .version(false)
    .help()
    .command<CommonArgs>(
      "parse",
      "Parse excel and output JSON to stdout",
      (cmd) =>
        cmd.option("file", {
          alias: "f",
          describe: "Excel file path",
          type: "string",
          default: "example_specifications.xlsx",
        }),
      async (argv) => {
        await handleParse({ file: argv.file });
      },
    )
    .command<PublishArgs>(
      "publish",
      "Publish all supplier config events (Contract, Supplier, PackSpecification, LetterVariant, SupplierAllocation) to EventBridge",
      (cmd) =>
        cmd
          .option("file", {
            alias: "f",
            describe: "Excel file path",
            type: "string",
            default: "example_specifications.xlsx",
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
        await handlePublish(argv);
      },
    )
    .command<TemplateArgs>(
      "template",
      "Generate a blank Excel template with all required sheets and columns",
      (cmd) =>
        cmd
          .option("out", {
            alias: "o",
            type: "string",
            describe: "Output .xlsx file path",
            default: "specifications.template.xlsx",
          })
          .option("force", {
            alias: "F",
            type: "boolean",
            describe: "Overwrite existing file if present",
            default: false,
          }),
      async (argv) => {
        await handleTemplate(argv);
      },
    )
    .command<ReportArgs>(
      "report",
      "Generate HTML reports per supplier showing assigned pack specifications",
      (cmd) =>
        cmd
          .option("file", {
            alias: "f",
            describe: "Excel file path",
            type: "string",
            default: "example_specifications.xlsx",
          })
          .option("out", {
            alias: "o",
            type: "string",
            describe: "Output directory for HTML reports",
            default: "./supplier-reports",
          })
          .option("exclude-drafts", {
            type: "boolean",
            describe: "Exclude supplier packs with DRAFT approval status from the reports",
            default: false,
          }),
      async (argv) => {
        await handleReport(argv);
      },
    )
    .command<DynamoDBArgs>(
      "dynamodb",
      "Populate a DynamoDB table with config data from the spreadsheet",
      (cmd) =>
        cmd
          .option("file", {
            alias: "f",
            describe: "Excel file path",
            type: "string",
            default: "example_specifications.xlsx",
          })
          .option("table", {
            alias: "t",
            type: "string",
            describe: "DynamoDB table name",
            demandOption: true,
          })
          .option("region", {
            alias: "r",
            type: "string",
            describe: "AWS region (fallback AWS_REGION env)",
          })
          .option("dry-run", {
            type: "boolean",
            describe: "Build items but do not write to DynamoDB",
            default: false,
          }),
      async (argv) => {
        await handleDynamoDB(argv);
      },
    )
    .example("$0 parse -f specs.xlsx", "Parse a spreadsheet and print JSON")
    .example(
      "$0 publish -f specs.xlsx -b my-bus -r eu-west-2",
      "Publish events to EventBridge",
    )
    .example(
      "$0 template -o specs.xlsx",
      "Generate template workbook (fails if specs.xlsx exists unless --force)",
    )
    .example(
      "$0 report -f specs.xlsx -o ./reports",
      "Generate HTML supplier reports",
    )
    .example(
      "$0 dynamodb -f specs.xlsx -t my-config-table -r eu-west-2",
      "Populate DynamoDB table with config data",
    );

  try {
    await parser.parseAsync();
  } catch (error) {
    console.error((error as Error).message);
    process.exitCode = 1;
  }
}

if (require.main === module) {
  main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
}
