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

## Dependencies

- `@nhs-notify/excel-parser` - For parsing Excel files
