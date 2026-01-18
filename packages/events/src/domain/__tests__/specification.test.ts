import {
  $PackSpecification,
  EnvelopeId,
  PackSpecification,
  PackSpecificationId,
  PostageId,
} from "@nhsdigital/nhs-notify-event-schemas-supplier-config/src/domain/pack-specification";

describe("Specification schema validation", () => {
  const standardLetterSpecification: PackSpecification = {
    id: PackSpecificationId("standard-letter"),
    name: "Standard Economy-class Letter",
    status: "INT",
    createdAt: "2023-01-01T00:00:00Z",
    updatedAt: "2023-01-01T00:00:00Z",
    version: 1,
    postage: {
      id: PostageId("economy"),
      size: "STANDARD",
      deliveryDays: 4,
    },
    assembly: {
      envelopeId: EnvelopeId("nhs-economy"),
      printColour: "BLACK",
    },
  };

  it("should validate a standard letter specification", () => {
    expect(() =>
      $PackSpecification.strict().parse(standardLetterSpecification),
    ).not.toThrow();
  });

  it("should accept a letter specification with unrecognised fields", () => {
    expect(() =>
      $PackSpecification.parse({
        ...standardLetterSpecification,
        additionalField: { some: "data" },
      }),
    ).not.toThrow();
  });
});
