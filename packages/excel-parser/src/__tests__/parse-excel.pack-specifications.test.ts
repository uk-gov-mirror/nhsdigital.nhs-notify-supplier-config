import {
  makePackRow,
  makeVariantRow,
  parseWorkbook,
} from "../test-helpers/parse-excel";

describe("parse-excel pack specifications", () => {
  it("throws on invalid postage size", () => {
    expect(() =>
      parseWorkbook({
        packs: [
          makePackRow({
            id: "pack-bad-size",
            name: "Bad Size Pack",
            billingId: "billing-pack-bad-size",
            "postage.id": "postage-bad",
            "postage.size": "C5",
          }),
        ],
        variants: [],
      }),
    ).toThrow(/Validation failed.*pack-bad-size/);
  });

  it("throws on missing required postage fields", () => {
    expect(() =>
      parseWorkbook({
        packs: [
          {
            id: "pack-missing",
            name: "Missing Pack",
            status: "PROD",
            version: "1",
            createdAt: "2024-01-01",
            updatedAt: "2024-01-01",
            billingId: "billing-pack-missing",
          },
        ],
        variants: [],
      }),
    ).toThrow(/Missing required postage fields/);
  });

  it("parses constraints on PackSpecification", () => {
    const result = parseWorkbook({
      packs: [
        makePackRow({
          id: "pack-with-constraints",
          name: "Pack with Constraints",
          billingId: "billing-pack-with-constraints",
          "constraints.sheets": "10",
          "constraints.deliveryDays": "5",
          "constraints.blackCoveragePercentage": "80.5",
          "constraints.colourCoveragePercentage": "50.25",
        }),
      ],
      variants: [],
    });

    expect(result.packs.packwithconstraints.constraints).toEqual({
      sheets: { value: 10, operator: "LESS_THAN" },
      deliveryDays: { value: 5, operator: "LESS_THAN" },
      blackCoveragePercentage: { value: 80.5, operator: "LESS_THAN" },
      colourCoveragePercentage: { value: 50.25, operator: "LESS_THAN" },
    });
  });

  it("parses PackSpecification with optional description", () => {
    const result = parseWorkbook({
      packs: [
        makePackRow({
          id: "pack-with-description",
          name: "Pack with Description",
          description: "A standard economy-class letter for bulk mailings",
          billingId: "billing-pack-with-description",
        }),
      ],
      variants: [],
    });

    expect(result.packs.packwithdescription.description).toBe(
      "A standard economy-class letter for bulk mailings",
    );
  });

  it("parses PackSpecification without description", () => {
    const result = parseWorkbook({
      packs: [
        makePackRow({
          id: "pack-without-description",
          name: "Pack without Description",
          billingId: "billing-pack-without-description",
        }),
      ],
      variants: [],
    });

    expect(result.packs.packwithoutdescription.description).toBeUndefined();
  });

  it("parses assembly with paper, insertIds, and features", () => {
    const result = parseWorkbook({
      packs: [
        makePackRow({
          id: "pack-with-assembly",
          name: "Pack with Assembly",
          billingId: "billing-pack-with-assembly",
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
        }),
      ],
      variants: [],
    });

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
    const result = parseWorkbook({
      packs: [
        makePackRow({
          id: "pack-with-duplex-true",
          name: "Pack with Duplex True",
          billingId: "billing-pack-with-duplex-true",
          "assembly.envelopeId": "envelope-1",
          "assembly.duplex": "true",
        }),
      ],
      variants: [],
    });

    expect(result.packs.packwithduplextrue.assembly?.duplex).toBe(true);
  });

  it("parses assembly with duplex set to false", () => {
    const result = parseWorkbook({
      packs: [
        makePackRow({
          id: "pack-with-duplex-false",
          name: "Pack with Duplex False",
          billingId: "billing-pack-with-duplex-false",
          "assembly.envelopeId": "envelope-1",
          "assembly.duplex": "false",
        }),
      ],
      variants: [],
    });

    expect(result.packs.packwithduplexfalse.assembly?.duplex).toBe(false);
  });

  it("parses assembly without duplex field", () => {
    const result = parseWorkbook({
      packs: [
        makePackRow({
          id: "pack-without-duplex",
          name: "Pack without Duplex",
          billingId: "billing-pack-without-duplex",
          "assembly.envelopeId": "envelope-1",
        }),
      ],
      variants: [],
    });

    expect(result.packs.packwithoutduplex.assembly?.duplex).toBeUndefined();
  });

  it("parses required billingId field", () => {
    const result = parseWorkbook({
      packs: [
        makePackRow({ id: "pack-with-billing", billingId: "billing-123" }),
      ],
      variants: [],
    });

    expect(result.packs.packwithbilling.billingId).toBe("billing-123");
  });

  it("throws when billingId is missing", () => {
    expect(() =>
      parseWorkbook({
        packs: [
          makePackRow({
            id: "pack-missing-billing",
            name: "Pack Missing Billing",
            billingId: undefined,
          }),
        ],
        variants: [],
      }),
    ).toThrow(/Missing required billingId.*pack-missing-billing/);
  });

  it("parses optional postage fields", () => {
    const result = parseWorkbook({
      packs: [
        makePackRow({
          id: "pack-full-postage",
          name: "Pack with Full Postage",
          billingId: "billing-pack-full-postage",
          "postage.size": "LARGE",
          "postage.deliveryDays": "2",
          "postage.maxWeightGrams": "100.5",
          "postage.maxThicknessMm": "5.2",
        }),
      ],
      variants: [],
    });

    const { postage } = result.packs.packfullpostage;
    expect(postage.deliveryDays).toBe(2);
    expect(postage.maxWeightGrams).toBe(100.5);
    expect(postage.maxThicknessMm).toBe(5.2);
  });

  it("handles missing createdAt and updatedAt with default dates", () => {
    const result = parseWorkbook({
      packs: [
        makePackRow({
          id: "pack-no-dates",
          name: "Pack No Dates",
          createdAt: undefined,
          updatedAt: undefined,
          billingId: "billing-pack-no-dates",
        }),
      ],
      variants: [],
    });

    expect(result.packs.packnodates.createdAt).toBe("2023-01-01T00:00:00Z");
    expect(result.packs.packnodates.updatedAt).toBe("2023-01-01T00:00:00Z");
  });

  it("handles invalid date strings with default date", () => {
    const result = parseWorkbook({
      packs: [
        makePackRow({
          id: "pack-invalid-dates",
          name: "Pack Invalid Dates",
          createdAt: "not-a-date",
          updatedAt: "also-not-a-date",
          billingId: "billing-pack-invalid-dates",
        }),
      ],
      variants: [],
    });

    expect(result.packs.packinvaliddates.createdAt).toBe(
      "2023-01-01T00:00:00Z",
    );
    expect(result.packs.packinvaliddates.updatedAt).toBe(
      "2023-01-01T00:00:00Z",
    );
  });

  it("handles empty string arrays as undefined", () => {
    const result = parseWorkbook({
      packs: [
        makePackRow({
          id: "pack-empty-arrays",
          name: "Pack Empty Arrays",
          billingId: "billing-pack-empty-arrays",
          "assembly.insertIds": "",
          "assembly.features": "  ",
        }),
      ],
      variants: [],
    });

    expect(result.packs.packemptyarrays.assembly?.insertIds).toBeUndefined();
    expect(result.packs.packemptyarrays.assembly?.features).toBeUndefined();
  });

  it("parses assembly.additional as JSON", () => {
    const result = parseWorkbook({
      packs: [
        makePackRow({
          id: "pack-with-additional",
          name: "Pack with Additional",
          billingId: "billing-pack-with-additional",
          "assembly.additional": '{"key1":"value1","key2":"value2"}',
        }),
      ],
      variants: [],
    });

    expect(result.packs.packwithadditional.assembly?.additional).toEqual({
      key1: "value1",
      key2: "value2",
    });
  });

  it("ignores invalid JSON in assembly.additional", () => {
    const result = parseWorkbook({
      packs: [
        makePackRow({
          id: "pack-bad-json",
          name: "Pack Bad JSON",
          billingId: "billing-pack-bad-json",
          "assembly.additional": "not-valid-json{",
        }),
      ],
      variants: [],
    });

    expect(result.packs.packbadjson.assembly?.additional).toBeUndefined();
  });

  it("parses paper.recycled as boolean", () => {
    const result = parseWorkbook({
      packs: [
        makePackRow({
          id: "pack-recycled-true",
          name: "Pack Recycled True",
          billingId: "billing-pack-recycled-true",
          "assembly.paper.id": "paper-1",
          "assembly.paper.name": "Recycled Paper",
          "assembly.paper.size": "A4",
          "assembly.paper.colour": "WHITE",
          "assembly.paper.recycled": "TRUE",
        }),
        makePackRow({
          id: "pack-recycled-false",
          name: "Pack Recycled False",
          billingId: "billing-pack-recycled-false",
          "postage.id": "postage-2",
          "postage.size": "LARGE",
          "assembly.paper.id": "paper-2",
          "assembly.paper.name": "Non-Recycled Paper",
          "assembly.paper.size": "A3",
          "assembly.paper.colour": "WHITE",
          "assembly.paper.recycled": "false",
        }),
      ],
      variants: [],
    });

    expect(result.packs.packrecycledtrue.assembly?.paper?.recycled).toBe(true);
    expect(result.packs.packrecycledfalse.assembly?.paper?.recycled).toBe(
      false,
    );
  });

  it("uses default weightGSM when not provided", () => {
    const result = parseWorkbook({
      packs: [
        makePackRow({
          id: "pack-default-gsm",
          name: "Pack Default GSM",
          billingId: "billing-pack-default-gsm",
          "assembly.paper.id": "paper-1",
          "assembly.paper.size": "A4",
          "assembly.paper.colour": "WHITE",
          "assembly.paper.recycled": "false",
        }),
      ],
      variants: [],
    });

    expect(result.packs.packdefaultgsm.assembly?.paper?.weightGSM).toBe(80);
  });

  it("sanitizes IDs by removing non-alphanumeric characters", () => {
    const result = parseWorkbook({
      packs: [
        makePackRow({
          id: "pack-with-dashes-123",
          name: "Pack with Dashes",
          billingId: "billing-pack-with-dashes-123",
        }),
      ],
      variants: [
        makeVariantRow({
          id: "variant_with_underscores_456",
          name: "Variant with Underscores",
          packSpecificationIds: "pack-with-dashes-123",
        }),
      ],
    });

    expect(result.packs.packwithdashes123).toBeDefined();
    expect(result.variants.variantwithunderscores456).toBeDefined();
  });

  it("handles partial constraints using only sheets", () => {
    const result = parseWorkbook({
      packs: [
        makePackRow({
          id: "pack-partial-1",
          name: "Pack Partial 1",
          billingId: "billing-pack-partial-1",
          "constraints.sheets": "15",
        }),
      ],
      variants: [],
    });

    expect(result.packs.packpartial1.constraints).toEqual({
      sheets: { value: 15, operator: "LESS_THAN" },
    });
  });

  it("handles partial constraints using only deliveryDays", () => {
    const result = parseWorkbook({
      packs: [
        makePackRow({
          id: "pack-partial-2",
          name: "Pack Partial 2",
          billingId: "billing-pack-partial-2",
          "constraints.deliveryDays": "7",
        }),
      ],
      variants: [],
    });

    expect(result.packs.packpartial2.constraints).toEqual({
      deliveryDays: { value: 7, operator: "LESS_THAN" },
    });
  });

  it("handles partial constraints using only coverage percentages", () => {
    const result = parseWorkbook({
      packs: [
        makePackRow({
          id: "pack-partial-3",
          name: "Pack Partial 3",
          billingId: "billing-pack-partial-3",
          "constraints.blackCoveragePercentage": "90.5",
          "constraints.colourCoveragePercentage": "60.25",
        }),
      ],
      variants: [],
    });

    expect(result.packs.packpartial3.constraints).toEqual({
      blackCoveragePercentage: { value: 90.5, operator: "LESS_THAN" },
      colourCoveragePercentage: { value: 60.25, operator: "LESS_THAN" },
    });
  });

  it("parses assembly with only envelopeId", () => {
    const result = parseWorkbook({
      packs: [
        makePackRow({
          id: "pack-envelope-only",
          name: "Pack Envelope Only",
          billingId: "billing-pack-envelope-only",
          "assembly.envelopeId": "envelope-123",
        }),
      ],
      variants: [],
    });

    expect(result.packs.packenvelopeonly.assembly).toEqual({
      envelopeId: "envelope-123",
    });
  });

  it("parses assembly with only printColour", () => {
    const result = parseWorkbook({
      packs: [
        makePackRow({
          id: "pack-print-only",
          name: "Pack Print Only",
          billingId: "billing-pack-print-only",
          "assembly.printColour": "BLACK",
        }),
      ],
      variants: [],
    });

    expect(result.packs.packprintonly.assembly).toEqual({
      printColour: "BLACK",
    });
  });

  it("throws when postage.id is missing but postage.size is present", () => {
    expect(() =>
      parseWorkbook({
        packs: [
          makePackRow({
            id: "pack-missing-id",
            name: "Pack Missing ID",
            billingId: "billing-pack-missing-id",
            "postage.id": undefined,
            "postage.size": "STANDARD",
          }),
        ],
        variants: [],
      }),
    ).toThrow(/Missing required postage fields.*pack-missing-id/);
  });

  it("throws when postage.size is missing but postage.id is present", () => {
    expect(() =>
      parseWorkbook({
        packs: [
          makePackRow({
            id: "pack-missing-size",
            name: "Pack Missing Size",
            billingId: "billing-pack-missing-size",
            "postage.id": "postage-1",
            "postage.size": undefined,
          }),
        ],
        variants: [],
      }),
    ).toThrow(/Missing required postage fields.*pack-missing-size/);
  });

  it("handles all assembly fields together", () => {
    const result = parseWorkbook({
      packs: [
        makePackRow({
          id: "pack-full-assembly",
          name: "Pack Full Assembly",
          billingId: "billing-pack-full-assembly",
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
        }),
      ],
      variants: [],
    });

    const { assembly } = result.packs.packfullassembly;
    expect(assembly?.envelopeId).toBe("env-1");
    expect(assembly?.printColour).toBe("COLOUR");
    expect(assembly?.paper?.id).toBe("paper-1");
    expect(assembly?.insertIds).toEqual(["insert-a", "insert-b"]);
    expect(assembly?.features).toEqual(["BRAILLE", "AUDIO", "ADMAIL"]);
    expect(assembly?.additional).toEqual({ note: "test" });
  });

  it("parses arrays with whitespace correctly", () => {
    const result = parseWorkbook({
      packs: [
        makePackRow({
          id: "pack-whitespace-arrays",
          name: "Pack Whitespace Arrays",
          billingId: "billing-pack-whitespace-arrays",
          "assembly.insertIds": " insert-1 , insert-2 , insert-3 ",
          "assembly.features": " BRAILLE , AUDIO ",
        }),
      ],
      variants: [],
    });

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
    const result = parseWorkbook({
      packs: [
        makePackRow({
          id: "pack-empty-inserts",
          name: "Pack Empty Inserts",
          billingId: "billing-pack-empty-inserts",
          "assembly.insertIds": "  ",
          "assembly.features": "BRAILLE",
        }),
      ],
      variants: [],
    });

    expect(result.packs.packemptyinserts.assembly?.insertIds).toBeUndefined();
    expect(result.packs.packemptyinserts.assembly?.features).toEqual([
      "BRAILLE",
    ]);
  });

  it("handles valid insertIds but empty features", () => {
    const result = parseWorkbook({
      packs: [
        makePackRow({
          id: "pack-empty-features",
          name: "Pack Empty Features",
          billingId: "billing-pack-empty-features",
          "assembly.insertIds": "insert-1",
          "assembly.features": "  ",
        }),
      ],
      variants: [],
    });

    expect(result.packs.packemptyfeatures.assembly?.insertIds).toEqual([
      "insert-1",
    ]);
    expect(result.packs.packemptyfeatures.assembly?.features).toBeUndefined();
  });

  it("parses Excel serial date numbers for timestamps", () => {
    const result = parseWorkbook({
      packs: [
        makePackRow({
          id: "pack-excel-dates",
          name: "Pack with Excel Serial Dates",
          createdAt: 44_927,
          updatedAt: 44_958,
          billingId: "billing-pack-excel-dates",
        }),
      ],
      variants: [],
    });

    expect(result.packs.packexceldates.createdAt).toMatch(/2023-01-01/);
    expect(result.packs.packexceldates.updatedAt).toMatch(/2023-02-01/);
  });

  it("parses constraints.sides on PackSpecification", () => {
    const result = parseWorkbook({
      packs: [
        makePackRow({
          id: "pack-with-sides",
          name: "Pack with Sides Constraint",
          billingId: "billing-pack-with-sides",
          "constraints.sheets": "10",
          "constraints.sides": "20",
          "constraints.deliveryDays": "5",
        }),
      ],
      variants: [],
    });

    expect(result.packs.packwithsides.constraints).toEqual({
      sheets: { value: 10, operator: "LESS_THAN" },
      sides: { value: 20, operator: "LESS_THAN" },
      deliveryDays: { value: 5, operator: "LESS_THAN" },
    });
  });

  it("parses assembly.paper.finish", () => {
    const result = parseWorkbook({
      packs: [
        makePackRow({
          id: "pack-with-paper-finish",
          name: "Pack with Paper Finish",
          billingId: "billing-pack-with-paper-finish",
          "assembly.paper.id": "paper-glossy",
          "assembly.paper.name": "Glossy Paper",
          "assembly.paper.weightGSM": "120",
          "assembly.paper.size": "A4",
          "assembly.paper.colour": "WHITE",
          "assembly.paper.recycled": "true",
          "assembly.paper.finish": "GLOSSY",
        }),
      ],
      variants: [],
    });

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
    const result = parseWorkbook({
      packs: [
        makePackRow({
          id: "pack-without-paper-finish",
          name: "Pack without Paper Finish",
          billingId: "billing-pack-without-paper-finish",
          "assembly.paper.id": "paper-plain",
          "assembly.paper.name": "Plain Paper",
          "assembly.paper.weightGSM": "80",
          "assembly.paper.size": "A4",
          "assembly.paper.colour": "WHITE",
          "assembly.paper.recycled": "false",
        }),
      ],
      variants: [],
    });

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
    const result = parseWorkbook({
      packs: [
        makePackRow({
          id: "pack-without-paper-colour",
          name: "Pack without Paper Colour",
          billingId: "billing-pack-without-paper-colour",
          "assembly.paper.id": "paper-default-colour",
          "assembly.paper.name": "Paper Default Colour",
          "assembly.paper.weightGSM": "80",
          "assembly.paper.size": "A4",
          "assembly.paper.recycled": "false",
        }),
      ],
      variants: [],
    });

    expect(result.packs.packwithoutpapercolour.assembly?.paper?.colour).toBe(
      "WHITE",
    );
  });

  it("leaves pack constraints undefined when none are provided", () => {
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

    expect(result.packs.packnoconstraints.constraints).toBeUndefined();
  });
});
