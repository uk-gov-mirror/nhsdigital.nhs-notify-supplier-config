import * as XLSX from "xlsx";
import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";

import { parseExcelFile } from "../parse-excel";
import { writeParseResultToConfigStore } from "../config-store-output";

function encodeRecordIdForFileName(id: string): string {
  return [...id]
    .map((character) =>
      /^[a-z0-9-]$/u.test(character)
        ? character
        : Buffer.from(character, "utf8")
            .toString("hex")
            .replaceAll(/(..)/gu, "%$1")
            .toUpperCase(),
    )
    .join("");
}

async function loadFileStoreHelpers() {
  const [{ default: loadConfigStore }, { validateConfigStore }] =
    await Promise.all([
      import(
        path.resolve(
          __dirname,
          "../../../file-store/src/loader/config-store-loader",
        )
      ),
      import(
        path.resolve(
          __dirname,
          "../../../file-store/src/validation/config-store-validator",
        )
      ),
    ]);

  return {
    loadConfigStore,
    validateConfigStore,
  };
}

function buildWorkbook(data: {
  packs: any[];
  variants: any[];
  volumeGroups?: any[];
  suppliers?: any[];
  allocations?: any[];
  supplierPacks?: any[];
}) {
  const workbook = XLSX.utils.book_new();

  XLSX.utils.book_append_sheet(
    workbook,
    XLSX.utils.json_to_sheet(data.packs),
    "PackSpecification",
  );
  XLSX.utils.book_append_sheet(
    workbook,
    XLSX.utils.json_to_sheet(data.variants),
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

function writeWorkbook(workbook: XLSX.WorkBook): string {
  const filePath = path.join(
    tmpdir(),
    `config-store-output-${Date.now()}.xlsx`,
  );
  XLSX.writeFile(workbook, filePath);
  return filePath;
}

describe("writeParseResultToConfigStore", () => {
  it("writes a file-store-compatible directory that validates successfully", async () => {
    const workbook = buildWorkbook({
      packs: [
        {
          id: "pack-spec-1",
          name: "Standard Letter Pack",
          description: "Basic pack specification for local testing",
          status: "DRAFT",
          version: "1",
          createdAt: "2026-01-01",
          updatedAt: "2026-01-01",
          billingId: "BILL-001",
          "postage.id": "postage-standard",
          "postage.size": "STANDARD",
          "postage.deliveryDays": "2",
        },
      ],
      variants: [
        {
          id: "lv-1",
          name: "Standard Letter Variant",
          volumeGroupId: "vg-1",
          packSpecificationIds: "pack-spec-1",
          supplierId: "sup-1",
          type: "STANDARD",
          status: "DRAFT",
        },
      ],
      volumeGroups: [
        {
          id: "vg-1",
          name: "Example Volume Group",
          description: "Simple example volume group for local testing",
          startDate: "2026-01-01",
          status: "DRAFT",
        },
      ],
      suppliers: [
        {
          id: "sup-1",
          name: "Example Supplier",
          channelType: "LETTER",
          dailyCapacity: "10000",
          status: "DRAFT",
        },
      ],
      allocations: [
        {
          id: "alloc-1",
          volumeGroupId: "vg-1",
          supplier: "sup-1",
          allocationPercentage: "100",
          status: "DRAFT",
        },
      ],
      supplierPacks: [
        {
          id: "sp-1",
          packSpecificationId: "pack-spec-1",
          supplierId: "sup-1",
          approval: "APPROVED",
          status: "DRAFT",
        },
      ],
    });
    const sourceFile = writeWorkbook(workbook);
    const outputDir = await mkdtemp(
      path.join(tmpdir(), "excel-parser-config-store-"),
    );

    try {
      const parsed = parseExcelFile(sourceFile);
      const { loadConfigStore, validateConfigStore } =
        await loadFileStoreHelpers();

      const writtenDir = await writeParseResultToConfigStore(
        parsed,
        outputDir,
        {
          pretty: true,
        },
      );
      const store = await loadConfigStore(writtenDir);
      const validation = validateConfigStore(store);
      const packFile = path.join(
        writtenDir,
        "pack-specification",
        "pack-spec-1.json",
      );
      const recordIds = (store.records as { entity: string; id: string }[])
        .map((record) => `${record.entity}:${record.id}`)
        .toSorted((left, right) => left.localeCompare(right));

      expect(writtenDir).toBe(path.resolve(outputDir));
      expect(store.records).toHaveLength(6);
      expect(recordIds).toEqual([
        "letter-variant:lv-1",
        "pack-specification:pack-spec-1",
        "supplier-allocation:alloc-1",
        "supplier-pack:sp-1",
        "supplier:sup-1",
        "volume-group:vg-1",
      ]);
      expect(validation).toEqual({ ok: true, issues: [] });
      await expect(readFile(packFile, "utf8")).resolves.toContain(
        '  "billingId": "BILL-001"',
      );
      await expect(readFile(packFile, "utf8")).resolves.toBe(`{
  "billingId": "BILL-001",
  "createdAt": "2026-01-01T00:00:00.000Z",
  "description": "Basic pack specification for local testing",
  "id": "pack-spec-1",
  "name": "Standard Letter Pack",
  "postage": {
    "deliveryDays": 2,
    "id": "postage-standard",
    "size": "STANDARD"
  },
  "status": "DRAFT",
  "updatedAt": "2026-01-01T00:00:00.000Z",
  "version": 1
}\n`);
    } finally {
      await rm(outputDir, { recursive: true, force: true });
    }
  });

  it("replaces managed entity directories while leaving unrelated files untouched", async () => {
    const outputDir = await mkdtemp(
      path.join(tmpdir(), "excel-parser-config-store-"),
    );

    try {
      await writeFile(path.join(outputDir, "notes.txt"), "keep me", "utf8");
      await mkdir(path.join(outputDir, "pack-specification"), {
        recursive: true,
      });
      await writeFile(
        path.join(outputDir, "pack-specification", "stale.json"),
        '{"id":"stale"}',
        "utf8",
      );

      const writtenDir = await writeParseResultToConfigStore(
        {
          packs: {},
          variants: {},
          volumeGroups: {},
          suppliers: {},
          allocations: {},
          supplierPacks: {},
        },
        outputDir,
      );
      const { loadConfigStore } = await loadFileStoreHelpers();

      await expect(
        readFile(path.join(writtenDir, "notes.txt"), "utf8"),
      ).resolves.toBe("keep me");
      await expect(
        readFile(
          path.join(writtenDir, "pack-specification", "stale.json"),
          "utf8",
        ),
      ).rejects.toThrow();

      const store = await loadConfigStore(writtenDir);
      expect(store.records).toHaveLength(0);
    } finally {
      await rm(outputDir, { recursive: true, force: true });
    }
  });

  it("encodes record ids into filename-safe paths and preserves the original id when loaded", async () => {
    const outputDir = await mkdtemp(
      path.join(tmpdir(), "excel-parser-config-store-"),
    );

    try {
      const writtenDir = await writeParseResultToConfigStore(
        {
          packs: {
            weird: {
              id: "pack/spec-1",
              name: "Bad Pack",
              status: "DRAFT",
              version: 1,
              createdAt: "2026-01-01T00:00:00.000Z",
              updatedAt: "2026-01-01T00:00:00.000Z",
              billingId: "BILL-001",
              postage: {
                id: "postage-1",
                size: "STANDARD",
              },
            },
          },
          variants: {},
          volumeGroups: {},
          suppliers: {},
          allocations: {},
          supplierPacks: {},
        },
        outputDir,
      );
      const { loadConfigStore, validateConfigStore } =
        await loadFileStoreHelpers();
      const store = await loadConfigStore(writtenDir);
      const validation = validateConfigStore(store);

      expect(store.records).toHaveLength(1);
      expect(store.records[0]).toMatchObject({
        entity: "pack-specification",
        id: "pack/spec-1",
      });
      expect(validation).toEqual({ ok: true, issues: [] });
      await expect(
        readFile(
          path.join(
            writtenDir,
            "pack-specification",
            `${encodeRecordIdForFileName("pack/spec-1")}.json`,
          ),
          "utf8",
        ),
      ).resolves.toContain('"id":"pack/spec-1"');
    } finally {
      await rm(outputDir, { recursive: true, force: true });
    }
  });

  it("keeps lowercase letters, digits, and hyphens readable in output filenames", async () => {
    const outputDir = await mkdtemp(
      path.join(tmpdir(), "excel-parser-config-store-"),
    );

    try {
      const writtenDir = await writeParseResultToConfigStore(
        {
          packs: {
            readable: {
              id: "pack-spec-1",
              name: "Readable Pack",
              status: "DRAFT",
              version: 1,
              createdAt: "2026-01-01T00:00:00.000Z",
              updatedAt: "2026-01-01T00:00:00.000Z",
              billingId: "BILL-001",
              postage: {
                id: "postage-1",
                size: "STANDARD",
              },
            },
          },
          variants: {},
          volumeGroups: {},
          suppliers: {},
          allocations: {},
          supplierPacks: {},
        },
        outputDir,
      );

      await expect(
        readFile(
          path.join(writtenDir, "pack-specification", "pack-spec-1.json"),
          "utf8",
        ),
      ).resolves.toContain('"id":"pack-spec-1"');
    } finally {
      await rm(outputDir, { recursive: true, force: true });
    }
  });

  it("encodes uppercase letters while leaving lowercase segments readable", async () => {
    const outputDir = await mkdtemp(
      path.join(tmpdir(), "excel-parser-config-store-"),
    );

    try {
      const writtenDir = await writeParseResultToConfigStore(
        {
          packs: {
            mixedCase: {
              id: "Pack-spec-1",
              name: "Mixed Case Pack",
              status: "DRAFT",
              version: 1,
              createdAt: "2026-01-01T00:00:00.000Z",
              updatedAt: "2026-01-01T00:00:00.000Z",
              billingId: "BILL-001",
              postage: {
                id: "postage-1",
                size: "STANDARD",
              },
            },
          },
          variants: {},
          volumeGroups: {},
          suppliers: {},
          allocations: {},
          supplierPacks: {},
        },
        outputDir,
      );

      await expect(
        readFile(
          path.join(writtenDir, "pack-specification", "%50ack-spec-1.json"),
          "utf8",
        ),
      ).resolves.toContain('"id":"Pack-spec-1"');
    } finally {
      await rm(outputDir, { recursive: true, force: true });
    }
  });

  it("throws when duplicate records would generate the same output filename", async () => {
    const outputDir = await mkdtemp(
      path.join(tmpdir(), "excel-parser-config-store-"),
    );

    try {
      await expect(
        writeParseResultToConfigStore(
          {
            packs: {
              one: {
                id: "pack-1",
                name: "Pack 1",
                status: "DRAFT",
                version: 1,
                createdAt: "2026-01-01T00:00:00.000Z",
                updatedAt: "2026-01-01T00:00:00.000Z",
                billingId: "BILL-001",
                postage: {
                  id: "postage-1",
                  size: "STANDARD",
                },
              },
              two: {
                id: "pack-1",
                name: "Pack 1 Duplicate",
                status: "DRAFT",
                version: 1,
                createdAt: "2026-01-01T00:00:00.000Z",
                updatedAt: "2026-01-01T00:00:00.000Z",
                billingId: "BILL-002",
                postage: {
                  id: "postage-2",
                  size: "STANDARD",
                },
              },
            },
            variants: {},
            volumeGroups: {},
            suppliers: {},
            allocations: {},
            supplierPacks: {},
          },
          outputDir,
        ),
      ).rejects.toThrow(
        "Duplicate config store filename generated for entity 'pack-specification': 'pack-1' and 'pack-1'",
      );
    } finally {
      await rm(outputDir, { recursive: true, force: true });
    }
  });

  it("throws when a record id is empty", async () => {
    const outputDir = await mkdtemp(
      path.join(tmpdir(), "excel-parser-config-store-"),
    );

    try {
      await expect(
        writeParseResultToConfigStore(
          {
            packs: {
              empty: {
                id: "",
                name: "Pack Empty",
                status: "DRAFT",
                version: 1,
                createdAt: "2026-01-01T00:00:00.000Z",
                updatedAt: "2026-01-01T00:00:00.000Z",
                billingId: "BILL-001",
                postage: {
                  id: "postage-1",
                  size: "STANDARD",
                },
              },
            },
            variants: {},
            volumeGroups: {},
            suppliers: {},
            allocations: {},
            supplierPacks: {},
          },
          outputDir,
        ),
      ).rejects.toThrow("Config store record ids must not be empty.");
    } finally {
      await rm(outputDir, { recursive: true, force: true });
    }
  });
});
