#!/usr/bin/env ts-node
import path from "node:path";
import fs from "node:fs";
import { hideBin } from "yargs/helpers";
import yargs from "yargs";
import {
  generateTemplateExcel,
  parseExcelFile,
} from "@supplier-config/excel-parser";
import { generateSupplierReports } from "./supplier-report";

interface ReportArgs {
  file: string;
  out: string;
  excludeDrafts?: boolean;
}

interface TemplateArgs {
  out: string;
  force?: boolean;
}

function ensureFile(file: string): string {
  const resolved = path.isAbsolute(file)
    ? file
    : path.join(process.cwd(), file);
  // Basic allowlist check: must end with .xlsx
  if (!/\.xlsx$/i.test(resolved)) {
    throw new Error(`Input file must be an .xlsx file: ${resolved}`);
  }
  try {
    // eslint-disable-next-line security/detect-non-literal-fs-filename
    fs.statSync(resolved);
  } catch {
    throw new Error(`Input file not found: ${resolved}`);
  }
  return resolved;
}

async function handleReport(args: ReportArgs): Promise<void> {
  const inputFile = ensureFile(args.file);
  console.log(`Reading Excel file: ${inputFile}`);
  const data = parseExcelFile(inputFile);

  const result = generateSupplierReports(data, args.out, {
    excludeDrafts: args.excludeDrafts,
  });

  console.log(
    `\nGenerated ${result.reports.length} supplier reports in: ${result.outputDir}\n`,
  );

  if (result.csvFilePath) {
    console.log(`  - Variant mapping CSV: ${result.csvFilePath}\n`);
  }

  for (const report of result.reports) {
    console.log(
      `  - ${report.supplierName}: ${report.packCount} pack(s) -> ${report.filePath}`,
    );
  }
}

async function handleTemplate(args: TemplateArgs): Promise<void> {
  const output = generateTemplateExcel(args.out, args.force);
  console.log(`Template Excel written: ${output}`);
}

async function main(): Promise<void> {
  const parser = yargs(hideBin(process.argv))
    .scriptName("supplier-reports")
    .demandCommand(1, "Specify a command")
    .strict()
    .recommendCommands()
    .version(false)
    .help()
    .command<ReportArgs>(
      "report",
      "Generate HTML reports per supplier showing assigned pack specifications",
      (cmd) =>
        cmd
          .option("file", {
            alias: "f",
            describe: "Excel file path",
            type: "string",
            default: "specifications.xlsx",
          })
          .option("out", {
            alias: "o",
            type: "string",
            describe: "Output directory for HTML reports",
            default: "./supplier-reports",
          })
          .option("exclude-drafts", {
            type: "boolean",
            describe: "Exclude supplier packs with DRAFT approval status from the reports",
            default: false,
          }),
      async (argv) => {
        await handleReport(argv);
      },
    )
    .command<TemplateArgs>(
      "template",
      "Generate a blank Excel template with all required sheets and columns",
      (cmd) =>
        cmd
          .option("out", {
            alias: "o",
            type: "string",
            describe: "Output .xlsx file path",
            default: "specifications.template.xlsx",
          })
          .option("force", {
            alias: "F",
            type: "boolean",
            describe: "Overwrite existing file if present",
            default: false,
          }),
      async (argv) => {
        await handleTemplate(argv);
      },
    )
    .example(
      "$0 report -f specs.xlsx -o ./reports",
      "Generate HTML supplier reports",
    )
    .example(
      "$0 template -o specs.xlsx",
      "Generate template workbook (fails if specs.xlsx exists unless --force)",
    );

  try {
    await parser.parseAsync();
  } catch (error) {
    console.error((error as Error).message);
    process.exitCode = 1;
  }
}

if (require.main === module) {
  main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
}

export { handleReport, handleTemplate };
