import { z } from "zod";
import type { DomainEntityName } from "@supplier-config/file-store";

import {
  normalizeIssuePath,
  validateConfigStore,
} from "@supplier-config/file-store";

jest.mock("@nhsdigital/nhs-notify-event-schemas-supplier-config", () => {
  return {
    $VolumeGroup: z.object({
      id: z.string(),
      name: z.string(),
    }),
    $LetterVariant: z.object({
      id: z.string(),
      priority: z.number().int().min(1).max(99).default(50),
      packSpecificationIds: z.array(z.string()).min(1),
    }),
    $PackSpecification: z.object({
      id: z.string(),
      version: z.number().int(),
      postage: z.object({
        id: z.string(),
      }),
    }),
    $Supplier: z.object({
      id: z.string(),
      dailyCapacity: z.number().int(),
    }),
    $SupplierAllocation: z.object({
      id: z.string(),
      allocationPercentage: z.number().min(0).max(100),
    }),
    $SupplierPack: z.object({
      id: z.string(),
      approval: z.enum(["APPROVED", "DRAFT"]),
    }),
  };
});

const mockRootPath = "/config-store";

function makeRecord(entity: DomainEntityName, id: string, data: unknown) {
  return {
    entity,
    sourceFilePath: `${mockRootPath}/${entity}/${id}.json`,
    id,
    data,
  };
}

describe("normalizeIssuePath", () => {
  it("should keep string and number parts and drop others", () => {
    expect(normalizeIssuePath(["a", 0, Symbol("x")])).toEqual(["a", 0]);
  });
});

describe("validateConfigStore", () => {
  it("should return ok=true with no issues for a larger mixed valid dataset", () => {
    const validRecords = [
      makeRecord("volume-group", "vg-1", {
        id: "vg-1",
        name: "VG 1",
      }),
      makeRecord("letter-variant", "lv-1", {
        id: "lv-1",
        packSpecificationIds: ["pack-spec-1"],
      }),
      makeRecord("pack-specification", "pack-spec-1", {
        id: "pack-spec-1",
        version: 1,
        postage: { id: "postage-1" },
      }),
      makeRecord("supplier", "sup-1", {
        id: "sup-1",
        dailyCapacity: 100,
      }),
      makeRecord("supplier-allocation", "alloc-1", {
        id: "alloc-1",
        allocationPercentage: 100,
      }),
      makeRecord("supplier-pack", "sp-1", {
        id: "sp-1",
        approval: "APPROVED",
      }),
    ];

    const result = validateConfigStore({
      rootPath: mockRootPath,
      records: Array.from({ length: 4 }, (_, i) =>
        validRecords.map((record) => ({
          ...record,
          id: `${record.id}-${i}`,
          sourceFilePath: record.sourceFilePath.replace(".json", `-${i}.json`),
          data:
            typeof record.data === "string"
              ? record.data
              : {
                  ...(record.data as Record<string, unknown>),
                  id: `${record.id}-${i}`,
                },
        })),
      ).flat(),
    });

    expect(result.ok).toBe(true);
    expect(result.issues).toHaveLength(0);
  });

  it("should return ok=false when schema validation fails", () => {
    const result = validateConfigStore({
      rootPath: mockRootPath,
      records: [makeRecord("supplier", "sup-1", { notAValidSupplier: true })],
    });

    expect(result.ok).toBe(false);
    expect(result.issues.length).toBeGreaterThan(0);
  });

  it("should preserve entity and source path across multiple invalid records", () => {
    const result = validateConfigStore({
      rootPath: mockRootPath,
      records: [
        makeRecord("supplier", "sup-1", {
          id: "sup-1",
          dailyCapacity: "not-a-number",
        }),
        makeRecord("pack-specification", "pack-spec-1", {
          id: "pack-spec-1",
          version: "bad-version",
          postage: {},
        }),
      ],
    });

    expect(result.ok).toBe(false);
    expect(result.issues).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          entity: "supplier",
          sourceFilePath: `${mockRootPath}/supplier/sup-1.json`,
        }),
        expect.objectContaining({
          entity: "pack-specification",
          sourceFilePath: `${mockRootPath}/pack-specification/pack-spec-1.json`,
        }),
      ]),
    );
  });

  it("should include nested array index paths from schema issues", () => {
    const result = validateConfigStore({
      rootPath: mockRootPath,
      records: [
        makeRecord("letter-variant", "lv-1", {
          id: "lv-1",
          priority: 10,
          packSpecificationIds: [123],
        }),
      ],
    });

    expect(result.ok).toBe(false);
    expect(result.issues[0]?.path).toEqual(["packSpecificationIds", 0]);
  });

  it("should reject letter variant priority values outside the allowed range", () => {
    const result = validateConfigStore({
      rootPath: mockRootPath,
      records: [
        makeRecord("letter-variant", "lv-1", {
          id: "lv-1",
          priority: 100,
          packSpecificationIds: ["pack-spec-1"],
        }),
      ],
    });

    expect(result.ok).toBe(false);
    expect(result.issues).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          entity: "letter-variant",
          path: ["priority"],
        }),
      ]),
    );
  });

  it("should return ok=true with no issues when all records are valid", () => {
    const result = validateConfigStore({
      rootPath: mockRootPath,
      records: [
        makeRecord("supplier", "sup-1", {
          id: "sup-1",
          dailyCapacity: 100,
        }),
      ],
    });

    expect(result.ok).toBe(true);
    expect(result.issues).toHaveLength(0);
  });

  it("should report an issue when the filename id does not match the parsed object id", () => {
    const result = validateConfigStore({
      rootPath: mockRootPath,
      records: [
        makeRecord("supplier", "sup-1", {
          id: "different-id",
          dailyCapacity: 100,
        }),
      ],
    });

    expect(result.ok).toBe(false);
    expect(result.issues).toContainEqual({
      entity: "supplier",
      sourceFilePath: `${mockRootPath}/supplier/sup-1.json`,
      message: "Record id 'different-id' does not match filename id 'sup-1'.",
      path: ["id"],
    });
  });
});
