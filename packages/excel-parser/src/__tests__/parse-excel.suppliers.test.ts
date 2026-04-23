import {
  makeAllocationRow,
  makePackRow,
  makeSupplierPackRow,
  makeSupplierRow,
  makeVolumeGroupRow,
  parseWorkbook,
} from "../test-helpers/parse-excel";

describe("parse-excel suppliers, allocations, and supplier packs", () => {
  it("parses Suppliers of all channel types", () => {
    const result = parseWorkbook({
      packs: [
        makePackRow({
          id: "pack-y",
          name: "Pack Y",
          createdAt: "2025-01-01",
          updatedAt: "2025-01-01",
          billingId: "billing-pack-y",
          "postage.id": "postage-y",
        }),
      ],
      variants: [],
      volumeGroups: [],
      suppliers: [
        makeSupplierRow({
          id: "supplier-app",
          name: "App Supplier",
          channelType: "NHSAPP",
        }),
        makeSupplierRow({
          id: "supplier-sms",
          name: "SMS Supplier",
          channelType: "SMS",
          dailyCapacity: "2000",
        }),
        makeSupplierRow({
          id: "supplier-email",
          name: "Email Supplier",
          channelType: "EMAIL",
          dailyCapacity: "3000",
        }),
        makeSupplierRow({
          id: "supplier-letter",
          name: "Letter Supplier",
          channelType: "LETTER",
          dailyCapacity: "4000",
        }),
      ],
      allocations: [],
      supplierPacks: [],
    });

    expect(result.suppliers.supplierapp.channelType).toBe("NHSAPP");
    expect(result.suppliers.suppliersms.channelType).toBe("SMS");
    expect(result.suppliers.supplieremail.channelType).toBe("EMAIL");
    expect(result.suppliers.supplierletter.channelType).toBe("LETTER");
  });

  it("throws on invalid Supplier channelType", () => {
    expect(() =>
      parseWorkbook({
        packs: [
          makePackRow({
            id: "pack-z",
            name: "Pack Z",
            createdAt: "2025-01-01",
            updatedAt: "2025-01-01",
            billingId: "billing-pack-z",
            "postage.id": "postage-z",
          }),
        ],
        variants: [],
        volumeGroups: [],
        suppliers: [
          makeSupplierRow({
            id: "supplier-bad",
            name: "Bad Supplier",
            channelType: "PIGEON",
          }),
        ],
        allocations: [],
        supplierPacks: [],
      }),
    ).toThrow(/Validation failed.*supplier-bad/);
  });

  it("parses SupplierAllocations including boundary percentages and sanitizes IDs", () => {
    const result = parseWorkbook({
      packs: [
        makePackRow({
          id: "pack-a",
          name: "Pack A",
          createdAt: "2025-01-01",
          updatedAt: "2025-01-01",
          billingId: "billing-pack-a",
          "postage.id": "postage-a",
        }),
      ],
      variants: [],
      volumeGroups: [
        makeVolumeGroupRow({
          id: "volume-group-a",
          name: "VolumeGroup A",
        }),
      ],
      suppliers: [
        makeSupplierRow({ id: "supplier-a", name: "Supplier A" }),
        makeSupplierRow({
          id: "supplier-b",
          name: "Supplier B",
          dailyCapacity: "2000",
        }),
        makeSupplierRow({
          id: "supplier-c",
          name: "Supplier C",
          dailyCapacity: "3000",
        }),
      ],
      allocations: [
        makeAllocationRow({
          id: "allocation-1%",
          volumeGroupId: "volume-group-a",
          supplier: "supplier-a",
          allocationPercentage: "0",
        }),
        makeAllocationRow({
          id: "allocation-2%",
          volumeGroupId: "volume-group-a",
          supplier: "supplier-b",
          allocationPercentage: "75",
        }),
        makeAllocationRow({
          id: "allocation-3%",
          volumeGroupId: "volume-group-a",
          supplier: "supplier-c",
          allocationPercentage: "100",
        }),
      ],
      supplierPacks: [],
    });

    expect(result.allocations.allocation1.volumeGroup).toBe("volume-group-a");
    expect(result.allocations.allocation2.allocationPercentage).toBe(75);
    expect(result.allocations.allocation3.allocationPercentage).toBe(100);
  });

  it("throws when allocationPercentage is out of bounds (<0 or >100)", () => {
    expect(() =>
      parseWorkbook({
        packs: [
          makePackRow({
            id: "pack-bounds",
            name: "Pack Bounds",
            createdAt: "2025-01-01",
            updatedAt: "2025-01-01",
            billingId: "billing-pack-bounds",
            "postage.id": "postage-bounds",
          }),
        ],
        variants: [],
        volumeGroups: [
          makeVolumeGroupRow({
            id: "volume-group-bounds",
            name: "VolumeGroup Bounds",
          }),
        ],
        suppliers: [
          makeSupplierRow({
            id: "supplier-bounds",
            name: "Supplier Bounds",
          }),
        ],
        allocations: [
          makeAllocationRow({
            id: "allocation-high",
            volumeGroupId: "volume-group-bounds",
            supplier: "supplier-bounds",
            allocationPercentage: "150",
          }),
        ],
        supplierPacks: [],
      }),
    ).toThrow(/Validation failed.*allocation-high/);

    expect(() =>
      parseWorkbook({
        packs: [
          makePackRow({
            id: "pack-bounds2",
            name: "Pack Bounds 2",
            createdAt: "2025-01-01",
            updatedAt: "2025-01-01",
            billingId: "billing-pack-bounds2",
            "postage.id": "postage-bounds2",
          }),
        ],
        variants: [],
        volumeGroups: [
          makeVolumeGroupRow({
            id: "volume-group-bounds2",
            name: "VolumeGroup Bounds 2",
          }),
        ],
        suppliers: [
          makeSupplierRow({
            id: "supplier-bounds2",
            name: "Supplier Bounds 2",
          }),
        ],
        allocations: [
          makeAllocationRow({
            id: "allocation-low",
            volumeGroupId: "volume-group-bounds2",
            supplier: "supplier-bounds2",
            allocationPercentage: "-5",
          }),
        ],
        supplierPacks: [],
      }),
    ).toThrow(/Validation failed.*allocation-low/);
  });

  it("parses SupplierPack rows for all statuses", () => {
    const result = parseWorkbook({
      packs: [
        makePackRow({
          id: "pack-sp",
          name: "Pack SP",
          createdAt: "2025-01-01",
          updatedAt: "2025-01-01",
          billingId: "billing-pack-sp",
          "postage.id": "postage-sp",
        }),
      ],
      variants: [],
      volumeGroups: [],
      suppliers: [
        makeSupplierRow({
          id: "supplier-sp",
          name: "Supplier SP",
        }),
      ],
      allocations: [],
      supplierPacks: [
        makeSupplierPackRow({
          id: "sp-submitted",
          packSpecificationId: "pack-sp",
          supplierId: "supplier-sp",
          approval: "SUBMITTED",
        }),
        makeSupplierPackRow({
          id: "sp-approved",
          packSpecificationId: "pack-sp",
          supplierId: "supplier-sp",
          approval: "APPROVED",
        }),
        makeSupplierPackRow({
          id: "sp-rejected",
          packSpecificationId: "pack-sp",
          supplierId: "supplier-sp",
          approval: "REJECTED",
        }),
        makeSupplierPackRow({
          id: "sp-disabled",
          packSpecificationId: "pack-sp",
          supplierId: "supplier-sp",
          approval: "DISABLED",
        }),
      ],
    });

    expect(result.supplierPacks.spsubmitted.approval).toBe("SUBMITTED");
    expect(result.supplierPacks.spapproved.approval).toBe("APPROVED");
    expect(result.supplierPacks.sprejected.approval).toBe("REJECTED");
    expect(result.supplierPacks.spdisabled.approval).toBe("DISABLED");
  });

  it("throws on invalid SupplierPack status", () => {
    expect(() =>
      parseWorkbook({
        packs: [
          makePackRow({
            id: "pack-sp-bad",
            name: "Pack SP Bad",
            createdAt: "2025-01-01",
            updatedAt: "2025-01-01",
            billingId: "billing-pack-sp-bad",
            "postage.id": "postage-sp-bad",
          }),
        ],
        variants: [],
        volumeGroups: [],
        suppliers: [
          makeSupplierRow({
            id: "supplier-sp-bad",
            name: "Supplier SP Bad",
          }),
        ],
        allocations: [],
        supplierPacks: [
          makeSupplierPackRow({
            id: "sp-invalid",
            packSpecificationId: "pack-sp-bad",
            supplierId: "supplier-sp-bad",
            approval: "UNKNOWNSTATUS",
          }),
        ],
      }),
    ).toThrow(/Validation failed.*sp-invalid/);
  });

  it("parses volume group and supplier IDs with special chars sanitizing keys", () => {
    const result = parseWorkbook({
      packs: [
        makePackRow({
          id: "pack-sanitize",
          name: "Pack Sanitize",
          createdAt: "2025-01-01",
          updatedAt: "2025-01-01",
          billingId: "billing-pack-sanitize",
          "postage.id": "postage-sanitize",
        }),
      ],
      variants: [],
      volumeGroups: [
        makeVolumeGroupRow({
          id: "volume-group#sanitize",
          name: "VolumeGroup Sanitize",
        }),
      ],
      suppliers: [
        makeSupplierRow({
          id: "supplier@sanitize",
          name: "Supplier Sanitize",
        }),
      ],
      allocations: [],
      supplierPacks: [],
    });

    expect(result.volumeGroups.volumegroupsanitize.name).toBe(
      "VolumeGroup Sanitize",
    );
    expect(result.suppliers.suppliersanitize.name).toBe("Supplier Sanitize");
  });

  it("defaults Supplier status to DRAFT when missing", () => {
    const result = parseWorkbook({
      packs: [makePackRow()],
      variants: [],
      suppliers: [
        makeSupplierRow({
          id: "supplier-no-status",
          name: "Supplier without Status",
          dailyCapacity: "5000",
          status: undefined,
        }),
      ],
    });

    expect(result.suppliers.suppliernostatus.status).toBe("DRAFT");
  });
});
