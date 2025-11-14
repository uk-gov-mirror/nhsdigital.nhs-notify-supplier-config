# AI Agent Guide for NHS Notify Supplier Config

This document provides helpful context and commands for AI agents working on this project.

## Project Structure

This is a monorepo containing:

- **packages/events** - Event schemas and domain models using Zod
- **packages/event-builder** - Tools for parsing Excel specs and generating reports
- **lambdas/** - Lambda function implementations
- **infrastructure/** - Terraform infrastructure as code
- **docs/** - Documentation site

## Event Builder Package

### Quick Start Commands

```bash
# Navigate to event-builder
cd packages/event-builder

# Run tests
npm test

# Generate supplier reports from Excel file
npm run cli:report -- -f specifications.xlsx

# Generate reports with custom output directory
npm run cli:report -- -f specifications.xlsx -o ./output

# Populate DynamoDB with events
npm run cli:dynamodb -- -f specifications.xlsx

# Generate CloudEvents
npm run cli:events -- -f specifications.xlsx
```

### Excel File Structure

The `specifications.xlsx` file contains sheets:

- **PackSpecification** - Pack specifications with postage, assembly, constraints
- **LetterVariant** - Letter variants referencing pack specs
- **VolumeGroup** - Volume groups (contracts)
- **Supplier** - Supplier definitions
- **SupplierAllocation** - Supplier allocations to volume groups
- **SupplierPack** - Supplier pack approvals and status

See `EXCEL_HEADERS.md` for detailed field documentation.

### Supplier Reports

HTML reports are generated per supplier showing:

- Assigned pack specifications
- Table of Contents with two sections:
  - **Submitted & Approved Packs**: Packs with approval status SUBMITTED, PROOF_RECEIVED, APPROVED, REJECTED, or DISABLED
  - **Draft Packs**: Packs with approval status DRAFT
- Both sections are sorted by pack specification ID
- Approval status and environment status
- Full pack details with tooltips from schema metadata
- Volume group allocations

**Location**: `packages/event-builder/supplier-reports/`

**Tooltips**: The reports use schema metadata from Zod `.meta()` calls to provide context-sensitive tooltips on hover for fields like:

- Version number
- Delivery days
- Max weight/thickness
- Paper colour options

### Testing

```bash
# Run all tests
npm test

# Run tests in watch mode
npm test -- --watch

# Run specific test file
npm test -- parse-excel.test.ts
```

## Schema Metadata System

### How Tooltips Work

1. Domain schemas define metadata using `.meta()`:

   ```typescript
   deliveryDays: z.number().optional().meta({
     title: "Delivery Days",
     description: "The expected number of days for delivery under this postage option."
   })
   ```

2. The `.meta()` method automatically registers metadata in Zod's global registry

3. Retrieve metadata using `.meta()` without arguments:

   ```typescript
   const description = $Postage.shape.deliveryDays.meta()?.description;
   ```

4. Supplier reports use `data-tooltip` attributes to display custom CSS tooltips (not browser default `title` tooltips)

### Key Schema Files

- `packages/events/src/domain/pack-specification.ts` - Main pack spec schema
- `packages/events/src/domain/letter-variant.ts` - Letter variant schema
- `packages/events/src/domain/common.ts` - Common types (EnvironmentStatus, etc.)

## Common Tasks

### Updating Field Names

1. Update domain schema in `packages/events/src/domain/`
2. Update Excel parsing in `packages/event-builder/src/lib/parse-excel.ts`
3. Update supplier reports in `packages/event-builder/src/lib/supplier-report.ts`
4. Update `EXCEL_HEADERS.md` documentation
5. Update test files in `__tests__/` directories
6. Run tests: `npm test`

### Adding New Tooltips

1. Add `.meta()` to schema field:

   ```typescript
   fieldName: z.string().meta({
     title: "Display Title",
     description: "Tooltip text shown on hover"
   })
   ```

2. In supplier-report.ts, access metadata:

   ```typescript
   $Schema.shape.fieldName.meta()?.description
   ```

3. Use in HTML with `data-tooltip` attribute and `has-tooltip` class

### Editing Markdown Files

When editing markdown files (`.md`), always run the markdown linter to ensure formatting compliance:

```bash
# Check a specific markdown file
./scripts/githooks/check-markdown-format.sh AGENTS.md

# Check with all rules enabled
check=all ./scripts/githooks/check-markdown-format.sh README.md
```

Common markdown rules to follow:

- Add blank lines before and after lists
- Add blank lines before and after fenced code blocks
- Use angle brackets for bare URLs: `<https://example.com>`
- Keep consistent list markers and indentation

### Debugging Excel Parsing

If Excel parsing fails:

1. Check sheet names match expected names (case-sensitive)
2. Verify required columns exist in `parse-excel.ts` interfaces
3. Check data types (dates, numbers, enums)
4. Run with debugger: `node --inspect-brk node_modules/.bin/ts-node src/cli/events.ts`

## Workspace Commands

```bash
# Install all dependencies
npm install

# Run tests for specific workspace
npm test --workspace=packages/events
npm test --workspace=packages/event-builder

# Build all packages
npm run build --workspaces

# Lint all code
npm run lint

# Check markdown formatting
./scripts/githooks/check-markdown-format.sh <file>

# Check markdown formatting for all files
check=all ./scripts/githooks/check-markdown-format.sh <file>
```

## Helpful Links

- Zod documentation: <https://zod.dev>
- Zod 4 metadata: Use `.meta()` with/without arguments
- CloudEvents spec: <https://cloudevents.io>

## Troubleshooting

### "Input file not found" Error

The default Excel file path is `example_specifications.xlsx`. Use `-f` flag to specify:

```bash
npm run cli:report -- -f specifications.xlsx
```

### "Sheet not found" Error

Check that the Excel file has all required sheets:

- PackSpecification
- LetterVariant
- VolumeGroup
- Supplier
- SupplierAllocation
- SupplierPack

### Validation Errors

Check the error output for specific Zod validation failures. Common issues:

- Invalid enum values (e.g., using "PUBLISHED" instead of "PROD")
- Missing required fields
- Wrong data types (string vs number)
- Invalid date formats

### Tooltips Not Showing

1. Check if field has `.meta({ description: "..." })` in schema
2. Verify `data-tooltip` attribute is in HTML
3. Verify `has-tooltip` class is applied
4. Check browser console for CSS errors

## Agent Notes

- The project uses Zod 4.x for schema validation
- Metadata is stored in Zod's global registry via `.meta()`
- Excel parsing is forgiving - missing optional fields are handled gracefully
- Reports are regenerated from scratch each time (not incremental)
- CSS tooltips use `data-tooltip` to avoid duplicate browser tooltips
- Test files should be updated whenever domain models change
- Always run markdown linter when editing `.md` files to catch formatting issues
