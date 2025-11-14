import path from "node:path";
import fs from "node:fs";
import * as XLSX from "xlsx";

function generateTemplateExcel(out: string, force = false): string {
  const resolved = path.isAbsolute(out) ? out : path.join(process.cwd(), out);
  if (!/\.xlsx$/i.test(resolved)) {
    throw new Error(`Output file must end with .xlsx: ${resolved}`);
  }
  // eslint-disable-next-line security/detect-non-literal-fs-filename
  const exists = fs.existsSync(resolved);
  if (exists && !force) {
    throw new Error(
      `Output file already exists (use --force to overwrite): ${resolved}`,
    );
  }

  const wb = XLSX.utils.book_new();

  const addSheet = (name: string, headers: string[]) => {
    const sheet = XLSX.utils.aoa_to_sheet([headers]);
    XLSX.utils.book_append_sheet(wb, sheet, name);
  };

  addSheet("PackSpecification", [
    "id",
    "name",
    "status",
    "version",
    "createdAt",
    "updatedAt",
    "billingId",
    "postage.id",
    "postage.size",
    "postage.deliverySLA",
    "postage.maxWeight",
    "postage.maxThickness",
    "constraints.maxSheets",
    "constraints.deliverySLA",
    "constraints.blackCoveragePercentage",
    "constraints.colourCoveragePercentage",
    "assembly.envelopeId",
    "assembly.printColour",
    "assembly.paper.id",
    "assembly.paper.name",
    "assembly.paper.weightGSM",
    "assembly.paper.size",
    "assembly.paper.colour",
    "assembly.paper.recycled",
    "assembly.insertIds",
    "assembly.features",
    "assembly.additional",
  ]);

  addSheet("LetterVariant", [
    "id",
    "name",
    "description",
    "volumeGroupId",
    "packSpecificationIds",
    "type",
    "status",
    "clientId",
    "campaignIds",
    "constraints.maxSheets",
    "constraints.deliverySLA",
    "constraints.blackCoveragePercentage",
    "constraints.colourCoveragePercentage",
  ]);

  addSheet("VolumeGroup", [
    "id",
    "name",
    "description",
    "startDate",
    "endDate",
    "status",
  ]);

  addSheet("Supplier", [
    "id",
    "name",
    "channelType",
    "dailyCapacity",
    "status",
  ]);

  addSheet("SupplierAllocation", [
    "id",
    "volumeGroupId",
    "supplier",
    "allocationPercentage",
    "status",
  ]);

  addSheet("SupplierPack", [
    "id",
    "packSpecificationId",
    "supplierId",
    "status",
  ]);

  XLSX.writeFile(wb, resolved);
  return resolved;
}

export default generateTemplateExcel;
