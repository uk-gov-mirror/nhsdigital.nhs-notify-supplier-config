import fs from "node:fs";
import path from "node:path";
import {
  EventBridgeClient,
  PutEventsCommand,
} from "@aws-sdk/client-eventbridge";
import { parseExcelFile } from "@supplier-config/excel-parser";
import { buildLetterVariantEvents } from "@supplier-config/event-builder/letter-variant-event-builder";
import { buildPackSpecificationEvents } from "@supplier-config/event-builder/pack-specification-event-builder";
import { buildVolumeGroupEvents } from "@supplier-config/event-builder/volume-group-event-builder";
import { buildSupplierEvents } from "@supplier-config/event-builder/supplier-event-builder";
import { buildSupplierAllocationEvents } from "@supplier-config/event-builder/supplier-allocation-event-builder";
import { buildSupplierPackEvents } from "@supplier-config/event-builder/supplier-pack-event-builder";
import {
  chunk,
  ensureFile,
  handleParse,
  handlePublish,
} from "../eventbus-publisher";

jest.mock("node:fs");
jest.mock("@aws-sdk/client-eventbridge");
jest.mock("@supplier-config/excel-parser");
jest.mock("@supplier-config/event-builder/letter-variant-event-builder");
jest.mock("@supplier-config/event-builder/pack-specification-event-builder");
jest.mock("@supplier-config/event-builder/volume-group-event-builder");
jest.mock("@supplier-config/event-builder/supplier-event-builder");
jest.mock("@supplier-config/event-builder/supplier-allocation-event-builder");
jest.mock("@supplier-config/event-builder/supplier-pack-event-builder");

const mockStatSync = fs.statSync as jest.MockedFunction<typeof fs.statSync>;
const mockParseExcelFile = parseExcelFile as jest.MockedFunction<
  typeof parseExcelFile
>;
const mockBuildLetterVariantEvents =
  buildLetterVariantEvents as jest.MockedFunction<
    typeof buildLetterVariantEvents
  >;
const mockBuildPackSpecificationEvents =
  buildPackSpecificationEvents as jest.MockedFunction<
    typeof buildPackSpecificationEvents
  >;
const mockBuildVolumeGroupEvents =
  buildVolumeGroupEvents as jest.MockedFunction<typeof buildVolumeGroupEvents>;
const mockBuildSupplierEvents = buildSupplierEvents as jest.MockedFunction<
  typeof buildSupplierEvents
>;
const mockBuildSupplierAllocationEvents =
  buildSupplierAllocationEvents as jest.MockedFunction<
    typeof buildSupplierAllocationEvents
  >;
const mockBuildSupplierPackEvents =
  buildSupplierPackEvents as jest.MockedFunction<
    typeof buildSupplierPackEvents
  >;

describe("eventbus-publisher", () => {
  let consoleLogSpy: jest.SpyInstance;
  let consoleErrorSpy: jest.SpyInstance;

  beforeEach(() => {
    jest.clearAllMocks();
    consoleLogSpy = jest.spyOn(console, "log").mockImplementation();
    consoleErrorSpy = jest.spyOn(console, "error").mockImplementation();
  });

  afterEach(() => {
    consoleLogSpy.mockRestore();
    consoleErrorSpy.mockRestore();
  });

  describe("ensureFile", () => {
    it("should return absolute path if provided", () => {
      const absolutePath = "/absolute/path/to/test.xlsx";
      mockStatSync.mockReturnValue({} as fs.Stats);

      const result = ensureFile(absolutePath);

      expect(result).toBe(absolutePath);
      expect(mockStatSync).toHaveBeenCalledWith(absolutePath);
    });

    it("should resolve relative path to absolute", () => {
      const relativePath = "test.xlsx";
      mockStatSync.mockReturnValue({} as fs.Stats);

      const result = ensureFile(relativePath);

      expect(result).toBe(path.join(process.cwd(), relativePath));
      expect(mockStatSync).toHaveBeenCalledWith(
        path.join(process.cwd(), relativePath),
      );
    });

    it("should throw error if file does not have .xlsx extension", () => {
      expect(() => ensureFile("test.csv")).toThrow(
        "Input file must be an .xlsx file",
      );
      expect(() => ensureFile("test.txt")).toThrow(
        "Input file must be an .xlsx file",
      );
      expect(() => ensureFile("test")).toThrow(
        "Input file must be an .xlsx file",
      );
    });

    it("should throw error if file does not exist", () => {
      mockStatSync.mockImplementation(() => {
        throw new Error("ENOENT: no such file or directory");
      });

      expect(() => ensureFile("test.xlsx")).toThrow("Input file not found");
    });

    it("should be case-insensitive for .xlsx extension", () => {
      mockStatSync.mockReturnValue({} as fs.Stats);

      expect(() => ensureFile("test.XLSX")).not.toThrow();
      expect(() => ensureFile("test.XlSx")).not.toThrow();
    });
  });

  describe("chunk", () => {
    it("should split array into chunks of specified size", () => {
      const arr = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
      const result = chunk(arr, 3);

      expect(result).toEqual([[1, 2, 3], [4, 5, 6], [7, 8, 9], [10]]);
    });

    it("should handle empty array", () => {
      const result = chunk([], 5);

      expect(result).toEqual([]);
    });

    it("should handle array smaller than chunk size", () => {
      const arr = [1, 2, 3];
      const result = chunk(arr, 10);

      expect(result).toEqual([[1, 2, 3]]);
    });

    it("should handle array exactly matching chunk size", () => {
      const arr = [1, 2, 3, 4, 5];
      const result = chunk(arr, 5);

      expect(result).toEqual([[1, 2, 3, 4, 5]]);
    });

    it("should handle chunk size of 1", () => {
      const arr = [1, 2, 3];
      const result = chunk(arr, 1);

      expect(result).toEqual([[1], [2], [3]]);
    });
  });

  describe("handleParse", () => {
    it("should parse an Excel file and return the results", async () => {
      const mockResult = {
        packs: { pack1: {} },
        variants: { variant1: {}, variant2: {} },
        volumeGroups: { vg1: {} },
        suppliers: { supplier1: {}, supplier2: {}, supplier3: {} },
        allocations: { alloc1: {} },
        supplierPacks: { sp1: {}, sp2: {} },
      };

      mockStatSync.mockReturnValue({} as fs.Stats);
      mockParseExcelFile.mockReturnValue(mockResult as any);

      const result = await handleParse({ file: "test.xlsx" });

      expect(mockStatSync).toHaveBeenCalledWith(
        expect.stringContaining("test.xlsx"),
      );
      expect(mockParseExcelFile).toHaveBeenCalledWith(
        expect.stringContaining("test.xlsx"),
      );
      expect(result).toEqual(mockResult);
      expect(Object.keys(result.packs).length).toBe(1);
      expect(Object.keys(result.variants).length).toBe(2);
      expect(Object.keys(result.volumeGroups).length).toBe(1);
      expect(Object.keys(result.suppliers).length).toBe(3);
      expect(Object.keys(result.allocations).length).toBe(1);
      expect(Object.keys(result.supplierPacks).length).toBe(2);
    });

    it("should handle absolute file paths", async () => {
      const mockResult = {
        packs: {},
        variants: {},
        volumeGroups: {},
        suppliers: {},
        allocations: {},
        supplierPacks: {},
      };

      mockStatSync.mockReturnValue({} as fs.Stats);
      mockParseExcelFile.mockReturnValue(mockResult as any);

      const absolutePath = "/absolute/path/to/test.xlsx";
      const result = await handleParse({ file: absolutePath });

      expect(mockParseExcelFile).toHaveBeenCalledWith(absolutePath);
      expect(result).toEqual(mockResult);
    });

    it("should throw an error if the file does not exist", async () => {
      mockStatSync.mockImplementation(() => {
        throw new Error("ENOENT");
      });

      await expect(handleParse({ file: "nonexistent.xlsx" })).rejects.toThrow(
        "Input file not found",
      );
    });

    it("should throw an error if the file is not an xlsx file", async () => {
      await expect(handleParse({ file: "test.txt" })).rejects.toThrow(
        "Input file must be an .xlsx file",
      );
    });
  });

  describe("handlePublish", () => {
    const mockParsedData = {
      packs: { pack1: {} },
      variants: { variant1: {} },
      volumeGroups: { vg1: {} },
      suppliers: { supplier1: {} },
      allocations: { alloc1: {} },
      supplierPacks: { sp1: {} },
    };

    beforeEach(() => {
      mockStatSync.mockReturnValue({} as fs.Stats);
      mockParseExcelFile.mockReturnValue(mockParsedData as any);

      mockBuildVolumeGroupEvents.mockReturnValue([
        {
          type: "VolumeGroup.Created",
          source: "/control-plane/supplier-config/dev/events",
          subject: "urn:nhs:notify:supplier-config:volume-group:vg1",
          time: "2026-01-01T00:00:00Z",
          sequence: "0000000001",
          data: {} as any,
        },
      ]);

      mockBuildSupplierEvents.mockReturnValue([
        {
          type: "Supplier.Created",
          source: "/control-plane/supplier-config/dev/events",
          subject: "urn:nhs:notify:supplier-config:supplier:supplier1",
          time: "2026-01-01T00:00:00Z",
          sequence: "0000000002",
          data: {} as any,
        },
      ]);

      mockBuildPackSpecificationEvents.mockReturnValue([
        {
          type: "PackSpecification.Created",
          source: "/control-plane/supplier-config/dev/events",
          subject: "urn:nhs:notify:supplier-config:pack-specification:pack1",
          time: "2026-01-01T00:00:00Z",
          sequence: "0000000003",
          data: {} as any,
        },
      ]);

      mockBuildSupplierPackEvents.mockReturnValue([
        {
          type: "SupplierPack.Created",
          source: "/control-plane/supplier-config/dev/events",
          subject: "urn:nhs:notify:supplier-config:supplier-pack:sp1",
          time: "2026-01-01T00:00:00Z",
          sequence: "0000000004",
          data: {} as any,
        },
      ]);

      mockBuildLetterVariantEvents.mockReturnValue([
        {
          type: "LetterVariant.Created",
          source: "/control-plane/supplier-config/dev/events",
          subject: "urn:nhs:notify:supplier-config:letter-variant:variant1",
          time: "2026-01-01T00:00:00Z",
          sequence: "0000000005",
          data: {} as any,
        },
      ]);

      mockBuildSupplierAllocationEvents.mockReturnValue([
        {
          type: "SupplierAllocation.Created",
          source: "/control-plane/supplier-config/dev/events",
          subject: "urn:nhs:notify:supplier-config:supplier-allocation:alloc1",
          time: "2026-01-01T00:00:00Z",
          sequence: "0000000006",
          data: {} as any,
        },
      ]);
    });

    it("should publish events successfully with dry-run mode", async () => {
      const result = await handlePublish({
        file: "test.xlsx",
        bus: "test-bus",
        dryRun: true,
      });

      expect(mockParseExcelFile).toHaveBeenCalled();
      expect(result.success).toBe(true);
      expect(result.eventCount).toBe(6); // All 6 mocked events
      expect(result.error).toBeUndefined();
      expect(EventBridgeClient).not.toHaveBeenCalled();
    });

    it("should publish events to EventBridge successfully", async () => {
      const mockSend = jest.fn().mockResolvedValue({
        FailedEntryCount: 0,
        Entries: [],
      });

      (
        EventBridgeClient as jest.MockedClass<typeof EventBridgeClient>
      ).mockImplementation(
        () =>
          ({
            send: mockSend,
          }) as any,
      );

      const result = await handlePublish({
        file: "test.xlsx",
        bus: "test-bus",
        region: "us-east-1",
        dryRun: false,
      });

      expect(EventBridgeClient).toHaveBeenCalledWith({ region: "us-east-1" });
      expect(mockSend).toHaveBeenCalledWith(expect.any(PutEventsCommand));
      expect(result.success).toBe(true);
      expect(result.eventCount).toBe(6);
      expect(result.error).toBeUndefined();
    });

    it("should use AWS_REGION environment variable if region not specified", async () => {
      process.env.AWS_REGION = "eu-west-2";

      const mockSend = jest.fn().mockResolvedValue({
        FailedEntryCount: 0,
        Entries: [],
      });

      (
        EventBridgeClient as jest.MockedClass<typeof EventBridgeClient>
      ).mockImplementation(
        () =>
          ({
            send: mockSend,
          }) as any,
      );

      await handlePublish({
        file: "test.xlsx",
        bus: "test-bus",
        dryRun: false,
      });

      expect(EventBridgeClient).toHaveBeenCalledWith({ region: "eu-west-2" });
      delete process.env.AWS_REGION;
    });

    it("should use AWS_DEFAULT_REGION environment variable as fallback", async () => {
      process.env.AWS_DEFAULT_REGION = "ap-southeast-1";

      const mockSend = jest.fn().mockResolvedValue({
        FailedEntryCount: 0,
        Entries: [],
      });

      (
        EventBridgeClient as jest.MockedClass<typeof EventBridgeClient>
      ).mockImplementation(
        () =>
          ({
            send: mockSend,
          }) as any,
      );

      await handlePublish({
        file: "test.xlsx",
        bus: "test-bus",
        dryRun: false,
      });

      expect(EventBridgeClient).toHaveBeenCalledWith({
        region: "ap-southeast-1",
      });
      delete process.env.AWS_DEFAULT_REGION;
    });

    it("should throw an error if no region is specified", async () => {
      delete process.env.AWS_REGION;
      delete process.env.AWS_DEFAULT_REGION;

      await expect(
        handlePublish({
          file: "test.xlsx",
          bus: "test-bus",
          dryRun: false,
        }),
      ).rejects.toThrow("AWS region not specified");
    });

    it("should handle failed event entries", async () => {
      const mockSend = jest.fn().mockResolvedValue({
        FailedEntryCount: 1,
        Entries: [
          { ErrorCode: "ValidationError", ErrorMessage: "Invalid event" },
        ],
      });

      (
        EventBridgeClient as jest.MockedClass<typeof EventBridgeClient>
      ).mockImplementation(
        () =>
          ({
            send: mockSend,
          }) as any,
      );

      const result = await handlePublish({
        file: "test.xlsx",
        bus: "test-bus",
        region: "us-east-1",
        dryRun: false,
      });

      expect(result.success).toBe(false);
      expect(result.eventCount).toBe(6);
      expect(result.error).toContain("PutEvents had 1 failed entries");
    });

    it("should handle errors when sending events", async () => {
      const mockError = new Error("Network error");
      const mockSend = jest.fn().mockRejectedValue(mockError);

      (
        EventBridgeClient as jest.MockedClass<typeof EventBridgeClient>
      ).mockImplementation(
        () =>
          ({
            send: mockSend,
          }) as any,
      );

      const result = await handlePublish({
        file: "test.xlsx",
        bus: "test-bus",
        region: "us-east-1",
        dryRun: false,
      });

      expect(result.success).toBe(false);
      expect(result.eventCount).toBe(6);
      expect(result.error).toContain("Error sending events batch");
      expect(result.error).toContain("Network error");
    });

    it("should batch events in chunks of 10", async () => {
      // Create 25 events to test batching
      const manyEvents = Array.from({ length: 25 }, (_, i) => ({
        type: "VolumeGroup.Created",
        source: "/control-plane/supplier-config/dev/events",
        subject: `urn:nhs:notify:supplier-config:volume-group:vg${i}`,
        time: "2026-01-01T00:00:00Z",
        sequence: `000000000${i}`,
        data: {} as any,
        specversion: "1.0" as const,
        id: `id-${i}`,
        plane: "control" as const,
        dataschema: "test",
        dataschemaversion: "1.0.0",
      }));

      mockBuildVolumeGroupEvents.mockReturnValue(manyEvents as any);
      mockBuildSupplierEvents.mockReturnValue([]);
      mockBuildPackSpecificationEvents.mockReturnValue([]);
      mockBuildSupplierPackEvents.mockReturnValue([]);
      mockBuildLetterVariantEvents.mockReturnValue([]);
      mockBuildSupplierAllocationEvents.mockReturnValue([]);

      const mockSend = jest.fn().mockResolvedValue({
        FailedEntryCount: 0,
        Entries: [],
      });

      (
        EventBridgeClient as jest.MockedClass<typeof EventBridgeClient>
      ).mockImplementation(
        () =>
          ({
            send: mockSend,
          }) as any,
      );

      const result = await handlePublish({
        file: "test.xlsx",
        bus: "test-bus",
        region: "us-east-1",
        dryRun: false,
      });

      // Should be called 3 times: 10 + 10 + 5
      expect(mockSend).toHaveBeenCalledTimes(3);
      expect(result.success).toBe(true);
      expect(result.eventCount).toBe(25);
    });

    it("should filter out undefined volume group events", async () => {
      mockBuildVolumeGroupEvents.mockReturnValue([
        {
          type: "VolumeGroup.Created",
          source: "/control-plane/supplier-config/dev/events",
          subject: "urn:nhs:notify:supplier-config:volume-group:vg1",
          time: "2026-01-01T00:00:00Z",
          sequence: "0000000001",
          data: {} as any,
        },
        undefined,
        {
          type: "VolumeGroup.Created",
          source: "/control-plane/supplier-config/dev/events",
          subject: "urn:nhs:notify:supplier-config:volume-group:vg2",
          time: "2026-01-01T00:00:00Z",
          sequence: "0000000003",
          data: {} as any,
        },
      ]);

      const mockSend = jest.fn().mockResolvedValue({
        FailedEntryCount: 0,
        Entries: [],
      });

      (
        EventBridgeClient as jest.MockedClass<typeof EventBridgeClient>
      ).mockImplementation(
        () =>
          ({
            send: mockSend,
          }) as any,
      );

      const result = await handlePublish({
        file: "test.xlsx",
        bus: "test-bus",
        region: "us-east-1",
        dryRun: false,
      });

      // Should only count non-undefined events (2 VolumeGroup + 5 others = 7 total)
      expect(result.success).toBe(true);
      expect(result.eventCount).toBe(7);
    });

    it("should maintain sequence numbering across all event types", async () => {
      const mockSend = jest.fn().mockResolvedValue({
        FailedEntryCount: 0,
        Entries: [],
      });

      (
        EventBridgeClient as jest.MockedClass<typeof EventBridgeClient>
      ).mockImplementation(
        () =>
          ({
            send: mockSend,
          }) as any,
      );

      await handlePublish({
        file: "test.xlsx",
        bus: "test-bus",
        region: "us-east-1",
        dryRun: false,
      });

      // Verify that all event builders were called with incremented counters
      expect(mockBuildVolumeGroupEvents).toHaveBeenCalledWith(
        mockParsedData.volumeGroups,
        1,
      );
      expect(mockBuildSupplierEvents).toHaveBeenCalledWith(
        mockParsedData.suppliers,
        2,
      );
      expect(mockBuildPackSpecificationEvents).toHaveBeenCalledWith(
        mockParsedData.packs,
        3,
      );
      expect(mockBuildSupplierPackEvents).toHaveBeenCalledWith(
        mockParsedData.supplierPacks,
        4,
      );
    });

    it("should throw an error if the file does not exist", async () => {
      mockStatSync.mockImplementation(() => {
        throw new Error("ENOENT");
      });

      await expect(
        handlePublish({
          file: "nonexistent.xlsx",
          bus: "test-bus",
          region: "us-east-1",
          dryRun: false,
        }),
      ).rejects.toThrow("Input file not found");
    });

    it("should throw an error if the file is not an xlsx file", async () => {
      await expect(
        handlePublish({
          file: "test.csv",
          bus: "test-bus",
          region: "us-east-1",
          dryRun: false,
        }),
      ).rejects.toThrow("Input file must be an .xlsx file");
    });
  });
});
