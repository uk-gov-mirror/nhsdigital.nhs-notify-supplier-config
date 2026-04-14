import { LetterVariant } from "@nhsdigital/nhs-notify-event-schemas-supplier-config/src/domain/letter-variant";
import { letterVariantEvents } from "@nhsdigital/nhs-notify-event-schemas-supplier-config/src/events/letter-variant-events";
import { z } from "zod";
import { configFromEnv } from "packages/event-builder/src/config";
import {
  SeverityText,
  newSequenceGenerator,
} from "packages/event-builder/src/lib/envelope-helpers";
import { buildBaseEventEnvelope } from "packages/event-builder/src/lib/base-event-envelope";

export interface BuildLetterVariantEventOptions {
  severity?: SeverityText;
  sequence?: string | Generator<string, never, undefined>;
}

export type LetterVariantSpecialisedEvent = z.infer<
  (typeof letterVariantEvents)[keyof typeof letterVariantEvents]
>;

export const buildLetterVariantEvent = (
  variant: LetterVariant,
  opts: BuildLetterVariantEventOptions = {},
  config = configFromEnv(),
): LetterVariantSpecialisedEvent | undefined => {
  if (variant.status === "DRAFT") return undefined; // skip drafts

  const lcStatus = variant.status.toLowerCase();
  const schemaKey =
    `letter-variant.${lcStatus}` as keyof typeof letterVariantEvents;
  // Access using controlled key constructed from validated status
  // eslint-disable-next-line security/detect-object-injection
  const specialised = letterVariantEvents[schemaKey];
  if (!specialised) {
    throw new Error(
      `No specialised event schema found for status ${variant.status}`,
    );
  }
  const dataschemaversion = config.EVENT_DATASCHEMAVERSION;
  const dataschema = `https://notify.nhs.uk/cloudevents/schemas/supplier-config/letter-variant.${lcStatus}.${dataschemaversion}.schema.json`;
  const severity = opts.severity ?? "INFO";
  return specialised.parse(
    buildBaseEventEnvelope(
      specialised.shape.type.options[0],
      `letter-variant/${variant.id}`,
      variant.id,
      { ...variant, status: variant.status },
      dataschema,
      config,
      { severity, sequence: opts.sequence },
    ),
  );
};

export const buildLetterVariantEvents = (
  variants: Record<string, LetterVariant>,
  startingCounter = 1,
): LetterVariantSpecialisedEvent[] => {
  const sequenceGenerator = newSequenceGenerator(startingCounter);

  return (
    Object.values(variants)
      .map((v) => buildLetterVariantEvent(v, { sequence: sequenceGenerator }))
      // key fields are UUIDs already validated so dynamic filtering is safe
      .filter((e): e is LetterVariantSpecialisedEvent => e !== undefined)
  );
};
