import { z } from "zod";
import { $SupplierPack, SupplierPack } from "../domain";
import { EventEnvelope } from "./event-envelope";

const packStatuses = [
  "DRAFT",
  "INT",
  "PROD",
] as const satisfies readonly SupplierPack["status"][];

/**
 * Generic schema for parsing any SupplierPack status change event
 */
export const $SupplierPackEvent = EventEnvelope(
  "supplier-pack",
  "supplier-pack",
  $SupplierPack,
  packStatuses,
).meta({
  title: "supplier-pack.* Event",
  description: "Generic event schema for supplier pack changes",
});

/**
 * Specialise the generic event schema for a single status
 * @param status
 */
function specialiseSupplierPackEvent(status: (typeof packStatuses)[number]) {
  const lcStatus = status.toLowerCase();
  return EventEnvelope(
    `supplier-pack.${lcStatus}`,
    "supplier-pack",
    $SupplierPack
      .extend({
        status: z.literal(status),
      })
      .meta({
        title: "SupplierPack",
        description: `Indicates that a specific supplier is capable of producing a specific pack specification.

For this event the status is always \`${status}\``,
      }),
    [status],
  ).meta({
    title: `supplier-pack.${lcStatus} Event`,
    description: `Event schema for supplier pack change to ${status}`,
  });
}

export const supplierPackEvents = {
  "supplier-pack.draft": specialiseSupplierPackEvent("DRAFT"),
  "supplier-pack.int": specialiseSupplierPackEvent("INT"),
  "supplier-pack.prod": specialiseSupplierPackEvent("PROD"),
} as const;
