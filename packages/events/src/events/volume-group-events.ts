import { z } from "zod";
import { $VolumeGroup, VolumeGroup } from "../domain";
import { EventEnvelope } from "./event-envelope";

const statuses = [
  "DRAFT",
  "INT",
  "PROD",
] as const satisfies readonly VolumeGroup["status"][];

/**
 * Generic schema for parsing any VolumeGroup status change event
 */
export const $VolumeGroupEvent = EventEnvelope(
  "volume-group",
  "volume-group",
  $VolumeGroup,
  statuses,
).meta({
  title: "volume-group.* Event",
  description: "Generic event schema for volume group changes",
});

/**
 * Specialise the generic event schema for a single status
 * @param status
 */
function specialiseVolumeGroupEvent(status: (typeof statuses)[number]) {
  const lcStatus = status.toLowerCase();
  return EventEnvelope(
    `volume-group.${lcStatus}`,
    "volume-group",
    $VolumeGroup
      .extend({
        status: z.literal(status),
      })
      .meta({
        title: "VolumeGroup",
        description: `A volume group representing several lots within a competition framework under which suppliers will be allocated capacity.

For this event the status is always \`${status}\``,
      }),
    [status],
  ).meta({
    title: `volume-group.${lcStatus} Event`,
    description: `Event schema for volume group change to ${status}`,
  });
}

export const volumeGroupEvents = {
  "volume-group.draft": specialiseVolumeGroupEvent("DRAFT"),
  "volume-group.int": specialiseVolumeGroupEvent("INT"),
  "volume-group.prod": specialiseVolumeGroupEvent("PROD"),
} as const;
