# AI Agent Guide for NHS Notify Supplier Config

This document provides helpful context and commands for AI agents working on this project.

## Project Structure

This is a monorepo containing:

- **packages/events** - Event schemas and domain models using Zod
- **packages/event-builder** - CloudEvent builders for domain objects
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

# Run tests in watch mode
npm test -- --watch

# Build package
npm run build

# Type check
npm run typecheck
```

### Event Builder Functions

The event-builder package provides functions to build CloudEvents from domain objects:

- `buildLetterVariantEvents()` - Build events for letter variants
- `buildPackSpecificationEvents()` - Build events for pack specifications
- `buildSupplierEvents()` - Build events for suppliers
- `buildVolumeGroupEvents()` - Build events for volume groups
- `buildSupplierAllocationEvents()` - Build events for supplier allocations
- `buildSupplierPackEvents()` - Build events for supplier packs

All functions accept domain objects and a starting counter, returning an array of CloudEvents.

### Testing

```bash
# Run all tests
npm test

# Run tests in watch mode
npm test -- --watch

# Run specific test file
npm test -- letter-variant-event-builder.test.ts
```

## Schema Metadata System

### Using Metadata in Schemas

Domain schemas can include metadata using `.meta()`:

```typescript
deliveryDays: z.number().optional().meta({
  title: "Delivery Days",
  description: "The expected number of days for delivery under this postage option."
})
```

The `.meta()` method registers metadata in Zod's global registry, which can be retrieved later:

```typescript
const description = $Postage.shape.deliveryDays.meta()?.description;
```

### Key Schema Files

- `packages/events/src/domain/pack-specification.ts` - Main pack spec schema
- `packages/events/src/domain/letter-variant.ts` - Letter variant schema
- `packages/events/src/domain/supplier.ts` - Supplier schema
- `packages/events/src/domain/volume-group.ts` - Volume group schema
- `packages/events/src/domain/supplier-allocation.ts` - Supplier allocation schema
- `packages/events/src/domain/supplier-pack.ts` - Supplier pack schema
- `packages/events/src/domain/common.ts` - Common types (EnvironmentStatus, etc.)

## Common Tasks

### Updating Domain Schemas

1. Update domain schema in `packages/events/src/domain/`
2. Update event builder if needed in `packages/event-builder/src/`
3. Update test files in `__tests__/` directories
4. Run tests: `npm test`

### Adding Metadata to Schema Fields

1. Add `.meta()` to schema field:

   ```typescript
   fieldName: z.string().meta({
     title: "Display Title",
     description: "Helpful description for this field"
   })
   ```

2. Access metadata programmatically:

   ```typescript
   $Schema.shape.fieldName.meta()?.description
   ```

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

### Validation Errors

Check the error output for specific Zod validation failures. Common issues:

- Invalid enum values (e.g., using "PUBLISHED" instead of "PROD")
- Missing required fields
- Wrong data types (string vs number)
- Invalid date formats

## Agent Notes

- The project uses Zod 4.x for schema validation
- Metadata is stored in Zod's global registry via `.meta()`
- Test files should be updated whenever domain models change
- Always run markdown linter when editing `.md` files to catch formatting issues
