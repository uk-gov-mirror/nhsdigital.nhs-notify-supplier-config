# Event domain ERD

This document contains the mermaid diagrams for the event domain model.

The schemas are generated from Zod definitions and provide a visual representation of the data structure.

## AllSchemas schema

A Letter Variant describes a letter that can be produced with particular characteristics, and may be scoped to a single clientId and campaignId.

```mermaid
erDiagram
    LetterVariant {
        string id
        string name
        string description
        string type "enum: STANDARD, BRAILLE, AUDIO"
        string status "enum: DRAFT, INT, PROD"
        string volumeGroupId "ref: VolumeGroup"
        string clientId
        string[] campaignIds
        string[] packSpecificationIds "ref: PackSpecification"
        Constraints constraints
    }
    Constraints {
        number maxSheets
        number deliverySLA
        number blackCoveragePercentage
        number colourCoveragePercentage
    }
    PackSpecification {
        string id
        string name
        string status "enum: DRAFT, INT, PROD"
        string createdAt
        string updatedAt
        number version "min: -9007199254740991, max: 9007199254740991"
        string billingId
        Constraints constraints
        Postage postage
        Assembly assembly
    }
    Constraints {
        number maxSheets
        number deliverySLA
        number blackCoveragePercentage
        number colourCoveragePercentage
    }
    Postage {
        string id
        string size "enum: STANDARD, LARGE"
        number deliverySLA
        number maxWeight
        number maxThickness
    }
    Assembly {
        string envelopeId "ref: Envelope"
        string printColour "enum: BLACK, COLOUR"
        Paper paper
        string[] insertIds "ref: Insert"
        string[] features "enum: MAILMARK, BRAILLE, AUDIO, ADMAIL, SAME_DAY"
        Record additional "&lt;string, string&gt;"
    }
    Paper {
        string id
        string name
        number weightGSM
        string size "enum: A4, A3"
        string colour "enum: WHITE, COLOURED"
        boolean recycled
    }
    VolumeGroup {
        string id
        string name
        string description
        string status "enum: DRAFT, INT, PROD"
        string startDate
        string endDate
    }
    Supplier {
        string id
        string name
        string channelType "enum: NHSAPP, SMS, EMAIL, LETTER"
        number dailyCapacity "min: -9007199254740991, max: 9007199254740991"
        string status "enum: DRAFT, INT, PROD"
    }
    SupplierAllocation {
        string id
        string volumeGroup "ref: VolumeGroup"
        string supplier "ref: Supplier"
        number allocationPercentage "positive, max: 100"
        string status "enum: DRAFT, INT, PROD"
    }
    SupplierPack {
        string id
        string packSpecificationId "ref: PackSpecification"
        string supplierId "ref: Supplier"
        string approval "enum: DRAFT, SUBMITTED, PROOF_RECEIVED, APPROVED, REJECTED, DISABLED"
        string status "enum: DRAFT, INT, PROD"
    }
    Envelope {
        string id
        string name
        string size "enum: C5, C4, DL"
        string[] features "enum: WHITEMAIL, NHS_BRANDING, NHS_BARCODE"
        string artwork "url"
    }
    LetterVariant }o--|| VolumeGroup : "volumeGroupId"
    LetterVariant }o--o{ PackSpecification : "packSpecificationIds"
    LetterVariant ||--o{ Constraints : "constraints"
    PackSpecification ||--o{ Constraints : "constraints"
    PackSpecification ||--|| Postage : "postage"
    PackSpecification ||--o{ Assembly : "assembly"
    Assembly }o--o{ Envelope : "envelopeId"
    Assembly ||--o{ Paper : "paper"
    SupplierAllocation }o--|| VolumeGroup : "volumeGroup"
    SupplierAllocation }o--|| Supplier : "supplier"
    SupplierPack }o--|| PackSpecification : "packSpecificationId"
    SupplierPack }o--|| Supplier : "supplierId"
```

## LetterVariant schema

A Letter Variant describes a letter that can be produced with particular characteristics, and may be scoped to a single clientId and campaignId.

```mermaid
erDiagram
    LetterVariant {
        string id
        string name
        string description
        string type "enum: STANDARD, BRAILLE, AUDIO"
        string status "enum: DRAFT, INT, PROD"
        string volumeGroupId "ref: VolumeGroup"
        string clientId
        string[] campaignIds
        string[] packSpecificationIds "ref: PackSpecification"
        Constraints constraints
    }
    Constraints {
        number maxSheets
        number deliverySLA
        number blackCoveragePercentage
        number colourCoveragePercentage
    }
    LetterVariant }o--|| VolumeGroup : "volumeGroupId"
    LetterVariant }o--o{ PackSpecification : "packSpecificationIds"
    LetterVariant ||--o{ Constraints : "constraints"
```

## PackSpecification schema

A PackSpecification defines the composition, postage and assembly attributes for producing a pack.

```mermaid
erDiagram
    PackSpecification {
        string id
        string name
        string status "enum: DRAFT, INT, PROD"
        string createdAt
        string updatedAt
        number version "min: -9007199254740991, max: 9007199254740991"
        string billingId
        Constraints constraints
        Postage postage
        Assembly assembly
    }
    Constraints {
        number maxSheets
        number deliverySLA
        number blackCoveragePercentage
        number colourCoveragePercentage
    }
    Postage {
        string id
        string size "enum: STANDARD, LARGE"
        number deliverySLA
        number maxWeight
        number maxThickness
    }
    Assembly {
        string envelopeId "ref: Envelope"
        string printColour "enum: BLACK, COLOUR"
        Paper paper
        string[] insertIds "ref: Insert"
        string[] features "enum: MAILMARK, BRAILLE, AUDIO, ADMAIL, SAME_DAY"
        Record additional "&lt;string, string&gt;"
    }
    Paper {
        string id
        string name
        number weightGSM
        string size "enum: A4, A3"
        string colour "enum: WHITE, COLOURED"
        boolean recycled
    }
    Envelope {
        string id
        string name
        string size "enum: C5, C4, DL"
        string[] features "enum: WHITEMAIL, NHS_BRANDING, NHS_BARCODE"
        string artwork "url"
    }
    PackSpecification ||--o{ Constraints : "constraints"
    PackSpecification ||--|| Postage : "postage"
    PackSpecification ||--o{ Assembly : "assembly"
    Assembly }o--o{ Envelope : "envelopeId"
    Assembly ||--o{ Paper : "paper"
```

## SupplierAllocation schema

A volume group representing several lots within a competition framework under which suppliers will be allocated capacity.

```mermaid
erDiagram
    VolumeGroup {
        string id
        string name
        string description
        string status "enum: DRAFT, INT, PROD"
        string startDate
        string endDate
    }
    Supplier {
        string id
        string name
        string channelType "enum: NHSAPP, SMS, EMAIL, LETTER"
        number dailyCapacity "min: -9007199254740991, max: 9007199254740991"
        string status "enum: DRAFT, INT, PROD"
    }
    SupplierAllocation {
        string id
        string volumeGroup "ref: VolumeGroup"
        string supplier "ref: Supplier"
        number allocationPercentage "positive, max: 100"
        string status "enum: DRAFT, INT, PROD"
    }
    SupplierAllocation }o--|| VolumeGroup : "volumeGroup"
    SupplierAllocation }o--|| Supplier : "supplier"
```

## SupplierPack schema

Indicates that a supplier is capable of producing a specific pack specification.

```mermaid
erDiagram
    SupplierPack {
        string id
        string packSpecificationId "ref: PackSpecification"
        string supplierId "ref: Supplier"
        string approval "enum: DRAFT, SUBMITTED, PROOF_RECEIVED, APPROVED, REJECTED, DISABLED"
        string status "enum: DRAFT, INT, PROD"
    }
    SupplierPack }o--|| PackSpecification : "packSpecificationId"
    SupplierPack }o--|| Supplier : "supplierId"
```
