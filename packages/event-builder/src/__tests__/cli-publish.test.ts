import {
  LetterVariant,
  LetterVariantId,
} from "@nhsdigital/nhs-notify-event-schemas-supplier-config/src/domain/letter-variant";
import {
  EventBridgeClient,
  PutEventsCommand,
} from "@aws-sdk/client-eventbridge";
import {
  PackSpecificationId,
  VolumeGroupId,
} from "@nhsdigital/nhs-notify-event-schemas-supplier-config/src";
import { buildLetterVariantEvents } from "../letter-variant-event-builder";

jest.mock("@aws-sdk/client-eventbridge", () => {
  const actual = jest.requireActual("@aws-sdk/client-eventbridge");
  return {
    ...actual,
    EventBridgeClient: jest.fn().mockImplementation(() => ({
      send: jest.fn().mockResolvedValue({ FailedEntryCount: 0 }),
    })),
  };
});

describe("publish cli behaviour (indirect)", () => {
  const variants: Record<string, LetterVariant> = {};
  for (let i = 0; i < 13; i += 1) {
    const id = `${i}`
      .padStart(32, "a")
      .slice(0, 32)
      .replace(/(.{8})(.{4})(.{4})(.{4})(.{12})/, "$1-$2-$3-$4-$5");
    variants[`v${i}`] = {
      id: LetterVariantId(id),
      name: `Variant ${i}`,
      type: "STANDARD",
      volumeGroupId: VolumeGroupId("volume-group-123"),
      status: i % 2 === 0 ? "PROD" : "INT",
      packSpecificationIds: [
        PackSpecificationId("00000000-0000-0000-0000-000000000001"),
      ],
    } satisfies LetterVariant;
  }

  it("buildLetterVariantEvents chunks >10", async () => {
    const events = buildLetterVariantEvents(variants);
    expect(events.length).toBe(13);

    const client = new EventBridgeClient({ region: "eu-west-2" });
    const sendSpy = (client as any).send as jest.Mock;
    for (let i = 0; i < events.length; i += 10) {
      const batch = events.slice(i, i + 10).map((e) => ({
        DetailType: e.type,
        Source: e.source,
        EventBusName: "test-bus",
        Time: new Date(e.time),
        Detail: JSON.stringify(e.data),
        Resources: [e.subject],
      }));

      await client.send(new PutEventsCommand({ Entries: batch }));
    }
    expect(sendSpy).toHaveBeenCalledTimes(2);
    const firstCallArg = sendSpy.mock.calls[0][0] as PutEventsCommand;
    expect((firstCallArg as any).input.Entries).toHaveLength(10);
  });
});
