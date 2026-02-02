"use client";

import Header from "@/components/Header";
import Footer from "@/components/Footer";
import AutoForm from "@/components/AutoForm";
import { trpc } from "@/src/trpc/client";
import {
  $EnvelopeForm,
  $PaperForm,
  $PostageForm,
  $InsertForm,
} from "@/src/schemas";
import { useState } from "react";

type EntityType = "envelopes" | "papers" | "postages" | "inserts";

const entityConfig = {
  envelopes: { label: "Envelopes", schema: $EnvelopeForm },
  papers: { label: "Papers", schema: $PaperForm },
  postages: { label: "Postage tariffs", schema: $PostageForm },
  inserts: { label: "Inserts", schema: $InsertForm },
};

export default function ConfigPage() {
  const [activeTab, setActiveTab] = useState<EntityType>("postages");
  const [isCreating, setIsCreating] = useState(false);

  const utils = trpc.useUtils();

  // Queries for all entity types
  const envelopes = trpc.envelope.list.useQuery();
  const papers = trpc.paper.list.useQuery();
  const postages = trpc.postage.list.useQuery();
  const inserts = trpc.insert.list.useQuery();

  // Mutations
  const createEnvelope = trpc.envelope.create.useMutation({
    onSuccess: () => { utils.envelope.list.invalidate(); setIsCreating(false); },
  });
  const deleteEnvelope = trpc.envelope.delete.useMutation({
    onSuccess: () => utils.envelope.list.invalidate(),
  });

  const createPaper = trpc.paper.create.useMutation({
    onSuccess: () => { utils.paper.list.invalidate(); setIsCreating(false); },
  });
  const deletePaper = trpc.paper.delete.useMutation({
    onSuccess: () => utils.paper.list.invalidate(),
  });

  const createPostage = trpc.postage.create.useMutation({
    onSuccess: () => { utils.postage.list.invalidate(); setIsCreating(false); },
  });
  const deletePostage = trpc.postage.delete.useMutation({
    onSuccess: () => utils.postage.list.invalidate(),
  });

  const createInsert = trpc.insert.create.useMutation({
    onSuccess: () => { utils.insert.list.invalidate(); setIsCreating(false); },
  });
  const deleteInsert = trpc.insert.delete.useMutation({
    onSuccess: () => utils.insert.list.invalidate(),
  });

  const getActiveData = () => {
    switch (activeTab) {
      case "envelopes": return envelopes.data ?? [];
      case "papers": return papers.data ?? [];
      case "postages": return postages.data ?? [];
      case "inserts": return inserts.data ?? [];
    }
  };

  const isLoading = () => {
    switch (activeTab) {
      case "envelopes": return envelopes.isLoading;
      case "papers": return papers.isLoading;
      case "postages": return postages.isLoading;
      case "inserts": return inserts.isLoading;
    }
  };

  const handleCreate = (data: unknown) => {
    switch (activeTab) {
      case "envelopes": createEnvelope.mutate(data as never); break;
      case "papers": createPaper.mutate(data as never); break;
      case "postages": createPostage.mutate(data as never); break;
      case "inserts": createInsert.mutate(data as never); break;
    }
  };

  const handleDelete = (id: string) => {
    switch (activeTab) {
      case "envelopes": deleteEnvelope.mutate({ id }); break;
      case "papers": deletePaper.mutate({ id }); break;
      case "postages": deletePostage.mutate({ id }); break;
      case "inserts": deleteInsert.mutate({ id }); break;
    }
  };

  const renderEntityDetails = (entity: Record<string, unknown>) => {
    const excludeKeys = ["id", "createdAt", "updatedAt"];
    return Object.entries(entity)
      .filter(([key]) => !excludeKeys.includes(key))
      .map(([key, value]) => {
        if (Array.isArray(value)) {
          return value.length > 0 ? `${key}: ${value.join(", ")}` : null;
        }
        if (typeof value === "boolean") {
          return value ? key : null;
        }
        return value ? `${key}: ${value}` : null;
      })
      .filter(Boolean)
      .join(" | ");
  };

  return (
    <div className="min-h-screen bg-white">
      <Header subtitle="Configuration Management" />

      <main className="max-w-7xl mx-auto px-6 py-12">
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Reference Data Configuration
          </h2>
          <p className="text-gray-700">
            Manage envelopes, papers, postage tariffs, and inserts that can be referenced in pack specifications.
          </p>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200 mb-6">
          <nav className="flex space-x-8">
            {(Object.keys(entityConfig) as EntityType[]).map((tab) => (
              <button
                key={tab}
                onClick={() => { setActiveTab(tab); setIsCreating(false); }}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab
                    ? "border-[#005EB8] text-[#005EB8]"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                {entityConfig[tab].label}
              </button>
            ))}
          </nav>
        </div>

        {/* Action Button */}
        <div className="mb-6 flex justify-end">
          <button
            onClick={() => setIsCreating(!isCreating)}
            className="bg-[#005EB8] text-white px-4 py-2 rounded-md hover:bg-[#004a93] transition-colors"
          >
            {isCreating ? "Cancel" : `+ New ${entityConfig[activeTab].label.slice(0, -1)}`}
          </button>
        </div>

        {/* Create Form */}
        {isCreating && (
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 mb-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Create New {entityConfig[activeTab].label.slice(0, -1)}
            </h3>
            <AutoForm
              schema={entityConfig[activeTab].schema}
              onSubmit={handleCreate}
              submitText={`Create ${entityConfig[activeTab].label.slice(0, -1)}`}
            />
          </div>
        )}

        {/* Entity List */}
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          <div className="bg-gray-50 px-6 py-3 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">
              {entityConfig[activeTab].label}
            </h3>
          </div>

          {isLoading() ? (
            <div className="p-6 text-center text-gray-500">Loading...</div>
          ) : getActiveData().length > 0 ? (
            <ul className="divide-y divide-gray-200">
              {getActiveData().map((entity) => (
                <li key={entity.id} className="px-6 py-4 flex justify-between items-center hover:bg-gray-50">
                  <div>
                    <p className="font-medium text-gray-900">{entity.name}</p>
                    <p className="text-sm text-gray-500">
                      ID: {entity.id}
                    </p>
                    <p className="text-sm text-gray-600 mt-1">
                      {renderEntityDetails(entity as Record<string, unknown>)}
                    </p>
                  </div>
                  <button
                    onClick={() => handleDelete(entity.id)}
                    className="text-red-600 hover:text-red-800 text-sm"
                  >
                    Delete
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <div className="p-6 text-center text-gray-500">
              No {entityConfig[activeTab].label.toLowerCase()} found. Create one to get started.
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
