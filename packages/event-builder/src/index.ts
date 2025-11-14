// Config
export { configFromEnv, buildEventSource } from "./config";
export type { Config } from "./config";

// Envelope helpers
export {
  severityNumber,
  generateTraceParent,
  nextSequence,
  newSequenceGenerator,
} from "./lib/envelope-helpers";
export type { SeverityText } from "./lib/envelope-helpers";

// Base event envelope
export { buildBaseEventEnvelope } from "./lib/base-event-envelope";
export type { BaseEnvelopeOptions } from "./lib/base-event-envelope";

// Event builders
export {
  buildLetterVariantEvent,
  buildLetterVariantEvents,
} from "./letter-variant-event-builder";
export type {
  BuildLetterVariantEventOptions,
  LetterVariantSpecialisedEvent,
} from "./letter-variant-event-builder";

export {
  buildPackSpecificationEvent,
  buildPackSpecificationEvents,
} from "./pack-specification-event-builder";
export type {
  BuildPackSpecificationEventOptions,
  PackSpecificationSpecialisedEvent,
} from "./pack-specification-event-builder";

export {
  buildSupplierEvent,
  buildSupplierEvents,
} from "./supplier-event-builder";
export type {
  BuildSupplierEventOptions,
  SupplierEvent,
} from "./supplier-event-builder";

export {
  buildSupplierAllocationEvent,
  buildSupplierAllocationEvents,
} from "./supplier-allocation-event-builder";
export type {
  BuildSupplierAllocationEventOptions,
  SupplierAllocationSpecialisedEvent,
} from "./supplier-allocation-event-builder";

export {
  buildSupplierPackEvent,
  buildSupplierPackEvents,
} from "./supplier-pack-event-builder";
export type {
  BuildSupplierPackEventOptions,
  SupplierPackSpecialisedEvent,
} from "./supplier-pack-event-builder";

export {
  buildVolumeGroupEvent,
  buildVolumeGroupEvents,
} from "./volume-group-event-builder";
export type { BuildVolumeGroupEventOptions } from "./volume-group-event-builder";
