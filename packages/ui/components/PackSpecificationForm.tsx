"use client";

import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useCallback } from "react";
import { trpc } from "@/src/trpc/client";
import { $PackSpecificationForm, type PackSpecificationFormData } from "@/src/schemas";
import type { PostageStorage, EnvelopeStorage, PaperStorage, InsertStorage } from "@/src/config-repo";
import MultiSelect from "./MultiSelect";

// Compute constraints based on selected options
function computeConstraints(
  postage: PostageStorage | undefined,
  envelope: EnvelopeStorage | undefined,
  paper: PaperStorage | undefined,
  inserts: InsertStorage[],
  printColour: string | undefined
): PackSpecificationFormData["constraints"] {
  const constraints: PackSpecificationFormData["constraints"] = {};

  // Delivery days from postage
  if (postage?.deliveryDays) {
    constraints.deliveryDays = {
      value: postage.deliveryDays,
      operator: "LESS_THAN" as const,
    };
  }

  // Calculate max sheets based on:
  // 1. Envelope's configured maxSheets (if set)
  // 2. Fallback to default physical limits by envelope size
  // 3. Postage weight limits
  // 4. Account for inserts reducing available sheet capacity

  // Default physical limits by envelope size (fallback if not configured)
  const defaultLimitByEnvelope: Record<string, number> = {
    DL: 3,   // DL envelope: max ~3 A4 sheets folded
    C5: 5,   // C5 envelope: max ~5 A4 sheets folded
    C4: 15,  // C4 envelope: max ~15 A4 sheets flat
  };

  // Use envelope's configured limit, or fall back to defaults
  let envelopeLimit: number;
  if (envelope?.maxSheets) {
    envelopeLimit = envelope.maxSheets;
  } else if (envelope?.size) {
    envelopeLimit = defaultLimitByEnvelope[envelope.size] ?? 10;
  } else {
    envelopeLimit = 10;
  }

  // Reduce envelope limit by number of inserts (each counts as 1 sheet equivalent)
  const insertCount = inserts.length;
  const physicalLimit = Math.max(1, envelopeLimit - insertCount);

  // Weight-based limit
  let weightBasedLimit = physicalLimit;

  if (postage?.maxWeightGrams && paper?.weightGSM) {
    // Paper weight calculation:
    // A4 = 210mm × 297mm = 0.06237 m²
    // Weight per sheet = GSM × area in m² = GSM × 0.06237
    // For 80gsm: 80 × 0.06237 ≈ 5g per A4 sheet
    const sheetWeightGrams = paper.weightGSM * 0.06237;

    // Envelope weight - estimate based on size since weightGrams is not in domain model
    const envelopeWeight = envelope?.size === "C4" ? 20 : envelope?.size === "C5" ? 15 : 10;

    // Insert weight - use configured values or estimate 5g each
    const insertWeight = inserts.reduce(
      (sum, insert) => sum + (insert.weightGrams ?? 5),
      0
    );

    // Available weight for paper sheets
    const availableWeight = postage.maxWeightGrams - envelopeWeight - insertWeight;

    if (sheetWeightGrams > 0 && availableWeight > 0) {
      weightBasedLimit = Math.floor(availableWeight / sheetWeightGrams);
    }
  }

  // Use the more restrictive limit
  constraints.sheets = {
    value: Math.min(physicalLimit, weightBasedLimit),
    operator: "LESS_THAN" as const,
  };

  // Set coverage percentages based on print colour
  if (printColour === "BLACK") {
    constraints.blackCoveragePercentage = {
      value: 15, // Typical black text coverage
      operator: "LESS_THAN" as const,
    };
    constraints.colourCoveragePercentage = {
      value: 0,
      operator: "LESS_THAN" as const,
    };
  } else if (printColour === "COLOUR") {
    constraints.blackCoveragePercentage = {
      value: 10,
      operator: "LESS_THAN" as const,
    };
    constraints.colourCoveragePercentage = {
      value: 20, // Typical colour coverage
      operator: "LESS_THAN" as const,
    };
  }

  return Object.keys(constraints).length > 0 ? constraints : undefined;
}

interface PackSpecificationFormProps {
  onSubmit: (data: PackSpecificationFormData) => void;
  defaultValues?: Partial<PackSpecificationFormData>;
  submitText?: string;
  isSubmitting?: boolean;
}

export function PackSpecificationForm({
  onSubmit,
  defaultValues,
  submitText = "Submit",
  isSubmitting = false,
}: PackSpecificationFormProps) {
  const form = useForm<PackSpecificationFormData>({
    resolver: zodResolver($PackSpecificationForm) as never,
    defaultValues: defaultValues as never,
  });

  // Fetch available options for reference fields
  const { data: postages } = trpc.postage.list.useQuery();
  const { data: envelopes } = trpc.envelope.list.useQuery();
  const { data: papers } = trpc.paper.list.useQuery();
  const { data: inserts } = trpc.insert.list.useQuery();

  // Watch fields that affect constraints
  const watchPostageId = form.watch("postageId");
  const watchEnvelopeId = form.watch("assembly.envelopeId");
  const watchPaperId = form.watch("assembly.paperId");
  const watchInsertIds = form.watch("assembly.insertIds");
  const watchPrintColour = form.watch("assembly.printColour");

  // Auto-compute constraints when relevant fields change
  const updateConstraints = useCallback(() => {
    const selectedPostage = postages?.find((p) => p.id === watchPostageId);
    const selectedEnvelope = envelopes?.find((e) => e.id === watchEnvelopeId);
    const selectedPaper = papers?.find((p) => p.id === watchPaperId);
    const selectedInserts = inserts?.filter((i) => watchInsertIds?.includes(i.id)) ?? [];

    const computed = computeConstraints(
      selectedPostage,
      selectedEnvelope,
      selectedPaper,
      selectedInserts,
      watchPrintColour
    );

    if (computed) {
      // Only update if computed values differ from current
      const current = form.getValues("constraints");
      if (JSON.stringify(computed) !== JSON.stringify(current)) {
        form.setValue("constraints", computed);
      }
    }
  }, [postages, envelopes, papers, inserts, watchPostageId, watchEnvelopeId, watchPaperId, watchInsertIds, watchPrintColour, form]);

  useEffect(() => {
    // Only auto-compute if we have loaded the reference data
    if (postages && envelopes && papers && inserts) {
      updateConstraints();
    }
  }, [updateConstraints, postages, envelopes, papers, inserts]);

  return (
    <form onSubmit={form.handleSubmit(onSubmit as never)} className="space-y-6">
      {/* Basic Information */}
      <div className="grid md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-900 mb-1">
            Name <span className="text-red-600">*</span>
          </label>
          <input
            type="text"
            {...form.register("name")}
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#005EB8]"
          />
          {form.formState.errors.name && (
            <p className="mt-1 text-sm text-red-600">{form.formState.errors.name.message}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-900 mb-1">
            Status <span className="text-red-600">*</span>
          </label>
          <select
            {...form.register("status")}
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#005EB8] bg-white"
          >
            <option value="DRAFT">Draft</option>
            <option value="INT">Integration</option>
            <option value="PROD">Production</option>
            <option value="DISABLED">Disabled</option>
          </select>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-900 mb-1">
          Description
        </label>
        <textarea
          {...form.register("description")}
          rows={2}
          className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#005EB8]"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-900 mb-1">
          Billing ID
        </label>
        <input
          type="text"
          {...form.register("billingId")}
          className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#005EB8]"
        />
      </div>

      {/* Postage Selection */}
      <fieldset className="p-4 border border-gray-200 rounded-lg bg-white">
        <legend className="text-sm font-semibold text-gray-900 px-2">Postage</legend>
        <div>
          <label className="block text-sm font-medium text-gray-900 mb-1">
            Postage Option <span className="text-red-600">*</span>
          </label>
          <select
            {...form.register("postageId")}
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#005EB8] bg-white"
          >
            <option value="">Select postage...</option>
            {postages?.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} ({p.size} - {p.deliveryDays} days)
              </option>
            ))}
          </select>
          {form.formState.errors.postageId && (
            <p className="mt-1 text-sm text-red-600">{form.formState.errors.postageId.message}</p>
          )}
        </div>
      </fieldset>

      {/* Assembly Configuration */}
      <fieldset className="p-4 border border-gray-200 rounded-lg bg-white">
        <legend className="text-sm font-semibold text-gray-900 px-2">Assembly</legend>

        <div className="grid md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-1">
              Envelope
            </label>
            <select
              {...form.register("assembly.envelopeId")}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#005EB8] bg-white"
            >
              <option value="">Select envelope...</option>
              {envelopes?.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.name} ({e.size})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-900 mb-1">
              Paper
            </label>
            <select
              {...form.register("assembly.paperId")}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#005EB8] bg-white"
            >
              <option value="">Select paper...</option>
              {papers?.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.size} - {p.weightGSM}gsm)
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-1">
              Print Colour
            </label>
            <select
              {...form.register("assembly.printColour")}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#005EB8] bg-white"
            >
              <option value="">Select...</option>
              <option value="BLACK">Black</option>
              <option value="COLOUR">Colour</option>
            </select>
          </div>

          <div className="flex items-center pt-6">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                {...form.register("assembly.duplex")}
                className="w-4 h-4 text-[#005EB8] border-gray-300 rounded focus:ring-[#005EB8]"
              />
              <span className="text-sm font-medium text-gray-900">Duplex (double-sided)</span>
            </label>
          </div>
        </div>

        <div className="mb-4">
          <Controller
            name="assembly.insertIds"
            control={form.control}
            render={({ field }) => (
              <MultiSelect
                label="Inserts"
                options={(inserts ?? []).map((insert) => ({
                  id: insert.id,
                  name: insert.name,
                  description: `${insert.type} - ${insert.source}`,
                }))}
                selected={field.value ?? []}
                onChange={field.onChange}
                placeholder="Select inserts..."
              />
            )}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-900 mb-1">
            Features
          </label>
          <div className="flex flex-wrap gap-4">
            {["BRAILLE", "AUDIO", "ADMAIL", "SAME_DAY"].map((feature) => (
              <label key={feature} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  value={feature}
                  {...form.register("assembly.features")}
                  className="w-4 h-4 text-[#005EB8] border-gray-300 rounded focus:ring-[#005EB8]"
                />
                <span className="text-sm font-medium text-gray-900">{feature.replace("_", " ")}</span>
              </label>
            ))}
          </div>
        </div>
      </fieldset>

      {/* Constraints */}
      <fieldset className="p-4 border border-gray-200 rounded-lg bg-white">
        <legend className="text-sm font-semibold text-gray-900 px-2">
          Constraints
          <span className="ml-2 text-xs font-normal text-gray-600">(Auto-computed, can be overridden)</span>
        </legend>

        <div className="mb-4 flex items-center gap-2">
          <button
            type="button"
            onClick={updateConstraints}
            className="text-sm text-[#005EB8] hover:text-[#004a93] font-medium flex items-center gap-1"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Recalculate from selections
          </button>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-1">
              Sheets
            </label>
            <div className="flex gap-2">
              <select
                {...form.register("constraints.sheets.operator")}
                className="px-3 py-2 border border-gray-300 rounded-md text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#005EB8] bg-white"
              >
                <option value="LESS_THAN">Less Than</option>
                <option value="EQUALS">Equals</option>
                <option value="GREATER_THAN">Greater Than</option>
                <option value="NOT_EQUALS">Not Equals</option>
              </select>
              <input
                type="number"
                {...form.register("constraints.sheets.value", { valueAsNumber: true })}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#005EB8]"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-900 mb-1">
              Delivery Days
            </label>
            <div className="flex gap-2">
              <select
                {...form.register("constraints.deliveryDays.operator")}
                className="px-3 py-2 border border-gray-300 rounded-md text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#005EB8] bg-white"
              >
                <option value="LESS_THAN">Less Than</option>
                <option value="EQUALS">Equals</option>
                <option value="GREATER_THAN">Greater Than</option>
                <option value="NOT_EQUALS">Not Equals</option>
              </select>
              <input
                type="number"
                {...form.register("constraints.deliveryDays.value", { valueAsNumber: true })}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#005EB8]"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-900 mb-1">
              Black Coverage %
            </label>
            <div className="flex gap-2">
              <select
                {...form.register("constraints.blackCoveragePercentage.operator")}
                className="px-3 py-2 border border-gray-300 rounded-md text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#005EB8] bg-white"
              >
                <option value="LESS_THAN">Less Than</option>
                <option value="EQUALS">Equals</option>
                <option value="GREATER_THAN">Greater Than</option>
                <option value="NOT_EQUALS">Not Equals</option>
              </select>
              <input
                type="number"
                min="0"
                max="100"
                {...form.register("constraints.blackCoveragePercentage.value", { valueAsNumber: true })}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#005EB8]"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-900 mb-1">
              Colour Coverage %
            </label>
            <div className="flex gap-2">
              <select
                {...form.register("constraints.colourCoveragePercentage.operator")}
                className="px-3 py-2 border border-gray-300 rounded-md text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#005EB8] bg-white"
              >
                <option value="LESS_THAN">Less Than</option>
                <option value="EQUALS">Equals</option>
                <option value="GREATER_THAN">Greater Than</option>
                <option value="NOT_EQUALS">Not Equals</option>
              </select>
              <input
                type="number"
                min="0"
                max="100"
                {...form.register("constraints.colourCoveragePercentage.value", { valueAsNumber: true })}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#005EB8]"
              />
            </div>
          </div>
        </div>
      </fieldset>

      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full bg-[#005EB8] text-white px-6 py-3 rounded-md hover:bg-[#004a93] transition-colors font-medium disabled:opacity-50"
      >
        {isSubmitting ? "Submitting..." : submitText}
      </button>
    </form>
  );
}

export default PackSpecificationForm;
