# Supplier Reports CLI

A command-line tool for generating HTML reports for NHS Notify suppliers showing their assigned pack specifications.

## Installation

This package is part of the nhs-notify-supplier-config monorepo. Install dependencies from the root:

```bash
npm install
```

## Usage

```bash
# Generate HTML reports for all suppliers
npm run cli -- report -f specs.xlsx -o ./reports

# Exclude draft packs from reports
npm run cli -- report -f specs.xlsx -o ./reports --exclude-drafts

# Generate a blank Excel template
npm run cli -- template -o specs.template.xlsx

# Force overwrite existing template
npm run cli -- template -o specs.template.xlsx --force
```

### Commands

#### `report`

Generate HTML reports per supplier showing assigned pack specifications.

| Option | Alias | Description | Default |
|--------|-------|-------------|---------|
| `--file` | `-f` | Excel file path | specifications.xlsx |
| `--out` | `-o` | Output directory for HTML reports | ./supplier-reports |
| `--exclude-drafts` | | Exclude supplier packs with DRAFT approval status | false |

#### `template`

Generate a blank Excel template with all required sheets and columns.

| Option | Alias | Description | Default |
|--------|-------|-------------|---------|
| `--out` | `-o` | Output .xlsx file path | specifications.template.xlsx |
| `--force` | `-F` | Overwrite existing file if present | false |

## Report Features

Each supplier report includes:

- Supplier information (ID, name, channel type, daily capacity, status)
- Volume group allocations with percentages
- Summary cards showing pack counts by status
- Table of contents with quick navigation
- Detailed pack specifications including:
  - Basic information
  - Postage details
  - Constraints
  - Assembly specifications
  - Paper details

Additionally, a **variant-mapping.csv** file is generated containing the complete mapping from letter variants through pack specifications, supplier packs, to suppliers. This CSV only includes records where the status is INT or PROD, providing a clean view of active production configurations.

### Variant Mapping CSV

The variant mapping CSV includes the following columns:

- `variant_id` - Letter variant ID
- `variant_name` - Letter variant name
- `variant_status` - Letter variant environment status (INT/PROD)
- `variant_priority` - Letter variant dispatch priority (1 to 99, lower values are higher priority)
- `pack_specification_id` - Pack specification ID
- `pack_specification_name` - Pack specification name
- `pack_specification_status` - Pack specification environment status (INT/PROD)
- `pack_specification_version` - Pack specification version number
- `pack_specification_billing_id` - Pack specification billing identifier
- `supplier_pack_id` - Supplier pack ID
- `supplier_pack_approval` - Supplier pack approval status
- `supplier_pack_status` - Supplier pack environment status (INT/PROD)
- `supplier_id` - Supplier ID
- `supplier_name` - Supplier name

This CSV provides a flattened view of the relationships, making it easy to analyze and query the complete configuration in tools like Excel or databases.

## Dependencies

- `@nhs-notify/excel-parser` - For parsing Excel files
