import type { DomainEntityName } from "@supplier-config/file-store";

export function pkForEntity(entity: DomainEntityName): string {
  return `ENTITY#${entity}`;
}

export function skForId(id: string): string {
  return `ID#${id}`;
}
