import { SupplierPack } from "@nhsdigital/nhs-notify-event-schemas-supplier-config/src/domain/supplier-pack";
import { supplierPackEvents } from "@nhsdigital/nhs-notify-event-schemas-supplier-config/src/events/supplier-pack-events";
import { z } from "zod";
import { configFromEnv } from "./config";
import {
  SeverityText,
  newSequenceGenerator,
} from "./lib/envelope-helpers";
import { buildBaseEventEnvelope } from "./lib/base-event-envelope";

export interface BuildSupplierPackEventOptions {
  severity?: SeverityText;
  sequence?: string | Generator<string, never, undefined>;
}

export type SupplierPackSpecialisedEvent = z.infer<
  (typeof supplierPackEvents)[keyof typeof supplierPackEvents]
>;

export const buildSupplierPackEvent = (
  supplierPack: SupplierPack,
  opts: BuildSupplierPackEventOptions = {},
  config = configFromEnv(),
): SupplierPackSpecialisedEvent | undefined => {
  // Only publish APPROVED and DISABLED status events (not SUBMITTED or REJECTED)
  if (
    supplierPack.approval !== "APPROVED" &&
    supplierPack.approval !== "DISABLED"
  ) {
    return undefined;
  }

  const lcStatus = supplierPack.status.toLowerCase();
  const schemaKey =
    `supplier-pack.${lcStatus}` as keyof typeof supplierPackEvents;
  // Access using controlled key constructed from validated status
  // eslint-disable-next-line security/detect-object-injection
  const specialised = supplierPackEvents[schemaKey];
  if (!specialised) {
    throw new Error(
      `No specialised event schema found for status ${supplierPack.status}`,
    );
  }
  const dataschemaversion = config.EVENT_DATASCHEMAVERSION;
  const dataschema = `https://notify.nhs.uk/cloudevents/schemas/supplier-config/supplier-pack.${lcStatus}.${dataschemaversion}.schema.json`;
  const severity = opts.severity ?? "INFO";
  const baseEvent = buildBaseEventEnvelope(
    specialised.shape.type.options[0],
    `supplier-pack/${supplierPack.id}`,
    supplierPack.id,
    { ...supplierPack, status: supplierPack.status },
    dataschema,
    config,
    { severity, sequence: opts.sequence },
  );
  return specialised.parse(baseEvent);
};

export const buildSupplierPackEvents = (
  supplierPacks: Record<string, SupplierPack>,
  startingCounter = 1,
): SupplierPackSpecialisedEvent[] => {
  const sequenceGenerator = newSequenceGenerator(startingCounter);

  return Object.values(supplierPacks)
    .map((sp) => buildSupplierPackEvent(sp, { sequence: sequenceGenerator }))
    .filter((e): e is SupplierPackSpecialisedEvent => e !== undefined);
};
