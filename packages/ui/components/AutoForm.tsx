"use client";

import { useForm, UseFormReturn, FieldValues, Path } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

// Helper to get field label from key
function getLabel(key: string): string {
  return key
    .replace(/([A-Z])/g, " $1")
    .replace(/^./, (str) => str.toUpperCase())
    .trim();
}

// Helper to extract enum values from a zod schema (Zod 4 compatible)
function getEnumValues(schema: z.ZodTypeAny): string[] | null {
  // Check for enum type using _zod internals
  const def = (schema as { _zod?: { def?: { type?: string; values?: string[] } } })._zod?.def;

  if (def?.type === "enum" && def.values) {
    return def.values;
  }

  // Handle optional/default wrappers
  if (def?.type === "optional" || def?.type === "default") {
    const innerType = (def as { innerType?: z.ZodTypeAny }).innerType;
    if (innerType) {
      return getEnumValues(innerType);
    }
  }

  return null;
}

// Helper to check if schema is optional
function isOptional(schema: z.ZodTypeAny): boolean {
  const def = (schema as { _zod?: { def?: { type?: string } } })._zod?.def;
  return def?.type === "optional" || def?.type === "default";
}

// Helper to get inner type (Zod 4 compatible)
function getInnerType(schema: z.ZodTypeAny): z.ZodTypeAny {
  const def = (schema as { _zod?: { def?: { type?: string; innerType?: z.ZodTypeAny } } })._zod?.def;

  if ((def?.type === "optional" || def?.type === "default") && def.innerType) {
    return getInnerType(def.innerType);
  }
  return schema;
}

// Helper to get schema type
function getSchemaType(schema: z.ZodTypeAny): string {
  return (schema as { _zod?: { def?: { type?: string } } })._zod?.def?.type ?? "unknown";
}

// Helper to get object shape
function getObjectShape(schema: z.ZodTypeAny): Record<string, z.ZodTypeAny> | null {
  const def = (schema as { _zod?: { def?: { type?: string; shape?: Record<string, z.ZodTypeAny> } } })._zod?.def;
  if (def?.type === "object" && def.shape) {
    return def.shape;
  }
  return null;
}

type ZodObjectSchema = z.ZodObject<z.ZodRawShape>;

interface AutoFormProps<T extends ZodObjectSchema> {
  schema: T;
  onSubmit: (data: z.infer<T>) => void;
  defaultValues?: Partial<z.infer<T>>;
  submitText?: string;
}

// Field renderer based on schema type
function renderField<T extends FieldValues>(
  key: string,
  schema: z.ZodTypeAny,
  form: UseFormReturn<T>,
  parentKey = ""
) {
  const fieldPath = (parentKey ? `${parentKey}.${key}` : key) as Path<T>;
  const innerSchema = getInnerType(schema);
  const innerType = getSchemaType(innerSchema);
  const required = !isOptional(schema);
  const label = getLabel(key);
  const error = form.formState.errors[fieldPath as keyof typeof form.formState.errors];
  const errorMessage = error?.message as string | undefined;

  // Handle enum fields
  const enumValues = getEnumValues(schema);
  if (enumValues) {
    return (
      <div key={fieldPath} className="mb-4">
        <label className="block text-sm font-medium text-gray-900 mb-1">
          {label}
          {required && <span className="text-red-600 ml-1">*</span>}
        </label>
        <select
          {...form.register(fieldPath)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#005EB8] focus:border-transparent bg-white"
        >
          <option value="">Select...</option>
          {enumValues.map((opt) => (
            <option key={opt} value={opt}>
              {opt}
            </option>
          ))}
        </select>
        {errorMessage && <p className="mt-1 text-sm text-red-600">{errorMessage}</p>}
      </div>
    );
  }

  // Handle boolean fields
  if (innerType === "boolean") {
    return (
      <div key={fieldPath} className="mb-4">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            {...form.register(fieldPath)}
            className="w-4 h-4 text-[#005EB8] border-gray-300 rounded focus:ring-[#005EB8]"
          />
          <span className="text-sm font-medium text-gray-900">{label}</span>
        </label>
        {errorMessage && <p className="mt-1 text-sm text-red-600">{errorMessage}</p>}
      </div>
    );
  }

  // Handle number fields
  if (innerType === "number" || innerType === "int" || innerType === "float") {
    return (
      <div key={fieldPath} className="mb-4">
        <label className="block text-sm font-medium text-gray-900 mb-1">
          {label}
          {required && <span className="text-red-600 ml-1">*</span>}
        </label>
        <input
          type="number"
          {...form.register(fieldPath, { valueAsNumber: true })}
          className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#005EB8] focus:border-transparent"
        />
        {errorMessage && <p className="mt-1 text-sm text-red-600">{errorMessage}</p>}
      </div>
    );
  }

  // Handle nested objects
  const objectShape = getObjectShape(innerSchema);
  if (objectShape) {
    return (
      <fieldset key={fieldPath} className="mb-6 p-4 border border-gray-200 rounded-lg bg-white">
        <legend className="text-sm font-semibold text-gray-900 px-2">{label}</legend>
        {Object.entries(objectShape).map(([nestedKey, nestedSchema]) =>
          renderField(nestedKey, nestedSchema as z.ZodTypeAny, form, fieldPath)
        )}
      </fieldset>
    );
  }

  // Handle array fields (simplified - just show as JSON input for now)
  if (innerType === "array") {
    return (
      <div key={fieldPath} className="mb-4">
        <label className="block text-sm font-medium text-gray-900 mb-1">
          {label}
          {required && <span className="text-red-600 ml-1">*</span>}
        </label>
        <input
          type="text"
          placeholder="Comma-separated values"
          {...form.register(fieldPath)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#005EB8] focus:border-transparent"
        />
        <p className="mt-1 text-sm text-gray-600">Enter comma-separated values</p>
        {errorMessage && <p className="mt-1 text-sm text-red-600">{errorMessage}</p>}
      </div>
    );
  }

  // Default: string field
  return (
    <div key={fieldPath} className="mb-4">
      <label className="block text-sm font-medium text-gray-900 mb-1">
        {label}
        {required && <span className="text-red-600 ml-1">*</span>}
      </label>
      <input
        type="text"
        {...form.register(fieldPath)}
        className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#005EB8] focus:border-transparent"
      />
      {errorMessage && <p className="mt-1 text-sm text-red-600">{errorMessage}</p>}
    </div>
  );
}

export function AutoForm<T extends ZodObjectSchema>({
  schema,
  onSubmit,
  defaultValues,
  submitText = "Submit",
}: AutoFormProps<T>) {
  type FormData = z.infer<T>;

  const form = useForm<FormData>({
    resolver: zodResolver(schema) as never,
    defaultValues: defaultValues as never,
  });

  const shape = getObjectShape(schema) ?? {};

  return (
    <form onSubmit={form.handleSubmit(onSubmit as never)} className="space-y-4">
      {Object.entries(shape).map(([key, fieldSchema]) =>
        renderField(key, fieldSchema as z.ZodTypeAny, form)
      )}

      <button
        type="submit"
        disabled={form.formState.isSubmitting}
        className="w-full bg-[#005EB8] text-white px-6 py-3 rounded-md hover:bg-[#004a93] transition-colors font-medium disabled:opacity-50"
      >
        {form.formState.isSubmitting ? "Submitting..." : submitText}
      </button>
    </form>
  );
}

export default AutoForm;
