import { PackSpecification } from "@nhsdigital/nhs-notify-event-schemas-supplier-config/src/domain/pack-specification";
import {
  buildPackSpecificationEvent,
  buildPackSpecificationEvents,
} from "../pack-specification-event-builder";

describe("pack-specification-event-builder", () => {
  const base = {
    name: "Test Pack",
    status: "PROD",
    createdAt: "2024-01-01T00:00:00.000Z",
    updatedAt: "2024-01-01T00:00:00.000Z",
    version: 1,
    billingId: "TEST-BILLING-001",
    postage: { id: "postage-test" as any, size: "STANDARD" },
  } satisfies Omit<PackSpecification, "id">;

  it("skips draft", () => {
    const ev = buildPackSpecificationEvent({
      ...base,
      id: "11111111-1111-1111-1111-111111111111" as any,
      status: "DRAFT",
    } as PackSpecification);
    expect(ev).toBeUndefined();
  });

  it("throws on unknown status", () => {
    const pack = {
      ...base,
      id: "11111111-1111-1111-1111-111111111111" as any,
      status: "UNKNOWN" as any,
    } as unknown as PackSpecification;
    expect(() => buildPackSpecificationEvent(pack)).toThrow(
      /No specialised event schema found for status UNKNOWN/,
    );
  });

  it("builds published", () => {
    const event = buildPackSpecificationEvent({
      ...base,
      id: "22222222-2222-2222-2222-222222222222" as any,
      status: "PROD",
    } satisfies PackSpecification);
    expect(event).toBeDefined();
    expect(event!.type).toMatch(/pack-specification.prod/);
    expect(event!.subject).toBe(
      "pack-specification/22222222-2222-2222-2222-222222222222",
    );
    expect(event!.partitionkey).toBe("22222222-2222-2222-2222-222222222222");
    expect(event!.severitytext).toBe("INFO");
  });

  it("builds multiple with sequence ordering", () => {
    const events = buildPackSpecificationEvents({
      a: {
        ...base,
        id: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa" as any,
        status: "PROD",
      } as PackSpecification,
      b: {
        ...base,
        id: "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb" as any,
        status: "INT",
      } as PackSpecification,
    });
    expect(events).toHaveLength(2);
    expect(events[0].sequence).toBe("00000000000000000001");
    expect(events[1].sequence).toBe("00000000000000000002");
  });
});
