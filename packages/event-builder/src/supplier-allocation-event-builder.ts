import { SupplierAllocation } from "@nhsdigital/nhs-notify-event-schemas-supplier-config/src/domain/supplier-allocation";
import { supplierAllocationEvents } from "@nhsdigital/nhs-notify-event-schemas-supplier-config/src/events/supplier-allocation-events";
import { z } from "zod";
import { configFromEnv } from "packages/event-builder/src/config";
import {
  SeverityText,
  newSequenceGenerator,
} from "packages/event-builder/src/lib/envelope-helpers";
import { buildBaseEventEnvelope } from "packages/event-builder/src/lib/base-event-envelope";

export interface BuildSupplierAllocationEventOptions {
  severity?: SeverityText;
  sequence?: string | Generator<string, never, undefined>;
}

export type SupplierAllocationSpecialisedEvent = z.infer<
  (typeof supplierAllocationEvents)[keyof typeof supplierAllocationEvents]
>;

export const buildSupplierAllocationEvent = (
  allocation: SupplierAllocation,
  opts: BuildSupplierAllocationEventOptions = {},
  config = configFromEnv(),
): SupplierAllocationSpecialisedEvent => {
  const lcStatus = allocation.status.toLowerCase();
  const schemaKey =
    `supplier-allocation.${lcStatus}` as keyof typeof supplierAllocationEvents;
  // Access using controlled key constructed from validated status
  // eslint-disable-next-line security/detect-object-injection
  const specialised = supplierAllocationEvents[schemaKey];
  if (!specialised) {
    throw new Error(
      `No specialised event schema found for status ${allocation.status}`,
    );
  }
  const dataschemaversion = config.EVENT_DATASCHEMAVERSION;
  const dataschema = `https://notify.nhs.uk/cloudevents/schemas/supplier-config/supplier-allocation.${lcStatus}.${dataschemaversion}.schema.json`;
  const severity = opts.severity ?? "INFO";
  const baseEvent = buildBaseEventEnvelope(
    specialised.shape.type.options[0],
    `supplier-allocation/${allocation.id}`,
    allocation.id,
    { ...allocation, status: allocation.status },
    dataschema,
    config,
    { severity, sequence: opts.sequence },
  );
  return specialised.parse(baseEvent);
};

export const buildSupplierAllocationEvents = (
  allocations: Record<string, SupplierAllocation>,
  startingCounter = 1,
): SupplierAllocationSpecialisedEvent[] => {
  const sequenceGenerator = newSequenceGenerator(startingCounter);

  return Object.values(allocations).map((a) =>
    buildSupplierAllocationEvent(a, { sequence: sequenceGenerator }),
  );
};
