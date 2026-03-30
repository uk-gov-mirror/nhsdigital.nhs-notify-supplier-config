import {
  getNavigationLinkForPath,
  getNavigationSectionForPath,
  overviewNavigationLink,
} from "@/components/navigation-links";

describe("navigation-links", () => {
  it("maps supplier pages to the Suppliers section", () => {
    expect(getNavigationSectionForPath("/suppliers")?.label).toBe("Suppliers");
    expect(getNavigationSectionForPath("/supplier-allocations")?.label).toBe(
      "Suppliers",
    );
    expect(getNavigationSectionForPath("/volume-groups")?.label).toBe(
      "Suppliers",
    );
  });

  it("maps specification pages to the Specifications section", () => {
    expect(getNavigationSectionForPath("/pack-specifications")?.label).toBe(
      "Specifications",
    );
    expect(getNavigationSectionForPath("/postage")?.label).toBe(
      "Specifications",
    );
  });

  it("maps mapping pages to the Mapping section", () => {
    expect(getNavigationSectionForPath("/letter-variants")?.label).toBe(
      "Mapping",
    );
    expect(getNavigationSectionForPath("/reports/suppliers")?.label).toBe(
      "Mapping",
    );
  });

  it("returns the exact active link for subsection pages", () => {
    expect(getNavigationLinkForPath("/reports/suppliers")?.label).toBe(
      "Supplier reports",
    );
    expect(getNavigationLinkForPath("/letter-variants")?.label).toBe(
      "Letter variants",
    );
  });

  it("keeps overview outside the grouped sections", () => {
    expect(overviewNavigationLink.href).toBe("/");
    expect(getNavigationSectionForPath("/")).toBeUndefined();
    expect(getNavigationLinkForPath("/")).toBeUndefined();
  });
});
