import { parseExcelFile } from "../parse-excel";
import {
  buildWorkbookOmitting,
  writeWorkbook,
} from "../test-helpers/parse-excel";

describe("parse-excel workbook structure", () => {
  it("throws when LetterVariant sheet is missing", () => {
    const file = writeWorkbook(buildWorkbookOmitting("LetterVariant"));

    expect(() => parseExcelFile(file)).toThrow(
      /LetterVariant sheet not found in Excel file/,
    );
  });

  it("throws when PackSpecification sheet is missing", () => {
    const file = writeWorkbook(buildWorkbookOmitting("PackSpecification"));

    expect(() => parseExcelFile(file)).toThrow(
      /PackSpecification sheet not found in Excel file/,
    );
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
    it(`throws when ${sheet} sheet is missing`, () => {
      const file = writeWorkbook(buildWorkbookOmitting(sheet));

      expect(() => parseExcelFile(file)).toThrow(error);
    });
  }
});
