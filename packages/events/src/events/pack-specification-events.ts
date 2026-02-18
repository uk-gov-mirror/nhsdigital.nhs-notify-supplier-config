import {
  $PackSpecification,
  PackSpecification,
} from "@nhsdigital/nhs-notify-event-schemas-supplier-config/src/domain/pack-specification";
import { z } from "zod";
import { EventEnvelope } from "./event-envelope";

const packStatuses = [
  "DRAFT",
  "INT",
  "PROD",
  "DISABLED",
] as const satisfies readonly PackSpecification["status"][];

/**
 * Generic schema for parsing any PackSpecification status change event
 */
export const $PackSpecificationEvent = EventEnvelope(
  "pack-specification",
  "pack-specification",
  $PackSpecification,
  packStatuses,
).meta({
  title: "pack-specification.* Event",
  description: "Generic event schema for pack specification changes",
});

function specialisePackSpecificationEvent(
  status: (typeof packStatuses)[number],
) {
  const lcStatus = status.toLowerCase();
  return EventEnvelope(
    `pack-specification.${lcStatus}`,
    "pack-specification",
    $PackSpecification
      .extend({
        status: z.literal(status),
      })
      .meta({
        description: `Indicates the current state of the pack specification.

For this event the status is always \`${status}\``,
      }),
    [status],
  ).meta({
    title: `pack-specification.${lcStatus} Event`,
    description: `Event schema for pack specification change to ${status}`,
  });
}

export const packSpecificationEvents = {
  "pack-specification.draft": specialisePackSpecificationEvent("DRAFT"),
  "pack-specification.int": specialisePackSpecificationEvent("INT"),
  "pack-specification.prod": specialisePackSpecificationEvent("PROD"),
  "pack-specification.disabled": specialisePackSpecificationEvent("DISABLED"),
} as const;
