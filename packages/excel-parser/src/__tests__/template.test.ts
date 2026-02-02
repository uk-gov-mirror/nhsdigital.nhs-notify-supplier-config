/* eslint-disable sonarjs/no-alphabetical-sort,security/detect-non-literal-fs-filename */
import fs from "node:fs";
import path from "node:path";
import * as XLSX from "xlsx";
import generateTemplateExcel from "../template";

describe("generateTemplateExcel", () => {
  const tmpFile = path.join(process.cwd(), `specs.template.${Date.now()}.xlsx`);

  afterAll(() => {
    if (fs.existsSync(tmpFile)) fs.unlinkSync(tmpFile);
  });

  it("creates an .xlsx with all expected sheets", () => {
    const out = generateTemplateExcel(tmpFile, true);
    expect(out).toBe(tmpFile);
    expect(fs.existsSync(out)).toBe(true);
    const wb = XLSX.readFile(out);
    const sheetNames = wb.SheetNames.toSorted();
    expect(sheetNames).toEqual(
      [
        "VolumeGroup",
        "LetterVariant",
        "PackSpecification",
        "Supplier",
        "SupplierAllocation",
        "SupplierPack",
      ].toSorted(),
    );
  });

  it("populates header row for PackSpecification", () => {
    const out = generateTemplateExcel(tmpFile, true);
    const wb = XLSX.readFile(out);
    const packSheet = wb.Sheets.PackSpecification;
    const headers = XLSX.utils.sheet_to_json<string[]>(packSheet, {
      header: 1,
    })[0];
    expect(headers).toContain("postage.id");
    expect(headers).toContain("assembly.paper.recycled");
    expect(headers).toContain("constraints.blackCoveragePercentage");
  });

  it("throws without force when file exists", () => {
    generateTemplateExcel(tmpFile, true);
    expect(() => generateTemplateExcel(tmpFile, false)).toThrow(
      /already exists/,
    );
  });

  it("creates file when not existing using default force parameter (no overwrite)", () => {
    const freshFile = path.join(
      process.cwd(),
      `template.default.${Date.now()}.xlsx`,
    );
    expect(fs.existsSync(freshFile)).toBe(false);
    const out = generateTemplateExcel(freshFile); // force omitted -> false
    expect(out).toBe(freshFile);
    expect(fs.existsSync(freshFile)).toBe(true);
    // cleanup
    fs.unlinkSync(freshFile);
  });

  it("rejects non-xlsx outputs", () => {
    expect(() => generateTemplateExcel("template.csv", true)).toThrow(
      /must end with .xlsx/,
    );
  });
});
