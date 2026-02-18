import {
  $LetterVariantEvent,
  LetterVariantEvent,
  letterVariantEvents,
} from "@nhsdigital/nhs-notify-event-schemas-supplier-config/src/events/letter-variant-events";

describe("LetterVariant Events", () => {
  describe("letter-variant.prod event", () => {
    const validProdEvent: LetterVariantEvent = {
      specversion: "1.0",
      id: "6f1c2a53-3d54-4a0a-9a0b-0e9ae2d4c111",
      source: "/control-plane/supplier-config",
      subject: "letter-variant/standard-letter-variant",
      type: "uk.nhs.notify.supplier-config.letter-variant.prod.v1",
      plane: "control",
      time: "2025-10-01T10:15:30.000Z",
      recordedtime: "2025-10-01T10:15:30.250Z",
      severitynumber: 2,
      severitytext: "INFO",
      datacontenttype: "application/json",
      dataschema:
        "https://notify.nhs.uk/cloudevents/schemas/supplier-config/letter-variant.prod.1.0.0.schema.json",
      dataschemaversion: "1.0.0",
      traceparent: "00-0af7651916cd43dd8448eb211c80319c-b7ad6b7169203331-01",
      data: {
        id: "standard-letter-variant",
        name: "Standard Letter Variant",
        description: "A standard letter variant for general correspondence",
        volumeGroupId: "supplier-framework-123",
        type: "STANDARD",
        status: "PROD",
        packSpecificationIds: ["bau-standard-c5", "bau-standard-c4"],
      },
    };

    it("should validate a valid letter-variant.prod event", () => {
      const result = $LetterVariantEvent.safeParse(validProdEvent);
      expect(result.error).toBeUndefined();
      expect(result.success).toBe(true);
    });

    it("should validate using the specialised published schema", () => {
      const prodSchema = letterVariantEvents["letter-variant.prod"];
      const result = prodSchema.safeParse(validProdEvent);
      expect(result.error).toBeUndefined();
      expect(result.success).toBe(true);
    });

    it("should validate event with optional fields", () => {
      const eventWithOptionalFields: LetterVariantEvent = {
        ...validProdEvent,
        data: {
          ...validProdEvent.data,
          clientId: "client-123",
          campaignIds: ["campaign-456", "campaign-789"],
        },
      };

      const result = $LetterVariantEvent.safeParse(eventWithOptionalFields);
      expect(result.success).toBe(true);
    });

    it("should validate BRAILLE type variant", () => {
      const brailleEvent: LetterVariantEvent = {
        ...validProdEvent,
        data: {
          id: "braille-variant",
          name: "Braille Letter Variant",
          volumeGroupId: "supplier-framework-123",
          type: "BRAILLE",
          status: "PROD",
          packSpecificationIds: ["braille"],
        },
      };

      const result = $LetterVariantEvent.safeParse(brailleEvent);
      expect(result.success).toBe(true);
    });

    it("should validate AUDIO type variant", () => {
      const audioEvent: LetterVariantEvent = {
        ...validProdEvent,
        data: {
          id: "audio-variant",
          name: "Audio Letter Variant",
          volumeGroupId: "supplier-framework-123",
          type: "AUDIO",
          status: "PROD",
          packSpecificationIds: ["audio"],
        },
      };

      const result = $LetterVariantEvent.safeParse(audioEvent);
      expect(result.success).toBe(true);
    });

    it("should reject event with invalid type", () => {
      const invalidEvent = {
        ...validProdEvent,
        type: "uk.nhs.notify.supplier-config.letter-variant.invalid.v1",
      };

      const result = $LetterVariantEvent.safeParse(invalidEvent);
      expect(result.success).toBe(false);
    });

    it("should reject event with invalid source", () => {
      const invalidEvent = {
        ...validProdEvent,
        source: "/data-plane/invalid",
      };

      const result = $LetterVariantEvent.safeParse(invalidEvent);
      expect(result.success).toBe(false);
    });

    it("should reject event with invalid subject", () => {
      const invalidEvent = {
        ...validProdEvent,
        subject: "invalid/subject",
      };

      const result = $LetterVariantEvent.safeParse(invalidEvent);
      expect(result.success).toBe(false);
    });

    it("should reject event with mismatched dataschema using specialized schema", () => {
      const prodSchema = letterVariantEvents["letter-variant.prod"];
      const invalidEvent = {
        ...validProdEvent,
        dataschema:
          "https://notify.nhs.uk/cloudevents/schemas/supplier-config/letter-variant.int.1.0.0.schema.json",
      };

      const result = prodSchema.safeParse(invalidEvent);
      expect(result.success).toBe(false);
    });

    it("should reject event with invalid dataschema version format", () => {
      const invalidEvent = {
        ...validProdEvent,
        dataschema:
          "https://notify.nhs.uk/cloudevents/schemas/supplier-config/letter-variant.int.2.0.0.schema.json", // Major version must be 1
      };

      const result = $LetterVariantEvent.safeParse(invalidEvent);
      expect(result.success).toBe(false);
    });

    it("should reject event with empty packSpecificationIds", () => {
      const invalidEvent = {
        ...validProdEvent,
        data: {
          ...validProdEvent.data,
          packSpecificationIds: [],
        },
      };

      const result = $LetterVariantEvent.safeParse(invalidEvent);
      expect(result.success).toBe(false);
    });

    it("should reject event with invalid letter type", () => {
      const invalidEvent = {
        ...validProdEvent,
        data: {
          ...validProdEvent.data,
          type: "INVALID_TYPE",
        },
      };

      const result = $LetterVariantEvent.safeParse(invalidEvent);
      expect(result.success).toBe(false);
    });

    it("should validate specialised schema enforces PROD status", () => {
      const prodSchema = letterVariantEvents["letter-variant.prod"];

      // Valid with PROD status
      const validResult = prodSchema.safeParse(validProdEvent);
      expect(validResult.success).toBe(true);

      // Invalid with INT status
      const invalidEvent = {
        ...validProdEvent,
        data: {
          ...validProdEvent.data,
          status: "INT",
        },
      };
      const invalidResult = prodSchema.safeParse(invalidEvent);
      expect(invalidResult.success).toBe(false);
    });

    it("should validate letter variant with constraints", () => {
      const eventWithConstraints = {
        ...validProdEvent,
        data: {
          ...validProdEvent.data,
          constraints: {
            sheets: {
              value: 10,
              operator: "LESS_THAN",
            },
            deliveryDays: {
              value: 3,
              operator: "LESS_THAN",
            },
          },
        },
      };

      const result = $LetterVariantEvent.safeParse(eventWithConstraints);
      expect(result.success).toBe(true);
    });

    it("should validate letter variant with all constraint fields", () => {
      const eventWithConstraints = {
        ...validProdEvent,
        data: {
          ...validProdEvent.data,
          constraints: {
            deliveryDays: {
              value: 5,
              operator: "EQUALS",
            },
            sheets: {
              value: 20,
              operator: "LESS_THAN",
            },
            blackCoveragePercentage: {
              value: 80,
              operator: "LESS_THAN",
            },
            colourCoveragePercentage: {
              value: 50,
              operator: "LESS_THAN",
            },
          },
        },
      };

      const result = $LetterVariantEvent.safeParse(eventWithConstraints);
      expect(result.success).toBe(true);
    });

    it("should reject letter variant with invalid constraint field", () => {
      const eventWithInvalidConstraints = {
        ...validProdEvent,
        data: {
          ...validProdEvent.data,
          constraints: {
            sheets: {
              value: "not a number",
              operator: "LESS_THAN",
            },
          },
        },
      };

      const result = $LetterVariantEvent.safeParse(eventWithInvalidConstraints);
      expect(result.success).toBe(false);
    });

    it("should validate letter variant without constraints", () => {
      const result = $LetterVariantEvent.safeParse(validProdEvent);
      expect(result.success).toBe(true);
    });
  });

  describe("letter-variant.int event", () => {
    const validIntEvent: LetterVariantEvent = {
      specversion: "1.0",
      id: "7f2d3b64-4e65-4b1b-8c1c-bf3e5d222abc",
      source: "/control-plane/supplier-config",
      subject: "letter-variant/disabled-letter-variant",
      type: "uk.nhs.notify.supplier-config.letter-variant.int.v1",
      plane: "control",
      time: "2025-10-01T11:20:45.000Z",
      recordedtime: "2025-10-01T11:20:45.500Z",
      severitynumber: 2,
      severitytext: "INFO",
      datacontenttype: "application/json",
      dataschema:
        "https://notify.nhs.uk/cloudevents/schemas/supplier-config/letter-variant.int.1.0.0.schema.json",
      dataschemaversion: "1.0.0",
      traceparent: "00-1bf8762027de54ee9559fc322d91430d-c8be7c2270314442-01",
      data: {
        id: "disabled-letter-variant",
        name: "Disabled Letter Variant",
        volumeGroupId: "supplier-framework-123",
        type: "STANDARD",
        status: "INT",
        packSpecificationIds: ["bau-standard-c5"],
      },
    };

    it("should validate a valid letter-variant.int event", () => {
      const result = $LetterVariantEvent.safeParse(validIntEvent);
      expect(result.error).toBeUndefined();
      expect(result.success).toBe(true);
    });

    it("should validate using the specialised disabled schema", () => {
      const intSchema = letterVariantEvents["letter-variant.int"];
      const result = intSchema.safeParse(validIntEvent);
      expect(result.success).toBe(true);
    });

    it("should validate specialised schema enforces INT status", () => {
      const intSchema = letterVariantEvents["letter-variant.int"];

      // Valid with INT status
      const validResult = intSchema.safeParse(validIntEvent);
      expect(validResult.success).toBe(true);

      // Invalid with PROD status
      const invalidEvent = {
        ...validIntEvent,
        data: {
          ...validIntEvent.data,
          status: "PROD",
        },
      };
      const invalidResult = intSchema.safeParse(invalidEvent);
      expect(invalidResult.success).toBe(false);
    });
  });

  describe("letter-variant.disabled event", () => {
    const validDisabledEvent: LetterVariantEvent = {
      specversion: "1.0",
      id: "8f3e4c75-5f76-5c2c-9d2d-cf4f6e333bcd",
      source: "/control-plane/supplier-config",
      subject: "letter-variant/disabled-letter-variant",
      type: "uk.nhs.notify.supplier-config.letter-variant.disabled.v1",
      plane: "control",
      time: "2025-10-01T12:25:00.000Z",
      recordedtime: "2025-10-01T12:25:00.750Z",
      severitynumber: 2,
      severitytext: "INFO",
      datacontenttype: "application/json",
      dataschema:
        "https://notify.nhs.uk/cloudevents/schemas/supplier-config/letter-variant.disabled.1.0.0.schema.json",
      dataschemaversion: "1.0.0",
      traceparent: "00-2cf9873138ef65ff0670fd433e02541e-d9cf8d3381425553-01",
      data: {
        id: "disabled-letter-variant",
        name: "Disabled Letter Variant",
        description: "A letter variant that has been disabled",
        volumeGroupId: "supplier-framework-123",
        type: "STANDARD",
        status: "DISABLED",
        packSpecificationIds: ["bau-standard-c5"],
      },
    };

    it("should validate a valid letter-variant.disabled event", () => {
      const result = $LetterVariantEvent.safeParse(validDisabledEvent);
      expect(result.error).toBeUndefined();
      expect(result.success).toBe(true);
    });

    it("should validate using the specialised disabled schema", () => {
      const disabledSchema = letterVariantEvents["letter-variant.disabled"];
      const result = disabledSchema.safeParse(validDisabledEvent);
      expect(result.success).toBe(true);
    });

    it("should validate specialised schema enforces DISABLED status", () => {
      const disabledSchema = letterVariantEvents["letter-variant.disabled"];

      // Valid with DISABLED status
      const validResult = disabledSchema.safeParse(validDisabledEvent);
      expect(validResult.success).toBe(true);

      // Invalid with PROD status
      const invalidEvent = {
        ...validDisabledEvent,
        data: {
          ...validDisabledEvent.data,
          status: "PROD",
        },
      };
      const invalidResult = disabledSchema.safeParse(invalidEvent);
      expect(invalidResult.success).toBe(false);
    });
  });

  describe("letterVariantEvents object", () => {
    it("should contain draft, int, prod and disabled event schemas", () => {
      expect(letterVariantEvents["letter-variant.draft"]).toBeDefined();
      expect(letterVariantEvents["letter-variant.int"]).toBeDefined();
      expect(letterVariantEvents["letter-variant.prod"]).toBeDefined();
      expect(letterVariantEvents["letter-variant.disabled"]).toBeDefined();
    });

    it("should not contain published event schema", () => {
      expect(
        (letterVariantEvents as any)["letter-variant.published"],
      ).toBeUndefined();
    });
  });
});
