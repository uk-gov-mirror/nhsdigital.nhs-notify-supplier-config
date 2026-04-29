import type { ConfigRecord } from "@supplier-config/file-store";

import { mapToEvents } from "../record-mapper";

function makeRecord(
  entity: ConfigRecord["entity"],
  id: string,
  data: unknown,
): ConfigRecord {
  return {
    entity,
    sourceFilePath: `/tmp/${entity}/${id}.json`,
    id,
    data,
  };
}

describe("mapToEvents", () => {
  it("should return an empty array when given no records", () => {
    expect(mapToEvents([])).toEqual([]);
  });

  it("should produce a supplier event for each supplier record", () => {
    const records = [
      makeRecord("supplier", "sup-1", {
        id: "sup-1",
        name: "Supplier One",
        channelType: "LETTER",
        dailyCapacity: 5000,
        status: "PROD",
      }),
      makeRecord("supplier", "sup-2", {
        id: "sup-2",
        name: "Supplier Two",
        channelType: "LETTER",
        dailyCapacity: 1000,
        status: "PROD",
      }),
    ];

    const result = mapToEvents(records);

    expect(result).toHaveLength(2);
    expect(result[0]).toMatchObject({
      subject: "supplier/sup-1",
      type: "uk.nhs.notify.supplier-config.supplier",
    });
    expect(result[1]).toMatchObject({
      subject: "supplier/sup-2",
      type: "uk.nhs.notify.supplier-config.supplier",
    });
  });

  it("should produce events for non-draft volume groups and skip draft ones", () => {
    const records = [
      makeRecord("volume-group", "vg-prod", {
        id: "vg-prod",
        name: "Prod Group",
        startDate: "2026-01-01",
        status: "PROD",
      }),
      makeRecord("volume-group", "vg-draft", {
        id: "vg-draft",
        name: "Draft Group",
        startDate: "2026-06-01",
        status: "DRAFT",
      }),
    ];

    const result = mapToEvents(records);

    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({ subject: "volume-group/vg-prod" });
  });

  it("should produce events from separate builders for each distinct entity type and flatten results", () => {
    const records = [
      makeRecord("supplier", "sup-1", {
        id: "sup-1",
        name: "Supplier",
        channelType: "LETTER",
        dailyCapacity: 100,
        status: "PROD",
      }),
      makeRecord("volume-group", "vg-1", {
        id: "vg-1",
        name: "VG",
        startDate: "2026-01-01",
        status: "PROD",
      }),
    ];

    const result = mapToEvents(records);

    expect(result).toHaveLength(2);
    expect(result.some((e) => e?.subject === "supplier/sup-1")).toBe(true);
    expect(result.some((e) => e?.subject === "volume-group/vg-1")).toBe(true);
  });

  it("should group records by entity before passing to the builder, producing sequential events", () => {
    const records = [
      makeRecord("supplier", "sup-1", {
        id: "sup-1",
        name: "Supplier One",
        channelType: "LETTER",
        dailyCapacity: 100,
        status: "PROD",
      }),
      makeRecord("supplier", "sup-2", {
        id: "sup-2",
        name: "Supplier Two",
        channelType: "LETTER",
        dailyCapacity: 200,
        status: "PROD",
      }),
    ];

    const result = mapToEvents(records);

    // Both suppliers processed in a single builder call → sequential sequence numbers
    expect(result).toHaveLength(2);
    const seq1 = Number(result[0]?.sequence);
    const seq2 = Number(result[1]?.sequence);
    expect(seq2).toBe(seq1 + 1);
  });

  it("should handle all six entity types", () => {
    const records = [
      makeRecord("volume-group", "vg-1", {
        id: "vg-1",
        name: "VG",
        startDate: "2026-01-01",
        status: "PROD",
      }),
      makeRecord("letter-variant", "lv-1", {
        id: "lv-1",
        name: "LV",
        packSpecificationIds: ["ps-1"],
        status: "PROD",
        supplierId: "sup-1",
        type: "STANDARD",
        volumeGroupId: "vg-1",
      }),
      makeRecord("pack-specification", "ps-1", {
        id: "ps-1",
        name: "Pack",
        billingId: "BILL-001",
        createdAt: "2026-01-01T00:00:00.000Z",
        updatedAt: "2026-01-01T00:00:00.000Z",
        version: 1,
        postage: { id: "postage-standard", size: "STANDARD" },
        status: "PROD",
      }),
      makeRecord("supplier", "sup-1", {
        id: "sup-1",
        name: "Supplier",
        channelType: "LETTER",
        dailyCapacity: 100,
        status: "PROD",
      }),
      makeRecord("supplier-allocation", "alloc-1", {
        id: "alloc-1",
        allocationPercentage: 100,
        supplier: "sup-1",
        volumeGroup: "vg-1",
        status: "PROD",
      }),
      makeRecord("supplier-pack", "sp-1", {
        id: "sp-1",
        approval: "APPROVED",
        packSpecificationId: "ps-1",
        supplierId: "sup-1",
        status: "PROD",
      }),
    ];

    const result = mapToEvents(records);

    expect(result).toHaveLength(6);
    const subjects = result.map((e) => e?.subject);
    expect(subjects).toContain("volume-group/vg-1");
    expect(subjects).toContain("letter-variant/lv-1");
    expect(subjects).toContain("pack-specification/ps-1");
    expect(subjects).toContain("supplier/sup-1");
    expect(subjects).toContain("supplier-allocation/alloc-1");
    expect(subjects).toContain("supplier-pack/sp-1");
  });
});
