import { z } from "zod";
import { $EnvironmentStatus } from "@nhsdigital/nhs-notify-event-schemas-supplier-config/src/domain/common";
import { idRef } from "@nhsdigital/nhs-notify-event-schemas-supplier-config/src/helpers/id-ref";
import { $Postage } from "./postage";
import { $Envelope } from "./envelope";
import { $Paper } from "./paper";
import { $Insert } from "./insert";
import {$Constraint, $Constraints} from "./constraint";

export const $PackFeature = z.enum(["BRAILLE", "AUDIO", "ADMAIL", "SAME_DAY"]);

export const $PackSpecification = z
  .object({
    id: z.string(),
    name: z.string(),
    description: z.string().optional(),
    status: $EnvironmentStatus,
    createdAt: z.iso.datetime(),
    updatedAt: z.iso.datetime(),
    version: z.int().meta({
      title: "Version",
      description:
        "The version number of this Pack Specification, incremented with each update.",
    }),
    billingId: z.string().optional(),
    constraints: $Constraints.optional(),
    postage: $Postage,
    assembly: z
      .object({
        envelopeId: idRef($Envelope),
        printColour: z.enum(["BLACK", "COLOUR"]),
        duplex: z.boolean(),
        paper: $Paper,
        insertIds: z.array(idRef($Insert)),
        features: z.array($PackFeature),
        additional: z.record(z.string(), z.string()),
      })
      .partial()
      .optional(),
  })
  .meta({
    title: "PackSpecification",
    description:
      "A PackSpecification defines the composition, postage and assembly attributes for producing a pack.",
  });
export type PackSpecification = z.infer<typeof $PackSpecification>;
