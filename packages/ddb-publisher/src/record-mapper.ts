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

function groupByEntity(records: ConfigRecord[]) {
  const recordsByEntity = new Map<DomainEntityName, ConfigRecord[]>();

  for (const record of records) {
    if (!recordsByEntity.get(record.entity)) {
      recordsByEntity.set(record.entity, []);
    }
    recordsByEntity.get(record.entity)!.push(record);
  }
  return recordsByEntity;
}

export function mapToEvents(records: ConfigRecord[]) {
  const recordsByEntity = groupByEntity(records);
  return [...recordsByEntity].flatMap(([entity, items]) => {
    // eslint-disable-next-line security/detect-object-injection
    const buildEvents = buildersByEntity[entity];
    const recordsById = Object.fromEntries(items.map((r) => [r.id, r.data]));
    return buildEvents(recordsById);
  });
}
