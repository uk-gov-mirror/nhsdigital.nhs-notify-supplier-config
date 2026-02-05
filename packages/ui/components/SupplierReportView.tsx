"use client";

import { useState } from "react";
import type { SupplierReportData, SupplierPackWithSpec } from "@/src/server/routers/supplier-report";
import PackSpecificationDetails from "./PackSpecificationDetails";

interface SupplierReportViewProps {
  report: SupplierReportData;
}

function StatusBadge({
  status,
  type,
}: {
  status: string;
  type: "approval" | "environment";
}) {
  const baseClasses = "inline-block px-2 py-0.5 rounded text-xs font-semibold uppercase";

  if (type === "approval") {
    const approvalClasses: Record<string, string> = {
      APPROVED: "bg-white text-[#007f3b] border-2 border-[#007f3b]",
      SUBMITTED: "bg-white text-[#b45309] border-2 border-[#b45309]",
      REJECTED: "bg-white text-[#da291c] border-2 border-[#da291c]",
      DRAFT: "bg-white text-gray-600 border-2 border-gray-600",
      PROOF_RECEIVED: "bg-white text-[#005eb8] border-2 border-[#005eb8]",
      DISABLED: "bg-gray-200 text-gray-600 border-2 border-gray-400",
    };
    return (
      <span className={`${baseClasses} ${approvalClasses[status] || approvalClasses.DRAFT}`}>
        {status}
      </span>
    );
  }

  const envClasses: Record<string, string> = {
    PROD: "bg-[#007f3b] text-white border-2 border-[#007f3b]",
    INT: "bg-[#005eb8] text-white border-2 border-[#005eb8]",
    DRAFT: "bg-gray-500 text-white border-2 border-gray-500",
  };
  return (
    <span className={`${baseClasses} ${envClasses[status] || envClasses.DRAFT}`}>
      {status}
    </span>
  );
}

function SummaryCard({ number, label }: { number: number; label: string }) {
  return (
    <div className="bg-white rounded-lg shadow-sm p-4 text-center">
      <div className="text-3xl font-bold text-[#005eb8]">{number}</div>
      <div className="text-sm text-gray-700">{label}</div>
    </div>
  );
}

export default function SupplierReportView({ report }: SupplierReportViewProps) {
  const [expandedPacks, setExpandedPacks] = useState<Set<string>>(new Set());
  const [filterStatus, setFilterStatus] = useState<string>("all");

  const togglePack = (packId: string) => {
    setExpandedPacks((prev) => {
      const next = new Set(prev);
      if (next.has(packId)) {
        next.delete(packId);
      } else {
        next.add(packId);
      }
      return next;
    });
  };

  const expandAll = () => {
    setExpandedPacks(new Set(report.packs.map((p) => p.packSpecification.id)));
  };

  const collapseAll = () => {
    setExpandedPacks(new Set());
  };

  // Separate packs into submitted/approved vs draft
  const submittedPacks = report.packs.filter((p) => p.supplierPack.approval !== "DRAFT");
  const draftPacks = report.packs.filter((p) => p.supplierPack.approval === "DRAFT");

  // Filter packs based on selected filter
  const filteredPacks = report.packs.filter((pack) => {
    if (filterStatus === "all") return true;
    if (filterStatus === "approved") return pack.supplierPack.approval === "APPROVED";
    if (filterStatus === "submitted") return pack.supplierPack.approval === "SUBMITTED";
    if (filterStatus === "draft") return pack.supplierPack.approval === "DRAFT";
    if (filterStatus === "prod") return pack.supplierPack.status === "PROD";
    return true;
  });

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  return (
    <div className="space-y-6">
      {/* Supplier Info */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-xl font-bold text-[#003087] mb-4 pb-2 border-b-2 border-[#005eb8]">
          Supplier Information
        </h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <span className="text-gray-700 text-sm">ID</span>
            <p className="font-medium text-gray-900">{report.supplier.id}</p>
          </div>
          <div>
            <span className="text-gray-700 text-sm">Name</span>
            <p className="font-medium text-gray-900">{report.supplier.name}</p>
          </div>
          <div>
            <span className="text-gray-700 text-sm">Channel Type</span>
            <p className="font-medium text-gray-900">{report.supplier.channelType}</p>
          </div>
          <div>
            <span className="text-gray-700 text-sm">Daily Capacity</span>
            <p className="font-medium text-gray-900">{report.supplier.dailyCapacity?.toLocaleString() ?? "Not specified"}</p>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <SummaryCard number={report.summary.totalPacks} label="Total Packs" />
        <SummaryCard number={report.summary.approvedCount} label="Approved" />
        <SummaryCard number={report.summary.submittedCount} label="Submitted" />
        <SummaryCard number={report.summary.prodCount} label="In Production" />
      </div>

      {/* Volume Group Allocations */}
      {report.allocations.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-bold text-[#003087] mb-4 pb-2 border-b-2 border-[#005eb8]">
            Volume Group Allocations
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-[#f0f4f5]">
                  <th className="text-left p-3 font-semibold text-[#003087]">Volume Group</th>
                  <th className="text-left p-3 font-semibold text-[#003087]">Allocation %</th>
                  <th className="text-left p-3 font-semibold text-[#003087]">Start Date</th>
                  <th className="text-left p-3 font-semibold text-[#003087]">End Date</th>
                  <th className="text-left p-3 font-semibold text-[#003087]">Status</th>
                </tr>
              </thead>
              <tbody>
                {report.allocations.map(({ allocation, volumeGroup }) => (
                  <tr key={allocation.id} className="border-b border-gray-200">
                    <td className="p-3">
                      <div className="font-medium text-gray-900">{volumeGroup.name}</div>
                      <div className="text-sm text-gray-600">{volumeGroup.id}</div>
                    </td>
                    <td className="p-3 font-medium text-gray-900">{allocation.allocationPercentage}%</td>
                    <td className="p-3 text-gray-900">{formatDate(volumeGroup.startDate)}</td>
                    <td className="p-3 text-gray-900">{volumeGroup.endDate ? formatDate(volumeGroup.endDate) : "—"}</td>
                    <td className="p-3">
                      <StatusBadge status={allocation.status} type="environment" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Table of Contents / Pack List */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-4 pb-2 border-b-2 border-[#005eb8]">
          <h3 className="text-lg font-bold text-[#003087]">
            Pack Specifications ({filteredPacks.length})
          </h3>
          <div className="flex gap-2 items-center">
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="border border-gray-300 rounded px-2 py-1 text-sm text-gray-900"
            >
              <option value="all">All Statuses</option>
              <option value="approved">Approved Only</option>
              <option value="submitted">Submitted Only</option>
              <option value="draft">Drafts Only</option>
              <option value="prod">Production Only</option>
            </select>
            <button
              onClick={expandAll}
              className="px-3 py-1 text-sm text-[#005eb8] border border-[#005eb8] rounded hover:bg-[#005eb8] hover:text-white transition-colors"
            >
              Expand All
            </button>
            <button
              onClick={collapseAll}
              className="px-3 py-1 text-sm text-gray-600 border border-gray-300 rounded hover:bg-gray-100 transition-colors"
            >
              Collapse All
            </button>
          </div>
        </div>

        {/* Submitted & Approved Section */}
        {submittedPacks.length > 0 && filterStatus !== "draft" && (
          <div className="mb-6">
            <h4 className="text-base font-semibold text-gray-700 mb-3 pb-1 border-b border-gray-200">
              Submitted & Approved Packs ({submittedPacks.filter((p) => {
                if (filterStatus === "all") return true;
                if (filterStatus === "approved") return p.supplierPack.approval === "APPROVED";
                if (filterStatus === "submitted") return p.supplierPack.approval === "SUBMITTED";
                if (filterStatus === "prod") return p.supplierPack.status === "PROD";
                return true;
              }).length})
            </h4>
            <PackTable
              packs={submittedPacks.filter((p) => {
                if (filterStatus === "all") return true;
                if (filterStatus === "approved") return p.supplierPack.approval === "APPROVED";
                if (filterStatus === "submitted") return p.supplierPack.approval === "SUBMITTED";
                if (filterStatus === "prod") return p.supplierPack.status === "PROD";
                return true;
              })}
              expandedPacks={expandedPacks}
              togglePack={togglePack}
              formatDate={formatDate}
            />
          </div>
        )}

        {/* Draft Section */}
        {draftPacks.length > 0 && (filterStatus === "all" || filterStatus === "draft") && (
          <div>
            <h4 className="text-base font-semibold text-gray-700 mb-3 pb-1 border-b border-gray-200">
              Draft Packs ({draftPacks.length})
            </h4>
            <PackTable
              packs={draftPacks}
              expandedPacks={expandedPacks}
              togglePack={togglePack}
              formatDate={formatDate}
            />
          </div>
        )}

        {filteredPacks.length === 0 && (
          <p className="text-gray-600 text-center py-8">No packs match the current filter.</p>
        )}
      </div>
    </div>
  );
}

interface PackTableProps {
  packs: SupplierPackWithSpec[];
  expandedPacks: Set<string>;
  togglePack: (id: string) => void;
  formatDate: (date: string) => string;
}

function PackTable({ packs, expandedPacks, togglePack, formatDate }: PackTableProps) {
  return (
    <div className="space-y-2">
      {packs.map(({ packSpecification, supplierPack }) => {
        const isExpanded = expandedPacks.has(packSpecification.id);
        return (
          <div key={packSpecification.id} className="border border-gray-200 rounded-lg overflow-hidden">
            <button
              onClick={() => togglePack(packSpecification.id)}
              className="w-full flex items-center justify-between p-4 bg-[#f0f4f5] hover:bg-[#e8eef0] transition-colors text-left"
            >
              <div className="flex-1">
                <div className="flex items-center gap-3">
                  <code className="bg-white px-2 py-0.5 rounded text-sm font-mono text-gray-800">
                    {packSpecification.id}
                  </code>
                  <span className="font-medium text-[#003087]">{packSpecification.name}</span>
                </div>
                <div className="flex items-center gap-4 mt-2 text-sm text-gray-700">
                  <span>v{packSpecification.version}</span>
                  <span>Updated: {formatDate(packSpecification.updatedAt)}</span>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-end gap-2 min-w-35">
                  <span className="text-xs text-gray-500 uppercase">Approval:</span>
                  <StatusBadge status={supplierPack.approval} type="approval" />
                </div>
                <div className="flex items-center justify-end gap-2 min-w-30">
                  <span className="text-xs text-gray-500 uppercase">Env:</span>
                  <StatusBadge status={supplierPack.status} type="environment" />
                </div>
                <span className="text-gray-500 text-lg">{isExpanded ? "▼" : "▶"}</span>
              </div>
            </button>
            {isExpanded && (
              <div className="p-4 border-t border-gray-200 bg-white">
                <PackSpecificationDetails
                  packSpecification={packSpecification}
                  supplierPack={supplierPack}
                />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
