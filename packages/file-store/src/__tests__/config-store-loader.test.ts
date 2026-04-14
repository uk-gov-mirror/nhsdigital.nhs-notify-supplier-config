import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";

import { loadConfigStore } from "@supplier-config/file-store";

const exampleConfigStoreRoot = path.resolve(
  __dirname,
  "../../../../tests/example-config-store",
);

async function createTempConfigStore(): Promise<string> {
  return mkdtemp(path.join(tmpdir(), "file-store-loader-"));
}

describe("loadConfigStore", () => {
  it("should load all JSON records from the shared example config store", async () => {
    const store = await loadConfigStore(exampleConfigStoreRoot);

    expect(store.rootPath).toBe(exampleConfigStoreRoot);
    expect(store.records).toHaveLength(6);
    expect(
      store.records
        .map((record) => `${record.entity}:${record.id}`)
        .toSorted((left, right) => left.localeCompare(right)),
    ).toEqual([
      "letter-variant:lv-1",
      "pack-specification:pack-spec-1",
      "supplier-allocation:alloc-1",
      "supplier-pack:sp-1",
      "supplier:sup-1",
      "volume-group:vg-1",
    ]);
  });

  it("should ignore non-json files and non-persisted directories", async () => {
    const root = await createTempConfigStore();

    try {
      await mkdir(path.join(root, "supplier"), { recursive: true });
      await mkdir(path.join(root, "channel"), { recursive: true });
      await mkdir(path.join(root, "unexpected-folder"), { recursive: true });
      await writeFile(
        path.join(root, "supplier", "sup-1.json"),
        JSON.stringify({ ok: true }),
        "utf8",
      );
      await writeFile(
        path.join(root, "supplier", "notes.txt"),
        "ignore me",
        "utf8",
      );
      await writeFile(
        path.join(root, "unexpected-folder", "skip.json"),
        JSON.stringify({ ignored: true }),
        "utf8",
      );
      await writeFile(
        path.join(root, "channel", "letter.json"),
        JSON.stringify("LETTER"),
        "utf8",
      );

      const store = await loadConfigStore(root);

      expect(store.records).toEqual([
        {
          entity: "supplier",
          sourceFilePath: path.join(root, "supplier", "sup-1.json"),
          id: "sup-1",
          data: { ok: true },
        },
      ]);
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  });

  it("should throw when the root path is not readable", async () => {
    const missingRoot = path.join(
      tmpdir(),
      `file-store-loader-missing-${Date.now()}`,
    );

    await expect(loadConfigStore(missingRoot)).rejects.toThrow(
      `Config store root path not readable: ${path.resolve(missingRoot)}`,
    );
  });

  it("should throw when a JSON file cannot be parsed", async () => {
    const root = await createTempConfigStore();

    try {
      await mkdir(path.join(root, "supplier"), { recursive: true });
      await writeFile(path.join(root, "supplier", "bad.json"), "{", "utf8");

      await expect(loadConfigStore(root)).rejects.toThrow(
        `Invalid JSON in ${path.join(root, "supplier", "bad.json")}`,
      );
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  });
});
