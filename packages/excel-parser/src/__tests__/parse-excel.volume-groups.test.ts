import {
  makePackRow,
  makeVariantRow,
  parseWorkbook,
} from "./helpers/parse-excel";

describe("parse-excel volume groups", () => {
  it("parses VolumeGroup with description and endDate", () => {
    const result = parseWorkbook({
      packs: [
        makePackRow({
          id: "pack-x",
          name: "Pack X",
          createdAt: "2025-01-01",
          updatedAt: "2025-01-02",
          billingId: "billing-pack-x",
          "postage.id": "postage-x",
        }),
      ],
      variants: [
        makeVariantRow({
          id: "variant-x",
          name: "Variant X",
          volumeGroupId: "volume-group-x",
          packSpecificationIds: "pack-x",
        }),
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

    expect(result.volumeGroups.volumegroupx.description).toBe("My VolumeGroup");
    expect(result.volumeGroups.volumegroupx.endDate).toBe("2025-12-31");
    expect(result.volumeGroups.volumegroupx.startDate).toBe("2025-01-01");
    expect(result.volumeGroups.volumegroupx.status).toBe("PROD");
  });

  it("throws validation error for VolumeGroup with missing name", () => {
    expect(() =>
      parseWorkbook({
        packs: [
          makePackRow({
            id: "pack-volume-group-bad",
            name: "Pack VolumeGroup Bad",
            createdAt: "2025-01-01",
            updatedAt: "2025-01-01",
            billingId: "billing-pack-volume-group-bad",
            "postage.id": "postage-volume-group-bad",
          }),
        ],
        variants: [
          makeVariantRow({
            id: "variant-volume-group-bad",
            name: "Variant VolumeGroup Bad",
            volumeGroupId: "volume-group-bad",
            packSpecificationIds: "pack-volume-group-bad",
          }),
        ],
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
      }),
    ).toThrow(/Validation failed.*volume-group-bad/);
  });

  it("defaults volume group startDate when missing or invalid", () => {
    const result = parseWorkbook({
      packs: [
        makePackRow({
          id: "pack-default-date",
          name: "Pack Default Date",
          createdAt: "2025-01-01",
          updatedAt: "2025-01-01",
          billingId: "billing-pack-default-date",
          "postage.id": "postage-default-date",
        }),
      ],
      variants: [
        makeVariantRow({
          id: "variant-default-date",
          name: "Variant Default Date",
          volumeGroupId: "volume-group-missing-date",
          packSpecificationIds: "pack-default-date",
        }),
        makeVariantRow({
          id: "variant-invalid-date",
          name: "Variant Invalid Date",
          volumeGroupId: "volume-group-invalid-date",
          packSpecificationIds: "pack-default-date",
        }),
      ],
      volumeGroups: [
        {
          id: "volume-group-missing-date",
          name: "VolumeGroup Missing Date",
          status: "PROD",
        },
        {
          id: "volume-group-invalid-date",
          name: "VolumeGroup Invalid Date",
          startDate: "not-a-valid-date",
          status: "PROD",
        },
      ],
    });

    expect(result.volumeGroups.volumegroupmissingdate.startDate).toBe(
      "2023-01-01",
    );
    expect(result.volumeGroups.volumegroupinvaliddate.startDate).toBe(
      "2023-01-01",
    );
  });

  it("parses Excel serial date numbers for date-only fields", () => {
    const result = parseWorkbook({
      packs: [makePackRow()],
      variants: [],
      volumeGroups: [
        {
          id: "volume-group-excel-dates",
          name: "VolumeGroup with Excel Dates",
          startDate: 44_927,
          endDate: 45_292,
          status: "PROD",
        },
      ],
    });

    expect(result.volumeGroups.volumegroupexceldates.startDate).toBe(
      "2023-01-01",
    );
    expect(result.volumeGroups.volumegroupexceldates.endDate).toBe(
      "2024-01-01",
    );
  });

  it("defaults VolumeGroup status to DRAFT when missing", () => {
    const result = parseWorkbook({
      packs: [makePackRow()],
      variants: [],
      volumeGroups: [
        {
          id: "volume-group-no-status",
          name: "VolumeGroup without Status",
          startDate: "2024-01-01",
        },
      ],
    });

    expect(result.volumeGroups.volumegroupnostatus.status).toBe("DRAFT");
  });
});
