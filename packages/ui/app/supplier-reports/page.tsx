"use client";

import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { trpc } from "@/src/trpc/client";
import { useState } from "react";
import SupplierReportView from "@/components/SupplierReportView";

export default function SupplierReports() {
  const [selectedSupplierId, setSelectedSupplierId] = useState<string | null>(null);
  const [excludeDrafts, setExcludeDrafts] = useState(false);

  const { data: suppliers, isLoading: suppliersLoading } = trpc.supplierReport.listSuppliers.useQuery();

  const { data: report, isLoading: reportLoading } = trpc.supplierReport.getReport.useQuery(
    { supplierId: selectedSupplierId!, excludeDrafts },
    { enabled: !!selectedSupplierId }
  );

  return (
    <div className="min-h-screen bg-[#f0f4f5]">
      <Header subtitle="Supplier Pack Specification Reports" />

      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Supplier Selection */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h2 className="text-xl font-bold text-[#003087] mb-4 pb-2 border-b-2 border-[#005eb8]">
            Select Supplier
          </h2>

          <div className="flex flex-wrap gap-4 items-center">
            <div className="flex-1 min-w-[250px]">
              <label htmlFor="supplier-select" className="block text-sm font-medium text-gray-700 mb-1">
                Supplier
              </label>
              <select
                id="supplier-select"
                value={selectedSupplierId || ""}
                onChange={(e) => setSelectedSupplierId(e.target.value || null)}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#005eb8] focus:border-transparent"
                disabled={suppliersLoading}
              >
                <option value="">
                  {suppliersLoading ? "Loading suppliers..." : "Select a supplier..."}
                </option>
                {suppliers?.map((supplier) => (
                  <option key={supplier.id} value={supplier.id}>
                    {supplier.name} ({supplier.packCount} packs)
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="exclude-drafts"
                checked={excludeDrafts}
                onChange={(e) => setExcludeDrafts(e.target.checked)}
                className="h-4 w-4 text-[#005eb8] focus:ring-[#005eb8] border-gray-300 rounded"
              />
              <label htmlFor="exclude-drafts" className="text-sm text-gray-700">
                Exclude draft packs
              </label>
            </div>
          </div>
        </div>

        {/* Supplier Cards Overview */}
        {!selectedSupplierId && suppliers && suppliers.length > 0 && (
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-[#003087] mb-4">All Suppliers</h3>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {suppliers.map((supplier) => (
                <button
                  key={supplier.id}
                  onClick={() => setSelectedSupplierId(supplier.id)}
                  className="bg-white rounded-lg shadow-sm p-4 text-left hover:shadow-md transition-shadow border border-gray-200 hover:border-[#005eb8]"
                >
                  <h4 className="font-semibold text-[#003087] mb-2">{supplier.name}</h4>
                  <div className="text-sm text-gray-600 space-y-1">
                    <p>Channel: <span className="font-medium">{supplier.channelType}</span></p>
                    <p>Total Packs: <span className="font-medium">{supplier.packCount}</span></p>
                    <p>Approved: <span className="font-medium text-[#007f3b]">{supplier.approvedCount}</span></p>
                  </div>
                  {supplier.status && (
                    <span className={`inline-block mt-2 px-2 py-0.5 text-xs font-semibold rounded ${
                      supplier.status === "PROD"
                        ? "bg-[#007f3b] text-white"
                        : supplier.status === "INT"
                        ? "bg-[#005eb8] text-white"
                        : "bg-gray-500 text-white"
                    }`}>
                      {supplier.status}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Report View */}
        {selectedSupplierId && (
          <div>
            {reportLoading ? (
              <div className="bg-white rounded-lg shadow-sm p-8 text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#005eb8] mx-auto mb-4"></div>
                <p className="text-gray-600">Loading report...</p>
              </div>
            ) : report ? (
              <SupplierReportView report={report} />
            ) : (
              <div className="bg-white rounded-lg shadow-sm p-8 text-center">
                <p className="text-gray-600">No report data available</p>
              </div>
            )}
          </div>
        )}

        {/* Empty State */}
        {!selectedSupplierId && (!suppliers || suppliers.length === 0) && !suppliersLoading && (
          <div className="bg-white rounded-lg shadow-sm p-8 text-center">
            <p className="text-gray-600 mb-4">
              No suppliers found. Add suppliers via the configuration interface to generate reports.
            </p>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
