import {
  VolumeGroup,
  VolumeGroupId,
} from "@nhsdigital/nhs-notify-event-schemas-supplier-config";
import {
  buildVolumeGroupEvent,
  buildVolumeGroupEvents,
} from "../volume-group-event-builder";
import { configFromEnv } from "../config";

describe("volume-group-event-builder", () => {
  const baseVolumeGroup: VolumeGroup = {
    id: VolumeGroupId("volume-group-1"),
    name: "Volume Group 1",
    startDate: "2025-01-01", // date only per schema
    status: "PROD",
  };
  const secondVolumeGroup: VolumeGroup = {
    id: VolumeGroupId("volume-group-2"),
    name: "Volume Group 2",
    startDate: "2025-01-02", // date only
    status: "PROD",
  };
  const draftVolumeGroup: VolumeGroup = {
    id: VolumeGroupId("volume-group-draft"),
    name: "Volume Group Draft",
    startDate: "2025-01-03", // date only
    status: "DRAFT",
  };
  const disabledVolumeGroup: VolumeGroup = {
    id: VolumeGroupId("volume-group-disabled"),
    name: "Volume Group Disabled",
    startDate: "2025-02-01",
    status: "INT",
  };

  it("builds event with explicit sequence string and severity ERROR", () => {
    const cfg = configFromEnv();
    const event = buildVolumeGroupEvent(
      baseVolumeGroup,
      {
        severity: "ERROR",
        sequence: "00000000000000000042",
      },
      cfg,
    );
    expect(event).toBeDefined();
    expect(event!.sequence).toBe("00000000000000000042");
    expect(event!.severitytext).toBe("ERROR");
    expect(event!.severitynumber).toBe(4);
    expect(event!.subject).toBe("volume-group/volume-group-1");
    expect(event!.type).toBe(
      "uk.nhs.notify.supplier-config.volume-group.prod.v1",
    );
  });

  it("builds events using generator sequence path (object branch)", () => {
    const events = buildVolumeGroupEvents(
      { vg1: baseVolumeGroup, vg2: secondVolumeGroup },
      10,
    );
    expect(events).toHaveLength(2);
    expect(events[0]!.sequence).toBe("00000000000000000010");
    expect(events[1]!.sequence).toBe("00000000000000000011");
    // default severity INFO
    expect(events[0]!.severitytext).toBe("INFO");
    expect(events[0]!.severitynumber).toBe(2);
  });

  it("builds events using generator sequence and default startingCounter", () => {
    const events = buildVolumeGroupEvents({
      vg1: baseVolumeGroup,
      vg2: secondVolumeGroup,
    });
    expect(events).toHaveLength(2);
    expect(events[0]!.sequence).toBe("00000000000000000001");
    expect(events[1]!.sequence).toBe("00000000000000000002");
    // default severity INFO
    expect(events[0]!.severitytext).toBe("INFO");
    expect(events[0]!.severitynumber).toBe(2);
  });

  it("builds event without sequence (undefined branch) and severity WARN", () => {
    const event = buildVolumeGroupEvent(baseVolumeGroup, { severity: "WARN" });
    expect(event).toBeDefined();
    expect(event!.sequence).toBeUndefined();
    expect(event!.severitytext).toBe("WARN");
    expect(event!.severitynumber).toBe(3);
  });

  it("applies severity FATAL mapping", () => {
    const event = buildVolumeGroupEvent(baseVolumeGroup, { severity: "FATAL" });
    expect(event).toBeDefined();
    expect(event!.severitytext).toBe("FATAL");
    expect(event!.severitynumber).toBe(5);
  });

  it("returns undefined for DRAFT volume group", () => {
    const event = buildVolumeGroupEvent(draftVolumeGroup);
    expect(event).toBeUndefined();
  });

  it("buildVolumeGroupEvents includes undefined for DRAFT volume group", () => {
    const events = buildVolumeGroupEvents({
      published: baseVolumeGroup,
      draft: draftVolumeGroup,
    });
    expect(events).toHaveLength(2);
    const publishedEvent = events.find(
      (e) => e && e.subject === "volume-group/volume-group-1",
    );
    expect(publishedEvent).toBeDefined();
    const draftEvent = events.find(
      (e) => e?.subject === "volume-group/volume-group-draft",
    );
    expect(draftEvent).toBeUndefined();
    expect(events.filter((e) => e === undefined)).toHaveLength(1);
  });

  it("builds event for INT status", () => {
    const event = buildVolumeGroupEvent(disabledVolumeGroup);
    expect(event).toBeDefined();
    expect(event!.type).toBe(
      "uk.nhs.notify.supplier-config.volume-group.int.v1",
    );
    expect(event!.subject).toBe("volume-group/volume-group-disabled");
    expect(event!.partitionkey).toBe(disabledVolumeGroup.id);
  });

  it("builds event with TRACE severity", () => {
    const event = buildVolumeGroupEvent(baseVolumeGroup, { severity: "TRACE" });
    expect(event).toBeDefined();
    expect(event!.severitytext).toBe("TRACE");
    expect(event!.severitynumber).toBe(0);
  });

  it("builds event with DEBUG severity", () => {
    const event = buildVolumeGroupEvent(baseVolumeGroup, { severity: "DEBUG" });
    expect(event).toBeDefined();
    expect(event!.severitytext).toBe("DEBUG");
    expect(event!.severitynumber).toBe(1);
  });

  it("includes partitionkey and valid traceparent format", () => {
    const event = buildVolumeGroupEvent(baseVolumeGroup);
    expect(event).toBeDefined();
    expect(event!.partitionkey).toBe(baseVolumeGroup.id);
    expect(event!.traceparent).toMatch(/^00-[0-9a-f]{32}-[0-9a-f]{16}-01$/);
  });

  it("uses custom config env overrides for source and dataschema version", () => {
    const originalEnv = { ...process.env };
    try {
      process.env.EVENT_ENV = "staging";
      process.env.EVENT_SERVICE = "custom-service";
      process.env.EVENT_DATASCHEMAVERSION = "1.9.9"; // must start with major '1.' per schema regex
      const cfg = configFromEnv();
      const event = buildVolumeGroupEvent(baseVolumeGroup, {}, cfg);
      expect(event).toBeDefined();
      expect(event!.source).toBe(
        "/control-plane/supplier-config/staging/custom-service",
      );
      expect(event!.dataschema).toMatch(
        /volume-group.prod\.1\.9\.9\.schema\.json$/,
      );
    } finally {
      process.env = originalEnv; // restore
    }
  });

  it("throws error when specialised schema missing (unknown status)", () => {
    // Force an invalid status not in volumeGroupEvents map
    const bogus = { ...baseVolumeGroup, status: "ARCHIVED" as any };
    expect(() => buildVolumeGroupEvent(bogus as VolumeGroup)).toThrow(
      /No specialised event schema found for status ARCHIVED/,
    );
  });
});
