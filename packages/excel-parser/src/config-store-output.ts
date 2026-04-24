import { mkdir, rm, writeFile } from "node:fs/promises";
import path from "node:path";

import { stringifyJsonWithSortedKeys } from "./json-output";
import type { ParseResult } from "./parse-excel";

type ConfigStoreEntityDirectory =
  | "volume-group"
  | "letter-variant"
  | "pack-specification"
  | "supplier"
  | "supplier-allocation"
  | "supplier-pack";

type ConfigStoreRecord = {
  entity: ConfigStoreEntityDirectory;
  id: string;
  data: unknown;
};

export interface WriteConfigStoreOptions {
  pretty?: boolean;
}

const persistedEntityDirectories: readonly ConfigStoreEntityDirectory[] = [
  "volume-group",
  "letter-variant",
  "pack-specification",
  "supplier",
  "supplier-allocation",
  "supplier-pack",
];

function assertSafeRecordId(id: string): void {
  if (id.length === 0) {
    throw new Error("Config store record ids must not be empty.");
  }
}

function encodeRecordIdForFileName(id: string): string {
  return [...id]
    .map((character) =>
      /^[a-z0-9-]$/u.test(character)
        ? character
        : Buffer.from(character, "utf8")
            .toString("hex")
            .replaceAll(/(..)/gu, "%$1")
            .toUpperCase(),
    )
    .join("");
}

function sortById<T extends { id: string }>(records: T[]): T[] {
  return [...records].toSorted((left, right) =>
    left.id.localeCompare(right.id),
  );
}

function buildConfigStoreRecords(result: ParseResult): ConfigStoreRecord[] {
  return [
    ...sortById(Object.values(result.volumeGroups)).map((data) => ({
      entity: "volume-group" as const,
      id: data.id,
      data,
    })),
    ...sortById(Object.values(result.variants)).map((data) => ({
      entity: "letter-variant" as const,
      id: data.id,
      data,
    })),
    ...sortById(Object.values(result.packs)).map((data) => ({
      entity: "pack-specification" as const,
      id: data.id,
      data,
    })),
    ...sortById(Object.values(result.suppliers)).map((data) => ({
      entity: "supplier" as const,
      id: data.id,
      data,
    })),
    ...sortById(Object.values(result.allocations)).map((data) => ({
      entity: "supplier-allocation" as const,
      id: data.id,
      data,
    })),
    ...sortById(Object.values(result.supplierPacks)).map((data) => ({
      entity: "supplier-pack" as const,
      id: data.id,
      data,
    })),
  ];
}

function assertUniqueOutputFiles(records: ConfigStoreRecord[]): void {
  const seen = new Map<string, string>();

  for (const record of records) {
    const encodedId = encodeRecordIdForFileName(record.id);
    const key = `${record.entity}:${encodedId}`;
    const existing = seen.get(key);

    if (existing) {
      throw new Error(
        `Duplicate config store filename generated for entity '${record.entity}': '${existing}' and '${record.id}'`,
      );
    }

    seen.set(key, record.id);
  }
}

export async function writeParseResultToConfigStore(
  result: ParseResult,
  outputDir: string,
  options: WriteConfigStoreOptions = {},
): Promise<string> {
  const resolvedOutputDir = path.resolve(outputDir);
  const jsonSpacing = options.pretty ? 2 : undefined;
  const records = buildConfigStoreRecords(result);

  assertUniqueOutputFiles(records);

  // eslint-disable-next-line security/detect-non-literal-fs-filename
  await mkdir(resolvedOutputDir, { recursive: true });

  await Promise.all(
    persistedEntityDirectories.map(async (entity) => {
      const entityDir = path.join(resolvedOutputDir, entity);
      await rm(entityDir, { recursive: true, force: true });
      // eslint-disable-next-line security/detect-non-literal-fs-filename
      await mkdir(entityDir, { recursive: true });
    }),
  );

  await Promise.all(
    records.map(async ({ data, entity, id }) => {
      assertSafeRecordId(id);

      const outputFile = path.join(
        resolvedOutputDir,
        entity,
        `${encodeRecordIdForFileName(id)}.json`,
      );
      const serialized = `${stringifyJsonWithSortedKeys(data, jsonSpacing)}\n`;

      // eslint-disable-next-line security/detect-non-literal-fs-filename
      await writeFile(outputFile, serialized, "utf8");
    }),
  );

  return resolvedOutputDir;
}
