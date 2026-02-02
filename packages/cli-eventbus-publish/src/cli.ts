#!/usr/bin/env ts-node
import path from "node:path";
import fs from "node:fs";
import { hideBin } from "yargs/helpers";
import yargs from "yargs";
import {
  EventBridgeClient,
  PutEventsCommand,
} from "@aws-sdk/client-eventbridge";
import { parseExcelFile } from "@supplier-config/excel-parser";
import { buildLetterVariantEvents } from "@supplier-config/event-builder/letter-variant-event-builder";
import { buildPackSpecificationEvents } from "@supplier-config/event-builder/pack-specification-event-builder";
import { buildVolumeGroupEvents } from "@supplier-config/event-builder/volume-group-event-builder";
import { buildSupplierEvents } from "@supplier-config/event-builder/supplier-event-builder";
import { buildSupplierAllocationEvents } from "@supplier-config/event-builder/supplier-allocation-event-builder";
import { buildSupplierPackEvents } from "@supplier-config/event-builder/supplier-pack-event-builder";
import { nextSequence } from "@supplier-config/event-builder/lib/envelope-helpers";

interface PublishArgs {
  file: string;
  bus: string;
  region?: string;
  dryRun?: boolean;
}

interface ParseArgs {
  file: string;
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

function chunk<T>(arr: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

async function handleParse(args: ParseArgs): Promise<void> {
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
        await handleParse({ file: argv.file });
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
        await handlePublish(argv);
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

if (require.main === module) {
  main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
}

export { handleParse, handlePublish };
