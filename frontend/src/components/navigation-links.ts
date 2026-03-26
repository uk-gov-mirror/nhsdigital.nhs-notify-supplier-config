export type NavigationLink = {
  description: string;
  href: string;
  label: string;
};

export const navigationLinks: NavigationLink[] = [
  {
    description: "Manage print and letter suppliers.",
    href: "/suppliers",
    label: "Suppliers",
  },
  {
    description: "Define pack composition and production rules.",
    href: "/pack-specifications",
    label: "Pack specifications",
  },
  {
    description: "Maintain postal tariff reference data.",
    href: "/postages",
    label: "Postages",
  },
  {
    description: "Maintain paper definitions used by pack assembly.",
    href: "/papers",
    label: "Papers",
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
  {
    description: "Manage allocation windows and periods.",
    href: "/volume-groups",
    label: "Volume groups",
  },
  {
    description: "Track supplier readiness for pack specifications.",
    href: "/supplier-packs",
    label: "Supplier packs",
  },
  {
    description: "Manage supplier allocation percentages.",
    href: "/supplier-allocations",
    label: "Supplier allocations",
  },
  {
    description: "Read supplier-focused summary views.",
    href: "/reports/suppliers",
    label: "Supplier reports",
  },
];
