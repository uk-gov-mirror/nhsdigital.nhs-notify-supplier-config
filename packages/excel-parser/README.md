# Excel Parser

A package for parsing and generating Excel files for NHS Notify supplier configuration data.

## Features

- Parse Excel files containing supplier configuration data (PackSpecification, LetterVariant, VolumeGroup, Supplier, SupplierAllocation, SupplierPack)
- Generate template Excel files with the correct sheet structure and headers
- Validate parsed data against Zod schemas

## Usage

### Parsing an Excel file

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
