import { $EnvironmentStatus } from "@nhsdigital/nhs-notify-event-schemas-supplier-config/src/domain/common";
import { idRef } from "@nhsdigital/nhs-notify-event-schemas-supplier-config/src/helpers/id-ref";
import { $PackSpecification } from "@nhsdigital/nhs-notify-event-schemas-supplier-config/src/domain/pack-specification";
import { z } from "zod";
import { $VolumeGroup } from "./volume-group";
import { $Supplier } from "./supplier";
import { $Constraint, $Constraints } from "./constraint";

export const $LetterType = z.enum(["STANDARD", "BRAILLE", "AUDIO"]);

export const $LetterVariant = z
  .object({
    id: z.string(),
    name: z.string(),
    description: z.string().optional(),
    type: $LetterType,
    status: $EnvironmentStatus,
    volumeGroupId: idRef($VolumeGroup),
    clientId: z
      .string()
      .optional()
      .meta({
        title: "Client ID",
        description:
          "The clientId this letter variant is scoped to, if applicable. If omitted, all client IDs" +
          " are eligible to use this letter variant.",
      }),
    campaignIds: z
      .array(z.string())
      .optional()
      .meta({
        title: "Campaign IDs",
        description:
          "The campaignIds this letter variant is scoped to, if applicable. " +
          "This is used to restrict a particular variant to specific campaigns " +
          "without the need for bespoke specifications, for example individual admail campaigns.",
      }),
    supplierId: idRef($Supplier)
      .optional()
      .meta({
        title: "Supplier ID",
        description:
          "The supplierId this letter variant is scoped to, if applicable. " +
          "This is used to restrict a particular variant to a single supplier, " +
          "for example individual admail campaigns.",
      }),
    packSpecificationIds: z.array(idRef($PackSpecification)).nonempty().meta({
      title: "Pack Specifications",
      description:
        "The pack specifications eligible for production of this letter variant.",
    }),
    constraints: $Constraints.optional().meta({
      title: "LetterVariant Constraints",
      description:
        "Constraints that apply to this letter variant, aggregating those in the pack " +
        "specifications where specified.",
    }),
  })
  .meta({
    title: "LetterVariant",
    description:
      "A Letter Variant describes a letter that can be produced with particular " +
      "characteristics, and may be scoped to a single clientId and campaignId.",
  });
export type LetterVariant = z.infer<typeof $LetterVariant>;
