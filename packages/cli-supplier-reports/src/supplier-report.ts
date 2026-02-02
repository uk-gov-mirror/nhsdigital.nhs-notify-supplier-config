import * as fs from "node:fs";
import path from "node:path";
import {
  $PackSpecification,
  $Paper,
  $Postage,
  PackSpecification,
} from "@nhsdigital/nhs-notify-event-schemas-supplier-config/src/domain/pack-specification";
import { Supplier } from "@nhsdigital/nhs-notify-event-schemas-supplier-config/src/domain/supplier";
import { SupplierAllocation } from "@nhsdigital/nhs-notify-event-schemas-supplier-config/src/domain/supplier-allocation";
import { SupplierPack } from "@nhsdigital/nhs-notify-event-schemas-supplier-config/src/domain/supplier-pack";
import { VolumeGroup } from "@nhsdigital/nhs-notify-event-schemas-supplier-config/src/domain/volume-group";
import type { ParseResult } from "@supplier-config/excel-parser";

interface SupplierPackWithSpec {
  packSpecification: PackSpecification;
  supplierPack: SupplierPack;
}

interface AllocationWithVolumeGroup {
  allocation: SupplierAllocation;
  volumeGroup: VolumeGroup;
}

interface SupplierReport {
  allocations: AllocationWithVolumeGroup[];
  packs: SupplierPackWithSpec[];
  supplier: Supplier;
}

function escapeHtml(text: string | number | boolean | undefined): string {
  if (text === undefined) return "";
  const str = String(text);
  return str
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function formatValue(value: unknown): string {
  if (value === undefined || value === null) return "<em>Not specified</em>";
  if (typeof value === "boolean") return value ? "Yes" : "No";
  if (Array.isArray(value)) return value.join(", ");
  if (typeof value === "object") return JSON.stringify(value, null, 2);
  return escapeHtml(String(value));
}

function sanitizeAnchorId(text: string): string {
  return text
    .toLowerCase()
    .replaceAll(/[^a-z0-9]+/g, "-")
    .replaceAll(/(^-)|(-$)/g, "");
}

function getApprovalStatusTooltip(approval: string): string {
  const tooltips: Record<string, string> = {
    DRAFT: "Not yet submitted to the supplier for review",
    SUBMITTED:
      "Pack specification has been submitted to the supplier for review",
    PROOF_RECEIVED:
      "Supplier has returned a proof for approval based on the specification details",
    APPROVED: "Pack specification has been approved and is ready for use",
    REJECTED: "Pack specification has been rejected and requires revision",
    DISABLED:
      "No longer active and won't be available for allocating new letters to the supplier",
  };
  return tooltips[approval] || "";
}

function getEnvironmentStatusTooltip(status: string): string {
  const tooltips: Record<string, string> = {
    DRAFT: "In draft state, not deployed to any environment",
    INT: "Deployed to integration/test environment",
    PROD: "Deployed to production environment",
  };
  return tooltips[status] || "";
}

function getPackSpecificationStatusTooltip(status: string): string {
  const tooltips: Record<string, string> = {
    DRAFT: "Pack specification is in draft and not yet published",
    INT: "Pack specification is published to integration/test environment",
    PROD: "Pack specification is published to production environment",
  };
  return tooltips[status] || "";
}

function renderOptionalRow(
  label: string,
  value: unknown,
  formatter: (v: unknown) => string = (v) => escapeHtml(String(v)),
  tooltip?: string,
): string {
  if (value === undefined || value === null) return "";
  const tooltipAttr = tooltip
    ? ` data-tooltip="${escapeHtml(tooltip)}" class="has-tooltip"`
    : "";
  return `<tr><th${tooltipAttr}>${label}</th><td>${formatter(value)}</td></tr>`;
}

function renderConstraintsSection(
  constraints: PackSpecification["constraints"],
): string {
  // Get the Constraints schema from PackSpecification
  const constraintsSchema = $PackSpecification.shape.constraints;
  const unwrapped = constraintsSchema.unwrap().shape;

  const maxSheetsTooltip = unwrapped.maxSheets.meta()?.description;
  const deliveryDaysTooltip = unwrapped.deliveryDays.meta()?.description;
  const blackCoverageTooltip = unwrapped.blackCoveragePercentage.meta()?.description;
  const colourCoverageTooltip = unwrapped.colourCoveragePercentage.meta()?.description;

  const maxSheetsHeader = maxSheetsTooltip ? ` data-tooltip="${escapeHtml(maxSheetsTooltip)}" class="has-tooltip"` : "";
  const deliveryDaysHeader = deliveryDaysTooltip ? ` data-tooltip="${escapeHtml(deliveryDaysTooltip)}" class="has-tooltip"` : "";
  const blackCoverageHeader = blackCoverageTooltip ? ` data-tooltip="${escapeHtml(blackCoverageTooltip)}" class="has-tooltip"` : "";
  const colourCoverageHeader = colourCoverageTooltip ? ` data-tooltip="${escapeHtml(colourCoverageTooltip)}" class="has-tooltip"` : "";

  return `
    <h4>Constraints</h4>
    <table class="details-table">
      <tr><th${maxSheetsHeader}>Max Sheets</th><td>${constraints?.maxSheets !== undefined ? escapeHtml(constraints.maxSheets) : "<em>Not specified</em>"}</td></tr>
      <tr><th${deliveryDaysHeader}>Delivery Days</th><td>${constraints?.deliveryDays !== undefined ? escapeHtml(constraints.deliveryDays) : "<em>Not specified</em>"}</td></tr>
      <tr><th${blackCoverageHeader}>Black Coverage (%)</th><td>${constraints?.blackCoveragePercentage !== undefined ? escapeHtml(constraints.blackCoveragePercentage) : "<em>Not specified</em>"}</td></tr>
      <tr><th${colourCoverageHeader}>Colour Coverage (%)</th><td>${constraints?.colourCoveragePercentage !== undefined ? escapeHtml(constraints.colourCoveragePercentage) : "<em>Not specified</em>"}</td></tr>
    </table>
  `;
}

function renderPaperSection(
  paper: NonNullable<PackSpecification["assembly"]>["paper"],
): string {
  const colourTooltip = $Paper.shape.colour.meta()?.description;
  const colourHeader = colourTooltip
    ? ` data-tooltip="${escapeHtml(colourTooltip)}" class="has-tooltip"`
    : "";

  if (!paper) {
    return `
    <h5>Paper Details</h5>
    <table class="details-table">
      <tr><th>Paper ID</th><td><em>Not specified</em></td></tr>
      <tr><th>Paper Name</th><td><em>Not specified</em></td></tr>
      <tr><th>Weight (GSM)</th><td><em>Not specified</em></td></tr>
      <tr><th>Size</th><td><em>Not specified</em></td></tr>
      <tr><th${colourHeader}>Colour</th><td><em>Not specified</em></td></tr>
      <tr><th>Finish</th><td><em>Not specified</em></td></tr>
      <tr><th>Recycled</th><td><em>Not specified</em></td></tr>
    </table>
  `;
  }

  return `
    <h5>Paper Details</h5>
    <table class="details-table">
      <tr><th>Paper ID</th><td>${escapeHtml(paper.id)}</td></tr>
      <tr><th>Paper Name</th><td>${escapeHtml(paper.name)}</td></tr>
      <tr><th>Weight (GSM)</th><td>${escapeHtml(paper.weightGSM)}</td></tr>
      <tr><th>Size</th><td>${escapeHtml(paper.size)}</td></tr>
      <tr><th${colourHeader}>Colour</th><td>${escapeHtml(paper.colour)}</td></tr>
      <tr><th>Finish</th><td>${paper.finish ? escapeHtml(paper.finish) : "<em>Not specified</em>"}</td></tr>
      <tr><th>Recycled</th><td>${paper.recycled ? "Yes" : "No"}</td></tr>
    </table>
  `;
}

function renderAssemblySection(
  assembly: PackSpecification["assembly"],
): string {
  const envelopeId = assembly?.envelopeId ? escapeHtml(assembly.envelopeId) : "<em>Not specified</em>";
  const printColour = assembly?.printColour ? escapeHtml(assembly.printColour) : "<em>Not specified</em>";
  const duplex = assembly?.duplex !== undefined ? (assembly.duplex ? "Yes" : "No") : "<em>Not specified</em>";
  const features = assembly?.features && assembly.features.length > 0 ? formatValue(assembly.features) : "<em>Not specified</em>";
  const insertIds = assembly?.insertIds && assembly.insertIds.length > 0 ? formatValue(assembly.insertIds) : "<em>Not specified</em>";
  const additional = assembly?.additional ? `<pre>${escapeHtml(JSON.stringify(assembly.additional, null, 2))}</pre>` : "<em>Not specified</em>";

  return `
    <h4>Assembly</h4>
    <table class="details-table">
      <tr><th>Envelope ID</th><td>${envelopeId}</td></tr>
      <tr><th>Print Colour</th><td>${printColour}</td></tr>
      <tr><th>Duplex</th><td>${duplex}</td></tr>
      <tr><th>Features</th><td>${features}</td></tr>
      <tr><th>Insert IDs</th><td>${insertIds}</td></tr>
      <tr><th>Additional</th><td>${additional}</td></tr>
    </table>
    ${renderPaperSection(assembly?.paper)}
  `;
}

function generatePackDetailsHtml(pack: PackSpecification): string {
  const deliveryDaysTooltip = $Postage.shape.deliveryDays.meta()?.description;
  const maxWeightTooltip = $Postage.shape.maxWeightGrams.meta()?.description;
  const maxThicknessTooltip = $Postage.shape.maxThicknessMm.meta()?.description;

  const deliveryDaysHeader = deliveryDaysTooltip ? ` data-tooltip="${escapeHtml(deliveryDaysTooltip)}" class="has-tooltip"` : "";
  const maxWeightHeader = maxWeightTooltip ? ` data-tooltip="${escapeHtml(maxWeightTooltip)}" class="has-tooltip"` : "";
  const maxThicknessHeader = maxThicknessTooltip ? ` data-tooltip="${escapeHtml(maxThicknessTooltip)}" class="has-tooltip"` : "";

  const versionTooltip = $PackSpecification.shape.version.meta()?.description;
  const versionHeader = versionTooltip
    ? ` data-tooltip="${escapeHtml(versionTooltip)}" class="has-tooltip"`
    : "";

  const packStatusTooltip = getPackSpecificationStatusTooltip(pack.status);

  return `
    <div class="pack-details">
      <h4>Basic Information</h4>
      <table class="details-table">
        <tr><th>ID</th><td>${escapeHtml(pack.id)}</td></tr>
        <tr><th>Name</th><td>${escapeHtml(pack.name)}</td></tr>
        <tr><th>Description</th><td>${pack.description ? escapeHtml(pack.description) : "<em>Not specified</em>"}</td></tr>
        <tr><th>Pack Specification Status</th><td><span class="status status-${pack.status.toLowerCase()} has-tooltip" data-tooltip="${escapeHtml(packStatusTooltip)}">${escapeHtml(pack.status)}</span></td></tr>
        <tr><th${versionHeader}>Version</th><td>${escapeHtml(pack.version)}</td></tr>
        <tr><th>Created At</th><td>${escapeHtml(pack.createdAt)}</td></tr>
        <tr><th>Updated At</th><td>${escapeHtml(pack.updatedAt)}</td></tr>
      </table>

      <h4>Postage</h4>
      <table class="details-table">
        <tr><th>Postage ID</th><td>${escapeHtml(pack.postage.id)}</td></tr>
        <tr><th>Size</th><td>${escapeHtml(pack.postage.size)}</td></tr>
        <tr><th${deliveryDaysHeader}>Delivery Days</th><td>${pack.postage.deliveryDays !== undefined ? escapeHtml(pack.postage.deliveryDays) : "<em>Not specified</em>"}</td></tr>
        <tr><th${maxWeightHeader}>Max Weight (grams)</th><td>${pack.postage.maxWeightGrams !== undefined ? escapeHtml(pack.postage.maxWeightGrams) : "<em>Not specified</em>"}</td></tr>
        <tr><th${maxThicknessHeader}>Max Thickness (mm)</th><td>${pack.postage.maxThicknessMm !== undefined ? escapeHtml(pack.postage.maxThicknessMm) : "<em>Not specified</em>"}</td></tr>
      </table>

      ${renderConstraintsSection(pack.constraints)}
      ${renderAssemblySection(pack.assembly)}
    </div>
  `;
}

function generateSupplierHtml(report: SupplierReport): string {
  const { allocations, packs, supplier } = report;
  const generatedAt = new Date().toISOString();

  // Separate packs into submitted/approved vs draft
  const submittedPacks = packs.filter(
    (p) => p.supplierPack.approval !== "DRAFT",
  );
  const draftPacks = packs.filter((p) => p.supplierPack.approval === "DRAFT");

  // Sort both groups by pack specification ID
  const sortedSubmittedPacks = [...submittedPacks].sort((a, b) =>
    a.packSpecification.id.localeCompare(b.packSpecification.id),
  );
  const sortedDraftPacks = [...draftPacks].sort((a, b) =>
    a.packSpecification.id.localeCompare(b.packSpecification.id),
  );

  // Combine in order: submitted first, then drafts
  const sortedPacks = [...sortedSubmittedPacks, ...sortedDraftPacks];

  const packSections = sortedPacks
    .map(({ packSpecification, supplierPack }) => {
      const anchorId = `pack-${sanitizeAnchorId(packSpecification.id)}`;
      const approvalTooltip = getApprovalStatusTooltip(supplierPack.approval);
      const envTooltip = getEnvironmentStatusTooltip(supplierPack.status);
      return `
    <section class="pack-section" id="${anchorId}">
      <h3>${escapeHtml(packSpecification.name)}</h3>
      <h4 class="supplier-pack-approval-header">Supplier pack approval</h4>
      <div class="status-row">
        <span class="status-label">Approval:</span>
        <span class="status approval-status status-${supplierPack.approval.toLowerCase()} has-tooltip" data-tooltip="${escapeHtml(approvalTooltip)}">${escapeHtml(supplierPack.approval)}</span>
        <span class="status-label">Environment:</span>
        <span class="status env-status status-${supplierPack.status.toLowerCase()} has-tooltip" data-tooltip="${escapeHtml(envTooltip)}">${escapeHtml(supplierPack.status)}</span>
      </div>
      <div class="supplier-pack-info">
        <p><strong>Pack Specification ID:</strong> ${escapeHtml(supplierPack.packSpecificationId)}</p>
      </div>
      ${generatePackDetailsHtml(packSpecification)}
      <a href="#top" class="back-to-top">↑ Back to top</a>
    </section>
  `;
    })
    .join("\n");

  // Generate Table of Contents with two sections
  const generateTocItems = (packList: SupplierPackWithSpec[]) =>
    packList
      .map(({ packSpecification, supplierPack }) => {
        const anchorId = `pack-${sanitizeAnchorId(packSpecification.id)}`;
        const approvalTooltip = getApprovalStatusTooltip(supplierPack.approval);
        const envTooltip = getEnvironmentStatusTooltip(supplierPack.status);
        return `
      <li>
        <a href="#${anchorId}"><code>${escapeHtml(packSpecification.id)}</code> – ${escapeHtml(packSpecification.name)}</a>
        <span class="toc-statuses">
          <span class="toc-status approval-status status-${supplierPack.approval.toLowerCase()} has-tooltip" data-tooltip="${escapeHtml(approvalTooltip)}">${escapeHtml(supplierPack.approval)}</span>
          <span class="toc-status env-status status-${supplierPack.status.toLowerCase()} has-tooltip" data-tooltip="${escapeHtml(envTooltip)}">${escapeHtml(supplierPack.status)}</span>
        </span>
      </li>`;
      })
      .join("\n");

  const submittedTocItems = generateTocItems(sortedSubmittedPacks);
  const draftTocItems = generateTocItems(sortedDraftPacks);

  const tocSection =
    packs.length > 0
      ? `
    <nav class="toc" aria-label="Table of Contents">
      <h3>Table of Contents</h3>
      ${
        sortedSubmittedPacks.length > 0
          ? `
      <h4 class="toc-section-header">Submitted & Approved Packs (${sortedSubmittedPacks.length})</h4>
      <ol>
        ${submittedTocItems}
      </ol>
      `
          : ""
      }
      ${
        sortedDraftPacks.length > 0
          ? `
      <h4 class="toc-section-header">Draft Packs (${sortedDraftPacks.length})</h4>
      <ol>
        ${draftTocItems}
      </ol>
      `
          : ""
      }
    </nav>
  `
      : "";

  const approvedCount = packs.filter(
    (p) => p.supplierPack.approval === "APPROVED",
  ).length;
  const submittedCount = packs.filter(
    (p) => p.supplierPack.approval === "SUBMITTED",
  ).length;
  const draftCount = packs.filter(
    (p) => p.supplierPack.approval === "DRAFT",
  ).length;
  const prodCount = packs.filter(
    (p) => p.supplierPack.status === "PROD",
  ).length;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Supplier Config Report - ${escapeHtml(supplier.name)}</title>
  <style>
    :root {
      --nhs-blue: #005eb8;
      --nhs-dark-blue: #003087;
      --nhs-white: #ffffff;
      --nhs-pale-grey: #f0f4f5;
      --nhs-light-grey: #d8dde0;
      --nhs-green: #007f3b;
      --nhs-red: #da291c;
      --nhs-yellow: #ffb81c;
    }

    * {
      box-sizing: border-box;
    }

    body {
      font-family: "Frutiger", Arial, sans-serif;
      line-height: 1.5;
      color: #212b32;
      margin: 0;
      padding: 0;
      background-color: var(--nhs-pale-grey);
    }

    .container {
      max-width: 1200px;
      margin: 0 auto;
      padding: 20px;
    }

    header {
      background-color: var(--nhs-blue);
      color: var(--nhs-white);
      padding: 20px;
      margin-bottom: 20px;
    }

    header h1 {
      margin: 0;
    }

    header p {
      margin: 5px 0 0 0;
      opacity: 0.9;
    }

    .supplier-info {
      background-color: var(--nhs-white);
      padding: 20px;
      border-radius: 4px;
      margin-bottom: 20px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.1);
    }

    .supplier-info h2 {
      color: var(--nhs-dark-blue);
      margin-top: 0;
      border-bottom: 2px solid var(--nhs-blue);
      padding-bottom: 10px;
    }

    .supplier-info table {
      width: 100%;
    }

    .pack-section {
      background-color: var(--nhs-white);
      padding: 20px;
      border-radius: 4px;
      margin-bottom: 20px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.1);
    }

    .pack-section h3 {
      color: var(--nhs-dark-blue);
      margin-top: 0;
      border-bottom: 2px solid var(--nhs-blue);
      padding-bottom: 10px;
      display: flex;
      align-items: center;
      gap: 10px;
    }

    .supplier-pack-approval-header {
      color: #4c6272;
      font-size: 16px;
      font-weight: 600;
      margin-top: 20px;
      margin-bottom: 10px;
      border-bottom: 1px solid var(--nhs-light-grey);
      padding-bottom: 5px;
    }

    .pack-section h4 {
      color: var(--nhs-blue);
      margin-top: 20px;
      margin-bottom: 10px;
    }

    .pack-section h5 {
      color: #4c6272;
      margin-top: 15px;
      margin-bottom: 8px;
    }

    .supplier-pack-info {
      background-color: var(--nhs-pale-grey);
      padding: 10px 15px;
      border-radius: 4px;
      margin-bottom: 15px;
    }

    .supplier-pack-info p {
      margin: 5px 0;
    }

    .details-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 15px;
    }

    .details-table th,
    .details-table td {
      padding: 10px;
      text-align: left;
      border-bottom: 1px solid var(--nhs-light-grey);
    }

    .details-table th {
      width: 250px;
      color: #4c6272;
      font-weight: 600;
    }

    .details-table th.has-tooltip {
      border-bottom: 2px dotted var(--nhs-blue);
      cursor: help;
    }

    .details-table td {
      color: #212b32;
    }

    .details-table pre {
      margin: 0;
      font-size: 12px;
      background: var(--nhs-pale-grey);
      padding: 8px;
      border-radius: 4px;
      overflow-x: auto;
    }

    .status {
      display: inline-block;
      padding: 2px 8px;
      border-radius: 4px;
      font-size: 12px;
      font-weight: 600;
      text-transform: uppercase;
    }

    .status.has-tooltip {
      cursor: help;
    }

    /* Approval statuses - outlined/bordered style */
    .approval-status.status-approved {
      background-color: var(--nhs-white);
      color: var(--nhs-green);
      border: 2px solid var(--nhs-green);
    }

    .approval-status.status-submitted {
      background-color: var(--nhs-white);
      color: var(--nhs-yellow);
      border: 2px solid var(--nhs-yellow);
    }

    .approval-status.status-rejected {
      background-color: var(--nhs-white);
      color: var(--nhs-red);
      border: 2px solid var(--nhs-red);
    }

    .approval-status.status-draft {
      background-color: var(--nhs-white);
      color: #4c6272;
      border: 2px solid #4c6272;
    }

    /* Environment statuses - solid filled background */
    .env-status.status-draft {
      background-color: #4c6272;
      color: var(--nhs-white);
      border: 2px solid #4c6272;
    }

    .env-status.status-int {
      background-color: var(--nhs-blue);
      color: var(--nhs-white);
      border: 2px solid var(--nhs-blue);
    }

    .env-status.status-prod {
      background-color: var(--nhs-green);
      color: var(--nhs-white);
      border: 2px solid var(--nhs-green);
    }

    /* Generic status fallbacks for other contexts */
    .status-approved {
      background-color: var(--nhs-white);
      color: var(--nhs-green);
      border: 2px solid var(--nhs-green);
    }

    .status-submitted {
      background-color: var(--nhs-white);
      color: var(--nhs-yellow);
      border: 2px solid var(--nhs-yellow);
    }

    .status-rejected {
      background-color: var(--nhs-white);
      color: var(--nhs-red);
      border: 2px solid var(--nhs-red);
    }

    .status-draft {
      background-color: #4c6272;
      color: var(--nhs-white);
      border: 2px solid #4c6272;
    }

    .status-int {
      background-color: var(--nhs-blue);
      color: var(--nhs-white);
      border: 2px solid var(--nhs-blue);
    }

    .status-prod {
      background-color: var(--nhs-green);
      color: var(--nhs-white);
      border: 2px solid var(--nhs-green);
    }

    /* Other statuses */
    .status-published {
      background-color: var(--nhs-green);
      color: var(--nhs-white);
      border: 2px solid var(--nhs-green);
    }

    .status-row {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 15px;
      flex-wrap: wrap;
    }

    .status-label {
      font-weight: 600;
      color: #4c6272;
      font-size: 14px;
    }

    .toc-statuses {
      display: flex;
      gap: 6px;
    }

    .allocations-section {
      background-color: var(--nhs-white);
      padding: 20px;
      border-radius: 4px;
      margin-bottom: 20px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.1);
    }

    .allocations-section h3 {
      color: var(--nhs-dark-blue);
      margin-top: 0;
      margin-bottom: 15px;
      border-bottom: 2px solid var(--nhs-blue);
      padding-bottom: 10px;
    }

    .allocations-table {
      width: 100%;
      border-collapse: collapse;
    }

    .allocations-table th,
    .allocations-table td {
      padding: 12px;
      text-align: left;
      border-bottom: 1px solid var(--nhs-light-grey);
    }

    .allocations-table th {
      background-color: var(--nhs-pale-grey);
      color: var(--nhs-dark-blue);
      font-weight: 600;
    }

    .allocations-table td small {
      color: #4c6272;
    }

    .summary {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 15px;
      margin-bottom: 20px;
    }

    .summary-card {
      background-color: var(--nhs-white);
      padding: 15px 20px;
      border-radius: 4px;
      text-align: center;
      box-shadow: 0 1px 3px rgba(0,0,0,0.1);
    }

    .summary-card .number {
      font-size: 32px;
      font-weight: bold;
      color: var(--nhs-blue);
    }

    .summary-card .label {
      color: #4c6272;
      font-size: 14px;
    }

    footer {
      text-align: center;
      color: #4c6272;
      font-size: 12px;
      padding: 20px;
    }

    .pack-specifications-header {
      color: var(--nhs-dark-blue);
    }

    .toc {
      background-color: var(--nhs-white);
      padding: 20px;
      border-radius: 4px;
      margin-bottom: 20px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.1);
    }

    .toc h3 {
      color: var(--nhs-dark-blue);
      margin-top: 0;
      margin-bottom: 15px;
      border-bottom: 2px solid var(--nhs-blue);
      padding-bottom: 10px;
    }

    .toc-section-header {
      color: #4c6272;
      font-size: 16px;
      margin-top: 20px;
      margin-bottom: 10px;
      padding-bottom: 5px;
      border-bottom: 1px solid var(--nhs-light-grey);
    }

    .toc-section-header:first-of-type {
      margin-top: 0;
    }

    .toc ol {
      margin: 0;
      padding-left: 20px;
    }

    .toc li {
      margin: 8px 0;
      display: flex;
      align-items: center;
      gap: 10px;
    }

    .toc a {
      color: var(--nhs-blue);
      text-decoration: none;
    }

    .toc a:hover {
      text-decoration: underline;
    }

    .toc a code {
      background-color: var(--nhs-pale-grey);
      padding: 2px 6px;
      border-radius: 3px;
      font-size: 12px;
      font-family: monospace;
    }

    .toc-status {
      display: inline-block;
      padding: 1px 6px;
      border-radius: 3px;
      font-size: 10px;
      font-weight: 600;
      text-transform: uppercase;
    }

    .back-to-top {
      display: inline-block;
      margin-top: 15px;
      color: var(--nhs-blue);
      text-decoration: none;
      font-size: 14px;
    }

    .back-to-top:hover {
      text-decoration: underline;
    }

    /* Tooltip styles */
    .has-tooltip {
      position: relative;
    }

    .has-tooltip:hover::after {
      content: attr(data-tooltip);
      position: absolute;
      left: 0;
      bottom: 100%;
      margin-bottom: 5px;
      padding: 8px 12px;
      background-color: #212b32;
      color: var(--nhs-white);
      font-size: 13px;
      font-weight: normal;
      line-height: 1.4;
      border-radius: 4px;
      white-space: normal;
      width: 300px;
      max-width: 90vw;
      z-index: 1000;
      box-shadow: 0 2px 8px rgba(0,0,0,0.2);
      text-transform: none;
    }

    .has-tooltip:hover::before {
      content: "";
      position: absolute;
      left: 20px;
      bottom: 100%;
      margin-bottom: -5px;
      border: 5px solid transparent;
      border-top-color: #212b32;
      z-index: 1001;
    }
  </style>
</head>
<body id="top">
  <header>
    <div class="container">
      <h1>Supplier Config Report</h1>
      <p>Generated: ${generatedAt}</p>
    </div>
  </header>

  <div class="container">
    <section class="supplier-info">
      <h2>${escapeHtml(supplier.name)}</h2>
      <table class="details-table">
        <tr><th>Supplier ID</th><td>${escapeHtml(supplier.id)}</td></tr>
        <tr><th>Channel Type</th><td>${escapeHtml(supplier.channelType)}</td></tr>
        <tr><th>Daily Capacity</th><td>${escapeHtml(supplier.dailyCapacity.toLocaleString())}</td></tr>
        <tr><th>Status</th><td><span class="status status-${supplier.status.toLowerCase()}">${escapeHtml(supplier.status)}</span></td></tr>
      </table>
    </section>

    ${
      allocations.length > 0
        ? `
    <section class="allocations-section">
      <h3>Volume Group Allocations</h3>
      <table class="allocations-table">
        <thead>
          <tr>
            <th>Volume Group</th>
            <th>Period</th>
            <th>Allocation</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          ${allocations
            .toSorted((a, b) =>
              a.volumeGroup.name.localeCompare(b.volumeGroup.name),
            )
            .map(
              ({ allocation, volumeGroup }) => `
          <tr>
            <td>
              <strong>${escapeHtml(volumeGroup.name)}</strong>
              ${volumeGroup.description ? `<br><small>${escapeHtml(volumeGroup.description)}</small>` : ""}
            </td>
            <td>${escapeHtml(volumeGroup.startDate)}${volumeGroup.endDate ? ` to ${escapeHtml(volumeGroup.endDate)}` : " (ongoing)"}</td>
            <td><strong>${escapeHtml(allocation.allocationPercentage)}%</strong></td>
            <td><span class="status status-${allocation.status.toLowerCase()}">${escapeHtml(allocation.status)}</span></td>
          </tr>
            `,
            )
            .join("\n")}
        </tbody>
      </table>
    </section>
    `
        : ""
    }

    <div class="summary">
      <div class="summary-card">
        <div class="number">${packs.length}</div>
        <div class="label">Pack Specifications</div>
      </div>
      <div class="summary-card">
        <div class="number">${draftCount}</div>
        <div class="label">Draft</div>
      </div>
      <div class="summary-card">
        <div class="number">${submittedCount}</div>
        <div class="label">Submitted</div>
      </div>
      <div class="summary-card">
        <div class="number">${approvedCount}</div>
        <div class="label">Approved</div>
      </div>
      <div class="summary-card">
        <div class="number">${prodCount}</div>
        <div class="label">Production</div>
      </div>
    </div>

    ${tocSection}

    <h2 class="pack-specifications-header">Pack Specifications (${packs.length})</h2>
    ${packSections.length > 0 ? packSections : "<p>No pack specifications assigned to this supplier.</p>"}
  </div>

  <footer>
    <p>NHS Notify Supplier Configuration Report</p>
  </footer>
</body>
</html>`;
}

function buildSupplierReports(data: ParseResult, options: GenerateReportsOptions = {}): Map<string, SupplierReport> {
  const reports = new Map<string, SupplierReport>();

  // Initialize reports for all suppliers
  for (const supplier of Object.values(data.suppliers)) {
    reports.set(supplier.id, {
      allocations: [],
      packs: [],
      supplier,
    });
  }

  // Associate supplier allocations with their volume groups
  for (const allocation of Object.values(data.allocations)) {
    const report = reports.get(allocation.supplier);
    if (report) {
      const volumeGroup = Object.values(data.volumeGroups).find(
        (vg) => vg.id === allocation.volumeGroup,
      );
      if (volumeGroup) {
        report.allocations.push({
          allocation,
          volumeGroup,
        });
      }
    }
  }

  // Associate supplier packs with their pack specifications
  for (const supplierPack of Object.values(data.supplierPacks)) {
    // Skip draft packs if excludeDrafts option is enabled
    if (options.excludeDrafts && supplierPack.approval === "DRAFT") {
      continue;
    }

    const report = reports.get(supplierPack.supplierId);
    if (report) {
      const packSpecification = Object.values(data.packs).find(
        (p) => p.id === supplierPack.packSpecificationId,
      );
      if (packSpecification) {
        report.packs.push({
          packSpecification,
          supplierPack,
        });
      } else {
        throw new Error(
          `Supplier pack ${supplierPack.id} references unknown pack specification ${supplierPack.packSpecificationId}`,
        );
      }
    } else {
      throw new Error(
        `Supplier pack ${supplierPack.id} references unknown supplier ${supplierPack.supplierId}`,
      );
    }
  }

  return reports;
}

function sanitizeFilename(name: string): string {
  const sanitized = name.toLowerCase().replaceAll(/[^a-z0-9]+/g, "-");
  // Remove leading and trailing dashes
  const chars = [...sanitized];
  const firstNonDash = chars.findIndex((c) => c !== "-");
  const lastNonDash = chars.findLastIndex((c) => c !== "-");
  if (firstNonDash === -1) return "";
  return sanitized.slice(firstNonDash, lastNonDash + 1);
}

export interface GenerateReportsOptions {
  excludeDrafts?: boolean;
}

export interface GenerateReportsResult {
  outputDir: string;
  reports: {
    filePath: string;
    packCount: number;
    supplierId: string;
    supplierName: string;
  }[];
}

export function generateSupplierReports(
  data: ParseResult,
  outputDir: string,
  options: GenerateReportsOptions = {},
): GenerateReportsResult {
  const reports = buildSupplierReports(data, options);
  const result: GenerateReportsResult = {
    outputDir,
    reports: [],
  };

  // Ensure output directory exists
  // eslint-disable-next-line security/detect-non-literal-fs-filename
  if (!fs.existsSync(outputDir)) {
    // eslint-disable-next-line security/detect-non-literal-fs-filename
    fs.mkdirSync(outputDir, { recursive: true });
  }

  for (const [supplierId, report] of reports) {
    const supplierNameSanitized = sanitizeFilename(report.supplier.name);
    const filename = `supplier-report-${supplierNameSanitized}.html`;
    const filePath = path.join(outputDir, filename);
    const html = generateSupplierHtml(report);

    // eslint-disable-next-line security/detect-non-literal-fs-filename
    fs.writeFileSync(filePath, html, "utf8");

    result.reports.push({
      filePath,
      packCount: report.packs.length,
      supplierId,
      supplierName: report.supplier.name,
    });
  }

  return result;
}
