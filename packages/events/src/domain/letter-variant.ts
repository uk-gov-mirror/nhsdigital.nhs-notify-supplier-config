import {$EnvironmentStatus, ConfigBase} from "@nhsdigital/nhs-notify-event-schemas-supplier-config/src/domain/common";
import { idRef } from "@nhsdigital/nhs-notify-event-schemas-supplier-config/src/helpers/id-ref";
import {
  $Constraints,
  $PackSpecification,
} from "@nhsdigital/nhs-notify-event-schemas-supplier-config/src/domain/pack-specification";
import { z } from "zod";
import { $VolumeGroup } from "./volume-group";

export const $LetterType = z.enum(["STANDARD", "BRAILLE", "AUDIO", "SAME_DAY"]);

export const $LetterVariant = ConfigBase("LetterVariant")
  .extend({
    name: z.string(),
    description: z.string().optional(),
    type: $LetterType,
    status: $EnvironmentStatus,
    volumeGroupId: idRef($VolumeGroup),
    clientId: z.string().optional(),
    campaignIds: z.array(z.string()).optional(),
    packSpecificationIds: z.array(idRef($PackSpecification)).nonempty(),
    constraints: $Constraints.optional().meta({
      title: "LetterVariant Constraints",
      description:
        "Constraints that apply to this letter variant, aggregating those in the pack specifications where specified.",
    }),
  })
  .meta({
    title: "LetterVariant",
    description:
      "A Letter Variant describes a letter that can be produced with particular characteristics, and may be scoped to a single clientId and campaignId.",
  });
export type LetterVariant = z.infer<typeof $LetterVariant>;
export const LetterVariantId = $LetterVariant.shape.id.parse;
