import { VolumeGroup } from "@nhsdigital/nhs-notify-event-schemas-supplier-config/src/domain/volume-group";
import { z } from "zod";
import {
  $VolumeGroupEvent,
  volumeGroupEvents,
} from "@nhsdigital/nhs-notify-event-schemas-supplier-config";
import { configFromEnv } from "./config";
import { SeverityText, newSequenceGenerator } from "./lib/envelope-helpers";
import { buildBaseEventEnvelope } from "./lib/base-event-envelope";

export interface BuildVolumeGroupEventOptions {
  severity?: SeverityText;
  sequence?: string | Generator<string, never, undefined>;
}

type VolumeGroupEvent = z.infer<typeof $VolumeGroupEvent>;

export const buildVolumeGroupEvent = (
  volumeGroup: VolumeGroup,
  opts: BuildVolumeGroupEventOptions = {},
  config = configFromEnv(),
): VolumeGroupEvent | undefined => {
  if (volumeGroup.status === "DRAFT") return undefined; // skip drafts

  const lcStatus = volumeGroup.status.toLowerCase();
  const schemaKey =
    `volume-group.${lcStatus}` as keyof typeof volumeGroupEvents;
  // Access using controlled key constructed from validated status
  // eslint-disable-next-line security/detect-object-injection
  const specialised = volumeGroupEvents[schemaKey];
  if (!specialised) {
    throw new Error(
      `No specialised event schema found for status ${volumeGroup.status}`,
    );
  }
  const dataschemaversion = config.EVENT_DATASCHEMAVERSION;
  const dataschema = `https://notify.nhs.uk/cloudevents/schemas/supplier-config/volume-group.${lcStatus}.${dataschemaversion}.schema.json`;
  const severity = opts.severity ?? "INFO";
  return specialised.parse(
    buildBaseEventEnvelope(
      specialised.shape.type.options[0],
      `volume-group/${volumeGroup.id}`,
      volumeGroup.id,
      { ...volumeGroup, status: volumeGroup.status },
      dataschema,
      config,
      { severity, sequence: opts.sequence },
    ),
  );
};

export const buildVolumeGroupEvents = (
  volumeGroups: Record<string, VolumeGroup>,
  startingCounter = 1,
): (VolumeGroupEvent | undefined)[] => {
  const sequenceGenerator = newSequenceGenerator(startingCounter);

  return Object.values(volumeGroups).map((vg) =>
    buildVolumeGroupEvent(vg, { sequence: sequenceGenerator }),
  );
};
