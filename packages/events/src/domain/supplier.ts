import { z } from "zod";
import { $ChannelType } from "@nhsdigital/nhs-notify-event-schemas-supplier-config/src/domain/channel";
import {
  $EnvironmentStatus,
  ConfigBase,
} from "@nhsdigital/nhs-notify-event-schemas-supplier-config/src/domain/common";

export const $Supplier = ConfigBase("Supplier")
  .extend({
    name: z.string(),
    channelType: $ChannelType,
    dailyCapacity: z.number().int(),
    status: $EnvironmentStatus,
  })
  .describe("Supplier");

export type Supplier = z.infer<typeof $Supplier>;
export const SupplierId = $Supplier.shape.id.parse;
