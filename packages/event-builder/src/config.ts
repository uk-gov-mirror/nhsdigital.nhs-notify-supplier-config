import { z } from "zod";
import packageJson from "@nhsdigital/nhs-notify-event-schemas-supplier-config/package.json";

const dataschemaversion = packageJson.version;

const $Config = z.object({
  EVENT_ENV: z.string().default("dev"),
  EVENT_SERVICE: z.string().default("events"),
  EVENT_DATASCHEMAVERSION: z.string().default(dataschemaversion),
});
export type Config = z.infer<typeof $Config>;

export const configFromEnv = () => {
  return $Config.parse(process.env);
};

export const buildEventSource = (config: Config) => {
  const { EVENT_ENV, EVENT_SERVICE } = config;
  return `/control-plane/supplier-config/${EVENT_ENV}/${EVENT_SERVICE}`;
};
