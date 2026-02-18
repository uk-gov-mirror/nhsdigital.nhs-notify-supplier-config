// eslint-disable-next-line import-x/no-extraneous-dependencies
import { generateMermaidDiagram } from "zod-mermaid";
import fs from "node:fs";
import path from "node:path";
import { z } from "zod";
import {
  $VolumeGroup, $Envelope,
  $LetterVariant,
  $PackSpecification, $Supplier,
  $SupplierAllocation,
  $SupplierPack, $Constraint,
} from "../domain";

// eslint-disable-next-line security/detect-non-literal-fs-filename
const out = fs.openSync(`${path.dirname(__filename)}/../domain/erd.md`, "w");

fs.writeSync(
  out,
  `# Event domain ERD

This document contains the mermaid diagrams for the event domain model.

The schemas are generated from Zod definitions and provide a visual representation of the data structure.
`,
);

for (const [name, schema] of Object.entries({
  AllSchemas: [
    $LetterVariant,
    $PackSpecification,
    $VolumeGroup,
    $Supplier,
    $SupplierAllocation,
    $SupplierPack,
    $Envelope,
  ],
  LetterVariant: [$LetterVariant],
  PackSpecification: [$PackSpecification, $Envelope],
  SupplierAllocation: [$VolumeGroup, $Supplier, $SupplierAllocation],
  SupplierPack: [$SupplierPack],
})) {
  const mermaid = generateMermaidDiagram(schema);
  fs.writeSync(
    out,
    `
## ${name} schema

${z.globalRegistry.get(schema[0])?.description}

\`\`\`mermaid
${mermaid}
\`\`\`
`,
  );
}

fs.closeSync(out);
