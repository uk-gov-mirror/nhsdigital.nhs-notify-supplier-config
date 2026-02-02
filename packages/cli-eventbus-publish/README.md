# EventBus Publish CLI

A command-line tool for publishing NHS Notify supplier configuration events to AWS EventBridge.

## Installation

This package is part of the nhs-notify-supplier-config monorepo. Install dependencies from the root:

```bash
npm install
```

## Usage

```bash
# Parse an Excel file and output JSON
npm run cli -- parse -f specs.xlsx

# Publish events to EventBridge
npm run cli -- publish -f specs.xlsx -b my-bus -r eu-west-2

# Dry run (build events without sending)
npm run cli -- publish -f specs.xlsx -b my-bus --dry-run
```

### Commands

#### `parse`

Parse an Excel file and output the parsed data as JSON.

| Option | Alias | Description | Default |
|--------|-------|-------------|---------|
| `--file` | `-f` | Excel file path | specifications.xlsx |

#### `publish`

Build and publish events to EventBridge.

| Option | Alias | Description | Required |
|--------|-------|-------------|----------|
| `--file` | `-f` | Excel file path | No (default: specifications.xlsx) |
| `--bus` | `-b` | EventBridge event bus name | Yes |
| `--region` | `-r` | AWS region (fallback: AWS_REGION env) | No |
| `--dry-run` | | Build events without sending | No |

## Event Types Published

Events are published in the following order:

1. VolumeGroup events
2. Supplier events
3. PackSpecification events
4. SupplierPack events
5. LetterVariant events
6. SupplierAllocation events

Each event is assigned a sequence number to maintain ordering.

## Dependencies

- `@nhs-notify/event-builder` - For building events from domain objects
- `@nhs-notify/excel-parser` - For parsing Excel files
