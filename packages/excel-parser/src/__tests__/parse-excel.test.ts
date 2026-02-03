import * as XLSX from "xlsx";
import { tmpdir } from "node:os";
import path from "node:path";
import { parseExcelFile } from "../parse-excel";

function buildWorkbook(data: {
  packs: any[];
  variants: any[];
  volumeGroups?: any[];
  suppliers?: any[];
  allocations?: any[];
  supplierPacks?: any[];
}) {
  const wb = XLSX.utils.book_new();
  const packSheet = XLSX.utils.json_to_sheet(data.packs);
  const variantSheet = XLSX.utils.json_to_sheet(data.variants);
  XLSX.utils.book_append_sheet(wb, packSheet, "PackSpecification");
  XLSX.utils.book_append_sheet(wb, variantSheet, "LetterVariant");

  // Add required new sheets with defaults if not provided
  const volumeGroupSheet = XLSX.utils.json_to_sheet(data.volumeGroups || []);
  XLSX.utils.book_append_sheet(wb, volumeGroupSheet, "VolumeGroup");

  const supplierSheet = XLSX.utils.json_to_sheet(data.suppliers || []);
  XLSX.utils.book_append_sheet(wb, supplierSheet, "Supplier");

  const allocationSheet = XLSX.utils.json_to_sheet(data.allocations || []);
  XLSX.utils.book_append_sheet(wb, allocationSheet, "SupplierAllocation");

  const supplierPackSheet = XLSX.utils.json_to_sheet(data.supplierPacks || []);
  XLSX.utils.book_append_sheet(wb, supplierPackSheet, "SupplierPack");

  return wb;
}

// Replace individual missing sheet tests with table-driven tests
function buildWorkbookOmitting(omit: string): XLSX.WorkBook {
  const wb = XLSX.utils.book_new();
  const packSheet = XLSX.utils.json_to_sheet([
    {
      id: "pack-1",
      name: "Pack 1",
      status: "PROD",
      version: "1",
      createdAt: "2024-01-01",
      updatedAt: "2024-01-01",
      "postage.id": "postage-1",
      "postage.size": "STANDARD",
    },
  ]);
  if (omit !== "PackSpecification") {
    XLSX.utils.book_append_sheet(wb, packSheet, "PackSpecification");
  }
  if (omit !== "LetterVariant") {
    XLSX.utils.book_append_sheet(
      wb,
      XLSX.utils.json_to_sheet([]),
      "LetterVariant",
    );
  }
  if (omit !== "VolumeGroup") {
    XLSX.utils.book_append_sheet(
      wb,
      XLSX.utils.json_to_sheet([]),
      "VolumeGroup",
    );
  }
  if (omit !== "Supplier") {
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet([]), "Supplier");
  }
  if (omit !== "SupplierAllocation") {
    XLSX.utils.book_append_sheet(
      wb,
      XLSX.utils.json_to_sheet([]),
      "SupplierAllocation",
    );
  }
  if (omit !== "SupplierPack") {
    XLSX.utils.book_append_sheet(
      wb,
      XLSX.utils.json_to_sheet([]),
      "SupplierPack",
    );
  }
  return wb;
}

function writeWorkbook(wb: XLSX.WorkBook): string {
  const filePath = path.join(tmpdir(), `test-${Date.now()}.xlsx`);
  XLSX.writeFile(wb, filePath);
  return filePath;
}

describe("parse-excel", () => {
  it("parses canonical enum values", () => {
    const wb = buildWorkbook({
      packs: [
        {
          id: "pack-1",
          name: "Pack 1",
          status: "PROD",
          version: "1",
          createdAt: "2024-01-01",
          updatedAt: "2024-01-01",
          "postage.id": "postage-standard",
          "postage.size": "STANDARD",
        },
        {
          id: "pack-2",
          name: "Pack 2",
          status: "PROD",
          version: "1",
          createdAt: "2024-01-01",
          updatedAt: "2024-01-01",
          "postage.id": "postage-large",
          "postage.size": "LARGE",
        },
      ],
      variants: [
        {
          id: "variant-1",
          name: "Variant 1",
          description: "Variant 1",
          volumeGroupId: "volume-group-1",
          packSpecificationIds: "pack-1,pack-2",
          type: "STANDARD",
          status: "PROD",
        },
      ],
    });
    const file = writeWorkbook(wb);
    const result = parseExcelFile(file);
    expect(result.packs.pack1.postage.id).toBe("postage-standard");
    expect(result.packs.pack1.postage.size).toBe("STANDARD");
    expect(result.packs.pack2.postage.id).toBe("postage-large");
    expect(result.packs.pack2.postage.size).toBe("LARGE");
    expect(result.variants.variant1.packSpecificationIds).toEqual([
      "pack-1",
      "pack-2",
    ]);
  });

  it("throws on invalid postage size", () => {
    const wb = buildWorkbook({
      packs: [
        {
          id: "pack-bad-size",
          name: "Bad Size Pack",
          status: "PROD",
          version: "1",
          createdAt: "2024-01-01",
          updatedAt: "2024-01-01",
          "postage.id": "postage-bad",
          "postage.size": "C5", // invalid size value
        },
      ],
      variants: [],
    });
    const file = writeWorkbook(wb);
    expect(() => parseExcelFile(file)).toThrow(
      /Validation failed.*pack-bad-size/,
    );
  });

  it("throws on missing required postage fields", () => {
    const wb = buildWorkbook({
      packs: [
        {
          id: "pack-missing",
          name: "Missing Pack",
          status: "PROD",
          version: "1",
          createdAt: "2024-01-01",
          updatedAt: "2024-01-01",
          // missing postage fields entirely
        },
      ],
      variants: [],
    });
    const file = writeWorkbook(wb);
    expect(() => parseExcelFile(file)).toThrow(
      /Missing required postage fields/,
    );
  });

  it("parses constraints on PackSpecification", () => {
    const wb = buildWorkbook({
      packs: [
        {
          id: "pack-with-constraints",
          name: "Pack with Constraints",
          status: "PROD",
          version: "1",
          createdAt: "2024-01-01",
          updatedAt: "2024-01-01",
          "postage.id": "postage-1",
          "postage.size": "STANDARD",
          "constraints.sheets": "10",
          "constraints.deliveryDays": "5",
          "constraints.blackCoveragePercentage": "80.5",
          "constraints.colourCoveragePercentage": "50.25",
        },
      ],
      variants: [],
    });
    const file = writeWorkbook(wb);
    const result = parseExcelFile(file);
    expect(result.packs.packwithconstraints.constraints).toEqual({
      sheets: { value: 10, operator: "LESS_THAN" },
      deliveryDays: { value: 5, operator: "LESS_THAN" },
      blackCoveragePercentage: { value: 80.5, operator: "LESS_THAN" },
      colourCoveragePercentage: { value: 50.25, operator: "LESS_THAN" },
    });
  });

  it("parses PackSpecification with optional description", () => {
    const wb = buildWorkbook({
      packs: [
        {
          id: "pack-with-description",
          name: "Pack with Description",
          description: "A standard economy-class letter for bulk mailings",
          status: "PROD",
          version: "1",
          createdAt: "2024-01-01",
          updatedAt: "2024-01-01",
          "postage.id": "postage-1",
          "postage.size": "STANDARD",
        },
      ],
      variants: [],
    });
    const file = writeWorkbook(wb);
    const result = parseExcelFile(file);
    expect(result.packs.packwithdescription.description).toBe(
      "A standard economy-class letter for bulk mailings",
    );
  });

  it("parses PackSpecification without description", () => {
    const wb = buildWorkbook({
      packs: [
        {
          id: "pack-without-description",
          name: "Pack without Description",
          status: "PROD",
          version: "1",
          createdAt: "2024-01-01",
          updatedAt: "2024-01-01",
          "postage.id": "postage-1",
          "postage.size": "STANDARD",
        },
      ],
      variants: [],
    });
    const file = writeWorkbook(wb);
    const result = parseExcelFile(file);
    expect(result.packs.packwithoutdescription.description).toBeUndefined();
  });

  it("parses constraints on LetterVariant", () => {
    const wb = buildWorkbook({
      packs: [
        {
          id: "pack-1",
          name: "Pack 1",
          status: "PROD",
          version: "1",
          createdAt: "2024-01-01",
          updatedAt: "2024-01-01",
          "postage.id": "postage-1",
          "postage.size": "STANDARD",
        },
      ],
      variants: [
        {
          id: "variant-with-constraints",
          name: "Variant with Constraints",
          description: "Test variant",
          volumeGroupId: "volume-group-1",
          packSpecificationIds: "pack-1",
          type: "STANDARD",
          status: "PROD",
          "constraints.sheets": "8",
          "constraints.deliveryDays": "3",
        },
      ],
    });
    const file = writeWorkbook(wb);
    const result = parseExcelFile(file);
    expect(result.variants.variantwithconstraints.constraints).toEqual({
      sheets: { value: 8, operator: "LESS_THAN" },
      deliveryDays: { value: 3, operator: "LESS_THAN" },
    });
  });

  it("parses assembly with paper, insertIds, and features", () => {
    const wb = buildWorkbook({
      packs: [
        {
          id: "pack-with-assembly",
          name: "Pack with Assembly",
          status: "PROD",
          version: "1",
          createdAt: "2024-01-01",
          updatedAt: "2024-01-01",
          "postage.id": "postage-1",
          "postage.size": "STANDARD",
          "assembly.envelopeId": "envelope-1",
          "assembly.printColour": "COLOUR",
          "assembly.paper.id": "paper-1",
          "assembly.paper.name": "Standard White",
          "assembly.paper.weightGSM": "90",
          "assembly.paper.size": "A4",
          "assembly.paper.colour": "WHITE",
          "assembly.paper.recycled": "true",
          "assembly.insertIds": "insert-1,insert-2",
          "assembly.features": "BRAILLE,AUDIO",
        },
      ],
      variants: [],
    });
    const file = writeWorkbook(wb);
    const result = parseExcelFile(file);
    const pack = result.packs.packwithassembly;
    expect(pack.assembly?.envelopeId).toBe("envelope-1");
    expect(pack.assembly?.printColour).toBe("COLOUR");
    expect(pack.assembly?.paper?.id).toBe("paper-1");
    expect(pack.assembly?.paper?.name).toBe("Standard White");
    expect(pack.assembly?.paper?.weightGSM).toBe(90);
    expect(pack.assembly?.paper?.size).toBe("A4");
    expect(pack.assembly?.paper?.colour).toBe("WHITE");
    expect(pack.assembly?.paper?.recycled).toBe(true);
    expect(pack.assembly?.insertIds).toEqual(["insert-1", "insert-2"]);
    expect(pack.assembly?.features).toEqual(["BRAILLE", "AUDIO"]);
  });

  it("parses assembly with duplex set to true", () => {
    const wb = buildWorkbook({
      packs: [
        {
          id: "pack-with-duplex-true",
          name: "Pack with Duplex True",
          status: "PROD",
          version: "1",
          createdAt: "2024-01-01",
          updatedAt: "2024-01-01",
          "postage.id": "postage-1",
          "postage.size": "STANDARD",
          "assembly.envelopeId": "envelope-1",
          "assembly.duplex": "true",
        },
      ],
      variants: [],
    });
    const file = writeWorkbook(wb);
    const result = parseExcelFile(file);
    expect(result.packs.packwithduplextrue.assembly?.duplex).toBe(true);
  });

  it("parses assembly with duplex set to false", () => {
    const wb = buildWorkbook({
      packs: [
        {
          id: "pack-with-duplex-false",
          name: "Pack with Duplex False",
          status: "PROD",
          version: "1",
          createdAt: "2024-01-01",
          updatedAt: "2024-01-01",
          "postage.id": "postage-1",
          "postage.size": "STANDARD",
          "assembly.envelopeId": "envelope-1",
          "assembly.duplex": "false",
        },
      ],
      variants: [],
    });
    const file = writeWorkbook(wb);
    const result = parseExcelFile(file);
    expect(result.packs.packwithduplexfalse.assembly?.duplex).toBe(false);
  });

  it("parses assembly without duplex field", () => {
    const wb = buildWorkbook({
      packs: [
        {
          id: "pack-without-duplex",
          name: "Pack without Duplex",
          status: "PROD",
          version: "1",
          createdAt: "2024-01-01",
          updatedAt: "2024-01-01",
          "postage.id": "postage-1",
          "postage.size": "STANDARD",
          "assembly.envelopeId": "envelope-1",
        },
      ],
      variants: [],
    });
    const file = writeWorkbook(wb);
    const result = parseExcelFile(file);
    expect(result.packs.packwithoutduplex.assembly?.duplex).toBeUndefined();
  });

  it("thows when LetterVariant sheet is missing", () => {
    const wb = XLSX.utils.book_new();
    const packSheet = XLSX.utils.json_to_sheet([
      {
        id: "pack-1",
        name: "Pack 1",
        status: "PROD",
        version: "1",
        createdAt: "2024-01-01",
        updatedAt: "2024-01-01",
        "postage.id": "postage-standard",
        "postage.size": "STANDARD",
      },
    ]);
    XLSX.utils.book_append_sheet(wb, packSheet, "PackSpecification");
    const file = writeWorkbook(wb);
    expect(() => parseExcelFile(file)).toThrow(
      /LetterVariant sheet not found in Excel file/,
    );
  });

  it("thows when PackSpecification sheet is missing", () => {
    const wb = XLSX.utils.book_new();
    const variantSheet = XLSX.utils.json_to_sheet([
      {
        id: "variant-1",
        name: "Variant 1",
        description: "Variant 1",
        packSpecificationIds: "pack-1,pack-2",
        type: "STANDARD",
        status: "PROD",
      },
    ]);
    XLSX.utils.book_append_sheet(wb, variantSheet, "LetterVariant");
    const file = writeWorkbook(wb);
    expect(() => parseExcelFile(file)).toThrow(
      /PackSpecification sheet not found in Excel file/,
    );
  });

  it("throws if LetterVariant type is invalid", () => {
    const wb = XLSX.utils.book_new();
    const variantSheet = XLSX.utils.json_to_sheet([
      {
        id: "variant-1",
        name: "Variant 1",
        description: "Variant 1",
        packSpecificationIds: "pack-1",
        type: "INVALID_TYPE",
        status: "PROD",
      },
    ]);
    XLSX.utils.book_append_sheet(wb, variantSheet, "LetterVariant");
    const packSheet = XLSX.utils.json_to_sheet([
      {
        id: "pack-1",
        name: "Pack 1",
        status: "PROD",
        version: "1",
        createdAt: "2024-01-01",
        updatedAt: "2024-01-01",
        "postage.id": "postage-standard",
        "postage.size": "STANDARD",
      },
    ]);
    XLSX.utils.book_append_sheet(wb, packSheet, "PackSpecification");
    const file = writeWorkbook(wb);
    expect(() => parseExcelFile(file)).toThrow(/Validation failed.*variant-1/);
  });

  it("parses optional billingId field", () => {
    const wb = buildWorkbook({
      packs: [
        {
          id: "pack-with-billing",
          name: "Pack with Billing",
          status: "PROD",
          version: "1",
          createdAt: "2024-01-01",
          updatedAt: "2024-01-01",
          billingId: "billing-123",
          "postage.id": "postage-1",
          "postage.size": "STANDARD",
        },
      ],
      variants: [],
    });
    const file = writeWorkbook(wb);
    const result = parseExcelFile(file);
    expect(result.packs.packwithbilling.billingId).toBe("billing-123");
  });

  it("parses optional postage fields", () => {
    const wb = buildWorkbook({
      packs: [
        {
          id: "pack-full-postage",
          name: "Pack with Full Postage",
          status: "PROD",
          version: "1",
          createdAt: "2024-01-01",
          updatedAt: "2024-01-01",
          "postage.id": "postage-1",
          "postage.size": "LARGE",
          "postage.deliveryDays": "2",
          "postage.maxWeightGrams": "100.5",
          "postage.maxThicknessMm": "5.2",
        },
      ],
      variants: [],
    });
    const file = writeWorkbook(wb);
    const result = parseExcelFile(file);
    const { postage } = result.packs.packfullpostage;
    expect(postage.deliveryDays).toBe(2);
    expect(postage.maxWeightGrams).toBe(100.5);
    expect(postage.maxThicknessMm).toBe(5.2);
  });

  it("handles missing createdAt/updatedAt with default dates", () => {
    const wb = buildWorkbook({
      packs: [
        {
          id: "pack-no-dates",
          name: "Pack No Dates",
          status: "PROD",
          version: "1",
          "postage.id": "postage-1",
          "postage.size": "STANDARD",
        },
      ],
      variants: [],
    });
    const file = writeWorkbook(wb);
    const result = parseExcelFile(file);
    expect(result.packs.packnodates.createdAt).toBe("2023-01-01T00:00:00Z");
    expect(result.packs.packnodates.updatedAt).toBe("2023-01-01T00:00:00Z");
  });

  it("handles invalid date strings with default date", () => {
    const wb = buildWorkbook({
      packs: [
        {
          id: "pack-invalid-dates",
          name: "Pack Invalid Dates",
          status: "PROD",
          version: "1",
          createdAt: "not-a-date",
          updatedAt: "also-not-a-date",
          "postage.id": "postage-1",
          "postage.size": "STANDARD",
        },
      ],
      variants: [],
    });
    const file = writeWorkbook(wb);
    const result = parseExcelFile(file);
    expect(result.packs.packinvaliddates.createdAt).toBe(
      "2023-01-01T00:00:00Z",
    );
    expect(result.packs.packinvaliddates.updatedAt).toBe(
      "2023-01-01T00:00:00Z",
    );
  });

  it("handles empty string arrays as undefined", () => {
    const wb = buildWorkbook({
      packs: [
        {
          id: "pack-empty-arrays",
          name: "Pack Empty Arrays",
          status: "PROD",
          version: "1",
          createdAt: "2024-01-01",
          updatedAt: "2024-01-01",
          "postage.id": "postage-1",
          "postage.size": "STANDARD",
          "assembly.insertIds": "",
          "assembly.features": "  ",
        },
      ],
      variants: [],
    });
    const file = writeWorkbook(wb);
    const result = parseExcelFile(file);
    expect(result.packs.packemptyarrays.assembly?.insertIds).toBeUndefined();
    expect(result.packs.packemptyarrays.assembly?.features).toBeUndefined();
  });

  it("parses assembly.additional as JSON", () => {
    const wb = buildWorkbook({
      packs: [
        {
          id: "pack-with-additional",
          name: "Pack with Additional",
          status: "PROD",
          version: "1",
          createdAt: "2024-01-01",
          updatedAt: "2024-01-01",
          "postage.id": "postage-1",
          "postage.size": "STANDARD",
          "assembly.additional": '{"key1":"value1","key2":"value2"}',
        },
      ],
      variants: [],
    });
    const file = writeWorkbook(wb);
    const result = parseExcelFile(file);
    expect(result.packs.packwithadditional.assembly?.additional).toEqual({
      key1: "value1",
      key2: "value2",
    });
  });

  it("ignores invalid JSON in assembly.additional", () => {
    const wb = buildWorkbook({
      packs: [
        {
          id: "pack-bad-json",
          name: "Pack Bad JSON",
          status: "PROD",
          version: "1",
          createdAt: "2024-01-01",
          updatedAt: "2024-01-01",
          "postage.id": "postage-1",
          "postage.size": "STANDARD",
          "assembly.additional": "not-valid-json{",
        },
      ],
      variants: [],
    });
    const file = writeWorkbook(wb);
    const result = parseExcelFile(file);
    expect(result.packs.packbadjson.assembly?.additional).toBeUndefined();
  });

  it("parses paper.recycled as boolean", () => {
    const wb = buildWorkbook({
      packs: [
        {
          id: "pack-recycled-true",
          name: "Pack Recycled True",
          status: "PROD",
          version: "1",
          createdAt: "2024-01-01",
          updatedAt: "2024-01-01",
          "postage.id": "postage-1",
          "postage.size": "STANDARD",
          "assembly.paper.id": "paper-1",
          "assembly.paper.name": "Recycled Paper",
          "assembly.paper.size": "A4",
          "assembly.paper.colour": "WHITE",
          "assembly.paper.recycled": "TRUE",
        },
        {
          id: "pack-recycled-false",
          name: "Pack Recycled False",
          status: "PROD",
          version: "1",
          createdAt: "2024-01-01",
          updatedAt: "2024-01-01",
          "postage.id": "postage-2",
          "postage.size": "LARGE",
          "assembly.paper.id": "paper-2",
          "assembly.paper.name": "Non-Recycled Paper",
          "assembly.paper.size": "A3",
          "assembly.paper.colour": "WHITE",
          "assembly.paper.recycled": "false",
        },
      ],
      variants: [],
    });
    const file = writeWorkbook(wb);
    const result = parseExcelFile(file);
    expect(result.packs.packrecycledtrue.assembly?.paper?.recycled).toBe(true);
    expect(result.packs.packrecycledfalse.assembly?.paper?.recycled).toBe(
      false,
    );
  });

  it("uses default weightGSM when not provided", () => {
    const wb = buildWorkbook({
      packs: [
        {
          id: "pack-default-gsm",
          name: "Pack Default GSM",
          status: "PROD",
          version: "1",
          createdAt: "2024-01-01",
          updatedAt: "2024-01-01",
          "postage.id": "postage-1",
          "postage.size": "STANDARD",
          "assembly.paper.id": "paper-1",
          "assembly.paper.size": "A4",
          "assembly.paper.colour": "WHITE",
          "assembly.paper.recycled": "false",
        },
      ],
      variants: [],
    });
    const file = writeWorkbook(wb);
    const result = parseExcelFile(file);
    expect(result.packs.packdefaultgsm.assembly?.paper?.weightGSM).toBe(80);
  });

  it("parses LetterVariant with optional clientId and campaignIds", () => {
    const wb = buildWorkbook({
      packs: [
        {
          id: "pack-1",
          name: "Pack 1",
          status: "PROD",
          version: "1",
          createdAt: "2024-01-01",
          updatedAt: "2024-01-01",
          "postage.id": "postage-1",
          "postage.size": "STANDARD",
        },
      ],
      variants: [
        {
          id: "variant-with-ids",
          name: "Variant with IDs",
          description: "Test variant",
          volumeGroupId: "volume-group-1",
          packSpecificationIds: "pack-1",
          type: "STANDARD",
          status: "PROD",
          clientId: "client-123",
          campaignIds: "campaign-1,campaign-2,campaign-3",
        },
      ],
    });
    const file = writeWorkbook(wb);
    const result = parseExcelFile(file);
    expect(result.variants.variantwithids.clientId).toBe("client-123");
    expect(result.variants.variantwithids.campaignIds).toEqual([
      "campaign-1",
      "campaign-2",
      "campaign-3",
    ]);
  });

  it("parses LetterVariant with optional supplierId", () => {
    const wb = buildWorkbook({
      packs: [
        {
          id: "pack-1",
          name: "Pack 1",
          status: "PROD",
          version: "1",
          createdAt: "2024-01-01",
          updatedAt: "2024-01-01",
          "postage.id": "postage-1",
          "postage.size": "STANDARD",
        },
      ],
      variants: [
        {
          id: "variant-with-supplier",
          name: "Variant with Supplier",
          description: "Test variant scoped to supplier",
          volumeGroupId: "volume-group-1",
          packSpecificationIds: "pack-1",
          type: "STANDARD",
          status: "PROD",
          supplierId: "supplier-printco",
        },
      ],
    });
    const file = writeWorkbook(wb);
    const result = parseExcelFile(file);
    expect(result.variants.variantwithsupplier.supplierId).toBe(
      "supplier-printco",
    );
  });

  it("uses name as description when description is missing", () => {
    const wb = buildWorkbook({
      packs: [
        {
          id: "pack-1",
          name: "Pack 1",
          status: "PROD",
          version: "1",
          createdAt: "2024-01-01",
          updatedAt: "2024-01-01",
          "postage.id": "postage-1",
          "postage.size": "STANDARD",
        },
      ],
      variants: [
        {
          id: "variant-no-desc",
          name: "My Variant Name",
          volumeGroupId: "volume-group-1",
          packSpecificationIds: "pack-1",
          type: "STANDARD",
          status: "PROD",
        },
      ],
    });
    const file = writeWorkbook(wb);
    const result = parseExcelFile(file);
    expect(result.variants.variantnodesc.description).toBe("My Variant Name");
  });

  it("throws on empty packSpecificationIds", () => {
    const wb = buildWorkbook({
      packs: [
        {
          id: "pack-1",
          name: "Pack 1",
          status: "PROD",
          version: "1",
          createdAt: "2024-01-01",
          updatedAt: "2024-01-01",
          "postage.id": "postage-1",
          "postage.size": "STANDARD",
        },
      ],
      variants: [
        {
          id: "variant-no-packs",
          name: "Variant No Packs",
          description: "Test",
          packSpecificationIds: "",
          type: "STANDARD",
          status: "PROD",
        },
      ],
    });
    const file = writeWorkbook(wb);
    expect(() => parseExcelFile(file)).toThrow(
      /Validation failed.*variant-no-packs/,
    );
  });

  it("sanitizes IDs by removing non-alphanumeric characters", () => {
    const wb = buildWorkbook({
      packs: [
        {
          id: "pack-with-dashes-123",
          name: "Pack with Dashes",
          status: "PROD",
          version: "1",
          createdAt: "2024-01-01",
          updatedAt: "2024-01-01",
          "postage.id": "postage-1",
          "postage.size": "STANDARD",
        },
      ],
      variants: [
        {
          id: "variant_with_underscores_456",
          name: "Variant with Underscores",
          volumeGroupId: "volume-group-1",
          packSpecificationIds: "pack-with-dashes-123",
          type: "STANDARD",
          status: "PROD",
        },
      ],
    });
    const file = writeWorkbook(wb);
    const result = parseExcelFile(file);
    expect(result.packs.packwithdashes123).toBeDefined();
    expect(result.variants.variantwithunderscores456).toBeDefined();
  });

  it("handles partial constraints - only sheets", () => {
    const wb = buildWorkbook({
      packs: [
        {
          id: "pack-partial-1",
          name: "Pack Partial 1",
          status: "PROD",
          version: "1",
          createdAt: "2024-01-01",
          updatedAt: "2024-01-01",
          "postage.id": "postage-1",
          "postage.size": "STANDARD",
          "constraints.sheets": "15",
        },
      ],
      variants: [],
    });
    const file = writeWorkbook(wb);
    const result = parseExcelFile(file);
    expect(result.packs.packpartial1.constraints).toEqual({
      sheets: { value: 15, operator: "LESS_THAN" },
    });
  });

  it("handles partial constraints - only deliveryDays", () => {
    const wb = buildWorkbook({
      packs: [
        {
          id: "pack-partial-2",
          name: "Pack Partial 2",
          status: "PROD",
          version: "1",
          createdAt: "2024-01-01",
          updatedAt: "2024-01-01",
          "postage.id": "postage-1",
          "postage.size": "STANDARD",
          "constraints.deliveryDays": "7",
        },
      ],
      variants: [],
    });
    const file = writeWorkbook(wb);
    const result = parseExcelFile(file);
    expect(result.packs.packpartial2.constraints).toEqual({
      deliveryDays: { value: 7, operator: "LESS_THAN" },
    });
  });

  it("handles partial constraints - only coverage percentages", () => {
    const wb = buildWorkbook({
      packs: [
        {
          id: "pack-partial-3",
          name: "Pack Partial 3",
          status: "PROD",
          version: "1",
          createdAt: "2024-01-01",
          updatedAt: "2024-01-01",
          "postage.id": "postage-1",
          "postage.size": "STANDARD",
          "constraints.blackCoveragePercentage": "90.5",
          "constraints.colourCoveragePercentage": "60.25",
        },
      ],
      variants: [],
    });
    const file = writeWorkbook(wb);
    const result = parseExcelFile(file);
    expect(result.packs.packpartial3.constraints).toEqual({
      blackCoveragePercentage: { value: 90.5, operator: "LESS_THAN" },
      colourCoveragePercentage: { value: 60.25, operator: "LESS_THAN" },
    });
  });

  it("parses assembly with only envelopeId", () => {
    const wb = buildWorkbook({
      packs: [
        {
          id: "pack-envelope-only",
          name: "Pack Envelope Only",
          status: "PROD",
          version: "1",
          createdAt: "2024-01-01",
          updatedAt: "2024-01-01",
          "postage.id": "postage-1",
          "postage.size": "STANDARD",
          "assembly.envelopeId": "envelope-123",
        },
      ],
      variants: [],
    });
    const file = writeWorkbook(wb);
    const result = parseExcelFile(file);
    expect(result.packs.packenvelopeonly.assembly).toEqual({
      envelopeId: "envelope-123",
    });
  });

  it("parses assembly with only printColour", () => {
    const wb = buildWorkbook({
      packs: [
        {
          id: "pack-print-only",
          name: "Pack Print Only",
          status: "PROD",
          version: "1",
          createdAt: "2024-01-01",
          updatedAt: "2024-01-01",
          "postage.id": "postage-1",
          "postage.size": "STANDARD",
          "assembly.printColour": "BLACK",
        },
      ],
      variants: [],
    });
    const file = writeWorkbook(wb);
    const result = parseExcelFile(file);
    expect(result.packs.packprintonly.assembly).toEqual({
      printColour: "BLACK",
    });
  });

  it("throws when postage.id is missing but postage.size is present", () => {
    const wb = buildWorkbook({
      packs: [
        {
          id: "pack-missing-id",
          name: "Pack Missing ID",
          status: "PROD",
          version: "1",
          createdAt: "2024-01-01",
          updatedAt: "2024-01-01",
          "postage.size": "STANDARD",
        },
      ],
      variants: [],
    });
    const file = writeWorkbook(wb);
    expect(() => parseExcelFile(file)).toThrow(
      /Missing required postage fields.*pack-missing-id/,
    );
  });

  it("throws when postage.size is missing but postage.id is present", () => {
    const wb = buildWorkbook({
      packs: [
        {
          id: "pack-missing-size",
          name: "Pack Missing Size",
          status: "PROD",
          version: "1",
          createdAt: "2024-01-01",
          updatedAt: "2024-01-01",
          "postage.id": "postage-1",
        },
      ],
      variants: [],
    });
    const file = writeWorkbook(wb);
    expect(() => parseExcelFile(file)).toThrow(
      /Missing required postage fields.*pack-missing-size/,
    );
  });

  it("handles all assembly fields together", () => {
    const wb = buildWorkbook({
      packs: [
        {
          id: "pack-full-assembly",
          name: "Pack Full Assembly",
          status: "PROD",
          version: "1",
          createdAt: "2024-01-01",
          updatedAt: "2024-01-01",
          "postage.id": "postage-1",
          "postage.size": "STANDARD",
          "assembly.envelopeId": "env-1",
          "assembly.printColour": "COLOUR",
          "assembly.paper.id": "paper-1",
          "assembly.paper.name": "Premium",
          "assembly.paper.weightGSM": "100",
          "assembly.paper.size": "A3",
          "assembly.paper.colour": "WHITE",
          "assembly.paper.recycled": "true",
          "assembly.insertIds": "insert-a,insert-b",
          "assembly.features": "BRAILLE,AUDIO,ADMAIL",
          "assembly.additional": '{"note":"test"}',
        },
      ],
      variants: [],
    });
    const file = writeWorkbook(wb);
    const result = parseExcelFile(file);
    const { assembly } = result.packs.packfullassembly;
    expect(assembly?.envelopeId).toBe("env-1");
    expect(assembly?.printColour).toBe("COLOUR");
    expect(assembly?.paper?.id).toBe("paper-1");
    expect(assembly?.insertIds).toEqual(["insert-a", "insert-b"]);
    expect(assembly?.features).toEqual(["BRAILLE", "AUDIO", "ADMAIL"]);
    expect(assembly?.additional).toEqual({ note: "test" });
  });

  it("parses arrays with whitespace correctly", () => {
    const wb = buildWorkbook({
      packs: [
        {
          id: "pack-whitespace-arrays",
          name: "Pack Whitespace Arrays",
          status: "PROD",
          version: "1",
          createdAt: "2024-01-01",
          updatedAt: "2024-01-01",
          "postage.id": "postage-1",
          "postage.size": "STANDARD",
          "assembly.insertIds": " insert-1 , insert-2 , insert-3 ",
          "assembly.features": " BRAILLE , AUDIO ",
        },
      ],
      variants: [],
    });
    const file = writeWorkbook(wb);
    const result = parseExcelFile(file);
    expect(result.packs.packwhitespacearrays.assembly?.insertIds).toEqual([
      "insert-1",
      "insert-2",
      "insert-3",
    ]);
    expect(result.packs.packwhitespacearrays.assembly?.features).toEqual([
      "BRAILLE",
      "AUDIO",
    ]);
  });

  it("handles empty insertIds but valid features", () => {
    const wb = buildWorkbook({
      packs: [
        {
          id: "pack-empty-inserts",
          name: "Pack Empty Inserts",
          status: "PROD",
          version: "1",
          createdAt: "2024-01-01",
          updatedAt: "2024-01-01",
          "postage.id": "postage-1",
          "postage.size": "STANDARD",
          "assembly.insertIds": "  ",
          "assembly.features": "BRAILLE",
        },
      ],
      variants: [],
    });
    const file = writeWorkbook(wb);
    const result = parseExcelFile(file);
    expect(result.packs.packemptyinserts.assembly?.insertIds).toBeUndefined();
    expect(result.packs.packemptyinserts.assembly?.features).toEqual([
      "BRAILLE",
    ]);
  });

  it("handles valid insertIds but empty features", () => {
    const wb = buildWorkbook({
      packs: [
        {
          id: "pack-empty-features",
          name: "Pack Empty Features",
          status: "PROD",
          version: "1",
          createdAt: "2024-01-01",
          updatedAt: "2024-01-01",
          "postage.id": "postage-1",
          "postage.size": "STANDARD",
          "assembly.insertIds": "insert-1",
          "assembly.features": "  ",
        },
      ],
      variants: [],
    });
    const file = writeWorkbook(wb);
    const result = parseExcelFile(file);
    expect(result.packs.packemptyfeatures.assembly?.insertIds).toEqual([
      "insert-1",
    ]);
    expect(result.packs.packemptyfeatures.assembly?.features).toBeUndefined();
  });

  const missingSheetCases: { sheet: string; error: RegExp }[] = [
    { sheet: "VolumeGroup", error: /VolumeGroup sheet not found/ },
    { sheet: "Supplier", error: /Supplier sheet not found/ },
    {
      sheet: "SupplierAllocation",
      error: /SupplierAllocation sheet not found/,
    },
    { sheet: "SupplierPack", error: /SupplierPack sheet not found/ },
  ];

  for (const { error, sheet } of missingSheetCases) {
    it(`throws when ${sheet} sheet is missing (table-driven)`, () => {
      const wb = buildWorkbookOmitting(sheet);
      // Ensure we are only consolidating the four; PackSpecification & LetterVariant already tested separately.
      const file = writeWorkbook(wb);
      expect(() => parseExcelFile(file)).toThrow(error);
    });
  }

  it("parses VolumeGroup with description and endDate", () => {
    const wb = buildWorkbook({
      packs: [
        {
          id: "pack-x",
          name: "Pack X",
          status: "PROD",
          version: "1",
          createdAt: "2025-01-01",
          updatedAt: "2025-01-02",
          "postage.id": "postage-x",
          "postage.size": "STANDARD",
        },
      ],
      variants: [
        {
          id: "variant-x",
          name: "Variant X",
          volumeGroupId: "volume-group-x",
          packSpecificationIds: "pack-x",
          type: "STANDARD",
          status: "PROD",
        },
      ],
      volumeGroups: [
        {
          id: "volume-group-x",
          name: "VolumeGroup X",
          description: "My VolumeGroup",
          startDate: "2025-01-01",
          endDate: "2025-12-31",
          status: "PROD",
        },
      ],
      suppliers: [],
      allocations: [],
      supplierPacks: [],
    });
    const file = writeWorkbook(wb);
    const result = parseExcelFile(file);
    expect(result.volumeGroups.volumegroupx.description).toBe("My VolumeGroup");
    expect(result.volumeGroups.volumegroupx.endDate).toBe("2025-12-31");
    expect(result.volumeGroups.volumegroupx.startDate).toBe("2025-01-01");
    expect(result.volumeGroups.volumegroupx.status).toBe("PROD");
  });

  it("parses Suppliers of all channel types", () => {
    const wb = buildWorkbook({
      packs: [
        {
          id: "pack-y",
          name: "Pack Y",
          status: "PROD",
          version: "1",
          createdAt: "2025-01-01",
          updatedAt: "2025-01-01",
          "postage.id": "postage-y",
          "postage.size": "STANDARD",
        },
      ],
      variants: [],
      volumeGroups: [],
      suppliers: [
        {
          id: "supplier-app",
          name: "App Supplier",
          channelType: "NHSAPP",
          dailyCapacity: "1000",
          status: "PROD",
        },
        {
          id: "supplier-sms",
          name: "SMS Supplier",
          channelType: "SMS",
          dailyCapacity: "2000",
          status: "PROD",
        },
        {
          id: "supplier-email",
          name: "Email Supplier",
          channelType: "EMAIL",
          dailyCapacity: "3000",
          status: "PROD",
        },
        {
          id: "supplier-letter",
          name: "Letter Supplier",
          channelType: "LETTER",
          dailyCapacity: "4000",
          status: "PROD",
        },
      ],
      allocations: [],
      supplierPacks: [],
    });
    const file = writeWorkbook(wb);
    const result = parseExcelFile(file);
    expect(result.suppliers.supplierapp.channelType).toBe("NHSAPP");
    expect(result.suppliers.suppliersms.channelType).toBe("SMS");
    expect(result.suppliers.supplieremail.channelType).toBe("EMAIL");
    expect(result.suppliers.supplierletter.channelType).toBe("LETTER");
  });

  it("throws on invalid Supplier channelType", () => {
    const wb = buildWorkbook({
      packs: [
        {
          id: "pack-z",
          name: "Pack Z",
          status: "PROD",
          version: "1",
          createdAt: "2025-01-01",
          updatedAt: "2025-01-01",
          "postage.id": "postage-z",
          "postage.size": "STANDARD",
        },
      ],
      variants: [],
      volumeGroups: [],
      suppliers: [
        {
          id: "supplier-bad",
          name: "Bad Supplier",
          channelType: "PIGEON",
          dailyCapacity: "1000",
          status: "PROD",
        },
      ],
      allocations: [],
      supplierPacks: [],
    });
    const file = writeWorkbook(wb);
    expect(() => parseExcelFile(file)).toThrow(
      /Validation failed.*supplier-bad/,
    );
  });

  it("parses SupplierAllocations including boundary percentages and sanitizes IDs", () => {
    const wb = buildWorkbook({
      packs: [
        {
          id: "pack-a",
          name: "Pack A",
          status: "PROD",
          version: "1",
          createdAt: "2025-01-01",
          updatedAt: "2025-01-01",
          "postage.id": "postage-a",
          "postage.size": "STANDARD",
        },
      ],
      variants: [],
      volumeGroups: [
        {
          id: "volume-group-a",
          name: "VolumeGroup A",
          startDate: "2025-01-01",
          status: "PROD",
        },
      ],
      suppliers: [
        {
          id: "supplier-a",
          name: "Supplier A",
          channelType: "LETTER",
          dailyCapacity: "1000",
          status: "PROD",
        },
        {
          id: "supplier-b",
          name: "Supplier B",
          channelType: "LETTER",
          dailyCapacity: "2000",
          status: "PROD",
        },
        {
          id: "supplier-c",
          name: "Supplier C",
          channelType: "LETTER",
          dailyCapacity: "3000",
          status: "PROD",
        },
      ],
      allocations: [
        {
          id: "allocation-1%", // sanitized
          volumeGroupId: "volume-group-a",
          supplier: "supplier-a",
          allocationPercentage: "0",
          status: "PROD",
        },
        {
          id: "allocation-2%",
          volumeGroupId: "volume-group-a",
          supplier: "supplier-b",
          allocationPercentage: "75",
          status: "PROD",
        },
        {
          id: "allocation-3%",
          volumeGroupId: "volume-group-a",
          supplier: "supplier-c",
          allocationPercentage: "100",
          status: "PROD",
        },
      ],
      supplierPacks: [],
    });
    const file = writeWorkbook(wb);
    const result = parseExcelFile(file);
    expect(result.allocations.allocation1.volumeGroup).toBe("volume-group-a");
    expect(result.allocations.allocation2.allocationPercentage).toBe(75);
    expect(result.allocations.allocation3.allocationPercentage).toBe(100);
  });

  it("throws when allocationPercentage is out of bounds (<0 or >100)", () => {
    const wbHigh = buildWorkbook({
      packs: [
        {
          id: "pack-bounds",
          name: "Pack Bounds",
          status: "PROD",
          version: "1",
          createdAt: "2025-01-01",
          updatedAt: "2025-01-01",
          "postage.id": "postage-bounds",
          "postage.size": "STANDARD",
        },
      ],
      variants: [],
      volumeGroups: [
        {
          id: "volume-group-bounds",
          name: "VolumeGroup Bounds",
          startDate: "2025-01-01",
          status: "PROD",
        },
      ],
      suppliers: [
        {
          id: "supplier-bounds",
          name: "Supplier Bounds",
          channelType: "LETTER",
          dailyCapacity: "1000",
          status: "PROD",
        },
      ],
      allocations: [
        {
          id: "allocation-high",
          volumeGroupId: "volume-group-bounds",
          supplier: "supplier-bounds",
          allocationPercentage: "150",
          status: "PROD",
        },
      ],
      supplierPacks: [],
    });
    const fileHigh = writeWorkbook(wbHigh);
    expect(() => parseExcelFile(fileHigh)).toThrow(
      /Validation failed.*allocation-high/,
    );

    const wbLow = buildWorkbook({
      packs: [
        {
          id: "pack-bounds2",
          name: "Pack Bounds 2",
          status: "PROD",
          version: "1",
          createdAt: "2025-01-01",
          updatedAt: "2025-01-01",
          "postage.id": "postage-bounds2",
          "postage.size": "STANDARD",
        },
      ],
      variants: [],
      volumeGroups: [
        {
          id: "volume-group-bounds2",
          name: "VolumeGroup Bounds 2",
          startDate: "2025-01-01",
          status: "PROD",
        },
      ],
      suppliers: [
        {
          id: "supplier-bounds2",
          name: "Supplier Bounds 2",
          channelType: "LETTER",
          dailyCapacity: "1000",
          status: "PROD",
        },
      ],
      allocations: [
        {
          id: "allocation-low",
          volumeGroupId: "volume-group-bounds2",
          supplier: "supplier-bounds2",
          allocationPercentage: "-5",
          status: "PROD",
        },
      ],
      supplierPacks: [],
    });
    const fileLow = writeWorkbook(wbLow);
    expect(() => parseExcelFile(fileLow)).toThrow(
      /Validation failed.*allocation-low/,
    );
  });

  it("parses SupplierPack rows for all statuses", () => {
    const wb = buildWorkbook({
      packs: [
        {
          id: "pack-sp",
          name: "Pack SP",
          status: "PROD",
          version: "1",
          createdAt: "2025-01-01",
          updatedAt: "2025-01-01",
          "postage.id": "postage-sp",
          "postage.size": "STANDARD",
        },
      ],
      variants: [],
      volumeGroups: [],
      suppliers: [
        {
          id: "supplier-sp",
          name: "Supplier SP",
          channelType: "LETTER",
          dailyCapacity: "1000",
          status: "PROD",
        },
      ],
      allocations: [],
      supplierPacks: [
        {
          id: "sp-submitted",
          packSpecificationId: "pack-sp",
          supplierId: "supplier-sp",
          approval: "SUBMITTED",
          status: "PROD",
        },
        {
          id: "sp-approved",
          packSpecificationId: "pack-sp",
          supplierId: "supplier-sp",
          approval: "APPROVED",
          status: "PROD",
        },
        {
          id: "sp-rejected",
          packSpecificationId: "pack-sp",
          supplierId: "supplier-sp",
          approval: "REJECTED",
          status: "PROD",
        },
        {
          id: "sp-disabled",
          packSpecificationId: "pack-sp",
          supplierId: "supplier-sp",
          approval: "DISABLED",
          status: "PROD",
        },
      ],
    });
    const file = writeWorkbook(wb);
    const result = parseExcelFile(file);
    expect(result.supplierPacks.spsubmitted.approval).toBe("SUBMITTED");
    expect(result.supplierPacks.spapproved.approval).toBe("APPROVED");
    expect(result.supplierPacks.sprejected.approval).toBe("REJECTED");
    expect(result.supplierPacks.spdisabled.approval).toBe("DISABLED");
  });

  it("throws on invalid SupplierPack status", () => {
    const wb = buildWorkbook({
      packs: [
        {
          id: "pack-sp-bad",
          name: "Pack SP Bad",
          status: "PROD",
          version: "1",
          createdAt: "2025-01-01",
          updatedAt: "2025-01-01",
          "postage.id": "postage-sp-bad",
          "postage.size": "STANDARD",
        },
      ],
      variants: [],
      volumeGroups: [],
      suppliers: [
        {
          id: "supplier-sp-bad",
          name: "Supplier SP Bad",
          channelType: "LETTER",
          dailyCapacity: "1000",
          status: "PROD",
        },
      ],
      allocations: [],
      supplierPacks: [
        {
          id: "sp-invalid",
          packSpecificationId: "pack-sp-bad",
          supplierId: "supplier-sp-bad",
          approval: "UNKNOWNSTATUS",
          status: "PROD",
        },
      ],
    });
    const file = writeWorkbook(wb);
    expect(() => parseExcelFile(file)).toThrow(/Validation failed.*sp-invalid/);
  });

  it("leaves constraints undefined when none provided", () => {
    const wb = buildWorkbook({
      packs: [
        {
          id: "pack-no-constraints",
          name: "Pack No Constraints",
          status: "PROD",
          version: "1",
          createdAt: "2025-01-01",
          updatedAt: "2025-01-01",
          "postage.id": "postage-nc",
          "postage.size": "STANDARD",
        },
      ],
      variants: [
        {
          id: "variant-no-constraints",
          name: "Variant No Constraints",
          volumeGroupId: "volume-group-nc",
          packSpecificationIds: "pack-no-constraints",
          type: "STANDARD",
          status: "PROD",
        },
      ],
      volumeGroups: [
        {
          id: "volume-group-nc",
          name: "VolumeGroup NC",
          startDate: "2025-01-01",
          status: "PROD",
        },
      ],
    });
    const file = writeWorkbook(wb);
    const result = parseExcelFile(file);
    expect(result.packs.packnoconstraints.constraints).toBeUndefined();
    expect(result.variants.variantnoconstraints.constraints).toBeUndefined();
  });

  it("trims spaces in campaignIds and packSpecificationIds", () => {
    const wb = buildWorkbook({
      packs: [
        {
          id: "pack-space-1",
          name: "Pack Space 1",
          status: "PROD",
          version: "1",
          createdAt: "2025-01-01",
          updatedAt: "2025-01-01",
          "postage.id": "postage-space-1",
          "postage.size": "STANDARD",
        },
        {
          id: "pack-space-2",
          name: "Pack Space 2",
          status: "PROD",
          version: "1",
          createdAt: "2025-01-01",
          updatedAt: "2025-01-01",
          "postage.id": "postage-space-2",
          "postage.size": "STANDARD",
        },
      ],
      variants: [
        {
          id: "variant-space",
          name: "Variant Space",
          volumeGroupId: "volume-group-space",
          packSpecificationIds: " pack-space-1 , pack-space-2 ",
          type: "STANDARD",
          status: "PROD",
          campaignIds: " campaign-1 ,  campaign-2 ",
        },
      ],
      volumeGroups: [
        {
          id: "volume-group-space",
          name: "VolumeGroup Space",
          startDate: "2025-01-01",
          status: "PROD",
        },
      ],
    });
    const file = writeWorkbook(wb);
    const result = parseExcelFile(file);
    expect(result.variants.variantspace.packSpecificationIds).toEqual([
      "pack-space-1",
      "pack-space-2",
    ]);
    expect(result.variants.variantspace.campaignIds).toEqual([
      "campaign-1",
      "campaign-2",
    ]);
  });

  it("parses volume group and supplier IDs with special chars sanitizing keys", () => {
    const wb = buildWorkbook({
      packs: [
        {
          id: "pack-sanitize",
          name: "Pack Sanitize",
          status: "PROD",
          version: "1",
          createdAt: "2025-01-01",
          updatedAt: "2025-01-01",
          "postage.id": "postage-sanitize",
          "postage.size": "STANDARD",
        },
      ],
      variants: [],
      volumeGroups: [
        {
          id: "volume-group#sanitize",
          name: "VolumeGroup Sanitize",
          startDate: "2025-01-01",
          status: "PROD",
        },
      ],
      suppliers: [
        {
          id: "supplier@sanitize",
          name: "Supplier Sanitize",
          channelType: "LETTER",
          dailyCapacity: "1000",
          status: "PROD",
        },
      ],
      allocations: [],
      supplierPacks: [],
    });
    const file = writeWorkbook(wb);
    const result = parseExcelFile(file);
    expect(result.volumeGroups.volumegroupsanitize.name).toBe(
      "VolumeGroup Sanitize",
    );
    expect(result.suppliers.suppliersanitize.name).toBe("Supplier Sanitize");
  });

  it("throws validation error for VolumeGroup with missing name", () => {
    const wb = buildWorkbook({
      packs: [
        {
          id: "pack-volume-group-bad",
          name: "Pack VolumeGroup Bad",
          status: "PROD",
          version: "1",
          createdAt: "2025-01-01",
          updatedAt: "2025-01-01",
          "postage.id": "postage-volume-group-bad",
          "postage.size": "STANDARD",
        },
      ],
      variants: [
        {
          id: "variant-volume-group-bad",
          name: "Variant VolumeGroup Bad",
          volumeGroupId: "volume-group-bad",
          packSpecificationIds: "pack-volume-group-bad",
          type: "STANDARD",
          status: "PROD",
        },
      ],
      // VolumeGroup row intentionally missing 'name' field to trigger validation error
      volumeGroups: [
        {
          id: "volume-group-bad",
          startDate: "2025-01-01",
          status: "PROD",
        },
      ],
      suppliers: [],
      allocations: [],
      supplierPacks: [],
    });
    const file = writeWorkbook(wb);
    expect(() => parseExcelFile(file)).toThrow(
      /Validation failed.*volume-group-bad/,
    );
  });

  it("defaults volume group startDate when missing or invalid", () => {
    const wb = buildWorkbook({
      packs: [
        {
          id: "pack-default-date",
          name: "Pack Default Date",
          status: "PROD",
          version: "1",
          createdAt: "2025-01-01",
          updatedAt: "2025-01-01",
          "postage.id": "postage-default-date",
          "postage.size": "STANDARD",
        },
      ],
      variants: [
        {
          id: "variant-default-date",
          name: "Variant Default Date",
          volumeGroupId: "volume-group-missing-date",
          packSpecificationIds: "pack-default-date",
          type: "STANDARD",
          status: "PROD",
        },
        {
          id: "variant-invalid-date",
          name: "Variant Invalid Date",
          volumeGroupId: "volume-group-invalid-date",
          packSpecificationIds: "pack-default-date",
          type: "STANDARD",
          status: "PROD",
        },
      ],
      volumeGroups: [
        // Missing startDate entirely (will default)
        {
          id: "volume-group-missing-date",
          name: "VolumeGroup Missing Date",
          // no startDate provided
          status: "PROD",
        },
        // Invalid startDate string (will default)
        {
          id: "volume-group-invalid-date",
          name: "VolumeGroup Invalid Date",
          startDate: "not-a-valid-date",
          status: "PROD",
        },
      ],
    });
    const file = writeWorkbook(wb);
    const result = parseExcelFile(file);
    expect(result.volumeGroups.volumegroupmissingdate.startDate).toBe(
      "2023-01-01",
    );
    expect(result.volumeGroups.volumegroupinvaliddate.startDate).toBe(
      "2023-01-01",
    );
  });

  it("parses Excel serial date numbers for timestamps", () => {
    const wb = buildWorkbook({
      packs: [
        {
          id: "pack-excel-dates",
          name: "Pack with Excel Serial Dates",
          status: "PROD",
          version: "1",
          createdAt: 44927, // Excel serial date for 2023-01-01
          updatedAt: 44958, // Excel serial date for 2023-02-01
          "postage.id": "postage-1",
          "postage.size": "STANDARD",
        },
      ],
      variants: [],
    });
    const file = writeWorkbook(wb);
    const result = parseExcelFile(file);
    expect(result.packs.packexceldates.createdAt).toMatch(/2023-01-01/);
    expect(result.packs.packexceldates.updatedAt).toMatch(/2023-02-01/);
  });

  it("parses Excel serial date numbers for date-only fields", () => {
    const wb = buildWorkbook({
      packs: [
        {
          id: "pack-1",
          name: "Pack 1",
          status: "PROD",
          version: "1",
          createdAt: "2024-01-01",
          updatedAt: "2024-01-01",
          "postage.id": "postage-1",
          "postage.size": "STANDARD",
        },
      ],
      variants: [],
      volumeGroups: [
        {
          id: "volume-group-excel-dates",
          name: "VolumeGroup with Excel Dates",
          startDate: 44927, // Excel serial date for 2023-01-01
          endDate: 45292, // Excel serial date for 2024-01-01
          status: "PROD",
        },
      ],
    });
    const file = writeWorkbook(wb);
    const result = parseExcelFile(file);
    expect(result.volumeGroups.volumegroupexceldates.startDate).toBe(
      "2023-01-01",
    );
    expect(result.volumeGroups.volumegroupexceldates.endDate).toBe(
      "2024-01-01",
    );
  });

  it("parses constraints.sides on PackSpecification", () => {
    const wb = buildWorkbook({
      packs: [
        {
          id: "pack-with-sides",
          name: "Pack with Sides Constraint",
          status: "PROD",
          version: "1",
          createdAt: "2024-01-01",
          updatedAt: "2024-01-01",
          "postage.id": "postage-1",
          "postage.size": "STANDARD",
          "constraints.sheets": "10",
          "constraints.sides": "20",
          "constraints.deliveryDays": "5",
        },
      ],
      variants: [],
    });
    const file = writeWorkbook(wb);
    const result = parseExcelFile(file);
    expect(result.packs.packwithsides.constraints).toEqual({
      sheets: { value: 10, operator: "LESS_THAN" },
      sides: { value: 20, operator: "LESS_THAN" },
      deliveryDays: { value: 5, operator: "LESS_THAN" },
    });
  });

  it("parses constraints.sides on LetterVariant", () => {
    const wb = buildWorkbook({
      packs: [
        {
          id: "pack-1",
          name: "Pack 1",
          status: "PROD",
          version: "1",
          createdAt: "2024-01-01",
          updatedAt: "2024-01-01",
          "postage.id": "postage-1",
          "postage.size": "STANDARD",
        },
      ],
      variants: [
        {
          id: "variant-with-sides",
          name: "Variant with Sides Constraint",
          volumeGroupId: "volume-group-1",
          packSpecificationIds: "pack-1",
          type: "STANDARD",
          status: "PROD",
          "constraints.sheets": "8",
          "constraints.sides": "16",
          "constraints.deliveryDays": "3",
        },
      ],
    });
    const file = writeWorkbook(wb);
    const result = parseExcelFile(file);
    expect(result.variants.variantwithsides.constraints).toEqual({
      sheets: { value: 8, operator: "LESS_THAN" },
      sides: { value: 16, operator: "LESS_THAN" },
      deliveryDays: { value: 3, operator: "LESS_THAN" },
    });
  });

  it("parses assembly.paper.finish", () => {
    const wb = buildWorkbook({
      packs: [
        {
          id: "pack-with-paper-finish",
          name: "Pack with Paper Finish",
          status: "PROD",
          version: "1",
          createdAt: "2024-01-01",
          updatedAt: "2024-01-01",
          "postage.id": "postage-1",
          "postage.size": "STANDARD",
          "assembly.paper.id": "paper-glossy",
          "assembly.paper.name": "Glossy Paper",
          "assembly.paper.weightGSM": "120",
          "assembly.paper.size": "A4",
          "assembly.paper.colour": "WHITE",
          "assembly.paper.recycled": "true",
          "assembly.paper.finish": "GLOSSY",
        },
      ],
      variants: [],
    });
    const file = writeWorkbook(wb);
    const result = parseExcelFile(file);
    expect(result.packs.packwithpaperfinish.assembly?.paper).toEqual({
      id: "paper-glossy",
      name: "Glossy Paper",
      weightGSM: 120,
      size: "A4",
      colour: "WHITE",
      recycled: true,
      finish: "GLOSSY",
    });
  });

  it("parses assembly.paper without finish", () => {
    const wb = buildWorkbook({
      packs: [
        {
          id: "pack-without-paper-finish",
          name: "Pack without Paper Finish",
          status: "PROD",
          version: "1",
          createdAt: "2024-01-01",
          updatedAt: "2024-01-01",
          "postage.id": "postage-1",
          "postage.size": "STANDARD",
          "assembly.paper.id": "paper-plain",
          "assembly.paper.name": "Plain Paper",
          "assembly.paper.weightGSM": "80",
          "assembly.paper.size": "A4",
          "assembly.paper.colour": "WHITE",
          "assembly.paper.recycled": "false",
        },
      ],
      variants: [],
    });
    const file = writeWorkbook(wb);
    const result = parseExcelFile(file);
    expect(result.packs.packwithoutpaperfinish.assembly?.paper).toEqual({
      id: "paper-plain",
      name: "Plain Paper",
      weightGSM: 80,
      size: "A4",
      colour: "WHITE",
      recycled: false,
    });
    expect(
      result.packs.packwithoutpaperfinish.assembly?.paper?.finish,
    ).toBeUndefined();
  });

  it("defaults paper.colour to WHITE when missing", () => {
    const wb = buildWorkbook({
      packs: [
        {
          id: "pack-without-paper-colour",
          name: "Pack without Paper Colour",
          status: "PROD",
          version: "1",
          createdAt: "2024-01-01",
          updatedAt: "2024-01-01",
          "postage.id": "postage-1",
          "postage.size": "STANDARD",
          "assembly.paper.id": "paper-default-colour",
          "assembly.paper.name": "Paper Default Colour",
          "assembly.paper.weightGSM": "80",
          "assembly.paper.size": "A4",
          // no colour field provided
          "assembly.paper.recycled": "false",
        },
      ],
      variants: [],
    });
    const file = writeWorkbook(wb);
    const result = parseExcelFile(file);
    expect(result.packs.packwithoutpapercolour.assembly?.paper?.colour).toBe(
      "WHITE",
    );
  });

  it("defaults VolumeGroup status to DRAFT when missing", () => {
    const wb = buildWorkbook({
      packs: [
        {
          id: "pack-1",
          name: "Pack 1",
          status: "PROD",
          version: "1",
          createdAt: "2024-01-01",
          updatedAt: "2024-01-01",
          "postage.id": "postage-1",
          "postage.size": "STANDARD",
        },
      ],
      variants: [],
      volumeGroups: [
        {
          id: "volume-group-no-status",
          name: "VolumeGroup without Status",
          startDate: "2024-01-01",
          // no status field
        },
      ],
    });
    const file = writeWorkbook(wb);
    const result = parseExcelFile(file);
    expect(result.volumeGroups.volumegroupnostatus.status).toBe("DRAFT");
  });

  it("defaults Supplier status to DRAFT when missing", () => {
    const wb = buildWorkbook({
      packs: [
        {
          id: "pack-1",
          name: "Pack 1",
          status: "PROD",
          version: "1",
          createdAt: "2024-01-01",
          updatedAt: "2024-01-01",
          "postage.id": "postage-1",
          "postage.size": "STANDARD",
        },
      ],
      variants: [],
      suppliers: [
        {
          id: "supplier-no-status",
          name: "Supplier without Status",
          channelType: "LETTER",
          dailyCapacity: "5000",
          // no status field
        },
      ],
    });
    const file = writeWorkbook(wb);
    const result = parseExcelFile(file);
    expect(result.suppliers.suppliernostatus.status).toBe("DRAFT");
  });
});
