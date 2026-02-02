import { z } from "zod";
import { $ChannelType } from "@nhsdigital/nhs-notify-event-schemas-supplier-config/src/domain/channel";
import { $EnvironmentStatus } from "@nhsdigital/nhs-notify-event-schemas-supplier-config/src/domain/common";

export const $Supplier = z
  .object({
    id: z.string(),
    name: z.string(),
    channelType: $ChannelType,
    dailyCapacity: z.number().int(),
    status: $EnvironmentStatus,
  })
  .describe("Supplier");

export type Supplier = z.infer<typeof $Supplier>;
