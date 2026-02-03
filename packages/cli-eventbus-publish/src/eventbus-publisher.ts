import path from "node:path";
import fs from "node:fs";
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

export interface PublishArgs {
  file: string;
  bus: string;
  region?: string;
  dryRun?: boolean;
}

export interface ParseArgs {
  file: string;
}

export interface ParseResult {
  packs: Record<string, unknown>;
  variants: Record<string, unknown>;
  volumeGroups: Record<string, unknown>;
  suppliers: Record<string, unknown>;
  allocations: Record<string, unknown>;
  supplierPacks: Record<string, unknown>;
}

export function ensureFile(file: string): string {
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

export function chunk<T>(arr: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

export async function handleParse(args: ParseArgs): Promise<ParseResult> {
  const inputFile = ensureFile(args.file);
  const result = parseExcelFile(inputFile);
  return result;
}

export async function handlePublish(
  args: PublishArgs,
): Promise<{ success: boolean; eventCount: number; error?: string }> {
  const inputFile = ensureFile(args.file);
  const {
    allocations,
    packs,
    supplierPacks,
    suppliers,
    variants,
    volumeGroups,
  } = parseExcelFile(inputFile);

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

  if (args.dryRun) {
    return { success: true, eventCount: events.length };
  }

  const region =
    args.region || process.env.AWS_REGION || process.env.AWS_DEFAULT_REGION;
  if (!region) {
    throw new Error("AWS region not specified (flag or AWS_REGION env)");
  }

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
        return {
          success: false,
          eventCount: events.length,
          error: `PutEvents had ${resp.FailedEntryCount} failed entries`,
        };
      }
    } catch (error) {
      return {
        success: false,
        eventCount: events.length,
        error: `Error sending events batch: ${(error as Error).message}`,
      };
    }
  }

  return { success: true, eventCount: events.length };
}
