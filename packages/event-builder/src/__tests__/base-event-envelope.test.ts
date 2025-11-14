import { buildBaseEventEnvelope } from "../lib/base-event-envelope";
import { configFromEnv } from "../config";

describe("buildBaseEventEnvelope", () => {
  it("applies default severity INFO when none provided", () => {
    const cfg = configFromEnv();
    const evt = buildBaseEventEnvelope(
      "test.type",
      "test/subject",
      "pk-1",
      { foo: "bar" },
      "https://example.test/schema.json",
      cfg,
      {},
    );
    expect(evt.severitytext).toBe("INFO");
    expect(evt.severitynumber).toBe(2);
  });

  it("applies explicit severity DEBUG", () => {
    const cfg = configFromEnv();
    const evt = buildBaseEventEnvelope(
      "test.type",
      "test/subject",
      "pk-1",
      { foo: "bar" },
      "https://example.test/schema.json",
      cfg,
      { severity: "DEBUG" },
    );
    expect(evt.severitytext).toBe("DEBUG");
    expect(evt.severitynumber).toBe(1);
  });

  it("uses generator for sequence values", () => {
    const cfg = configFromEnv();
    // eslint-disable-next-line unicorn/consistent-function-scoping
    function* g(): Generator<string, never> {
      for (;;) {
        yield "g-1";
        yield "g-2";
      }
    }
    const gen = g();
    const first = buildBaseEventEnvelope(
      "test.type",
      "test/subject",
      "pk-1",
      {},
      "https://example.test/schema.json",
      cfg,
      { sequence: gen },
    );
    const second = buildBaseEventEnvelope(
      "test.type",
      "test/subject",
      "pk-1",
      {},
      "https://example.test/schema.json",
      cfg,
      { sequence: gen },
    );
    expect(first.sequence).toBe("g-1");
    expect(second.sequence).toBe("g-2");
  });

  it("uses provided literal sequence string", () => {
    const cfg = configFromEnv();
    const evt = buildBaseEventEnvelope(
      "test.type",
      "test/subject",
      "pk-1",
      {},
      "https://example.test/schema.json",
      cfg,
      { sequence: "literal-seq" },
    );
    expect(evt.sequence).toBe("literal-seq");
  });

  it("handles undefined sequence (no property mutation)", () => {
    const cfg = configFromEnv();
    const evt = buildBaseEventEnvelope(
      "test.type",
      "test/subject",
      "pk-1",
      {},
      "https://example.test/schema.json",
      cfg,
      {},
    );
    expect(evt.sequence).toBeUndefined();
  });

  it("accepts an undefined options object", () => {
    const cfg = configFromEnv();
    const evt = buildBaseEventEnvelope(
      "test.type",
      "test/subject",
      "pk-1",
      {},
      "https://example.test/schema.json",
      cfg,
    );
    expect(evt.severitytext).toBe("INFO");
    expect(evt.severitynumber).toBe(2);
    expect(evt.sequence).toBeUndefined();
  });
});
