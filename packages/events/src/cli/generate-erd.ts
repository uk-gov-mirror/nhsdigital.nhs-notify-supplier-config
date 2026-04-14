import { generateMermaidDiagram } from "zod-mermaid";
import fs from "node:fs";
import path from "node:path";
import { z } from "zod";
import {
  $Envelope,
  $LetterVariant,
  $PackSpecification,
  $Supplier,
  $SupplierAllocation,
  $SupplierPack,
  $VolumeGroup,
} from "packages/events/src/domain";

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
