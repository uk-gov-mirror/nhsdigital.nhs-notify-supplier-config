import { z } from "zod";
import {
  type PackSpecification,
  type Postage,
  type Paper,
  type Envelope,
  type Insert,
  type Constraint,
  type Constraints,
  $PackFeature,
  $EnvelopeFeature,
  $Constraint,
  $Constraints,
} from "@nhsdigital/nhs-notify-event-schemas-supplier-config";

// Re-export types for use elsewhere
export {
  $PackFeature,
  $EnvelopeFeature,
  $Constraint,
  $Constraints,
  type PackSpecification,
  type Postage,
  type Paper,
  type Envelope,
  type Insert,
  type Constraint,
  type Constraints,
};

// =============================================================================
// Envelope Schema - Configured separately, referenced by ID in PackSpecification
// =============================================================================
export const $EnvelopeForm = z.object({
  name: z.string().min(1, "Name is required"),
  size: z.enum(["C5", "C4", "DL"]),
  features: z.array(z.enum(["WHITEMAIL", "NHS_BRANDING", "NHS_BARCODE"])).optional(),
  artwork: z.string().url().optional(),
  // Physical constraints for pack assembly
  maxSheets: z.number().min(1).optional().describe("Maximum number of sheets that can be accommodated within this envelope"),
  maxThicknessMm: z.number().min(0).optional().describe("Maximum thickness in mm for this envelope"),
});

export type EnvelopeFormData = z.infer<typeof $EnvelopeForm>;

export const $EnvelopeStorage = $EnvelopeForm.extend({
  id: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export type EnvelopeStorage = z.infer<typeof $EnvelopeStorage>;

// =============================================================================
// Insert Schema - Configured separately, referenced by ID in PackSpecification
// =============================================================================
export const $InsertForm = z.object({
  name: z.string().min(1, "Name is required"),
  type: z.enum(["FLYER", "BOOKLET", "ATTACHMENT"]),
  source: z.enum(["IN_HOUSE", "EXTERNAL"]),
  artwork: z.string().url().optional(),
  // Physical properties for constraint calculations
  weightGrams: z.number().min(0).optional().describe("Weight of the insert in grams"),
});

export type InsertFormData = z.infer<typeof $InsertForm>;

export const $InsertStorage = $InsertForm.extend({
  id: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export type InsertStorage = z.infer<typeof $InsertStorage>;

// =============================================================================
// Paper Schema - Configured separately, referenced by ID in PackSpecification
// =============================================================================
export const $PaperForm = z.object({
  name: z.string().min(1, "Name is required"),
  weightGSM: z.number().min(1, "Weight must be at least 1 GSM"),
  size: z.enum(["A5", "A4", "A3"]),
  colour: z.enum(["WHITE"]),
  finish: z.enum(["MATT", "GLOSSY", "SILK"]).optional(),
  recycled: z.boolean().default(false),
});

export type PaperFormData = z.infer<typeof $PaperForm>;

export const $PaperStorage = $PaperForm.extend({
  id: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export type PaperStorage = z.infer<typeof $PaperStorage>;

// =============================================================================
// Postage Schema - Configured separately, referenced by ID in PackSpecification
// =============================================================================
export const $PostageForm = z.object({
  name: z.string().min(1, "Name is required"), // UI field for display purposes
  size: z.enum(["STANDARD", "LARGE", "PARCEL"]),
  deliveryDays: z.number().min(1).optional(),
  maxWeightGrams: z.number().min(0).optional(),
  maxThicknessMm: z.number().min(0).optional(),
});

export type PostageFormData = z.infer<typeof $PostageForm>;

export const $PostageStorage = $PostageForm.extend({
  id: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export type PostageStorage = z.infer<typeof $PostageStorage>;

// =============================================================================
// Pack Specification Schema - References other entities by ID
// =============================================================================
export const $PackSpecificationForm = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  status: z.enum(["DRAFT", "INT", "PROD", "DISABLED"]).default("DRAFT"),
  billingId: z.string().optional(),
  // Postage configuration (full object in domain model, but we can start with ID for UI forms)
  postageId: z.string().min(1, "Postage is required"),
  // Assembly configuration with references by ID
  assembly: z
    .object({
      envelopeId: z.string().optional(),
      paperId: z.string().optional(),
      printColour: z.enum(["BLACK", "COLOUR"]).optional(),
      duplex: z.boolean().optional(),
      insertIds: z.array(z.string()).optional(),
      features: z.array(z.enum(["BRAILLE", "AUDIO", "ADMAIL", "SAME_DAY"])).optional(),
      additional: z.record(z.string(), z.string()).optional(),
    })
    .optional(),
  // Constraints with operator and value structure
  constraints: z
    .object({
      sheets: z
        .object({
          value: z.number(),
          operator: z.enum(["EQUALS", "NOT_EQUALS", "GREATER_THAN", "LESS_THAN"]).default("LESS_THAN"),
        })
        .optional(),
      sides: z
        .object({
          value: z.number(),
          operator: z.enum(["EQUALS", "NOT_EQUALS", "GREATER_THAN", "LESS_THAN"]).default("LESS_THAN"),
        })
        .optional(),
      deliveryDays: z
        .object({
          value: z.number(),
          operator: z.enum(["EQUALS", "NOT_EQUALS", "GREATER_THAN", "LESS_THAN"]).default("LESS_THAN"),
        })
        .optional(),
      blackCoveragePercentage: z
        .object({
          value: z.number().min(0).max(100),
          operator: z.enum(["EQUALS", "NOT_EQUALS", "GREATER_THAN", "LESS_THAN"]).default("LESS_THAN"),
        })
        .optional(),
      colourCoveragePercentage: z
        .object({
          value: z.number().min(0).max(100),
          operator: z.enum(["EQUALS", "NOT_EQUALS", "GREATER_THAN", "LESS_THAN"]).default("LESS_THAN"),
        })
        .optional(),
    })
    .optional(),
});

export type PackSpecificationFormData = z.infer<typeof $PackSpecificationForm>;

export const $PackSpecificationStorage = $PackSpecificationForm.extend({
  id: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
  version: z.number(),
});

export type PackSpecificationStorage = z.infer<typeof $PackSpecificationStorage>;
