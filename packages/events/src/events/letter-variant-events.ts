import { z } from "zod";
import {
  $LetterVariant,
  LetterVariant,
} from "@nhsdigital/nhs-notify-event-schemas-supplier-config/src/domain/letter-variant";
import { EventEnvelope } from "./event-envelope";

const variantStatuses = [
  "DRAFT",
  "INT",
  "PROD",
  "DISABLED",
] as const satisfies readonly LetterVariant["status"][];

/**
 * A generic schema for parsing any letter status change event
 */
export const $LetterVariantEvent = EventEnvelope(
  "letter-variant",
  "letter-variant",
  $LetterVariant,
  variantStatuses,
).meta({
  title: `letter-variant.* Event`,
  description: `Generic event schema for letter variant changes`,
});

export type LetterVariantEvent = z.infer<typeof $LetterVariantEvent>;

/**
 * Specialise the generic event schema for a single status
 * @param status
 */
const specialiseLetterVariantEvent = (status: LetterVariant["status"]) => {
  return EventEnvelope(
    `letter-variant.${status.toLowerCase()}`,
    "letter-variant",
    $LetterVariant
      .extend({
        status: z.literal(status),
      })
      .meta({
        description: `The status of a LetterVariant indicates whether it is available for use.

For this event the status is always \`${status}\``,
      }),
    [status],
  ).meta({
    title: `letter-variant.${status.toLowerCase()} Event`,
    description: `Event schema for letter variant change to ${status}`,
  });
};

export const letterVariantEvents = {
  "letter-variant.draft": specialiseLetterVariantEvent("DRAFT"),
  "letter-variant.int": specialiseLetterVariantEvent("INT"),
  "letter-variant.prod": specialiseLetterVariantEvent("PROD"),
  "letter-variant.disabled": specialiseLetterVariantEvent("DISABLED"),
} as const;
