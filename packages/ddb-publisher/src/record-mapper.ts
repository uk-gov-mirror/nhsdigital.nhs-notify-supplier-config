import type {
  ConfigRecord,
  DomainEntityName,
} from "@supplier-config/file-store";
import {
  buildLetterVariantEvents,
  buildPackSpecificationEvents,
  buildSupplierAllocationEvents,
  buildSupplierEvents,
  buildSupplierPackEvents,
  buildVolumeGroupEvents,
} from "@supplier-config/event-builder";

type Builder = (entity: Record<string, any>) => any;

const buildersByEntity: Record<DomainEntityName, Builder> = {
  "volume-group": buildVolumeGroupEvents,
  "letter-variant": buildLetterVariantEvents,
  "pack-specification": buildPackSpecificationEvents,
  supplier: buildSupplierEvents,
  "supplier-allocation": buildSupplierAllocationEvents,
  "supplier-pack": buildSupplierPackEvents,
};

export function mapToEvents(records: ConfigRecord[]) {
  const recordsByEntity = Map.groupBy(records, (record) => record.entity);
  return [...recordsByEntity].flatMap(([entity, items]) =>
    // eslint-disable-next-line security/detect-object-injection
    buildersByEntity[entity](
      Object.fromEntries(items.map((r) => [r.id, r.data])),
    ),
  );
}
