import {
  $SupplierPack,
  SupplierPack,
} from "../supplier-pack";
import {
  EnvelopeId,
  PackSpecification,
  PostageId,
} from "@nhsdigital/nhs-notify-event-schemas-supplier-config/src/domain/pack-specification";
import { SupplierId } from "../supplier";

describe("SpecificationSupplier schema validation", () => {
  const standardLetterSpecification: PackSpecification = {
    id: "standard-letter" as any,
    name: "Standard Economy-class Letter",
    status: "PROD",
    createdAt: "2023-01-01T00:00:00Z",
    updatedAt: "2023-01-01T00:00:00Z",
    version: 1,
    postage: {
      id: PostageId("economy"),
      size: "STANDARD",
      deliverySLA: 4,
    },
    assembly: {
      envelopeId: EnvelopeId("nhs-economy"),
      printColour: "BLACK",
      features: ["MAILMARK"],
    },
  };

  const testSupplierPack: SupplierPack = {
    id: "test-specification-supplier" as any,
    packSpecificationId: standardLetterSpecification.id,
    supplierId: SupplierId("supplier-123"),
    approval: "APPROVED",
    status: "PROD",
  };

  it("should validate a specification supplier", () => {
    expect(() => $SupplierPack.parse(testSupplierPack)).not.toThrow();
  });
});
