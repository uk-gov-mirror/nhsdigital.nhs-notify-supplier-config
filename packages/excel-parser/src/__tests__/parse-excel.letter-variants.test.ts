import {
  makePackRow,
  makeVariantRow,
  parseWorkbook,
} from "./helpers/parse-excel";

describe("parse-excel letter variants", () => {
  it("parses canonical enum values", () => {
    const result = parseWorkbook({
      packs: [
        makePackRow({
          id: "pack-1",
          "postage.id": "postage-standard",
          "postage.size": "STANDARD",
        }),
        makePackRow({
          id: "pack-2",
          name: "Pack 2",
          billingId: "billing-pack-2",
          "postage.id": "postage-large",
          "postage.size": "LARGE",
        }),
      ],
      variants: [
        makeVariantRow({
          id: "variant-1",
          volumeGroupId: "volume-group-1",
          packSpecificationIds: "pack-1,pack-2",
        }),
      ],
    });

    expect(result.packs.pack1.postage.id).toBe("postage-standard");
    expect(result.packs.pack1.postage.size).toBe("STANDARD");
    expect(result.packs.pack2.postage.id).toBe("postage-large");
    expect(result.packs.pack2.postage.size).toBe("LARGE");
    expect(result.variants.variant1.packSpecificationIds).toEqual([
      "pack-1",
      "pack-2",
    ]);
  });

  it("parses constraints on LetterVariant", () => {
    const result = parseWorkbook({
      packs: [makePackRow()],
      variants: [
        makeVariantRow({
          id: "variant-with-constraints",
          name: "Variant with Constraints",
          description: "Test variant",
          "constraints.sheets": "8",
          "constraints.deliveryDays": "3",
        }),
      ],
    });

    expect(result.variants.variantwithconstraints.constraints).toEqual({
      sheets: { value: 8, operator: "LESS_THAN" },
      deliveryDays: { value: 3, operator: "LESS_THAN" },
    });
  });

  it("throws if LetterVariant type is invalid", () => {
    expect(() =>
      parseWorkbook({
        packs: [makePackRow()],
        variants: [
          makeVariantRow({
            id: "variant-1",
            type: "INVALID_TYPE",
          }),
        ],
      }),
    ).toThrow(/Validation failed.*variant-1/);
  });

  it("parses LetterVariant with optional clientId and campaignIds", () => {
    const result = parseWorkbook({
      packs: [makePackRow()],
      variants: [
        makeVariantRow({
          id: "variant-with-ids",
          name: "Variant with IDs",
          description: "Test variant",
          clientId: "client-123",
          campaignIds: "campaign-1,campaign-2,campaign-3",
        }),
      ],
    });

    expect(result.variants.variantwithids.clientId).toBe("client-123");
    expect(result.variants.variantwithids.campaignIds).toEqual([
      "campaign-1",
      "campaign-2",
      "campaign-3",
    ]);
  });

  it("parses LetterVariant with optional supplierId", () => {
    const result = parseWorkbook({
      packs: [makePackRow()],
      variants: [
        makeVariantRow({
          id: "variant-with-supplier",
          name: "Variant with Supplier",
          description: "Test variant scoped to supplier",
          supplierId: "supplier-printco",
        }),
      ],
    });

    expect(result.variants.variantwithsupplier.supplierId).toBe(
      "supplier-printco",
    );
  });

  it("parses LetterVariant priority when provided", () => {
    const result = parseWorkbook({
      packs: [
        makePackRow({
          id: "pack-priority",
          name: "Pack Priority",
          billingId: "billing-pack-priority",
          "postage.id": "postage-priority",
        }),
      ],
      variants: [
        makeVariantRow({
          id: "variant-priority",
          name: "Variant Priority",
          volumeGroupId: "volume-group-priority",
          packSpecificationIds: "pack-priority",
          priority: 12,
        }),
      ],
      volumeGroups: [
        {
          id: "volume-group-priority",
          name: "VolumeGroup Priority",
          startDate: "2025-01-01",
          status: "PROD",
        },
      ],
    });

    expect(result.variants.variantpriority.priority).toBe(12);
  });

  it("uses the LetterVariant priority default when omitted", () => {
    const result = parseWorkbook({
      packs: [
        makePackRow({
          id: "pack-default-priority",
          name: "Pack Default Priority",
          billingId: "billing-pack-default-priority",
          "postage.id": "postage-default-priority",
        }),
      ],
      variants: [
        makeVariantRow({
          id: "variant-default-priority",
          name: "Variant Default Priority",
          volumeGroupId: "volume-group-default-priority",
          packSpecificationIds: "pack-default-priority",
        }),
      ],
      volumeGroups: [
        {
          id: "volume-group-default-priority",
          name: "VolumeGroup Default Priority",
          startDate: "2025-01-01",
          status: "PROD",
        },
      ],
    });

    expect(result.variants.variantdefaultpriority.priority).toBe(50);
  });

  it("uses the LetterVariant priority default when the Excel cell is blank", () => {
    const result = parseWorkbook({
      packs: [
        makePackRow({
          id: "pack-blank-priority",
          name: "Pack Blank Priority",
          billingId: "billing-pack-blank-priority",
          "postage.id": "postage-blank-priority",
        }),
      ],
      variants: [
        makeVariantRow({
          id: "variant-blank-priority",
          name: "Variant Blank Priority",
          volumeGroupId: "volume-group-blank-priority",
          packSpecificationIds: "pack-blank-priority",
          priority: "   ",
        }),
      ],
      volumeGroups: [
        {
          id: "volume-group-blank-priority",
          name: "VolumeGroup Blank Priority",
          startDate: "2025-01-01",
          status: "PROD",
        },
      ],
    });

    expect(result.variants.variantblankpriority.priority).toBe(50);
  });

  it("throws when LetterVariant priority is outside the allowed range", () => {
    expect(() =>
      parseWorkbook({
        packs: [
          makePackRow({
            id: "pack-invalid-priority",
            name: "Pack Invalid Priority",
            billingId: "billing-pack-invalid-priority",
            "postage.id": "postage-invalid-priority",
          }),
        ],
        variants: [
          makeVariantRow({
            id: "variant-invalid-priority",
            name: "Variant Invalid Priority",
            volumeGroupId: "volume-group-invalid-priority",
            packSpecificationIds: "pack-invalid-priority",
            priority: 100,
          }),
        ],
        volumeGroups: [
          {
            id: "volume-group-invalid-priority",
            name: "VolumeGroup Invalid Priority",
            startDate: "2025-01-01",
            status: "PROD",
          },
        ],
      }),
    ).toThrow(/Validation failed.*variant-invalid-priority/);
  });

  it("uses name as description when description is missing", () => {
    const result = parseWorkbook({
      packs: [makePackRow()],
      variants: [
        makeVariantRow({
          id: "variant-no-desc",
          name: "My Variant Name",
          description: undefined,
        }),
      ],
    });

    expect(result.variants.variantnodesc.description).toBe("My Variant Name");
  });

  it("throws on empty packSpecificationIds", () => {
    expect(() =>
      parseWorkbook({
        packs: [makePackRow()],
        variants: [
          makeVariantRow({
            id: "variant-no-packs",
            name: "Variant No Packs",
            description: "Test",
            packSpecificationIds: "",
          }),
        ],
      }),
    ).toThrow(/Validation failed.*variant-no-packs/);
  });

  it("leaves letter variant constraints undefined when none are provided", () => {
    const result = parseWorkbook({
      packs: [
        makePackRow({
          id: "pack-no-constraints",
          name: "Pack No Constraints",
          billingId: "billing-pack-no-constraints",
        }),
      ],
      variants: [
        makeVariantRow({
          id: "variant-no-constraints",
          name: "Variant No Constraints",
          volumeGroupId: "volume-group-nc",
          packSpecificationIds: "pack-no-constraints",
        }),
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

    expect(result.variants.variantnoconstraints.constraints).toBeUndefined();
  });

  it("trims spaces in campaignIds and packSpecificationIds", () => {
    const result = parseWorkbook({
      packs: [
        makePackRow({
          id: "pack-space-1",
          name: "Pack Space 1",
          billingId: "billing-pack-space-1",
          "postage.id": "postage-space-1",
        }),
        makePackRow({
          id: "pack-space-2",
          name: "Pack Space 2",
          billingId: "billing-pack-space-2",
          "postage.id": "postage-space-2",
        }),
      ],
      variants: [
        makeVariantRow({
          id: "variant-space",
          name: "Variant Space",
          volumeGroupId: "volume-group-space",
          packSpecificationIds: " pack-space-1 , pack-space-2 ",
          campaignIds: " campaign-1 ,  campaign-2 ",
        }),
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

    expect(result.variants.variantspace.packSpecificationIds).toEqual([
      "pack-space-1",
      "pack-space-2",
    ]);
    expect(result.variants.variantspace.campaignIds).toEqual([
      "campaign-1",
      "campaign-2",
    ]);
  });

  it("parses constraints.sides on LetterVariant", () => {
    const result = parseWorkbook({
      packs: [makePackRow()],
      variants: [
        makeVariantRow({
          id: "variant-with-sides",
          name: "Variant with Sides Constraint",
          "constraints.sheets": "8",
          "constraints.sides": "16",
          "constraints.deliveryDays": "3",
        }),
      ],
    });

    expect(result.variants.variantwithsides.constraints).toEqual({
      sheets: { value: 8, operator: "LESS_THAN" },
      sides: { value: 16, operator: "LESS_THAN" },
      deliveryDays: { value: 3, operator: "LESS_THAN" },
    });
  });
});
