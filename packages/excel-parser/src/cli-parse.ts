#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import yargs from "yargs";
import { hideBin } from "yargs/helpers";
import { writeParseResultToConfigStore } from "./config-store-output";
import { parseExcelFile } from "./parse-excel";

interface Arguments {
  input: string;
  output?: string;
  outputDir?: string;
  pretty: boolean;
}

async function main() {
  const argv = await yargs(hideBin(process.argv))
    .usage("Usage: $0 <input.xlsx> [options]")
    .command(
      "$0 <input>",
      "Parse an Excel file and output the parsed JSON data",
      (args) => {
        return args.positional("input", {
          describe: "Path to the Excel file to parse",
          type: "string",
          demandOption: true,
        });
      },
    )
    .option("output", {
      alias: "o",
      type: "string",
      description: "Write output to a file instead of stdout",
    })
    .option("output-dir", {
      alias: "d",
      type: "string",
      description:
        "Write one JSON file per record into a file-store-compatible directory",
    })
    .conflicts("output", "output-dir")
    .option("pretty", {
      alias: "p",
      type: "boolean",
      default: false,
      description: "Pretty-print the JSON output",
    })
    .example("$0 config.xlsx", "Parse and output to stdout")
    .example("$0 config.xlsx --pretty", "Parse and pretty-print to stdout")
    .example("$0 config.xlsx -o output.json", "Parse and save to file")
    .example(
      "$0 config.xlsx --output-dir ./config-store",
      "Parse and save one JSON file per record for file-store consumption",
    )
    .example(
      "$0 config.xlsx --pretty --output output.json",
      "Parse with pretty formatting and save to file",
    )
    .help("h")
    .alias("h", "help")
    .strict()
    .parseAsync();

  const { input, output, outputDir, pretty } = argv as unknown as Arguments;

  // Resolve input file path
  const resolvedInput = path.isAbsolute(input)
    ? input
    : path.join(process.cwd(), input);

  // Check if input file exists
  // eslint-disable-next-line security/detect-non-literal-fs-filename
  if (!fs.existsSync(resolvedInput)) {
    // eslint-disable-next-line no-console
    console.error(`Error: Input file not found: ${resolvedInput}`);
    process.exit(1);
  }

  // Check if input file is an Excel file
  if (!/\.xlsx?$/i.test(resolvedInput)) {
    // eslint-disable-next-line no-console
    console.error(`Error: Input file must be an Excel file (.xlsx or .xls)`);
    process.exit(1);
  }

  try {
    // Parse the Excel file
    const result = parseExcelFile(resolvedInput);

    // Format the output
    const jsonOutput = pretty
      ? JSON.stringify(result, null, 2)
      : JSON.stringify(result);

    if (outputDir) {
      const resolvedOutputDir = path.isAbsolute(outputDir)
        ? outputDir
        : path.join(process.cwd(), outputDir);

      await writeParseResultToConfigStore(result, resolvedOutputDir, {
        pretty,
      });
      // eslint-disable-next-line no-console
      console.error(
        `✓ Successfully parsed and wrote file-store output to: ${resolvedOutputDir}`,
      );
    } else if (output) {
      // Write to file
      const resolvedOutput = path.isAbsolute(output)
        ? output
        : path.join(process.cwd(), output);

      // eslint-disable-next-line security/detect-non-literal-fs-filename
      fs.writeFileSync(resolvedOutput, jsonOutput, "utf8");
      // eslint-disable-next-line no-console
      console.error(
        `✓ Successfully parsed and wrote output to: ${resolvedOutput}`,
      );
    } else {
      // Write to stdout
      // eslint-disable-next-line no-console
      console.log(jsonOutput);
    }
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error(
      `Error parsing Excel file: ${error instanceof Error ? error.message : String(error)}`,
    );
    process.exit(1);
  }
}

main().catch((error) => {
  // eslint-disable-next-line no-console
  console.error(`Unexpected error: ${error}`);
  process.exit(1);
});
