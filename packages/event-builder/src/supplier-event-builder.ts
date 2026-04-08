import { Supplier } from "@nhsdigital/nhs-notify-event-schemas-supplier-config/src/domain/supplier";
import { configFromEnv } from "./config";
import { SeverityText, newSequenceGenerator } from "./lib/envelope-helpers";
import { buildBaseEventEnvelope } from "./lib/base-event-envelope";

export interface BuildSupplierEventOptions {
  severity?: SeverityText;
  sequence?: string | Generator<string, never, undefined>;
}

// Suppliers don't have status-based events, they're just configuration
export interface SupplierEvent {
  specversion: string;
  id: string;
  source: string;
  subject: string;
  type: string;
  time: string;
  datacontenttype: string;
  dataschema: string;
  dataschemaversion: string;
  data: Supplier;
  traceparent: string;
  recordedtime: string;
  severitytext: string;
  severitynumber: number;
  partitionkey: string;
  sequence?: string;
}

export const buildSupplierEvent = (
  supplier: Supplier,
  opts: BuildSupplierEventOptions = {},
  config = configFromEnv(),
): SupplierEvent => {
  const dataschemaversion = config.EVENT_DATASCHEMAVERSION;
  const dataschema = `https://notify.nhs.uk/cloudevents/schemas/supplier-config/supplier.${dataschemaversion}.schema.json`;
  const severity = opts.severity ?? "INFO";

  return buildBaseEventEnvelope(
    "uk.nhs.notify.supplier-config.supplier",
    `supplier/${supplier.id}`,
    supplier.id,
    supplier,
    dataschema,
    config,
    { severity, sequence: opts.sequence },
  );
};

export const buildSupplierEvents = (
  suppliers: Record<string, Supplier>,
  startingCounter = 1,
): SupplierEvent[] => {
  const sequenceGenerator = newSequenceGenerator(startingCounter);

  return Object.values(suppliers).map((s) =>
    buildSupplierEvent(s, { sequence: sequenceGenerator }),
  );
};
