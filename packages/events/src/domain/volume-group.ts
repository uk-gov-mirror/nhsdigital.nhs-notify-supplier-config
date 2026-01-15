import { z } from "zod";
import { $EnvironmentStatus, ConfigBase } from "./common";

export const $VolumeGroup = ConfigBase("VolumeGroup")
  .extend({
    name: z.string(),
    description: z.string().optional(),
    status: $EnvironmentStatus,
    startDate: z.iso.date(), // ISO date
    endDate: z.iso.date().optional(), // ISO date
  })
  .meta({
    title: "VolumeGroup",
    description:
      "A volume group representing several lots within a competition framework under which suppliers will be allocated capacity.",
  });
export type VolumeGroup = z.infer<typeof $VolumeGroup>;
export const VolumeGroupId = $VolumeGroup.shape.id.parse;
