#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import yargs from "yargs";
import { hideBin } from "yargs/helpers";
import { generateTemplateExcel } from "./template";

interface Arguments {
  output: string;
  force: boolean;
}

async function main() {
  const argv = await yargs(hideBin(process.argv))
    .usage("Usage: $0 <output.xlsx> [options]")
    .command(
      "$0 <output>",
      "Generate a template Excel file with the correct sheet structure and headers",
      (args) => {
        return args.positional("output", {
          describe: "Path to the output Excel file to create",
          type: "string",
          demandOption: true,
        });
      },
    )
    .option("force", {
      alias: "f",
      type: "boolean",
      default: false,
      description: "Overwrite existing file if it exists",
    })
    .example("$0 template.xlsx", "Generate a template file")
    .example(
      "$0 template.xlsx --force",
      "Generate a template file, overwriting if it exists",
    )
    .help("h")
    .alias("h", "help")
    .strict()
    .parseAsync();

  const { force, output } = argv as unknown as Arguments;

  // Resolve output file path
  const resolvedOutput = path.isAbsolute(output)
    ? output
    : path.join(process.cwd(), output);

  // Check if output file has correct extension
  if (!/\.xlsx$/i.test(resolvedOutput)) {
    // eslint-disable-next-line no-console
    console.error(`Error: Output file must end with .xlsx: ${resolvedOutput}`);
    process.exit(1);
  }

  // Check if output file exists and force is not set
  // eslint-disable-next-line security/detect-non-literal-fs-filename
  if (fs.existsSync(resolvedOutput) && !force) {
    // eslint-disable-next-line no-console
    console.error(
      `Error: Output file already exists: ${resolvedOutput}\nUse --force to overwrite`,
    );
    process.exit(1);
  }

  try {
    // Generate the template
    const result = generateTemplateExcel(resolvedOutput, force);
    // eslint-disable-next-line no-console
    console.log(`✓ Template successfully generated: ${result}`);
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error(
      `Error generating template: ${error instanceof Error ? error.message : String(error)}`,
    );
    process.exit(1);
  }
}

main().catch((error) => {
  // eslint-disable-next-line no-console
  console.error(`Unexpected error: ${error}`);
  process.exit(1);
});
