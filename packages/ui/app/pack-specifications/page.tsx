"use client";

import Header from "@/components/Header";
import Footer from "@/components/Footer";
import PackSpecificationForm from "@/components/PackSpecificationForm";
import { trpc } from "@/src/trpc/client";
import { type PackSpecificationFormData } from "@/src/schemas";
import { useState } from "react";

export default function PackSpecifications() {
  const [isCreating, setIsCreating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const utils = trpc.useUtils();
  const { data: specifications, isLoading } = trpc.specification.list.useQuery();

  const createMutation = trpc.specification.create.useMutation({
    onSuccess: () => {
      utils.specification.list.invalidate();
      setIsCreating(false);
    },
  });

  const updateMutation = trpc.specification.update.useMutation({
    onSuccess: () => {
      utils.specification.list.invalidate();
      setEditingId(null);
    },
  });

  const deleteMutation = trpc.specification.delete.useMutation({
    onSuccess: () => {
      utils.specification.list.invalidate();
    },
  });

  const handleCreate = (data: PackSpecificationFormData) => {
    createMutation.mutate(data);
  };

  const handleUpdate = (id: string, data: PackSpecificationFormData) => {
    updateMutation.mutate({ id, data });
  };

  const editingSpec = editingId
    ? specifications?.find((s) => s.id === editingId)
    : null;

  return (
    <div className="min-h-screen bg-white">
      <Header />

      <main className="max-w-7xl mx-auto px-6 py-12">
        <div className="mb-8 flex justify-between items-start">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Pack Specifications
            </h2>
            <p className="text-gray-700">
              Manage pack specifications including postage, paper types, envelopes, and assembly options.
            </p>
          </div>
          <button
            onClick={() => setIsCreating(true)}
            className="bg-[#005EB8] text-white px-4 py-2 rounded-md hover:bg-[#004a93] transition-colors"
          >
            + New Specification
          </button>
        </div>

        {/* Create New Specification Form */}
        {isCreating && (
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 mb-8">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                Create New Specification
              </h3>
              <button
                onClick={() => setIsCreating(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>
            <PackSpecificationForm
              onSubmit={handleCreate}
              submitText="Create Specification"
              isSubmitting={createMutation.isPending}
            />
          </div>
        )}

        {/* Edit Specification Form */}
        {editingSpec && (
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 mb-8">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                Edit: {editingSpec.name}
              </h3>
              <button
                onClick={() => setEditingId(null)}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>
            <PackSpecificationForm
              onSubmit={(data) => handleUpdate(editingSpec.id, data)}
              defaultValues={editingSpec}
              submitText="Save Changes"
              isSubmitting={updateMutation.isPending}
            />
          </div>
        )}

        {/* Specifications List */}
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden mb-8">
          <div className="bg-gray-50 px-6 py-3 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">
              Saved Specifications
            </h3>
          </div>

          {isLoading ? (
            <div className="p-6 text-center text-gray-500">Loading...</div>
          ) : specifications && specifications.length > 0 ? (
            <ul className="divide-y divide-gray-200">
              {specifications.map((spec) => (
                <li key={spec.id} className="px-6 py-4 flex justify-between items-center hover:bg-gray-50">
                  <div>
                    <p className="font-medium text-gray-900">{spec.name}</p>
                    <p className="text-sm text-gray-500">
                      ID: {spec.id} | Status: {spec.status} | Version: {spec.version}
                    </p>
                    {spec.description && (
                      <p className="text-sm text-gray-600 mt-1">{spec.description}</p>
                    )}
                  </div>
                  <div className="flex gap-2 items-center">
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      spec.status === "PROD" ? "bg-green-100 text-green-800" :
                      spec.status === "INT" ? "bg-yellow-100 text-yellow-800" :
                      spec.status === "DISABLED" ? "bg-gray-100 text-gray-800" :
                      "bg-blue-100 text-blue-800"
                    }`}>
                      {spec.status}
                    </span>
                    <button
                      onClick={() => setEditingId(spec.id)}
                      className="text-[#005EB8] hover:text-[#004a93] text-sm font-medium"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => deleteMutation.mutate({ id: spec.id })}
                      disabled={deleteMutation.isPending}
                      className="text-red-600 hover:text-red-800 text-sm"
                    >
                      Delete
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <div className="p-6 text-center text-gray-500">
              No specifications found. Create one to get started.
            </div>
          )}
        </div>

        {/* Info Panel */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-blue-900 mb-2">
            📦 Pack Specification Components
          </h3>
          <ul className="list-disc list-inside text-blue-800 space-y-2">
            <li><strong>Postage:</strong> Standard, Large, or Parcel sizes with delivery day specifications</li>
            <li><strong>Paper:</strong> A3, A4, or A5 sizes with weight (GSM), colour, and finish options</li>
            <li><strong>Envelope:</strong> C4, C5, or DL sizes with optional features (Whitemail, NHS Branding, NHS Barcode)</li>
            <li><strong>Inserts:</strong> Flyers, booklets, or attachments from in-house or external sources</li>
            <li><strong>Features:</strong> Braille, Audio, ADMail, or Same Day delivery options</li>
          </ul>
        </div>
      </main>

      <Footer />
    </div>
  );
}
