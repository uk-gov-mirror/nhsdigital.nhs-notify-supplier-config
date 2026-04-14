import { readFile, readdir } from "node:fs/promises";
import path from "node:path";

import type {
  ConfigRecord,
  DomainEntityName,
  LoadedConfigStore,
} from "@supplier-config/file-store";

const persistedEntityDirectoryAllowList: readonly DomainEntityName[] = [
  "volume-group",
  "letter-variant",
  "pack-specification",
  "supplier",
  "supplier-allocation",
  "supplier-pack",
];

function isPersistedEntityDirName(name: string): name is DomainEntityName {
  return (persistedEntityDirectoryAllowList as readonly string[]).includes(
    name,
  );
}

async function readConfigRecord(
  entity: DomainEntityName,
  entityDir: string,
  file: string,
): Promise<ConfigRecord> {
  const sourceFilePath = path.join(entityDir, file);
  const id = file.replace(/\.json$/iu, "");
  const raw = await readFile(sourceFilePath, "utf8");

  let data: unknown;
  try {
    data = JSON.parse(raw);
  } catch (error) {
    throw new Error(`Invalid JSON in ${sourceFilePath}`, {
      cause: error as Error,
    });
  }

  return {
    entity,
    sourceFilePath,
    id,
    data,
  };
}

async function readEntityRecords(
  resolvedRoot: string,
  entity: DomainEntityName,
): Promise<ConfigRecord[]> {
  const entityDir = path.join(resolvedRoot, entity);
  const files = await readdir(entityDir);
  const jsonFiles = files.filter(
    (file) => path.extname(file).toLowerCase() === ".json",
  );

  return Promise.all(
    jsonFiles.map(async (file) => readConfigRecord(entity, entityDir, file)),
  );
}

/**
 * Load all records from a config store on disk. Validation is not performed on the records at this stage beyond
 * parsing the JSON - this function will throw if any file contains invalid JSON, but it will not check that the
 * data conforms to any particular schema or contains expected fields.
 * @param rootPath
 */
const loadConfigStore = async (
  rootPath: string,
): Promise<LoadedConfigStore> => {
  const resolvedRoot = path.resolve(rootPath);

  let dirents: string[];
  try {
    dirents = await readdir(resolvedRoot);
  } catch (error) {
    throw new Error(`Config store root path not readable: ${resolvedRoot}`, {
      cause: error as Error,
    });
  }

  const entities = dirents.filter(isPersistedEntityDirName);
  const recordGroups = await Promise.all(
    entities.map(async (entity) => readEntityRecords(resolvedRoot, entity)),
  );

  return {
    rootPath: resolvedRoot,
    records: recordGroups.flat(),
  };
};

export default loadConfigStore;
