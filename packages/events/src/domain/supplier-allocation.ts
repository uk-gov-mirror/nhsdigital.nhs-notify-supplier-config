import { z } from "zod";
import { $EnvironmentStatus, ConfigBase } from "./common";
import { idRef } from "../helpers/id-ref";
import { $VolumeGroup } from "./volume-group";
import { $Supplier } from "./supplier";

export const $SupplierAllocation = ConfigBase("SupplierAllocation")
  .extend({
    volumeGroup: idRef($VolumeGroup),
    supplier: idRef($Supplier),
    allocationPercentage: z.number().min(0).max(100),
    status: $EnvironmentStatus,
  })
  .meta({
    title: "SupplierAllocation",
    description:
      "A SupplierAllocation defines the proportion of the volume associated with a volume group which should be processed using a specific supplier.",
  });
export type SupplierAllocation = z.infer<typeof $SupplierAllocation>;
