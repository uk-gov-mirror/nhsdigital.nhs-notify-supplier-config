# Excel Parser

A package for parsing and generating Excel files for NHS Notify supplier configuration data.

## Features

- Parse Excel files containing supplier configuration data (PackSpecification, LetterVariant, VolumeGroup, Supplier, SupplierAllocation, SupplierPack)
- Generate template Excel files with the correct sheet structure and headers
- Validate parsed data against Zod schemas

## Usage

### CLI Commands

#### Parse Excel to JSON

Parse an Excel file and output the parsed JSON data:

```bash
# Parse and output to stdout
npm run parse -- config.xlsx

# Parse and pretty-print to stdout
npm run parse -- config.xlsx --pretty

# Parse and save to file
npm run parse -- config.xlsx -o output.json

# Parse with pretty formatting and save to file
npm run parse -- config.xlsx --pretty --output output.json

# Show help
npm run parse -- --help
```

**Options:**

- `-o, --output <file>` - Write output to a file instead of stdout
- `-p, --pretty` - Pretty-print the JSON output
- `-h, --help` - Show help message

**Output format:**

The JSON output contains the following top-level keys:

- `packs` - Record of PackSpecification objects keyed by ID
- `variants` - Record of LetterVariant objects keyed by ID
- `volumeGroups` - Record of VolumeGroup objects keyed by ID
- `suppliers` - Record of Supplier objects keyed by ID
- `allocations` - Record of SupplierAllocation objects keyed by ID
- `supplierPacks` - Record of SupplierPack objects keyed by ID

#### Generate Template

Generate a template Excel file with the correct sheet structure and column headers:

```bash
# Generate a new template
npm run template -- output.xlsx

# Overwrite existing template
npm run template -- output.xlsx --force

# Show help
npm run template -- --help
```

**Options:**

- `-f, --force` - Overwrite existing file if it exists
- `-h, --help` - Show help message

**Generated sheets:**

The template includes the following sheets with proper column headers:

- `PackSpecification` - Pack specification definitions
- `LetterVariant` - Letter variant configurations
- `VolumeGroup` - Volume group definitions
- `Supplier` - Supplier information
- `SupplierAllocation` - Supplier allocation percentages
- `SupplierPack` - Supplier-pack mappings

### Programmatic Usage

#### Parsing an Excel file

```typescript
import { parseExcelFile } from "@nhs-notify/excel-parser";

const result = parseExcelFile("./specifications.xlsx");

console.log(result.packs);           // Record<string, PackSpecification>
console.log(result.variants);        // Record<string, LetterVariant>
console.log(result.volumeGroups);    // Record<string, VolumeGroup>
console.log(result.suppliers);       // Record<string, Supplier>
console.log(result.allocations);     // Record<string, SupplierAllocation>
console.log(result.supplierPacks);   // Record<string, SupplierPack>
```

### Generating a template Excel file

```typescript
import { generateTemplateExcel } from "@nhs-notify/excel-parser";

// Generate a new template (fails if file exists)
generateTemplateExcel("./specifications.template.xlsx");

// Force overwrite existing file
generateTemplateExcel("./specifications.template.xlsx", true);
```

## Required Excel Sheets

The Excel file must contain the following sheets:

1. **PackSpecification** - Pack specification definitions
2. **LetterVariant** - Letter variant configurations
3. **VolumeGroup** - Volume group definitions
4. **Supplier** - Supplier information
5. **SupplierAllocation** - Supplier allocation percentages per volume group
6. **SupplierPack** - Mapping of suppliers to pack specifications

See `EXCEL_HEADERS.md` for detailed column specifications.
