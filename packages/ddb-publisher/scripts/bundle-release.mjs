// eslint-disable no-console
import { mkdir, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import esbuild from "esbuild";

const { dirname, resolve } = path;

// Bundles the ddb-publisher CLI into a single CommonJS file for the GitHub Action
// release artifact.
//
// Output (relative to this package root):
//   artifacts/ddb-publish/index.cjs
//
// The release workflow tars up the `artifacts/ddb-publish` directory.

const packageRoot = resolve(fileURLToPath(new URL("..", import.meta.url)));
const repoRoot = resolve(packageRoot, "../..");

const outDir = resolve(packageRoot, "artifacts/ddb-publish");
const outFile = resolve(outDir, "index.cjs");

await rm(outDir, { recursive: true, force: true });
await mkdir(dirname(outFile), { recursive: true });

const schemasRoot = resolve(repoRoot, "packages/events");

console.log("[bundle-release] repoRoot=", repoRoot);
console.log("[bundle-release] packageRoot=", packageRoot);
console.log("[bundle-release] schemasRoot=", schemasRoot);
console.log("[bundle-release] outFile=", outFile);

await esbuild.build({
  absWorkingDir: repoRoot,
  entryPoints: [resolve(packageRoot, "src/cli.ts")],
  outfile: outFile,
  bundle: true,
  platform: "node",
  // Use a conservative target so the bundle runs on GitHub-hosted runners.
  target: "node20",
  format: "cjs",
  sourcemap: false,
  logLevel: "debug",
  banner: {
    js: [
      "// Polyfill for libs that reference import.meta.url even in CJS builds (e.g. yargs-parser)",
      "globalThis.__IMPORT_META_URL__ = require('node:url').pathToFileURL(__filename).href;",
    ].join("\n"),
  },
  define: {
    "import.meta.url": "globalThis.__IMPORT_META_URL__",
    // yargs may reference `import.meta.resolve(...)` but we bundle as CJS.
    // Make it explicitly unavailable to avoid esbuild emitting confusing debug warnings.
    "import.meta.resolve": "undefined",
  },
  alias: {
    // Bundle against the workspace sources instead of relying on the package
    // being built/linked into node_modules.
    "@nhsdigital/nhs-notify-event-schemas-supplier-config": resolve(
      schemasRoot,
      "src/index.ts",
    ),
    "@nhsdigital/nhs-notify-event-schemas-supplier-config/src": resolve(
      schemasRoot,
      "src",
    ),
  },
});

// Add a small marker file to make the tarball contents obvious when debugging.
await writeFile(resolve(outDir, "README.txt"), "ddb-publish bundle\n", "utf8");
