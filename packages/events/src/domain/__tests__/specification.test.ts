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

  it("should validate a specification with optional description", () => {
    const specWithDescription: PackSpecification = {
      ...standardLetterSpecification,
      description: "A standard economy-class letter for bulk mailings",
    };

    expect(() =>
      $PackSpecification.strict().parse(specWithDescription),
    ).not.toThrow();
  });

  it("should validate a specification without description", () => {
    const specWithoutDescription: PackSpecification = {
      ...standardLetterSpecification,
    };

    expect(() =>
      $PackSpecification.strict().parse(specWithoutDescription),
    ).not.toThrow();
  });

  it("should validate a specification with duplex set to true", () => {
    const specWithDuplex: PackSpecification = {
      ...standardLetterSpecification,
      assembly: {
        ...standardLetterSpecification.assembly,
        duplex: true,
      },
    };

    expect(() =>
      $PackSpecification.strict().parse(specWithDuplex),
    ).not.toThrow();
  });

  it("should validate a specification with duplex set to false", () => {
    const specWithoutDuplex: PackSpecification = {
      ...standardLetterSpecification,
      assembly: {
        ...standardLetterSpecification.assembly,
        duplex: false,
      },
    };

    expect(() =>
      $PackSpecification.strict().parse(specWithoutDuplex),
    ).not.toThrow();
  });

  it("should validate a specification without duplex field", () => {
    const specWithoutDuplexField: PackSpecification = {
      ...standardLetterSpecification,
    };

    expect(() =>
      $PackSpecification.strict().parse(specWithoutDuplexField),
    ).not.toThrow();
  });
});
