import { randomUUID } from "node:crypto";
import * as XLSX from "xlsx";
import { tmpdir } from "node:os";
import path from "node:path";

import { parseExcelFile } from "../../parse-excel";

export interface WorkbookData {
  packs?: Record<string, unknown>[];
  variants?: Record<string, unknown>[];
  volumeGroups?: Record<string, unknown>[];
  suppliers?: Record<string, unknown>[];
  allocations?: Record<string, unknown>[];
  supplierPacks?: Record<string, unknown>[];
}

export function makePackRow(
  overrides: Record<string, unknown> = {},
): Record<string, unknown> {
  return {
    id: "pack-1",
    name: "Pack 1",
    status: "PROD",
    version: "1",
    createdAt: "2024-01-01",
    updatedAt: "2024-01-01",
    billingId: "billing-pack-1",
    "postage.id": "postage-1",
    "postage.size": "STANDARD",
    ...overrides,
  };
}

export function makeVariantRow(
  overrides: Record<string, unknown> = {},
): Record<string, unknown> {
  return {
    id: "variant-1",
    name: "Variant 1",
    description: "Variant 1",
    volumeGroupId: "volume-group-1",
    packSpecificationIds: "pack-1",
    type: "STANDARD",
    status: "PROD",
    ...overrides,
  };
}

export function makeVolumeGroupRow(
  overrides: Record<string, unknown> = {},
): Record<string, unknown> {
  return {
    id: "volume-group-1",
    name: "VolumeGroup 1",
    startDate: "2025-01-01",
    status: "PROD",
    ...overrides,
  };
}

export function makeSupplierRow(
  overrides: Record<string, unknown> = {},
): Record<string, unknown> {
  return {
    id: "supplier-1",
    name: "Supplier 1",
    channelType: "LETTER",
    dailyCapacity: "1000",
    status: "PROD",
    ...overrides,
  };
}

export function makeAllocationRow(
  overrides: Record<string, unknown> = {},
): Record<string, unknown> {
  return {
    id: "allocation-1",
    volumeGroupId: "volume-group-1",
    supplier: "supplier-1",
    allocationPercentage: "100",
    status: "PROD",
    ...overrides,
  };
}

export function makeSupplierPackRow(
  overrides: Record<string, unknown> = {},
): Record<string, unknown> {
  return {
    id: "supplier-pack-1",
    packSpecificationId: "pack-1",
    supplierId: "supplier-1",
    approval: "APPROVED",
    status: "PROD",
    ...overrides,
  };
}

export function buildWorkbook(data: WorkbookData): XLSX.WorkBook {
  const workbook = XLSX.utils.book_new();

  XLSX.utils.book_append_sheet(
    workbook,
    XLSX.utils.json_to_sheet(data.packs || []),
    "PackSpecification",
  );
  XLSX.utils.book_append_sheet(
    workbook,
    XLSX.utils.json_to_sheet(data.variants || []),
    "LetterVariant",
  );
  XLSX.utils.book_append_sheet(
    workbook,
    XLSX.utils.json_to_sheet(data.volumeGroups || []),
    "VolumeGroup",
  );
  XLSX.utils.book_append_sheet(
    workbook,
    XLSX.utils.json_to_sheet(data.suppliers || []),
    "Supplier",
  );
  XLSX.utils.book_append_sheet(
    workbook,
    XLSX.utils.json_to_sheet(data.allocations || []),
    "SupplierAllocation",
  );
  XLSX.utils.book_append_sheet(
    workbook,
    XLSX.utils.json_to_sheet(data.supplierPacks || []),
    "SupplierPack",
  );

  return workbook;
}

export function buildWorkbookOmitting(omit: string): XLSX.WorkBook {
  const workbook = XLSX.utils.book_new();
  const packSheet = XLSX.utils.json_to_sheet([makePackRow()]);

  if (omit !== "PackSpecification") {
    XLSX.utils.book_append_sheet(workbook, packSheet, "PackSpecification");
  }
  if (omit !== "LetterVariant") {
    XLSX.utils.book_append_sheet(
      workbook,
      XLSX.utils.json_to_sheet([]),
      "LetterVariant",
    );
  }
  if (omit !== "VolumeGroup") {
    XLSX.utils.book_append_sheet(
      workbook,
      XLSX.utils.json_to_sheet([]),
      "VolumeGroup",
    );
  }
  if (omit !== "Supplier") {
    XLSX.utils.book_append_sheet(
      workbook,
      XLSX.utils.json_to_sheet([]),
      "Supplier",
    );
  }
  if (omit !== "SupplierAllocation") {
    XLSX.utils.book_append_sheet(
      workbook,
      XLSX.utils.json_to_sheet([]),
      "SupplierAllocation",
    );
  }
  if (omit !== "SupplierPack") {
    XLSX.utils.book_append_sheet(
      workbook,
      XLSX.utils.json_to_sheet([]),
      "SupplierPack",
    );
  }

  return workbook;
}

export function writeWorkbook(workbook: XLSX.WorkBook): string {
  const filePath = path.join(tmpdir(), `test-${randomUUID()}.xlsx`);
  XLSX.writeFile(workbook, filePath);
  return filePath;
}

export function parseWorkbook(data: WorkbookData) {
  return parseExcelFile(writeWorkbook(buildWorkbook(data)));
}
