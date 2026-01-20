import {z} from "zod";
import {
  $EnvironmentStatus,
  ConfigBase,
} from "@nhsdigital/nhs-notify-event-schemas-supplier-config/src/domain/common";
import {idRef} from "@nhsdigital/nhs-notify-event-schemas-supplier-config/src/helpers/id-ref";

export const $PackFeature = z.enum(["BRAILLE", "AUDIO", "ADMAIL", "SAME_DAY"]);
export const $EnvelopeFeature = z.enum([
  "WHITEMAIL",
  "NHS_BRANDING",
  "NHS_BARCODE",
]);

export const $Envelope = ConfigBase("Envelope")
  .extend({
    name: z.string(),
    size: z.enum(["C5", "C4", "DL"]),
    features: z.array($EnvelopeFeature).optional(),
    artwork: z.url().optional(),
  })
  .describe("Envelope");
export type Envelope = z.infer<typeof $Envelope>;
export const EnvelopeId = $Envelope.shape.id.parse;

export const $Insert = ConfigBase("Insert")
  .extend({
    name: z.string(),
    type: z.enum(["FLYER", "BOOKLET"]),
    source: z.enum(["IN_HOUSE", "EXTERNAL"]),
    artwork: z.url().optional(),
  })
  .describe("Insert");
export type Insert = z.infer<typeof $Insert>;
export type InsertId = Insert["id"];

export const $Constraints = z.object({
  maxSheets: z.number().optional(),
  deliveryDays: z.number().optional(),
  blackCoveragePercentage: z.number().optional(),
  colourCoveragePercentage: z.number().optional(),
});

export const $Postage = ConfigBase("Postage")
  .extend({
    size: z.enum(["STANDARD", "LARGE", "PARCEL"]),
    deliveryDays: z.number().optional().meta({
      title: "Delivery Days",
      description:
        "The expected number of days for delivery under this postage option.",
    }),
    maxWeightGrams: z
      .number()
      .optional()
      .meta({
        title: "Max Weight (grams)",
        description:
          "The maximum weight in grams for this postage option. Places a " +
          "constraint based on the number of sheets and paper weight.",
      }),
    maxThicknessMm: z
      .number()
      .optional()
      .meta({
        title: "Max Thickness (mm)",
        description:
          "The maximum thickness in millimetres for this postage option. " +
          "Places a constraint based on the number of sheets and paper type.",
      }),
  })
  .describe("Postage");
export type Postage = z.infer<typeof $Postage>;
export const PostageId = $Postage.shape.id.parse;

export const $Paper = ConfigBase("Paper")
  .extend({
    name: z.string(),
    weightGSM: z.number(),
    size: z.enum(["A5", "A4", "A3"]),
    colour: z.enum(["WHITE"]).meta({
      title: "Colour",
      description:
        "The colour of the paper. Currently we only define WHITE paper, but this may be extended in future.",
    }),
    finish: z.enum(["MATT", "GLOSSY", "SILK"]).optional(),
    recycled: z.boolean(),
  })
  .describe("Paper");
export type Paper = z.infer<typeof $Paper>;
export const PaperId = $Paper.shape.id.parse;

export const $PackSpecification = ConfigBase("PackSpecification")
  .extend({
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
        paper: $Paper,
        insertIds: z.array(idRef($Insert)).optional(),
        features: z.array($PackFeature).optional(),
        additional: z.record(z.string(), z.string()).optional(),
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
export const PackSpecificationId = $PackSpecification.shape.id.parse;
