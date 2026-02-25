# Event Builder

Provides utilities for constructing CloudEvents from NHS Notify supplier configuration domain objects.

## Installation

This package is part of the nhs-notify-supplier-config monorepo. Install dependencies from the root:

```bash
npm install
```

## Usage

```typescript
import {
  buildLetterVariantEvent,
  buildLetterVariantEvents,
  buildPackSpecificationEvent,
  buildPackSpecificationEvents,
  buildSupplierEvent,
  buildSupplierEvents,
  buildSupplierAllocationEvent,
  buildSupplierAllocationEvents,
  buildSupplierPackEvent,
  buildSupplierPackEvents,
  buildVolumeGroupEvent,
  buildVolumeGroupEvents,
} from "@nhs-notify/event-builder";

// Build a single event
const event = buildLetterVariantEvent(letterVariant);

// Build events from a record of entities
const events = buildLetterVariantEvents(variants, startingCounter);
```

## Event Builders

### Letter Variant Events

```typescript
buildLetterVariantEvent(variant: LetterVariant, options?: BuildLetterVariantEventOptions): LetterVariantSpecialisedEvent | undefined
buildLetterVariantEvents(variants: Record<string, LetterVariant>, startingCounter?: number): LetterVariantSpecialisedEvent[]
```

### Pack Specification Events

```typescript
buildPackSpecificationEvent(pack: PackSpecification, options?: BuildPackSpecificationEventOptions): PackSpecificationSpecialisedEvent | undefined
buildPackSpecificationEvents(packs: Record<string, PackSpecification>, startingCounter?: number): PackSpecificationSpecialisedEvent[]
```

### Supplier Events

```typescript
buildSupplierEvent(supplier: Supplier, options?: BuildSupplierEventOptions): SupplierEvent
buildSupplierEvents(suppliers: Record<string, Supplier>, startingCounter?: number): SupplierEvent[]
```

### Supplier Allocation Events

```typescript
buildSupplierAllocationEvent(allocation: SupplierAllocation, options?: BuildSupplierAllocationEventOptions): SupplierAllocationSpecialisedEvent
buildSupplierAllocationEvents(allocations: Record<string, SupplierAllocation>, startingCounter?: number): SupplierAllocationSpecialisedEvent[]
```

### Supplier Pack Events

```typescript
buildSupplierPackEvent(supplierPack: SupplierPack, options?: BuildSupplierPackEventOptions): SupplierPackSpecialisedEvent | undefined
buildSupplierPackEvents(supplierPacks: Record<string, SupplierPack>, startingCounter?: number): SupplierPackSpecialisedEvent[]
```

### Volume Group Events

```typescript
buildVolumeGroupEvent(volumeGroup: VolumeGroup, options?: BuildVolumeGroupEventOptions): VolumeGroupEvent | undefined
buildVolumeGroupEvents(volumeGroups: Record<string, VolumeGroup>, startingCounter?: number): (VolumeGroupEvent | undefined)[]
```

## Event Envelope

All events follow the CloudEvents specification with the following envelope:

| Field | Description |
|-------|-------------|
| `specversion` | CloudEvents spec version (1.0) |
| `id` | Unique event ID (UUID) |
| `source` | Event source path |
| `subject` | Entity path (e.g., `letter-variant/<id>`) |
| `type` | Event type based on entity and status |
| `time` | Event timestamp |
| `datacontenttype` | application/json |
| `dataschema` | Schema URL |
| `dataschemaversion` | Schema version |
| `data` | Event payload (the domain object) |
| `traceparent` | W3C trace context |
| `recordedtime` | Recording timestamp |
| `severitytext` | Severity level (INFO) |
| `severitynumber` | Numeric severity (2) |
| `partitionkey` | Partition key for ordering |
| `sequence` | Sequence number for ordering |

## Configuration

Event source is configured via environment variables:

| Variable | Default | Description |
|----------|---------|-------------|
| `EVENT_ENV` | `dev` | Environment identifier |
| `EVENT_SERVICE` | `events` | Service identifier |
| `EVENT_DATASCHEMAVERSION` | (from schema package) | Schema version |

Source format: `/control-plane/supplier-config/<EVENT_ENV>/<EVENT_SERVICE>`
