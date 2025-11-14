import * as XLSX from "xlsx";
import {
  $PackSpecification,
  EnvelopeId,
  InsertId,
  PackSpecification,
  PackSpecificationId,
  PaperId,
  PostageId,
} from "@nhsdigital/nhs-notify-event-schemas-supplier-config/src/domain/pack-specification";
import {
  $LetterVariant,
  LetterVariant,
  LetterVariantId,
} from "@nhsdigital/nhs-notify-event-schemas-supplier-config/src/domain/letter-variant";
import {
  $VolumeGroup,
  VolumeGroup,
  VolumeGroupId,
} from "@nhsdigital/nhs-notify-event-schemas-supplier-config/src/domain/volume-group";
import {
  $Supplier,
  Supplier,
  SupplierId,
} from "@nhsdigital/nhs-notify-event-schemas-supplier-config/src/domain/supplier";
import {
  $SupplierAllocation,
  SupplierAllocation,
} from "@nhsdigital/nhs-notify-event-schemas-supplier-config/src/domain/supplier-allocation";
import {
  $SupplierPack,
  SupplierPack,
} from "@nhsdigital/nhs-notify-event-schemas-supplier-config/src/domain/supplier-pack";

interface PackSpecificationRow {
  id: string;
  name: string;
  description?: string;
  status: string;
  version: string;
  createdAt: string | number;
  updatedAt: string | number;
  billingId?: string;
  // Constraints
  "constraints.maxSheets"?: string;
  "constraints.deliveryDays"?: string;
  "constraints.blackCoveragePercentage"?: string;
  "constraints.colourCoveragePercentage"?: string;
  // Postage (only id and size are required, plus optional fields)
  "postage.id": string;
  "postage.size": string;
  "postage.deliveryDays"?: string;
  "postage.maxWeightGrams"?: string;
  "postage.maxThicknessMm"?: string;
  // Assembly
  "assembly.envelopeId"?: string;
  "assembly.printColour"?: string;
  "assembly.duplex"?: string;
  "assembly.paper.id"?: string;
  "assembly.paper.name"?: string;
  "assembly.paper.weightGSM"?: string;
  "assembly.paper.size"?: string;
  "assembly.paper.colour"?: string;
  "assembly.paper.finish"?: string;
  "assembly.paper.recycled"?: string;
  "assembly.insertIds"?: string;
  "assembly.features"?: string;
  "assembly.additional"?: string;
}

interface LetterVariantRow {
  id: string;
  name: string;
  description?: string;
  volumeGroupId: string;
  packSpecificationIds: string;
  type: string;
  status: string;
  clientId?: string;
  campaignIds?: string;
  supplierId?: string;
  // Constraints
  "constraints.maxSheets"?: string;
  "constraints.deliveryDays"?: string;
  "constraints.blackCoveragePercentage"?: string;
  "constraints.colourCoveragePercentage"?: string;
}

interface VolumeGroupRow {
  id: string;
  name: string;
  description?: string;
  startDate: string | number;
  endDate?: string | number;
  status?: string; // new optional status column
}

interface SupplierRow {
  id: string;
  name: string;
  channelType: string;
  dailyCapacity: string;
  status?: string;
}

interface SupplierAllocationRow {
  id: string;
  volumeGroupId: string;
  supplier: string;
  allocationPercentage: string;
  status: string;
}

interface SupplierPackRow {
  id: string;
  packSpecificationId: string;
  supplierId: string;
  approval: string;
  status: string;
}

function parseDate(dateStr?: string | number): string {
  if (!dateStr) return "2023-01-01T00:00:00Z";

  // Handle Excel serial date numbers
  if (typeof dateStr === "number") {
    // Excel serial date: days since 1900-01-01 (with Excel's leap year bug)
    // Excel incorrectly treats 1900 as a leap year, so subtract 1 for dates after Feb 28, 1900
    const excelEpoch = new Date(1899, 11, 30); // Dec 30, 1899
    const date = new Date(excelEpoch.getTime() + dateStr * 24 * 60 * 60 * 1000);
    return date.toISOString();
  }

  const date = new Date(dateStr);
  return Number.isNaN(date.getTime())
    ? "2023-01-01T00:00:00Z"
    : date.toISOString();
}

function parseDateOnly(dateStr?: string | number): string {
  if (!dateStr) return "2023-01-01"; // default date only

  // Handle Excel serial date numbers
  if (typeof dateStr === "number") {
    // Excel serial date: days since 1900-01-01 (with Excel's leap year bug)
    const excelEpoch = new Date(1899, 11, 30); // Dec 30, 1899
    const date = new Date(excelEpoch.getTime() + dateStr * 24 * 60 * 60 * 1000);
    return date.toISOString().split("T")[0];
  }

  const date = new Date(dateStr);
  if (Number.isNaN(date.getTime())) return "2023-01-01";
  // toISOString gives full timestamp, slice to date portion
  return date.toISOString().split("T")[0];
}

function parseArray(value?: string): string[] | undefined {
  if (!value || value.trim() === "") return undefined;
  return value.split(",").map((item) => item.trim());
}

function parseConstraints(row: {
  "constraints.maxSheets"?: string;
  "constraints.deliveryDays"?: string;
  "constraints.blackCoveragePercentage"?: string;
  "constraints.colourCoveragePercentage"?: string;
}): PackSpecification["constraints"] | undefined {
  const constraints: NonNullable<PackSpecification["constraints"]> = {};
  let hasConstraints = false;

  if (row["constraints.maxSheets"]) {
    constraints.maxSheets = Number.parseInt(row["constraints.maxSheets"], 10);
    hasConstraints = true;
  }
  if (row["constraints.deliveryDays"]) {
    constraints.deliveryDays = Number.parseInt(
      row["constraints.deliveryDays"],
      10,
    );
    hasConstraints = true;
  }
  if (row["constraints.blackCoveragePercentage"]) {
    constraints.blackCoveragePercentage = Number.parseFloat(
      row["constraints.blackCoveragePercentage"],
    );
    hasConstraints = true;
  }
  if (row["constraints.colourCoveragePercentage"]) {
    constraints.colourCoveragePercentage = Number.parseFloat(
      row["constraints.colourCoveragePercentage"],
    );
    hasConstraints = true;
  }

  return hasConstraints ? constraints : undefined;
}

function parsePostage(row: PackSpecificationRow): PackSpecification["postage"] {
  if (!row["postage.id"] || !row["postage.size"]) {
    throw new Error(
      `Missing required postage fields (postage.id & postage.size) for PackSpecification id '${row.id}'`,
    );
  }

  const postage: PackSpecification["postage"] = {
    id: PostageId(row["postage.id"]),
    size: row["postage.size"] as PackSpecification["postage"]["size"],
  };

  if (row["postage.deliveryDays"]) {
    postage.deliveryDays = Number.parseInt(row["postage.deliveryDays"], 10);
  }
  if (row["postage.maxWeightGrams"]) {
    postage.maxWeightGrams = Number.parseFloat(row["postage.maxWeightGrams"]);
  }
  if (row["postage.maxThicknessMm"]) {
    postage.maxThicknessMm = Number.parseFloat(row["postage.maxThicknessMm"]);
  }

  return postage;
}

function parseAssembly(
  row: PackSpecificationRow,
): NonNullable<PackSpecification["assembly"]> | undefined {
  const assembly: NonNullable<PackSpecification["assembly"]> = {};
  let hasAssembly = false;

  if (row["assembly.envelopeId"]) {
    assembly.envelopeId = EnvelopeId(row["assembly.envelopeId"]);
    hasAssembly = true;
  }

  if (row["assembly.printColour"]) {
    assembly.printColour = row["assembly.printColour"] as "BLACK" | "COLOUR";
    hasAssembly = true;
  }

  if (row["assembly.duplex"]) {
    assembly.duplex =
      row["assembly.duplex"] === "true" || row["assembly.duplex"] === "TRUE";
    hasAssembly = true;
  }

  // Parse paper if any paper fields are present
  if (row["assembly.paper.id"]) {
    assembly.paper = {
      id: PaperId(row["assembly.paper.id"]),
      name: row["assembly.paper.name"] || "",
      weightGSM: Number.parseFloat(row["assembly.paper.weightGSM"] || "80"),
      size: row["assembly.paper.size"] as "A5" | "A4" | "A3",
      colour: (row["assembly.paper.colour"] || "WHITE") as "WHITE",
      recycled:
        row["assembly.paper.recycled"] === "true" ||
        row["assembly.paper.recycled"] === "TRUE",
    };
    if (row["assembly.paper.finish"]) {
      assembly.paper.finish = row["assembly.paper.finish"] as
        | "MATT"
        | "GLOSSY"
        | "SILK";
    }
    hasAssembly = true;
  }

  if (row["assembly.insertIds"]) {
    const insertIds = parseArray(row["assembly.insertIds"]);
    if (insertIds) {
      assembly.insertIds = insertIds as InsertId[];
      hasAssembly = true;
    }
  }

  if (row["assembly.features"]) {
    const features = parseArray(row["assembly.features"]);
    if (features) {
      assembly.features = features as (
        | "BRAILLE"
        | "AUDIO"
        | "ADMAIL"
        | "SAME_DAY"
      )[];
      hasAssembly = true;
    }
  }

  if (row["assembly.additional"]) {
    try {
      assembly.additional = JSON.parse(row["assembly.additional"]);
      hasAssembly = true;
    } catch {
      // If not valid JSON, ignore it
    }
  }

  return hasAssembly ? assembly : undefined;
}

function parsePackSpecification(row: PackSpecificationRow): PackSpecification {
  const draft: Partial<PackSpecification> = {
    id: PackSpecificationId(row.id),
    name: row.name,
    status: row.status as PackSpecification["status"],
    version: Number.parseInt(row.version, 10),
    createdAt: parseDate(row.createdAt),
    updatedAt: parseDate(row.updatedAt),
    postage: parsePostage(row),
  };

  if (row.description) draft.description = row.description;
  if (row.billingId) draft.billingId = row.billingId;

  const constraints = parseConstraints(row);
  if (constraints) draft.constraints = constraints;

  const assembly = parseAssembly(row);
  if (assembly) draft.assembly = assembly;

  const parsed = $PackSpecification.safeParse(draft);
  if (!parsed.success) {
    throw new Error(
      `Validation failed for PackSpecification '${row.id}': ${JSON.stringify(
        parsed.error.issues,
      )}`,
    );
  }
  return parsed.data;
}

function parseLetterVariant(row: LetterVariantRow): LetterVariant {
  const baseIds = parseArray(row.packSpecificationIds) ?? [];
  const draft: Partial<LetterVariant> = {
    id: LetterVariantId(row.id),
    name: row.name,
    description: row.description || row.name,
    volumeGroupId: row.volumeGroupId as LetterVariant["volumeGroupId"],
    type: row.type as LetterVariant["type"],
    status: row.status as LetterVariant["status"],
    packSpecificationIds: baseIds.map((id) => PackSpecificationId(id)),
  };

  if (row.clientId) draft.clientId = row.clientId;
  if (row.campaignIds) draft.campaignIds = parseArray(row.campaignIds);
  if (row.supplierId) draft.supplierId = SupplierId(row.supplierId);

  const constraints = parseConstraints(row);
  if (constraints) draft.constraints = constraints;

  const parsed = $LetterVariant.safeParse(draft);
  if (!parsed.success) {
    throw new Error(
      `Validation failed for LetterVariant '${row.id}': ${JSON.stringify(
        parsed.error.issues,
      )}`,
    );
  }
  return parsed.data;
}

function parseVolumeGroup(row: VolumeGroupRow): VolumeGroup {
  const draft: Partial<VolumeGroup> = {
    id: VolumeGroupId(row.id),
    name: row.name,
    startDate: parseDateOnly(row.startDate),
    status: (row.status || "PUBLISHED") as VolumeGroup["status"],
  };

  if (row.description) draft.description = row.description;
  if (row.endDate) draft.endDate = parseDateOnly(row.endDate);

  const parsed = $VolumeGroup.safeParse(draft);
  if (!parsed.success) {
    throw new Error(
      `Validation failed for VolumeGroup '${row.id}': ${JSON.stringify(
        parsed.error.issues,
      )}`,
    );
  }
  return parsed.data;
}

function parseSupplier(row: SupplierRow): Supplier {
  const draft: Partial<Supplier> = {
    id: SupplierId(row.id),
    name: row.name,
    channelType: row.channelType as Supplier["channelType"],
    dailyCapacity: Number.parseInt(row.dailyCapacity, 10),
    status: (row.status || "PUBLISHED") as Supplier["status"],
  };

  const parsed = $Supplier.safeParse(draft);
  if (!parsed.success) {
    throw new Error(
      `Validation failed for Supplier '${row.id}': ${JSON.stringify(
        parsed.error.issues,
      )}`,
    );
  }
  return parsed.data;
}

function parseSupplierAllocation(
  row: SupplierAllocationRow,
): SupplierAllocation {
  const draft = {
    id: row.id,
    volumeGroup: VolumeGroupId(row.volumeGroupId),
    supplier: SupplierId(row.supplier),
    allocationPercentage: Number.parseFloat(row.allocationPercentage),
    status: row.status as SupplierAllocation["status"],
  };

  const parsed = $SupplierAllocation.safeParse(draft);
  if (!parsed.success) {
    throw new Error(
      `Validation failed for SupplierAllocation '${row.id}': ${JSON.stringify(
        parsed.error.issues,
      )}`,
    );
  }
  return parsed.data;
}

function parseSupplierPack(row: SupplierPackRow): SupplierPack {
  const draft = {
    id: row.id,
    packSpecificationId: PackSpecificationId(row.packSpecificationId),
    supplierId: SupplierId(row.supplierId),
    approval: row.approval as SupplierPack["approval"],
    status: row.status as SupplierPack["status"],
  };

  const parsed = $SupplierPack.safeParse(draft);
  if (!parsed.success) {
    throw new Error(
      `Validation failed for SupplierPack '${row.id}': ${JSON.stringify(
        parsed.error.issues,
      )}`,
    );
  }
  return parsed.data;
}

export interface ParseResult {
  packs: Record<string, PackSpecification>;
  variants: Record<string, LetterVariant>;
  volumeGroups: Record<string, VolumeGroup>;
  suppliers: Record<string, Supplier>;
  allocations: Record<string, SupplierAllocation>;
  supplierPacks: Record<string, SupplierPack>;
}

function sanitizeId(id: string): string {
  return id.replaceAll(/[^a-zA-Z0-9]/g, "");
}

function buildPacks(
  packRows: PackSpecificationRow[],
): Record<string, PackSpecification> {
  const packs: Record<string, PackSpecification> = {};
  for (const row of packRows) {
    const pack = parsePackSpecification(row);
    const key = sanitizeId(pack.id);
    Object.defineProperty(packs, key, { value: pack, enumerable: true });
  }
  return packs;
}

function buildVariants(
  variantRows: LetterVariantRow[],
): Record<string, LetterVariant> {
  const variants: Record<string, LetterVariant> = {};
  for (const row of variantRows) {
    const variant = parseLetterVariant(row);
    const key = sanitizeId(variant.id);
    Object.defineProperty(variants, key, { value: variant, enumerable: true });
  }
  return variants;
}

function buildVolumeGroups(
  volumeGroupRows: VolumeGroupRow[],
): Record<string, VolumeGroup> {
  const volumeGroups: Record<string, VolumeGroup> = {};
  for (const row of volumeGroupRows) {
    const volumeGroup = parseVolumeGroup(row);
    const key = sanitizeId(volumeGroup.id);
    Object.defineProperty(volumeGroups, key, {
      value: volumeGroup,
      enumerable: true,
    });
  }
  return volumeGroups;
}

function buildSuppliers(supplierRows: SupplierRow[]): Record<string, Supplier> {
  const suppliers: Record<string, Supplier> = {};
  for (const row of supplierRows) {
    const supplier = parseSupplier(row);
    const key = sanitizeId(supplier.id);
    Object.defineProperty(suppliers, key, {
      value: supplier,
      enumerable: true,
    });
  }
  return suppliers;
}

function buildAllocations(
  allocationRows: SupplierAllocationRow[],
): Record<string, SupplierAllocation> {
  const allocations: Record<string, SupplierAllocation> = {};
  for (const row of allocationRows) {
    const allocation = parseSupplierAllocation(row);
    const key = sanitizeId(allocation.id);
    Object.defineProperty(allocations, key, {
      value: allocation,
      enumerable: true,
    });
  }
  return allocations;
}

function buildSupplierPacks(
  supplierPackRows: SupplierPackRow[],
): Record<string, SupplierPack> {
  const supplierPacks: Record<string, SupplierPack> = {};
  for (const row of supplierPackRows) {
    const supplierPack = parseSupplierPack(row);
    const key = sanitizeId(supplierPack.id);
    Object.defineProperty(supplierPacks, key, {
      value: supplierPack,
      enumerable: true,
    });
  }
  return supplierPacks;
}

export function parseExcelFile(filePath: string): ParseResult {
  const workbook = XLSX.readFile(filePath);

  const packSheet = workbook.Sheets.PackSpecification;
  if (!packSheet)
    throw new Error("PackSpecification sheet not found in Excel file");
  const packRows: PackSpecificationRow[] = XLSX.utils.sheet_to_json(packSheet);
  const packs = buildPacks(packRows);

  const variantSheet = workbook.Sheets.LetterVariant;
  if (!variantSheet)
    throw new Error("LetterVariant sheet not found in Excel file");
  const variantRows: LetterVariantRow[] =
    XLSX.utils.sheet_to_json(variantSheet);
  const variants = buildVariants(variantRows);

  const volumeGroupSheet = workbook.Sheets.VolumeGroup;
  if (!volumeGroupSheet)
    throw new Error("VolumeGroup sheet not found in Excel file");
  const volumeGroupRows: VolumeGroupRow[] =
    XLSX.utils.sheet_to_json(volumeGroupSheet);
  const volumeGroups = buildVolumeGroups(volumeGroupRows);

  const supplierSheet = workbook.Sheets.Supplier;
  if (!supplierSheet) throw new Error("Supplier sheet not found in Excel file");
  const supplierRows: SupplierRow[] = XLSX.utils.sheet_to_json(supplierSheet);
  const suppliers = buildSuppliers(supplierRows);

  const allocationSheet = workbook.Sheets.SupplierAllocation;
  if (!allocationSheet)
    throw new Error("SupplierAllocation sheet not found in Excel file");
  const allocationRows: SupplierAllocationRow[] =
    XLSX.utils.sheet_to_json(allocationSheet);
  const allocations = buildAllocations(allocationRows);

  const supplierPackSheet = workbook.Sheets.SupplierPack;
  if (!supplierPackSheet)
    throw new Error("SupplierPack sheet not found in Excel file");
  const supplierPackRows: SupplierPackRow[] =
    XLSX.utils.sheet_to_json(supplierPackSheet);
  const supplierPacks = buildSupplierPacks(supplierPackRows);

  return {
    packs,
    variants,
    volumeGroups,
    suppliers,
    allocations,
    supplierPacks,
  };
}
