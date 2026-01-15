import { z } from "zod";
import { $Supplier, Supplier } from "../domain";
import { EventEnvelope } from "./event-envelope";

const supplierStatuses = [
  "DRAFT",
  "INT",
  "PROD",
] as const satisfies readonly Supplier["status"][];

/**
 * Generic schema for parsing any Supplier status change event
 */
export const $SupplierEvent = EventEnvelope(
  "supplier",
  "supplier",
  $Supplier,
  supplierStatuses,
).meta({
  title: "supplier.* Event",
  description: "Generic event schema for supplier changes",
});

function specialiseSupplierEvent(status: (typeof supplierStatuses)[number]) {
  const lcStatus = status.toLowerCase();
  return EventEnvelope(
    `supplier.${lcStatus}`,
    "supplier",
    $Supplier
      .extend({
        status: z.literal(status),
      })
      .meta({
        description: `Indicates the current operational state of the supplier.\n\nFor this event the status is always \`${status}\``,
      }),
    [status],
  ).meta({
    title: `supplier.${lcStatus} Event`,
    description: `Event schema for supplier change to ${status}`,
  });
}

export const supplierEvents = {
  "supplier.draft": specialiseSupplierEvent("DRAFT"),
  "supplier.int": specialiseSupplierEvent("INT"),
  "supplier.prod": specialiseSupplierEvent("PROD"),
} as const;
