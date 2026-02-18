import { z } from "zod";
import { idRef } from "@nhsdigital/nhs-notify-event-schemas-supplier-config/src/helpers/id-ref";
import { $PackSpecification } from "@nhsdigital/nhs-notify-event-schemas-supplier-config/src/domain/pack-specification";
import { $EnvironmentStatus } from "@nhsdigital/nhs-notify-event-schemas-supplier-config/src/domain/common";
import { $Supplier } from "./supplier";

export const $SupplierPack = z
  .object({
    id: z.string(),
    packSpecificationId: idRef($PackSpecification),
    supplierId: idRef($Supplier),
    approval: z
      .enum([
        "DRAFT",
        "SUBMITTED",
        "PROOF_RECEIVED",
        "APPROVED",
        "REJECTED",
        "DISABLED",
      ])
      .meta({
        title: "Approval Status",
        description:
          "Indicates the current state of the supplier pack approval process.",
      }),
    status: $EnvironmentStatus,
  })
  .meta({
    title: "SupplierPack",
    description:
      "Indicates that a supplier is capable of producing a specific pack specification.",
  });
export type SupplierPack = z.infer<typeof $SupplierPack>;
