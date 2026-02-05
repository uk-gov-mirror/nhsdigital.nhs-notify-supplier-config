"use client";

import type { ResolvedPackSpecification } from "@/src/server/routers/supplier-report";
import type { SupplierPackStorage } from "@/src/config-repo";

interface PackSpecificationDetailsProps {
  packSpecification: ResolvedPackSpecification;
  supplierPack: SupplierPackStorage;
}

function DetailRow({
  label,
  value,
  tooltip,
}: {
  label: string;
  value: React.ReactNode;
  tooltip?: string;
}) {
  return (
    <tr className="border-b border-gray-100 last:border-0">
      <th
        className={`p-2 text-left text-gray-600 font-semibold w-1/3 ${
          tooltip ? "border-b-2 border-dotted border-[#005eb8] cursor-help" : ""
        }`}
        title={tooltip}
      >
        {label}
      </th>
      <td className="p-2 text-gray-800">{value ?? <em className="text-gray-400">Not specified</em>}</td>
    </tr>
  );
}

function formatConstraint(
  constraint?: { value: number; operator: string }
): React.ReactNode {
  if (!constraint) return <em className="text-gray-400">Not specified</em>;

  const operatorSymbols: Record<string, string> = {
    EQUALS: "=",
    NOT_EQUALS: "≠",
    GREATER_THAN: ">",
    LESS_THAN: "<",
  };
  const symbol = operatorSymbols[constraint.operator] || constraint.operator;
  return `${symbol} ${constraint.value}`;
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function PackSpecificationDetails({
  packSpecification,
  supplierPack,
}: PackSpecificationDetailsProps) {
  const pack = packSpecification;

  return (
    <div className="space-y-6">
      {/* Supplier Pack Info */}
      <div className="bg-[#f0f4f5] rounded-lg p-4">
        <p className="text-sm text-gray-900">
          <strong className="text-gray-900">Pack Specification ID:</strong> {supplierPack.packSpecificationId}
        </p>
      </div>

      {/* Basic Information */}
      <section>
        <h4 className="text-base font-semibold text-[#005eb8] mb-3">Basic Information</h4>
        <table className="w-full">
          <tbody>
            <DetailRow label="ID" value={pack.id} />
            <DetailRow label="Name" value={pack.name} />
            <DetailRow label="Description" value={pack.description} />
            <DetailRow
              label="Pack Specification Status"
              value={
                <span
                  className={`inline-block px-2 py-0.5 rounded text-xs font-semibold uppercase ${
                    pack.status === "PROD"
                      ? "bg-[#007f3b] text-white"
                      : pack.status === "INT"
                      ? "bg-[#005eb8] text-white"
                      : "bg-gray-500 text-white"
                  }`}
                >
                  {pack.status}
                </span>
              }
            />
            <DetailRow
              label="Version"
              value={pack.version}
              tooltip="Version number of the pack specification"
            />
            <DetailRow label="Created At" value={formatDate(pack.createdAt)} />
            <DetailRow label="Updated At" value={formatDate(pack.updatedAt)} />
          </tbody>
        </table>
      </section>

      {/* Postage */}
      <section>
        <h4 className="text-base font-semibold text-[#005eb8] mb-3">Postage</h4>
        <table className="w-full">
          <tbody>
            <DetailRow label="Postage ID" value={pack.postage.id} />
            <DetailRow label="Size" value={pack.postage.size} />
            <DetailRow
              label="Delivery Days"
              value={pack.postage.deliveryDays}
              tooltip="Expected number of delivery days for this postage class"
            />
            <DetailRow
              label="Max Weight (grams)"
              value={pack.postage.maxWeightGrams}
              tooltip="Maximum weight in grams for this postage tariff"
            />
            <DetailRow
              label="Max Thickness (mm)"
              value={pack.postage.maxThicknessMm}
              tooltip="Maximum thickness in millimetres for this postage tariff"
            />
          </tbody>
        </table>
      </section>

      {/* Constraints */}
      <section>
        <h4 className="text-base font-semibold text-[#005eb8] mb-3">Constraints</h4>
        <table className="w-full">
          <tbody>
            <DetailRow
              label="Sheets"
              value={formatConstraint(pack.constraints?.sheets)}
              tooltip="Maximum number of sheets allowed in the pack"
            />
            <DetailRow
              label="Sides"
              value={formatConstraint(pack.constraints?.sides)}
              tooltip="Maximum number of printed sides"
            />
            <DetailRow
              label="Delivery Days"
              value={formatConstraint(pack.constraints?.deliveryDays)}
              tooltip="Delivery time constraint in days"
            />
            <DetailRow
              label="Black Coverage (%)"
              value={formatConstraint(pack.constraints?.blackCoveragePercentage)}
              tooltip="Maximum black ink coverage percentage"
            />
            <DetailRow
              label="Colour Coverage (%)"
              value={formatConstraint(pack.constraints?.colourCoveragePercentage)}
              tooltip="Maximum colour ink coverage percentage"
            />
          </tbody>
        </table>
      </section>

      {/* Assembly */}
      <section>
        <h4 className="text-base font-semibold text-[#005eb8] mb-3">Assembly</h4>
        <table className="w-full">
          <tbody>
            <DetailRow label="Envelope ID" value={pack.assembly?.envelopeId} />
            <DetailRow label="Print Colour" value={pack.assembly?.printColour} />
            <DetailRow
              label="Duplex"
              value={
                pack.assembly?.duplex === undefined
                  ? undefined
                  : pack.assembly.duplex
                  ? "Yes"
                  : "No"
              }
            />
            <DetailRow
              label="Features"
              value={
                pack.assembly?.features && pack.assembly.features.length > 0
                  ? pack.assembly.features.join(", ")
                  : undefined
              }
            />
            <DetailRow
              label="Insert IDs"
              value={
                pack.assembly?.insertIds && pack.assembly.insertIds.length > 0
                  ? pack.assembly.insertIds.join(", ")
                  : undefined
              }
            />
            <DetailRow
              label="Additional"
              value={
                pack.assembly?.additional ? (
                  <pre className="bg-[#f0f4f5] p-2 rounded text-sm overflow-x-auto">
                    {JSON.stringify(pack.assembly.additional, null, 2)}
                  </pre>
                ) : undefined
              }
            />
          </tbody>
        </table>
      </section>

      {/* Paper Details */}
      <section>
        <h5 className="text-sm font-semibold text-gray-600 mb-3">Paper Details</h5>
        <table className="w-full">
          <tbody>
            <DetailRow label="Paper ID" value={pack.assembly?.paper?.id} />
            <DetailRow label="Paper Name" value={pack.assembly?.paper?.name} />
            <DetailRow label="Weight (GSM)" value={pack.assembly?.paper?.weightGSM} />
            <DetailRow label="Size" value={pack.assembly?.paper?.size} />
            <DetailRow
              label="Colour"
              value={pack.assembly?.paper?.colour}
              tooltip="Paper colour"
            />
            <DetailRow label="Finish" value={pack.assembly?.paper?.finish} />
            <DetailRow
              label="Recycled"
              value={
                pack.assembly?.paper?.recycled === undefined
                  ? undefined
                  : pack.assembly.paper.recycled
                  ? "Yes"
                  : "No"
              }
            />
          </tbody>
        </table>
      </section>
    </div>
  );
}
