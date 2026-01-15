import {
  $SupplierEvent,
  supplierEvents,
} from "@nhsdigital/nhs-notify-event-schemas-supplier-config/src/events/supplier-events";
import { SupplierId } from "@nhsdigital/nhs-notify-event-schemas-supplier-config/src/domain/supplier";

describe("Supplier Events", () => {
  describe("supplier.prod event", () => {
    const validProdEvent = {
      specversion: "1.0",
      id: "6f1c2a53-3d54-4a0a-9a0b-0e9ae2d4c111",
      source: "/control-plane/supplier-config",
      subject: "supplier/test-supplier",
      type: "uk.nhs.notify.supplier-config.supplier.prod.v1",
      time: "2025-10-01T10:15:30.000Z",
      recordedtime: "2025-10-01T10:15:30.250Z",
      severitynumber: 2,
      severitytext: "INFO",
      datacontenttype: "application/json",
      dataschema:
        "https://notify.nhs.uk/cloudevents/schemas/supplier-config/supplier.prod.1.0.0.schema.json",
      traceparent: "00-0af7651916cd43dd8448eb211c80319c-b7ad6b7169203331-01",
      data: {
        id: SupplierId("test-supplier"),
        name: "Test Supplier",
        channelType: "LETTER",
        dailyCapacity: 10_000,
        status: "PROD",
      },
    };

    it("validates a supplier.prod event with generic schema", () => {
      const result = $SupplierEvent.safeParse(validProdEvent);
      if (!result.success) {
        console.log("Validation errors:", JSON.stringify(result.error.issues, null, 2));
      }
      expect(result.success).toBe(true);
    });

    it("validates with specialised prod schema", () => {
      const prodSchema = supplierEvents["supplier.prod"];
      const result = prodSchema.safeParse(validProdEvent);
      expect(result.success).toBe(true);
    });

    it("rejects mismatched dataschema using specialised schema", () => {
      const prodSchema = supplierEvents["supplier.prod"];
      const invalidEvent = {
        ...validProdEvent,
        dataschema:
          "https://notify.nhs.uk/cloudevents/schemas/supplier-config/supplier.int.1.0.0.schema.json",
      };
      const result = prodSchema.safeParse(invalidEvent);
      expect(result.success).toBe(false);
    });

    it("rejects invalid subject", () => {
      const invalidEvent = {
        ...validProdEvent,
        subject: "supplier/INVALID SUBJ",
      };
      const result = $SupplierEvent.safeParse(invalidEvent);
      expect(result.success).toBe(false);
    });
  });

  describe("supplier.int event", () => {
    const validIntEvent = {
      specversion: "1.0",
      id: "7f2d3b64-4e65-4b1b-8c1c-bf3e5d222abc",
      source: "/control-plane/supplier-config",
      subject: "supplier/int-supplier",
      type: "uk.nhs.notify.supplier-config.supplier.int.v1",
      time: "2025-10-01T11:20:45.000Z",
      recordedtime: "2025-10-01T11:20:45.500Z",
      severitynumber: 2,
      severitytext: "INFO",
      datacontenttype: "application/json",
      dataschema:
        "https://notify.nhs.uk/cloudevents/schemas/supplier-config/supplier.int.1.0.0.schema.json",
      traceparent: "00-1bf8762027de54ee9559fc322d91430d-c8be7c2270314442-01",
      data: {
        id: SupplierId("int-supplier"),
        name: "Integration Supplier",
        channelType: "LETTER",
        dailyCapacity: 5_000,
        status: "INT",
      },
    };

    it("validates a supplier.int event with generic schema", () => {
      const result = $SupplierEvent.safeParse(validIntEvent);
      expect(result.success).toBe(true);
    });

    it("validates with specialised int schema", () => {
      const intSchema = supplierEvents["supplier.int"];
      const result = intSchema.safeParse(validIntEvent);
      expect(result.success).toBe(true);
    });

    it("rejects event with PROD status using int schema", () => {
      const intSchema = supplierEvents["supplier.int"];
      const invalidEvent = {
        ...validIntEvent,
        data: { ...validIntEvent.data, status: "PROD" },
      };
      const result = intSchema.safeParse(invalidEvent);
      expect(result.success).toBe(false);
    });
  });

  describe("supplierEvents object", () => {
    it("contains draft, int and prod event schemas", () => {
      expect(supplierEvents["supplier.draft"]).toBeDefined();
      expect(supplierEvents["supplier.int"]).toBeDefined();
      expect(supplierEvents["supplier.prod"]).toBeDefined();
    });
    it("does not contain published event schema", () => {
      expect((supplierEvents as any)["supplier.published"]).toBeUndefined();
    });
  });
});
