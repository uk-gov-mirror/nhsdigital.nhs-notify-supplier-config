import packageJson from "@nhsdigital/nhs-notify-event-schemas-supplier-config/package.json";
import { Config, buildEventSource, configFromEnv } from "../config";

describe("config.ts", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...originalEnv }; // shallow copy
    delete process.env.EVENT_ENV;
    delete process.env.EVENT_SERVICE;
    delete process.env.EVENT_DATASCHEMAVERSION;
  });

  afterAll(() => {
    process.env = originalEnv; // restore
  });

  it("returns defaults when env vars are not set", () => {
    const cfg = configFromEnv();
    expect(cfg.EVENT_ENV).toBe("dev");
    expect(cfg.EVENT_SERVICE).toBe("events");
    expect(cfg.EVENT_DATASCHEMAVERSION).toBe(packageJson.version);
  });

  it("applies overrides from environment variables", () => {
    process.env.EVENT_ENV = "prod";
    process.env.EVENT_SERVICE = "supplier";
    process.env.EVENT_DATASCHEMAVERSION = "9.9.9";
    const cfg = configFromEnv();
    expect(cfg.EVENT_ENV).toBe("prod");
    expect(cfg.EVENT_SERVICE).toBe("supplier");
    expect(cfg.EVENT_DATASCHEMAVERSION).toBe("9.9.9");
  });

  it("buildEventSource constructs expected path", () => {
    const cfg: Config = {
      EVENT_ENV: "int",
      EVENT_SERVICE: "allocations",
      EVENT_DATASCHEMAVERSION: packageJson.version,
    };
    const src = buildEventSource(cfg);
    expect(src).toBe("/control-plane/supplier-config/int/allocations");
  });
});
