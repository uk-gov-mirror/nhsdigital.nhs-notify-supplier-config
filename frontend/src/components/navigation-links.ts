export type NavigationLink = {
  description: string;
  href: string;
  label: string;
};

export type NavigationSection = {
  description: string;
  label: string;
  links: NavigationLink[];
};

export const overviewNavigationLink: NavigationLink = {
  description: "Return to the supplier configuration overview dashboard.",
  href: "/",
  label: "Overview",
};

export const navigationSections: NavigationSection[] = [
  {
    description: "Details relating to suppliers and volume config.",
    label: "Suppliers",
    links: [
      {
        description:
          "Manage supplier records, channel capabilities, and operational status.",
        href: "/suppliers",
        label: "Suppliers",
      },
      {
        description: "Manage supplier allocation percentages.",
        href: "/supplier-allocations",
        label: "Supplier allocations",
      },
      {
        description:
          "Manage allocation windows, groupings, and related volume configuration.",
        href: "/volume-groups",
        label: "Volume groups",
      },
    ],
  },
  {
    description: "Details of pack assembly, not factoring in suppliers.",
    label: "Specifications",
    links: [
      {
        description: "Define pack composition and production rules.",
        href: "/pack-specifications",
        label: "Pack specifications",
      },
      {
        description: "Maintain postal tariff reference data.",
        href: "/postage",
        label: "Postage",
      },
      {
        description: "Maintain paper definitions used by pack assembly.",
        href: "/paper",
        label: "Paper",
      },
      {
        description: "Maintain envelope reference data.",
        href: "/envelopes",
        label: "Envelopes",
      },
      {
        description: "Maintain insert reference data.",
        href: "/inserts",
        label: "Inserts",
      },
    ],
  },
  {
    description:
      "Details of how specifications are assigned to suppliers and clients.",
    label: "Mapping",
    links: [
      {
        description:
          "Assign specific packs to a client or campaign, or make them globally available.",
        href: "/letter-variants",
        label: "Letter variants",
      },
      {
        description:
          "Map pack specifications onto specific suppliers and track approval status.",
        href: "/supplier-packs",
        label: "Supplier packs",
      },
      {
        description:
          "Review per-supplier submissions and approval status for configured packs.",
        href: "/reports/suppliers",
        label: "Supplier reports",
      },
    ],
  },
];

export const navigationLinks: NavigationLink[] = navigationSections.flatMap(
  (section) => section.links,
);

function isPathMatch(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function getNavigationSectionForPath(pathname: string) {
  return navigationSections.find((section) =>
    section.links.some((link) => isPathMatch(pathname, link.href)),
  );
}

export function getNavigationLinkForPath(pathname: string) {
  return navigationLinks.find((link) => isPathMatch(pathname, link.href));
}
