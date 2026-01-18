import { z } from "zod";

export function ConfigBase<T extends string>(type: T) {
  return z.object({
    id: z.string().brand<T>(type),
  });
}

export const $EnvironmentStatus = z.enum(["DRAFT", "INT", "PROD"]).meta({
  title: "EnvironmentStatus",
  description:
    "Indicates whether the configuration is in draft, or enabled in the integration or production environment. " +
    "`PROD` implies that the configuration is also enabled in the integration environment.",
});
