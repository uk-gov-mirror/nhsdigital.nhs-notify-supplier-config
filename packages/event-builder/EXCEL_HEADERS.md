# Excel Headers Documentation

This document describes the required and optional Excel headers for the supplier configuration spreadsheet.

## PackSpecification Sheet

### Required Headers

| Header | Type | Description | Example |
|--------|------|-------------|---------|
| `id` | string | Unique identifier for the pack specification | `pack-std-2day` |
| `name` | string | Human-readable name | `Standard 2-Day Delivery` |
| `status` | enum | Status of the specification | `PROD` (options: `DRAFT`, `INT`, `PROD`) |
| `version` | integer | Version number | `1` |
| `createdAt` | RFC3339 datetime | Creation timestamp (must be full datetime) | `2024-01-01T00:00:00Z` |
| `updatedAt` | RFC3339 datetime | Last update timestamp (must be full datetime) | `2024-01-01T00:00:00Z` |
| `postage.id` | string | Unique identifier for the postage type | `postage-standard-2day` |
| `postage.size` | enum | Postage size | `STANDARD` (options: `STANDARD`, `LARGE`, `PARCEL`) |

### Optional Headers - Constraints

| Header | Type | Description | Example |
|--------|------|-------------|---------|
| `constraints.maxSheets` | integer | Maximum number of sheets allowed | `10` |
| `constraints.deliveryDays` | integer | Delivery time in days | `2` |
| `constraints.blackCoveragePercentage` | float | Maximum black ink coverage percentage | `80.5` |
| `constraints.colourCoveragePercentage` | float | Maximum colour ink coverage percentage | `50.25` |

### Optional Headers - Postage

| Header | Type | Description | Example |
|--------|------|-------------|---------|
| `postage.deliveryDays` | integer | Delivery time in days | `2` |
| `postage.maxWeightGrams` | float | Maximum weight in grams | `100.5` |
| `postage.maxThicknessMm` | float | Maximum thickness in mm | `5.0` |

### Optional Headers - Assembly

| Header | Type | Description | Example |
|--------|------|-------------|---------|
| `assembly.envelopeId` | string | Reference to envelope entity | `envelope-c5-white` |
| `assembly.printColour` | enum | Print colour mode | `COLOUR` (options: `BLACK`, `COLOUR`) |
| `assembly.duplex` | boolean | Whether to print double-sided | `true` or `false` |
| `assembly.paper.id` | string | Unique identifier for paper type | `paper-std-white-80gsm` |
| `assembly.paper.name` | string | Human-readable name for paper | `Standard White 80gsm` |
| `assembly.paper.weightGSM` | float | Paper weight in GSM | `80` |
| `assembly.paper.size` | enum | Paper size | `A4` (options: `A5`, `A4`, `A3`) |
| `assembly.paper.colour` | enum | Paper colour | `WHITE` (currently only `WHITE` is supported) |
| `assembly.paper.finish` | enum | Paper finish (optional) | `MATT` (options: `MATT`, `GLOSSY`, `SILK`) |
| `assembly.paper.recycled` | boolean | Whether paper is recycled | `true` or `false` |
| `assembly.insertIds` | string (comma-separated) | List of insert IDs | `insert-1,insert-2,insert-3` |
| `assembly.features` | string (comma-separated) | List of pack features | `BRAILLE,AUDIO` (options: `BRAILLE`, `AUDIO`, `ADMAIL`, `SAME_DAY`) |
| `assembly.additional` | JSON string | Additional assembly properties | `{"key": "value"}` |

### Optional Headers - Other

| Header | Type | Description | Example |
|--------|------|-------------|---------|
| `description` | string | Description of the pack specification | `A standard economy-class letter for bulk mailings` |
| `billingId` | string | External billing system reference | `BILL-12345` |

---

## Contract Sheet

### Required Headers

| Header | Type | Description | Example |
|--------|------|-------------|---------|
| `id` | string | Unique identifier for the contract | `contract-2024-main` |
| `name` | string | Human-readable name | `Main Supplier Contract 2024` |
| `startDate` | date (YYYY-MM-DD) | Contract start date (date only) | `2024-01-01` |

### Optional Headers

| Header | Type | Description | Example |
|--------|------|-------------|---------|
| `description` | string | Description of the contract | `Primary contract for letter printing services` |
| `endDate` | date (YYYY-MM-DD) | Contract end date (date only) | `2025-12-31` |
| `status` | enum | Status (defaults to `PROD` if omitted) | `PROD` (options: `DRAFT`, `INT`, `PROD`) |

---

## Supplier Sheet

### Required Headers

| Header | Type | Description | Example |
|--------|------|-------------|---------|
| `id` | string | Unique identifier for the supplier | `supplier-printco` |
| `name` | string | Human-readable supplier name | `PrintCo Ltd` |
| `channelType` | enum | Type of channel the supplier handles | `LETTER` (options: `NHSAPP`, `SMS`, `EMAIL`, `LETTER`) |

---

## SupplierAllocation Sheet

### Required Headers

| Header | Type | Description | Example |
|--------|------|-------------|---------|
| `id` | string | Unique identifier for the allocation | `allocation-printco-70pct` |
| `contract` | string | Reference to contract ID | `contract-2024-main` |
| `supplier` | string | Reference to supplier ID | `supplier-printco` |
| `allocationPercentage` | float | Percentage of volume allocated (0-100) | `70.5` |
| `status` | enum | Status of the allocation | `PROD` (options: `PROD`, `REMOVED`) |

---

## SupplierPack Sheet

### Required Headers

| Header | Type | Description | Example |
|--------|------|-------------|---------|
| `id` | string | Unique identifier for the supplier pack | `sp-printco-pack1` |
| `packSpecificationId` | string | Reference to pack specification ID | `pack-std-2day` |
| `supplierId` | string | Reference to supplier ID | `supplier-printco` |
| `approval` | enum | Approval status | `APPROVED` (options: `DRAFT`, `SUBMITTED`, `PROOF_RECEIVED`, `APPROVED`, `REJECTED`, `DISABLED`) |
| `status` | enum | Environment status | `PROD` (options: `DRAFT`, `INT`, `PROD`) |

**Note**: Only supplier packs with approval status `APPROVED` and environment status `PROD` will generate production events during publishing.

---

## LetterVariant Sheet

### Required Headers

| Header | Type | Description | Example |
|--------|------|-------------|---------|
| `id` | string | Unique identifier for the letter variant | `variant-std-braille` |
| `name` | string | Human-readable name | `Standard with Braille` |
| `contractId` | string | Reference to contract ID | `contract-2024-main` |
| `packSpecificationIds` | string (comma-separated) | List of pack specification IDs | `pack-1,pack-2` |
| `type` | enum | Type of letter | `STANDARD` (options: `STANDARD`, `BRAILLE`, `AUDIO`) |
| `status` | enum | Status of the variant | `PROD` (options: `DRAFT`, `INT`, `PROD`) |

### Optional Headers

| Header | Type | Description | Example |
|--------|------|-------------|---------|
| `description` | string | Description of the variant | `Standard letter with braille option` |
| `clientId` | string | Client identifier | `client-nhs-trust-1` |
| `campaignIds` | string (comma-separated) | List of campaign IDs | `campaign-1,campaign-2` |
| `supplierId` | string | Supplier identifier (restricts variant to single supplier) | `supplier-printco` |

### Optional Headers - Constraints

| Header | Type | Description | Example |
|--------|------|-------------|---------|
| `constraints.maxSheets` | integer | Maximum number of sheets allowed | `8` |
| `constraints.deliveryDays` | integer | Delivery time in days | `3` |
| `constraints.blackCoveragePercentage` | float | Maximum black ink coverage percentage | `75.0` |
| `constraints.colourCoveragePercentage` | float | Maximum colour ink coverage percentage | `40.0` |

## Example Excel Data

### Contract Example

| id | name | description | startDate | endDate |
|----|------|-------------|-----------|---------|
| contract-2024-main | Main Supplier Contract 2024 | Primary contract for letter services | 2024-01-01 | 2025-12-31 |

### Supplier Example

| id | name | channelType |
|----|------|-------------|
| supplier-printco | PrintCo Ltd | LETTER |
| supplier-mailhouse | MailHouse Services | LETTER |

### PackSpecification Example

| id | name | status | version | createdAt | updatedAt | postage.id | postage.size | constraints.maxSheets | assembly.paper.id | assembly.paper.name | assembly.paper.weightGSM | assembly.paper.size | assembly.paper.colour | assembly.paper.recycled | assembly.printColour | assembly.features |
|----|------|--------|---------|-----------|-----------|------------|--------------|----------------------|-------------------|---------------------|--------------------------|---------------------|----------------------|------------------------|---------------------|-------------------|
| pack-1 | Standard Pack | PROD | 1 | 2024-01-01T00:00:00Z | 2024-01-01T00:00:00Z | postage-std | STANDARD | 10 | paper-std | Standard White | 80 | A4 | WHITE | true | COLOUR | BRAILLE,AUDIO |

### SupplierPack Example

| id | packSpecificationId | supplierId | approval | status |
|----|---------------------|------------|----------|--------|
| sp-printco-pack1 | pack-1 | supplier-printco | APPROVED | PROD |
| sp-mailhouse-pack1 | pack-1 | supplier-mailhouse | APPROVED | PROD |

### LetterVariant Example

| id | name | description | contractId | packSpecificationIds | type | status | constraints.maxSheets | constraints.deliveryDays |
|----|------|-------------|------------|---------------------|------|--------|----------------------|------------------------|
| variant-1 | Standard Variant | A standard letter variant | contract-2024-main | pack-1,pack-2 | STANDARD | PROD | 8 | 3 |

### SupplierAllocation Example

| id | contract | supplier | allocationPercentage | status |
|----|----------|----------|---------------------|--------|
| allocation-printco-70 | contract-2024-main | supplier-printco | 70.0 | PROD |
| allocation-mailhouse-30 | contract-2024-main | supplier-mailhouse | 30.0 | PROD |

---

## Notes

- **Required Sheets**: The Excel workbook must contain all six sheets: `Contract`, `Supplier`, `PackSpecification`, `SupplierPack`, `LetterVariant`, and `SupplierAllocation`
- **Comma-separated values**: Fields like `packSpecificationIds`, `campaignIds`, `assembly.insertIds`, and `assembly.features` accept comma-separated lists without spaces
- **Boolean values**: Use `true` or `TRUE` for true, anything else is false
- **JSON values**: The `assembly.additional` field expects valid JSON (will be ignored if invalid)
- **Date formats**: Dates can be in ISO format (`2024-01-01T00:00:00Z`) or simple date format (`2024-01-01`)
- **Optional fields**: If a field is not provided or empty, it will be treated as undefined/not present
- **Event Publishing**:
  - Contract: All (`DRAFT` skipped earlier at build)
  - Supplier: All
  - PackSpecification: `PUBLISHED`, `DISABLED`
  - SupplierPack: `APPROVED`, `DISABLED`
  - LetterVariant: `PUBLISHED`, `DISABLED`
  - SupplierAllocation: `PUBLISHED`, `REMOVED`
