import fs from "fs/promises";
import path from "path";
import { z } from "zod";
import {
  $PackSpecificationStorage,
  type PackSpecificationStorage,
  type PackSpecificationFormData,
  $EnvelopeStorage,
  type EnvelopeStorage,
  type EnvelopeFormData,
  $InsertStorage,
  type InsertStorage,
  type InsertFormData,
  $PaperStorage,
  type PaperStorage,
  type PaperFormData,
  $PostageStorage,
  type PostageStorage,
  type PostageFormData,
} from "./schemas";

// Re-export types for convenience
export type {
  PackSpecificationStorage,
  PackSpecificationFormData,
  EnvelopeStorage,
  EnvelopeFormData,
  InsertStorage,
  InsertFormData,
  PaperStorage,
  PaperFormData,
  PostageStorage,
  PostageFormData,
};

const DATA_BASE_DIR = path.join(process.cwd(), "data");

type EntityType = "specifications" | "envelopes" | "inserts" | "papers" | "postages";

async function ensureDataDir(entityType: EntityType) {
  const dir = path.join(DATA_BASE_DIR, entityType);
  try {
    await fs.access(dir);
  } catch {
    await fs.mkdir(dir, { recursive: true });
  }
  return dir;
}

function getFilePath(entityType: EntityType, id: string): string {
  return path.join(DATA_BASE_DIR, entityType, `${id}.json`);
}

// Generic CRUD operations for any entity type
async function listEntities<T>(
  entityType: EntityType,
  schema: z.ZodType<T>
): Promise<T[]> {
  const dir = await ensureDataDir(entityType);
  try {
    const files = await fs.readdir(dir);
    const jsonFiles = files.filter((f) => f.endsWith(".json"));
    const entities = await Promise.all(
      jsonFiles.map(async (file) => {
        const content = await fs.readFile(path.join(dir, file), "utf-8");
        return schema.parse(JSON.parse(content));
      })
    );
    return entities;
  } catch {
    return [];
  }
}

async function getEntity<T>(
  entityType: EntityType,
  id: string,
  schema: z.ZodType<T>
): Promise<T | null> {
  await ensureDataDir(entityType);
  try {
    const content = await fs.readFile(getFilePath(entityType, id), "utf-8");
    return schema.parse(JSON.parse(content));
  } catch {
    return null;
  }
}

async function saveEntity<T>(
  entityType: EntityType,
  id: string,
  data: T
): Promise<void> {
  await ensureDataDir(entityType);
  await fs.writeFile(getFilePath(entityType, id), JSON.stringify(data, null, 2));
}

async function deleteEntity(entityType: EntityType, id: string): Promise<void> {
  await ensureDataDir(entityType);
  try {
    await fs.unlink(getFilePath(entityType, id));
  } catch {
    throw new Error(`${entityType} ${id} not found`);
  }
}

// =============================================================================
// Config Repository - handles all entity types
// =============================================================================
export class ConfigRepo {
  // -------------------------------------------------------------------------
  // Pack Specifications
  // -------------------------------------------------------------------------
  async listSpecifications(): Promise<PackSpecificationStorage[]> {
    return listEntities("specifications", $PackSpecificationStorage);
  }

  async getSpecification(id: string): Promise<PackSpecificationStorage | null> {
    return getEntity("specifications", id, $PackSpecificationStorage);
  }

  async createSpecification(input: PackSpecificationFormData): Promise<PackSpecificationStorage> {
    const now = new Date().toISOString();
    const id = `pack-spec-${Date.now()}`;
    const spec: PackSpecificationStorage = {
      ...input,
      id,
      createdAt: now,
      updatedAt: now,
      version: 1,
    };
    await saveEntity("specifications", id, spec);
    return spec;
  }

  async updateSpecification(id: string, input: Partial<PackSpecificationFormData>): Promise<PackSpecificationStorage> {
    const existing = await this.getSpecification(id);
    if (!existing) throw new Error(`Specification ${id} not found`);
    const updated: PackSpecificationStorage = {
      ...existing,
      ...input,
      id: existing.id,
      createdAt: existing.createdAt,
      updatedAt: new Date().toISOString(),
      version: existing.version + 1,
    };
    await saveEntity("specifications", id, updated);
    return updated;
  }

  async deleteSpecification(id: string): Promise<void> {
    return deleteEntity("specifications", id);
  }

  // -------------------------------------------------------------------------
  // Envelopes
  // -------------------------------------------------------------------------
  async listEnvelopes(): Promise<EnvelopeStorage[]> {
    return listEntities("envelopes", $EnvelopeStorage);
  }

  async getEnvelope(id: string): Promise<EnvelopeStorage | null> {
    return getEntity("envelopes", id, $EnvelopeStorage);
  }

  async createEnvelope(input: EnvelopeFormData): Promise<EnvelopeStorage> {
    const now = new Date().toISOString();
    const id = `envelope-${Date.now()}`;
    const envelope: EnvelopeStorage = { ...input, id, createdAt: now, updatedAt: now };
    await saveEntity("envelopes", id, envelope);
    return envelope;
  }

  async updateEnvelope(id: string, input: Partial<EnvelopeFormData>): Promise<EnvelopeStorage> {
    const existing = await this.getEnvelope(id);
    if (!existing) throw new Error(`Envelope ${id} not found`);
    const updated: EnvelopeStorage = {
      ...existing,
      ...input,
      id: existing.id,
      createdAt: existing.createdAt,
      updatedAt: new Date().toISOString(),
    };
    await saveEntity("envelopes", id, updated);
    return updated;
  }

  async deleteEnvelope(id: string): Promise<void> {
    return deleteEntity("envelopes", id);
  }

  // -------------------------------------------------------------------------
  // Inserts
  // -------------------------------------------------------------------------
  async listInserts(): Promise<InsertStorage[]> {
    return listEntities("inserts", $InsertStorage);
  }

  async getInsert(id: string): Promise<InsertStorage | null> {
    return getEntity("inserts", id, $InsertStorage);
  }

  async createInsert(input: InsertFormData): Promise<InsertStorage> {
    const now = new Date().toISOString();
    const id = `insert-${Date.now()}`;
    const insert: InsertStorage = { ...input, id, createdAt: now, updatedAt: now };
    await saveEntity("inserts", id, insert);
    return insert;
  }

  async updateInsert(id: string, input: Partial<InsertFormData>): Promise<InsertStorage> {
    const existing = await this.getInsert(id);
    if (!existing) throw new Error(`Insert ${id} not found`);
    const updated: InsertStorage = {
      ...existing,
      ...input,
      id: existing.id,
      createdAt: existing.createdAt,
      updatedAt: new Date().toISOString(),
    };
    await saveEntity("inserts", id, updated);
    return updated;
  }

  async deleteInsert(id: string): Promise<void> {
    return deleteEntity("inserts", id);
  }

  // -------------------------------------------------------------------------
  // Papers
  // -------------------------------------------------------------------------
  async listPapers(): Promise<PaperStorage[]> {
    return listEntities("papers", $PaperStorage);
  }

  async getPaper(id: string): Promise<PaperStorage | null> {
    return getEntity("papers", id, $PaperStorage);
  }

  async createPaper(input: PaperFormData): Promise<PaperStorage> {
    const now = new Date().toISOString();
    const id = `paper-${Date.now()}`;
    const paper: PaperStorage = { ...input, id, createdAt: now, updatedAt: now };
    await saveEntity("papers", id, paper);
    return paper;
  }

  async updatePaper(id: string, input: Partial<PaperFormData>): Promise<PaperStorage> {
    const existing = await this.getPaper(id);
    if (!existing) throw new Error(`Paper ${id} not found`);
    const updated: PaperStorage = {
      ...existing,
      ...input,
      id: existing.id,
      createdAt: existing.createdAt,
      updatedAt: new Date().toISOString(),
    };
    await saveEntity("papers", id, updated);
    return updated;
  }

  async deletePaper(id: string): Promise<void> {
    return deleteEntity("papers", id);
  }

  // -------------------------------------------------------------------------
  // Postages
  // -------------------------------------------------------------------------
  async listPostages(): Promise<PostageStorage[]> {
    return listEntities("postages", $PostageStorage);
  }

  async getPostage(id: string): Promise<PostageStorage | null> {
    return getEntity("postages", id, $PostageStorage);
  }

  async createPostage(input: PostageFormData): Promise<PostageStorage> {
    const now = new Date().toISOString();
    const id = `postage-${Date.now()}`;
    const postage: PostageStorage = { ...input, id, createdAt: now, updatedAt: now };
    await saveEntity("postages", id, postage);
    return postage;
  }

  async updatePostage(id: string, input: Partial<PostageFormData>): Promise<PostageStorage> {
    const existing = await this.getPostage(id);
    if (!existing) throw new Error(`Postage ${id} not found`);
    const updated: PostageStorage = {
      ...existing,
      ...input,
      id: existing.id,
      createdAt: existing.createdAt,
      updatedAt: new Date().toISOString(),
    };
    await saveEntity("postages", id, updated);
    return updated;
  }

  async deletePostage(id: string): Promise<void> {
    return deleteEntity("postages", id);
  }
}
