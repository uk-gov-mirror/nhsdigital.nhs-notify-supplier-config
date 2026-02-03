import * as fs from "node:fs";
import path from "node:path";
import * as os from "node:os";
import type { ParseResult } from "@supplier-config/excel-parser";
import { generateSupplierReports } from "../supplier-report";

const createMockData = (): ParseResult => ({
  allocations: {
    alloc1: {
      allocationPercentage: 60,
      id: "alloc-printco-q1" as any,
      status: "PUBLISHED" as any,
      supplier: "supplier-printco" as any,
      volumeGroup: "vg-q1-2024" as any,
    },
    alloc2: {
      allocationPercentage: 40,
      id: "alloc-mailhouse-q1" as any,
      status: "PUBLISHED" as any,
      supplier: "supplier-mailhouse" as any,
      volumeGroup: "vg-q1-2024" as any,
    },
  },
  packs: {
    pack1: {
      assembly: {
        envelopeId: "envelope-c5" as any,
        features: ["BRAILLE"],
        paper: {
          colour: "WHITE",
          id: "paper-std" as any,
          name: "Standard White 80gsm",
          recycled: true,
          size: "A4",
          weightGSM: 80,
        },
        printColour: "COLOUR",
      },
      constraints: {
        deliveryDays: {
          value: 2,
          operator: "LESS_THAN" as const,
        },
        sheets: {
          value: 10,
          operator: "LESS_THAN" as const,
        },
      },
      createdAt: "2024-01-01T00:00:00Z",
      id: "pack-std-2day" as any,
      name: "Standard 2-Day Delivery",
      postage: {
        id: "postage-standard" as any,
        size: "STANDARD",
      },
      status: "PROD",
      updatedAt: "2024-01-01T00:00:00Z",
      version: 1,
    },
    pack2: {
      createdAt: "2024-01-01T00:00:00Z",
      id: "pack-express" as any,
      name: "Express Delivery",
      postage: {
        id: "postage-express" as any,
        size: "LARGE",
      },
      status: "PROD",
      updatedAt: "2024-01-01T00:00:00Z",
      version: 1,
    },
  },
  supplierPacks: {
    sp1: {
      approval: "APPROVED",
      id: "sp-printco-pack1" as any,
      packSpecificationId: "pack-std-2day" as any,
      status: "PROD",
      supplierId: "supplier-printco" as any,
    },
    sp2: {
      approval: "SUBMITTED",
      id: "sp-printco-pack2" as any,
      packSpecificationId: "pack-express" as any,
      status: "INT",
      supplierId: "supplier-printco" as any,
    },
    sp3: {
      approval: "APPROVED",
      id: "sp-mailhouse-pack1" as any,
      packSpecificationId: "pack-std-2day" as any,
      status: "PROD",
      supplierId: "supplier-mailhouse" as any,
    },
  },
  suppliers: {
    mailhouse: {
      channelType: "LETTER",
      dailyCapacity: 5000,
      id: "supplier-mailhouse" as any,
      name: "MailHouse Services",
      status: "PROD" as any,
    },
    printco: {
      channelType: "LETTER",
      dailyCapacity: 10_000,
      id: "supplier-printco" as any,
      name: "PrintCo Ltd",
      status: "PROD" as any,
    },
  },
  variants: {},
  volumeGroups: {
    vgQ1: {
      description: "Q1 2024 Volume Allocation",
      id: "vg-q1-2024" as any,
      name: "Q1 2024",
      startDate: "2024-01-01",
      status: "PUBLISHED" as any,
    },
  },
});

describe("supplier-report", () => {
  let tempDir: string;

  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "supplier-report-test-"));
  });

  afterEach(() => {
    // eslint-disable-next-line security/detect-non-literal-fs-filename
    if (tempDir && fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { force: true, recursive: true });
    }
  });

  it("generates HTML reports for each supplier", () => {
    const data = createMockData();
    const result = generateSupplierReports(data, tempDir);

    expect(result.reports).toHaveLength(2);
    expect(result.outputDir).toBe(tempDir);

    // Check that files were created
    for (const report of result.reports) {
      // eslint-disable-next-line security/detect-non-literal-fs-filename
      expect(fs.existsSync(report.filePath)).toBe(true);
    }
  });

  it("generates correct report for PrintCo with 2 packs", () => {
    const data = createMockData();
    const result = generateSupplierReports(data, tempDir);

    const printcoReport = result.reports.find(
      (r) => r.supplierId === "supplier-printco",
    );
    expect(printcoReport).toBeDefined();
    expect(printcoReport!.packCount).toBe(2);
    expect(printcoReport!.supplierName).toBe("PrintCo Ltd");

    // Read and verify HTML content
    // eslint-disable-next-line security/detect-non-literal-fs-filename
    const html = fs.readFileSync(printcoReport!.filePath, "utf8");
    expect(html).toContain("PrintCo Ltd");
    expect(html).toContain("Standard 2-Day Delivery");
    expect(html).toContain("Express Delivery");
    expect(html).toContain("APPROVED");
    expect(html).toContain("SUBMITTED");
  });

  it("generates correct report for MailHouse with 1 pack", () => {
    const data = createMockData();
    const result = generateSupplierReports(data, tempDir);

    const mailhouseReport = result.reports.find(
      (r) => r.supplierId === "supplier-mailhouse",
    );
    expect(mailhouseReport).toBeDefined();
    expect(mailhouseReport!.packCount).toBe(1);
    expect(mailhouseReport!.supplierName).toBe("MailHouse Services");

    // Read and verify HTML content
    // eslint-disable-next-line security/detect-non-literal-fs-filename
    const html = fs.readFileSync(mailhouseReport!.filePath, "utf8");
    expect(html).toContain("MailHouse Services");
    expect(html).toContain("Standard 2-Day Delivery");
    expect(html).not.toContain("Express Delivery");
  });

  it("includes pack specification details in report", () => {
    const data = createMockData();
    const result = generateSupplierReports(data, tempDir);

    const printcoReport = result.reports.find(
      (r) => r.supplierId === "supplier-printco",
    );
    // eslint-disable-next-line security/detect-non-literal-fs-filename
    const html = fs.readFileSync(printcoReport!.filePath, "utf8");

    // Check postage details
    expect(html).toContain("postage-standard");
    expect(html).toContain("STANDARD");

    // Check constraints
    expect(html).toContain("Sheets");
    expect(html).toContain("&lt; 10");
    expect(html).toContain("Delivery Days");

    // Check assembly details
    expect(html).toContain("envelope-c5");
    expect(html).toContain("BRAILLE");
    expect(html).toContain("Standard White 80gsm");
  });

  it("creates output directory if it does not exist", () => {
    const data = createMockData();
    const newDir = path.join(tempDir, "nested", "output");

    const result = generateSupplierReports(data, newDir);

    // eslint-disable-next-line security/detect-non-literal-fs-filename
    expect(fs.existsSync(newDir)).toBe(true);
    expect(result.reports.length).toBeGreaterThan(0);
  });

  it("generates report for supplier with no packs", () => {
    const data: ParseResult = {
      allocations: {},
      packs: {},
      supplierPacks: {},
      suppliers: {
        empty: {
          channelType: "LETTER",
          dailyCapacity: 1000,
          id: "supplier-empty" as any,
          name: "Empty Supplier",
          status: "PROD" as any,
        },
      },
      variants: {},
      volumeGroups: {},
    };

    const result = generateSupplierReports(data, tempDir);

    expect(result.reports).toHaveLength(1);
    expect(result.reports[0].packCount).toBe(0);

    // eslint-disable-next-line security/detect-non-literal-fs-filename
    const html = fs.readFileSync(result.reports[0].filePath, "utf8");
    expect(html).toContain("Empty Supplier");
    expect(html).toContain("No pack specifications assigned to this supplier");
  });

  it("sanitizes supplier name for filename", () => {
    const data: ParseResult = {
      allocations: {},
      packs: {},
      supplierPacks: {},
      suppliers: {
        special: {
          channelType: "LETTER",
          dailyCapacity: 1000,
          id: "supplier-special" as any,
          name: "Test & Co. (Special) Ltd!",
          status: "PROD" as any,
        },
      },
      variants: {},
      volumeGroups: {},
    };

    const result = generateSupplierReports(data, tempDir);

    expect(result.reports[0].filePath).toContain(
      "supplier-report-test-co-special-ltd.html",
    );
  });

  it("throws error when supplier pack references unknown supplier", () => {
    const data: ParseResult = {
      allocations: {},
      packs: {
        pack1: {
          createdAt: "2024-01-01T00:00:00Z",
          id: "pack-1" as any,
          name: "Pack 1",
          postage: { id: "postage-1" as any, size: "STANDARD" },
          status: "PROD",
          updatedAt: "2024-01-01T00:00:00Z",
          version: 1,
        },
      },
      supplierPacks: {
        sp1: {
          approval: "APPROVED",
          id: "sp-orphan" as any,
          packSpecificationId: "pack-1" as any,
          status: "PROD",
          supplierId: "unknown-supplier" as any,
        },
      },
      suppliers: {},
      variants: {},
      volumeGroups: {},
    };

    expect(() => generateSupplierReports(data, tempDir)).toThrow(
      "references unknown supplier",
    );
  });

  it("throws error when supplier pack references unknown pack specification", () => {
    const data: ParseResult = {
      allocations: {},
      packs: {},
      supplierPacks: {
        sp1: {
          approval: "APPROVED",
          id: "sp-orphan" as any,
          packSpecificationId: "unknown-pack" as any,
          status: "PROD",
          supplierId: "supplier-1" as any,
        },
      },
      suppliers: {
        s1: {
          channelType: "LETTER",
          dailyCapacity: 1000,
          id: "supplier-1" as any,
          name: "Supplier 1",
          status: "PROD" as any,
        },
      },
      variants: {},
      volumeGroups: {},
    };

    expect(() => generateSupplierReports(data, tempDir)).toThrow(
      "references unknown pack specification",
    );
  });

  it("handles boolean and object values in formatValue", () => {
    const data: ParseResult = {
      allocations: {},
      packs: {
        pack1: {
          assembly: {
            additional: { custom: "value" } as any,
            paper: {
              colour: "WHITE",
              id: "paper-1" as any,
              name: "Paper 1",
              recycled: false,
              size: "A4",
              weightGSM: 80,
            },
          },
          createdAt: "2024-01-01T00:00:00Z",
          id: "pack-1" as any,
          name: "Pack 1",
          postage: { id: "postage-1" as any, size: "STANDARD" },
          status: "PROD",
          updatedAt: "2024-01-01T00:00:00Z",
          version: 1,
        },
      },
      supplierPacks: {
        sp1: {
          approval: "APPROVED",
          id: "sp-1" as any,
          packSpecificationId: "pack-1" as any,
          status: "PROD",
          supplierId: "supplier-1" as any,
        },
      },
      suppliers: {
        s1: {
          channelType: "LETTER",
          dailyCapacity: 1000,
          id: "supplier-1" as any,
          name: "Supplier 1",
          status: "PROD" as any,
        },
      },
      variants: {},
      volumeGroups: {},
    };

    const result = generateSupplierReports(data, tempDir);
    // eslint-disable-next-line security/detect-non-literal-fs-filename
    const html = fs.readFileSync(result.reports[0].filePath, "utf8");

    // Check boolean rendered as No (recycled: false)
    expect(html).toContain("No");
    // Check additional object is rendered
    expect(html).toContain("custom");
    expect(html).toContain("value");
  });

  it("includes TOC with links to pack specifications", () => {
    const data = createMockData();
    const result = generateSupplierReports(data, tempDir);

    const printcoReport = result.reports.find(
      (r) => r.supplierId === "supplier-printco",
    );
    // eslint-disable-next-line security/detect-non-literal-fs-filename
    const html = fs.readFileSync(printcoReport!.filePath, "utf8");

    // Check TOC exists
    expect(html).toContain("Table of Contents");
    expect(html).toContain('class="toc"');

    // Check TOC contains links to packs
    expect(html).toContain('href="#pack-pack-std-2day"');
    expect(html).toContain('href="#pack-pack-express"');

    // Check TOC shows both approval and environment statuses
    expect(html).toContain("toc-statuses");

    // Check pack sections have anchor IDs
    expect(html).toContain('id="pack-pack-std-2day"');
    expect(html).toContain('id="pack-pack-express"');

    // Check back-to-top links exist
    expect(html).toContain('href="#top"');
    expect(html).toContain("Back to top");

    // Check body has id="top" for back-to-top navigation
    expect(html).toContain('id="top"');
  });

  it("shows both approval and environment statuses explicitly", () => {
    const data = createMockData();
    const result = generateSupplierReports(data, tempDir);

    const printcoReport = result.reports.find(
      (r) => r.supplierId === "supplier-printco",
    );
    // eslint-disable-next-line security/detect-non-literal-fs-filename
    const html = fs.readFileSync(printcoReport!.filePath, "utf8");

    // Check explicit status labels exist
    expect(html).toContain("Approval:");
    expect(html).toContain("Environment:");

    // Check status-row class is used
    expect(html).toContain('class="status-row"');
  });

  it("includes volume group allocations section", () => {
    const data = createMockData();
    const result = generateSupplierReports(data, tempDir);

    const printcoReport = result.reports.find(
      (r) => r.supplierId === "supplier-printco",
    );
    // eslint-disable-next-line security/detect-non-literal-fs-filename
    const html = fs.readFileSync(printcoReport!.filePath, "utf8");

    // Check allocations section exists
    expect(html).toContain("Volume Group Allocations");
    expect(html).toContain('class="allocations-section"');

    // Check volume group data is shown
    expect(html).toContain("Q1 2024");
    expect(html).toContain("Q1 2024 Volume Allocation");
    expect(html).toContain("60%");
    expect(html).toContain("2024-01-01");
  });

  it("excludes draft supplier packs when excludeDrafts option is true", () => {
    const data = createMockData();
    // Add a draft supplier pack to the data
    data.supplierPacks.sp4 = {
      approval: "DRAFT",
      id: "sp-printco-draft" as any,
      packSpecificationId: "pack-std-2day" as any,
      status: "DRAFT",
      supplierId: "supplier-printco" as any,
    };

    const result = generateSupplierReports(data, tempDir, {
      excludeDrafts: true,
    });

    const printcoReport = result.reports.find(
      (r) => r.supplierId === "supplier-printco",
    );
    expect(printcoReport).toBeDefined();
    // Should have 2 packs (APPROVED and SUBMITTED) but not the DRAFT
    expect(printcoReport!.packCount).toBe(2);

    // Read and verify HTML content doesn't contain draft approval status
    // eslint-disable-next-line security/detect-non-literal-fs-filename
    const html = fs.readFileSync(printcoReport!.filePath, "utf8");
    // Check that DRAFT approval status badge is not present
    expect(html).not.toContain("approval-status status-draft");
  });

  it("includes draft supplier packs when excludeDrafts option is false or not provided", () => {
    const data = createMockData();
    // Add a draft supplier pack to the data
    data.supplierPacks.sp4 = {
      approval: "DRAFT",
      id: "sp-printco-draft" as any,
      packSpecificationId: "pack-std-2day" as any,
      status: "DRAFT",
      supplierId: "supplier-printco" as any,
    };

    const result = generateSupplierReports(data, tempDir, {
      excludeDrafts: false,
    });

    const printcoReport = result.reports.find(
      (r) => r.supplierId === "supplier-printco",
    );
    expect(printcoReport).toBeDefined();
    // Should have 3 packs (APPROVED, SUBMITTED, and DRAFT)
    expect(printcoReport!.packCount).toBe(3);

    // Read and verify HTML content contains draft approval status
    // eslint-disable-next-line security/detect-non-literal-fs-filename
    const html = fs.readFileSync(printcoReport!.filePath, "utf8");
    // Check for DRAFT approval status badge
    expect(html).toContain("approval-status status-draft");
    expect(html).toContain(">DRAFT</span>");
  });

  it("includes pack specification description in report when present", () => {
    const data = createMockData();
    // Add description to pack1
    data.packs.pack1.description =
      "A standard economy-class letter for bulk mailings";

    const result = generateSupplierReports(data, tempDir);

    const printcoReport = result.reports.find(
      (r) => r.supplierId === "supplier-printco",
    );
    // eslint-disable-next-line security/detect-non-literal-fs-filename
    const html = fs.readFileSync(printcoReport!.filePath, "utf8");

    expect(html).toContain("A standard economy-class letter for bulk mailings");
    expect(html).toContain("Description");
  });

  it("includes description row even when not specified", () => {
    const data = createMockData();
    // Ensure pack2 has no description
    delete data.packs.pack2.description;

    const result = generateSupplierReports(data, tempDir);

    const printcoReport = result.reports.find(
      (r) => r.supplierId === "supplier-printco",
    );
    // eslint-disable-next-line security/detect-non-literal-fs-filename
    const html = fs.readFileSync(printcoReport!.filePath, "utf8");

    // Count occurrences of "Description" - should appear twice (once for each pack)
    const descriptionMatches = html.match(/<th>Description<\/th>/g);
    expect(descriptionMatches).toHaveLength(2);

    // Check that "Not specified" appears for description (pack2 has no description)
    expect(html).toContain(
      "<th>Description</th><td><em>Not specified</em></td>",
    );
  });

  it("includes duplex field when set to true in assembly", () => {
    const data = createMockData();
    // Add duplex to pack1 assembly
    if (data.packs.pack1.assembly) {
      data.packs.pack1.assembly.duplex = true;
    }

    const result = generateSupplierReports(data, tempDir);

    const printcoReport = result.reports.find(
      (r) => r.supplierId === "supplier-printco",
    );
    // eslint-disable-next-line security/detect-non-literal-fs-filename
    const html = fs.readFileSync(printcoReport!.filePath, "utf8");

    expect(html).toContain("Duplex");
    expect(html).toContain("<th>Duplex</th><td>Yes</td>");
  });

  it("includes duplex field when set to false in assembly", () => {
    const data = createMockData();
    // Add duplex to pack1 assembly
    if (data.packs.pack1.assembly) {
      data.packs.pack1.assembly.duplex = false;
    }

    const result = generateSupplierReports(data, tempDir);

    const printcoReport = result.reports.find(
      (r) => r.supplierId === "supplier-printco",
    );
    // eslint-disable-next-line security/detect-non-literal-fs-filename
    const html = fs.readFileSync(printcoReport!.filePath, "utf8");

    expect(html).toContain("Duplex");
    expect(html).toContain("<th>Duplex</th><td>No</td>");
  });

  it("shows duplex as not specified when not set", () => {
    const data = createMockData();
    // Ensure duplex is not set on pack2
    delete data.packs.pack2.assembly;

    const result = generateSupplierReports(data, tempDir);

    const printcoReport = result.reports.find(
      (r) => r.supplierId === "supplier-printco",
    );
    // eslint-disable-next-line security/detect-non-literal-fs-filename
    const html = fs.readFileSync(printcoReport!.filePath, "utf8");

    // Count occurrences of "Duplex" - should appear twice (once for each pack in assembly section)
    const duplexMatches = html.match(/<th>Duplex<\/th>/g);
    expect(duplexMatches).toHaveLength(2);

    // Check that "Not specified" appears for duplex
    expect(html).toContain("<th>Duplex</th><td><em>Not specified</em></td>");
  });

  describe("CSV variant mapping generation", () => {
    it("generates variant-mapping.csv file", () => {
      const data = createMockData();
      // Add variants to the mock data
      data.variants = {
        variant1: {
          id: "variant-standard" as any,
          name: "Standard Variant",
          type: "STANDARD" as any,
          status: "PROD",
          volumeGroupId: "vg-q1-2024" as any,
          packSpecificationIds: ["pack-std-2day" as any],
        },
      };

      const result = generateSupplierReports(data, tempDir);

      expect(result.csvFilePath).toBeDefined();
      expect(result.csvFilePath).toContain("variant-mapping.csv");
      // eslint-disable-next-line security/detect-non-literal-fs-filename
      expect(fs.existsSync(result.csvFilePath!)).toBe(true);
    });

    it("includes correct CSV headers", () => {
      const data = createMockData();
      data.variants = {
        variant1: {
          id: "variant-standard" as any,
          name: "Standard Variant",
          type: "STANDARD" as any,
          status: "PROD",
          volumeGroupId: "vg-q1-2024" as any,
          packSpecificationIds: ["pack-std-2day" as any],
        },
      };

      const result = generateSupplierReports(data, tempDir);
      // eslint-disable-next-line security/detect-non-literal-fs-filename
      const csvContent = fs.readFileSync(result.csvFilePath!, "utf8");
      const lines = csvContent.split("\n");

      expect(lines[0]).toBe(
        "variant_id,variant_name,variant_status,pack_specification_id,pack_specification_name,pack_specification_status,pack_specification_version,supplier_pack_id,supplier_pack_approval,supplier_pack_status,supplier_id,supplier_name",
      );
    });

    it("creates CSV rows for variant-pack-supplierpack-supplier mapping", () => {
      const data = createMockData();
      data.variants = {
        variant1: {
          id: "variant-standard" as any,
          name: "Standard Variant",
          type: "STANDARD" as any,
          status: "PROD",
          volumeGroupId: "vg-q1-2024" as any,
          packSpecificationIds: ["pack-std-2day" as any],
        },
      };

      const result = generateSupplierReports(data, tempDir);
      // eslint-disable-next-line security/detect-non-literal-fs-filename
      const csvContent = fs.readFileSync(result.csvFilePath!, "utf8");
      const lines = csvContent.split("\n").filter((l) => l.trim());

      // Should have header + 2 data rows (one for each supplier pack)
      expect(lines.length).toBe(3);
      expect(csvContent).toContain("variant-standard");
      expect(csvContent).toContain("Standard Variant");
      expect(csvContent).toContain("pack-std-2day");
      expect(csvContent).toContain("PrintCo Ltd");
      expect(csvContent).toContain("MailHouse Services");
    });

    it("only includes variants with INT or PROD status", () => {
      const data = createMockData();
      data.variants = {
        variant1: {
          id: "variant-prod" as any,
          name: "Production Variant",
          type: "STANDARD" as any,
          status: "PROD",
          volumeGroupId: "vg-q1-2024" as any,
          packSpecificationIds: ["pack-std-2day" as any],
        },
        variant2: {
          id: "variant-draft" as any,
          name: "Draft Variant",
          type: "STANDARD" as any,
          status: "DRAFT",
          volumeGroupId: "vg-q1-2024" as any,
          packSpecificationIds: ["pack-std-2day" as any],
        },
      };

      const result = generateSupplierReports(data, tempDir);
      // eslint-disable-next-line security/detect-non-literal-fs-filename
      const csvContent = fs.readFileSync(result.csvFilePath!, "utf8");

      expect(csvContent).toContain("variant-prod");
      expect(csvContent).not.toContain("variant-draft");
    });

    it("only includes pack specifications with INT or PROD status", () => {
      const data = createMockData();
      data.packs.pack3 = {
        createdAt: "2024-01-01T00:00:00Z",
        id: "pack-draft" as any,
        name: "Draft Pack",
        postage: {
          id: "postage-standard" as any,
          size: "STANDARD",
        },
        status: "DRAFT",
        updatedAt: "2024-01-01T00:00:00Z",
        version: 1,
      };
      data.supplierPacks.sp4 = {
        approval: "DRAFT",
        id: "sp-printco-pack3" as any,
        packSpecificationId: "pack-draft" as any,
        status: "DRAFT",
        supplierId: "supplier-printco" as any,
      };
      data.variants = {
        variant1: {
          id: "variant-mixed" as any,
          name: "Mixed Variant",
          type: "STANDARD" as any,
          status: "PROD",
          volumeGroupId: "vg-q1-2024" as any,
          packSpecificationIds: ["pack-std-2day" as any, "pack-draft" as any],
        },
      };

      const result = generateSupplierReports(data, tempDir);
      // eslint-disable-next-line security/detect-non-literal-fs-filename
      const csvContent = fs.readFileSync(result.csvFilePath!, "utf8");

      expect(csvContent).toContain("pack-std-2day");
      expect(csvContent).not.toContain("pack-draft");
    });

    it("only includes supplier packs with INT or PROD status", () => {
      const data = createMockData();
      data.supplierPacks.sp4 = {
        approval: "DRAFT",
        id: "sp-draft-pack1" as any,
        packSpecificationId: "pack-std-2day" as any,
        status: "DRAFT",
        supplierId: "supplier-printco" as any,
      };
      data.variants = {
        variant1: {
          id: "variant-standard" as any,
          name: "Standard Variant",
          type: "STANDARD" as any,
          status: "PROD",
          volumeGroupId: "vg-q1-2024" as any,
          packSpecificationIds: ["pack-std-2day" as any],
        },
      };

      const result = generateSupplierReports(data, tempDir);
      // eslint-disable-next-line security/detect-non-literal-fs-filename
      const csvContent = fs.readFileSync(result.csvFilePath!, "utf8");
      const lines = csvContent.split("\n").filter((l) => l.trim());

      // Should only have 2 supplier packs (sp1 and sp3), not sp4 which is DRAFT
      expect(lines.length).toBe(3); // header + 2 rows
      expect(csvContent).toContain("sp-printco-pack1");
      expect(csvContent).toContain("sp-mailhouse-pack1");
      expect(csvContent).not.toContain("sp-draft-pack1");
    });

    it("filters supplier packs by variant supplierId when specified", () => {
      const data = createMockData();
      data.variants = {
        variant1: {
          id: "variant-printco-only" as any,
          name: "PrintCo Only Variant",
          type: "STANDARD" as any,
          status: "PROD",
          volumeGroupId: "vg-q1-2024" as any,
          packSpecificationIds: ["pack-std-2day" as any],
          supplierId: "supplier-printco" as any,
        },
      };

      const result = generateSupplierReports(data, tempDir);
      // eslint-disable-next-line security/detect-non-literal-fs-filename
      const csvContent = fs.readFileSync(result.csvFilePath!, "utf8");
      const lines = csvContent.split("\n").filter((l) => l.trim());

      // Should only have 1 data row (for PrintCo), not MailHouse
      expect(lines.length).toBe(2); // header + 1 row
      expect(csvContent).toContain("PrintCo Ltd");
      expect(csvContent).not.toContain("MailHouse Services");
    });

    it("includes all suppliers when variant has no supplierId", () => {
      const data = createMockData();
      data.variants = {
        variant1: {
          id: "variant-any-supplier" as any,
          name: "Any Supplier Variant",
          type: "STANDARD" as any,
          status: "PROD",
          volumeGroupId: "vg-q1-2024" as any,
          packSpecificationIds: ["pack-std-2day" as any],
          // No supplierId specified
        },
      };

      const result = generateSupplierReports(data, tempDir);
      // eslint-disable-next-line security/detect-non-literal-fs-filename
      const csvContent = fs.readFileSync(result.csvFilePath!, "utf8");
      const lines = csvContent.split("\n").filter((l) => l.trim());

      // Should have 2 data rows (one for each supplier)
      expect(lines.length).toBe(3); // header + 2 rows
      expect(csvContent).toContain("PrintCo Ltd");
      expect(csvContent).toContain("MailHouse Services");
    });

    it("handles variants with multiple pack specifications", () => {
      const data = createMockData();
      data.variants = {
        variant1: {
          id: "variant-multi-pack" as any,
          name: "Multi Pack Variant",
          type: "STANDARD" as any,
          status: "PROD",
          volumeGroupId: "vg-q1-2024" as any,
          packSpecificationIds: ["pack-std-2day" as any, "pack-express" as any],
        },
      };

      const result = generateSupplierReports(data, tempDir);
      // eslint-disable-next-line security/detect-non-literal-fs-filename
      const csvContent = fs.readFileSync(result.csvFilePath!, "utf8");
      const lines = csvContent.split("\n").filter((l) => l.trim());

      // pack-std-2day has 2 supplier packs, pack-express has 1
      expect(lines.length).toBe(4); // header + 3 rows
      expect(csvContent).toContain("pack-std-2day");
      expect(csvContent).toContain("pack-express");
    });

    it("escapes CSV values with commas correctly", () => {
      const data = createMockData();
      data.packs.pack1.name = "Standard, 2-Day Delivery";
      data.variants = {
        variant1: {
          id: "variant-standard" as any,
          name: "Standard Variant",
          type: "STANDARD" as any,
          status: "PROD",
          volumeGroupId: "vg-q1-2024" as any,
          packSpecificationIds: ["pack-std-2day" as any],
        },
      };

      const result = generateSupplierReports(data, tempDir);
      // eslint-disable-next-line security/detect-non-literal-fs-filename
      const csvContent = fs.readFileSync(result.csvFilePath!, "utf8");

      // Value with comma should be wrapped in quotes
      expect(csvContent).toContain('"Standard, 2-Day Delivery"');
    });

    it("escapes CSV values with quotes correctly", () => {
      const data = createMockData();
      data.packs.pack1.name = 'Standard "Premium" Delivery';
      data.variants = {
        variant1: {
          id: "variant-standard" as any,
          name: "Standard Variant",
          type: "STANDARD" as any,
          status: "PROD",
          volumeGroupId: "vg-q1-2024" as any,
          packSpecificationIds: ["pack-std-2day" as any],
        },
      };

      const result = generateSupplierReports(data, tempDir);
      // eslint-disable-next-line security/detect-non-literal-fs-filename
      const csvContent = fs.readFileSync(result.csvFilePath!, "utf8");

      // Quotes should be escaped as double quotes
      expect(csvContent).toContain('Standard ""Premium"" Delivery');
    });

    it("generates empty CSV with only headers when no variants exist", () => {
      const data = createMockData();
      data.variants = {};

      const result = generateSupplierReports(data, tempDir);
      // eslint-disable-next-line security/detect-non-literal-fs-filename
      const csvContent = fs.readFileSync(result.csvFilePath!, "utf8");
      const lines = csvContent.split("\n").filter((l) => l.trim());

      // Should only have header row
      expect(lines.length).toBe(1);
    });

    it("includes version number in CSV output", () => {
      const data = createMockData();
      data.packs.pack1.version = 5;
      data.variants = {
        variant1: {
          id: "variant-standard" as any,
          name: "Standard Variant",
          type: "STANDARD" as any,
          status: "PROD",
          volumeGroupId: "vg-q1-2024" as any,
          packSpecificationIds: ["pack-std-2day" as any],
        },
      };

      const result = generateSupplierReports(data, tempDir);
      // eslint-disable-next-line security/detect-non-literal-fs-filename
      const csvContent = fs.readFileSync(result.csvFilePath!, "utf8");

      expect(csvContent).toContain(",5,");
    });
  });
});
