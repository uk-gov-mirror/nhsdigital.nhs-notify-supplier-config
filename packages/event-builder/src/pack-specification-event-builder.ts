import { PackSpecification } from "@nhsdigital/nhs-notify-event-schemas-supplier-config/src/domain/pack-specification";
import { packSpecificationEvents } from "@nhsdigital/nhs-notify-event-schemas-supplier-config/src/events/pack-specification-events";
import { z } from "zod";
import { configFromEnv } from "./config";
import {
  SeverityText,
  newSequenceGenerator,
} from "./lib/envelope-helpers";
import { buildBaseEventEnvelope } from "./lib/base-event-envelope";

export interface BuildPackSpecificationEventOptions {
  severity?: SeverityText;
  sequence?: string | Generator<string, never, undefined>;
}

export type PackSpecificationSpecialisedEvent = z.infer<
  (typeof packSpecificationEvents)[keyof typeof packSpecificationEvents]
>;

export const buildPackSpecificationEvent = (
  pack: PackSpecification,
  opts: BuildPackSpecificationEventOptions = {},
  config = configFromEnv(),
): PackSpecificationSpecialisedEvent | undefined => {
  if (pack.status === "DRAFT") return undefined; // skip drafts
  const lcStatus = pack.status.toLowerCase();
  const schemaKey =
    `pack-specification.${lcStatus}` as keyof typeof packSpecificationEvents;
  // Access using controlled key constructed from validated status
  // eslint-disable-next-line security/detect-object-injection
  const specialised = packSpecificationEvents[schemaKey];
  if (!specialised) {
    throw new Error(
      `No specialised event schema found for status ${pack.status}`,
    );
  }
  const dataschemaversion = config.EVENT_DATASCHEMAVERSION;
  const dataschema = `https://notify.nhs.uk/cloudevents/schemas/supplier-config/pack-specification.${lcStatus}.${dataschemaversion}.schema.json`;
  const severity = opts.severity ?? "INFO";
  const baseEvent = buildBaseEventEnvelope(
    specialised.shape.type.options[0],
    `pack-specification/${pack.id}`,
    pack.id,
    { ...pack, status: pack.status },
    dataschema,
    config,
    { severity, sequence: opts.sequence },
  );
  return specialised.parse(baseEvent);
};

export const buildPackSpecificationEvents = (
  packs: Record<string, PackSpecification>,
  startingCounter = 1,
): PackSpecificationSpecialisedEvent[] => {
  const sequenceGenerator = newSequenceGenerator(startingCounter);

  return Object.values(packs)
    .map((p) => {
      return buildPackSpecificationEvent(p, { sequence: sequenceGenerator });
    })
    .filter((e): e is PackSpecificationSpecialisedEvent => e !== undefined);
};
