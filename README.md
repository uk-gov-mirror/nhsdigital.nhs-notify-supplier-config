# NHS Notify Supplier Config

This repository contains code and schemas for NHS Notify supplier configuration management.

## Purpose

- **Configuration Model:** Defines and manages supplier configuration for NHS Notify suppliers.
- **Event Schemas:** Domain models and event builders for publishing configuration changes as CloudEvents.

## Design

### Configuration Management

A phased approach will be used to improve supplier configuration management:

1. **Libraries & Validation:** Standardise configuration and naming, reduce manual errors, and improve auditability.
2. **API Layer:** Centralise access to supplier configuration data.
3. **Web UI:** Enable operations/admin teams to manage supplier configuration with validation and audit trails.

Configuration entities include:

- Suppliers (print/letter suppliers with capacity and status)
- Volume Groups (time-based allocation periods)
- Pack Specifications (letter pack definitions with postage, assembly, and constraints)
- Letter Variants (channel and campaign-specific letter configurations)
- Supplier Allocations (percentage allocations per volume group)
- Supplier Packs (supplier approval status for pack specifications)

Configuration changes are validated, auditable, and published to environments via an event bus.

## Packages

### Core Libraries

- **`@supplier-config/event-builder`** - Builds CloudEvents from domain objects (LetterVariant, PackSpecification, Supplier, VolumeGroup, SupplierAllocation, SupplierPack)

- **`@nhsdigital/nhs-notify-event-schemas-supplier-config`** - Domain models and event schemas (Zod)

## Event Builder Usage

The event builder package provides functions to construct CloudEvents from domain objects.

```typescript
import {
  buildLetterVariantEvents,
  buildPackSpecificationEvents,
  buildSupplierEvents,
  buildVolumeGroupEvents,
  buildSupplierAllocationEvents,
  buildSupplierPackEvents,
} from "@supplier-config/event-builder";

// Build events from domain objects
const letterVariantEvents = buildLetterVariantEvents(variants, startingCounter);
const packEvents = buildPackSpecificationEvents(packs, startingCounter);
const supplierEvents = buildSupplierEvents(suppliers, startingCounter);
const volumeGroupEvents = buildVolumeGroupEvents(volumeGroups, startingCounter);
const allocationEvents = buildSupplierAllocationEvents(allocations, startingCounter);
const supplierPackEvents = buildSupplierPackEvents(supplierPacks, startingCounter);
```

### Configuration

Event source is configured via environment variables:

- `EVENT_ENV` - Environment identifier (default: `dev`)
- `EVENT_SERVICE` - Service identifier (default: `events`)
- `EVENT_DATASCHEMAVERSION` - Schema version (default: from schema package)

Source format: `/control-plane/supplier-config/<EVENT_ENV>/<EVENT_SERVICE>`

## Development

### Installation

```bash
npm install
```

### Testing

```bash
# Run all tests
npm run test:unit

# Test specific package
npm run test:unit --workspace @supplier-config/event-builder
```

### Linting

```bash
# Lint all packages
npm run lint

# Fix linting issues
npm run lint:fix
```

### Type Checking

```bash
npm run typecheck
```

## Event Structure

All events follow the CloudEvents specification with the following envelope:

- `specversion` - CloudEvents spec version (1.0)
- `id` - Unique event ID (UUID)
- `source` - Event source path (e.g., `/control-plane/supplier-config/dev/events`)
- `subject` - Entity path (e.g., `letter-variant/<id>`)
- `type` - Event type based on entity and status
- `time` - Event timestamp
- `datacontenttype` - application/json
- `dataschema` - Schema URL
- `dataschemaversion` - Schema version
- `data` - Event payload (the domain object)
- `traceparent` - W3C trace context
- `recordedtime` - Recording timestamp
- `severitytext` - Severity level (INFO)
- `severitynumber` - Numeric severity (2)
- `partitionkey` - Partition key for ordering
- `sequence` - Sequence number for ordering

## Contributing

Describe or link templates on how to raise an issue, feature request or make a contribution to the codebase. Reference the other documentation files, like

- Environment setup for contribution, i.e. `CONTRIBUTING.md`
- Coding standards, branching, linting, practices for development and testing
- Release process, versioning, changelog
- Backlog, board, roadmap, ways of working
- High-level requirements, guiding principles, decision records, etc.

## Contacts

Provide a way to contact the owners of this project. It can be a team, an individual or information on the means of getting in touch via active communication channels, e.g. opening a GitHub discussion, raising an issue, etc.

## Licence

Unless stated otherwise, the codebase is released under the MIT License. This covers both the codebase and any sample code in the documentation.

Any HTML or Markdown documentation is [© Crown Copyright](https://www.nationalarchives.gov.uk/information-management/re-using-public-sector-information/uk-government-licensing-framework/crown-copyright/) and available under the terms of the [Open Government Licence v3.0](https://www.nationalarchives.gov.uk/doc/open-government-licence/version/3/).
