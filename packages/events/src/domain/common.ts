import { z } from "zod";

export const $EnvironmentStatus = z
  .enum(["DRAFT", "INT", "PROD", "DISABLED"])
  .meta({
    title: "EnvironmentStatus",
    description:
      "Indicates whether the configuration is in draft, or enabled in the integration or production environment. " +
      "`PROD` implies that the configuration is also enabled in the integration environment.",
  });
