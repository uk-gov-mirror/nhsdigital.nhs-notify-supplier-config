import { randomUUID } from "node:crypto";
import { Config, buildEventSource } from "../config";
import {
  SeverityText,
  generateTraceParent,
  severityNumber,
} from "./envelope-helpers";

export interface BaseEnvelopeOptions {
  severity?: SeverityText;
  sequence?: string | Generator<string, never, undefined>;
}

// Common fields builder for CloudEvents envelope metadata
export function buildBaseEventEnvelope<TData>(
  type: string,
  subject: string,
  partitionKey: string,
  data: TData,
  dataschema: string,
  config: Config,
  opts: BaseEnvelopeOptions = {},
) {
  const now = new Date().toISOString();
  const dataschemaversion = config.EVENT_DATASCHEMAVERSION;
  const severity = opts.severity ?? "INFO";
  return {
    specversion: "1.0",
    id: randomUUID(),
    source: buildEventSource(config),
    subject,
    type,
    time: now,
    datacontenttype: "application/json",
    dataschema,
    dataschemaversion,
    data,
    traceparent: generateTraceParent(),
    recordedtime: now,
    severitytext: severity,
    severitynumber: severityNumber(severity),
    partitionkey: partitionKey,
    sequence:
      typeof opts.sequence === "object"
        ? opts.sequence.next().value
        : opts.sequence,
  };
}
