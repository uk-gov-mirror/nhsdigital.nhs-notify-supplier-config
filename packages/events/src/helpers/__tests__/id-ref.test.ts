import { z } from "zod";
import { idRef } from "../id-ref";

describe("idRef", () => {
  describe("when the id field is present", () => {
    it("should create a reference using the default 'id' field", () => {
      const CustomerSchema = z.object({
        id: z.string(),
        name: z.string(),
      });

      const refSchema = idRef(CustomerSchema);

      expect(refSchema.parse("customer-123")).toBe("customer-123");
    });

    it("should create a reference using a custom id field", () => {
      const CustomerSchema = z.object({
        customerId: z.string(),
        name: z.string(),
      });

      const refSchema = idRef(CustomerSchema, "customerId");

      expect(refSchema.parse("customer-123")).toBe("customer-123");
    });

    it("should add metadata to the reference schema", () => {
      const CustomerSchema = z
        .object({
          id: z.string(),
          name: z.string(),
        })
        .describe("Customer");

      const refSchema = idRef(CustomerSchema);

      expect(refSchema.description).toBe(
        "Reference to a Customer by its unique identifier",
      );
    });

    it("should use provided entity name in metadata", () => {
      const Schema = z.object({
        id: z.string(),
        name: z.string(),
      });

      const refSchema = idRef(Schema, undefined, "CustomEntity");

      expect(refSchema.description).toBe(
        "Reference to a CustomEntity by its unique identifier",
      );
    });

    it("should infer the correct type from the referenced schema", () => {
      const CustomerSchema = z.object({
        id: z.number(),
        name: z.string(),
      });

      const refSchema = idRef(CustomerSchema);

      expect(refSchema.parse(123)).toBe(123);
      expect(() => refSchema.parse("not-a-number")).toThrow();
    });
  });

  describe("when the id field is not present", () => {
    it("should throw an error when default 'id' field is missing", () => {
      const CustomerSchema = z.object({
        customerId: z.string(),
        name: z.string(),
      }) as any; // TypeScript won't allow this, but we're testing runtime behavior

      expect(() => idRef(CustomerSchema)).toThrow(
        "ID field 'id' not found in schema",
      );
    });

    it("should throw an error when custom id field is missing", () => {
      const CustomerSchema = z.object({
        id: z.string(),
        name: z.string(),
      });

      expect(() => idRef(CustomerSchema, "nonExistentId" as any)).toThrow(
        "ID field 'nonExistentId' not found in schema",
      );
    });
  });
});
