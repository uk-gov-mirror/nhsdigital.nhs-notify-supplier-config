import { z } from "zod";
import { router, publicProcedure } from "../trpc";
import {
  ConfigRepo,
  type SupplierStorage,
  type SupplierPackStorage,
  type SupplierAllocationStorage,
  type VolumeGroupStorage,
  type PackSpecificationStorage,
  type PostageStorage,
  type PaperStorage,
} from "../../config-repo";

// Resolved pack specification with postage object instead of ID
export interface ResolvedPackSpecification extends Omit<PackSpecificationStorage, "postageId" | "assembly"> {
  postage: PostageStorage;
  assembly?: PackSpecificationStorage["assembly"] & {
    paper?: PaperStorage;
  };
}

// Types for supplier report data
export interface SupplierPackWithSpec {
  packSpecification: ResolvedPackSpecification;
  supplierPack: SupplierPackStorage;
}

export interface AllocationWithVolumeGroup {
  allocation: SupplierAllocationStorage;
  volumeGroup: VolumeGroupStorage;
}

export interface SupplierReportData {
  supplier: SupplierStorage;
  packs: SupplierPackWithSpec[];
  allocations: AllocationWithVolumeGroup[];
  summary: {
    totalPacks: number;
    approvedCount: number;
    submittedCount: number;
    draftCount: number;
    prodCount: number;
  };
}

// Singleton ConfigRepo instance
const configRepo = new ConfigRepo();

// Resolve a pack specification by replacing IDs with full objects
function resolvePackSpecification(
  spec: PackSpecificationStorage,
  postages: PostageStorage[],
  papers: PaperStorage[]
): ResolvedPackSpecification | null {
  const postage = postages.find((p) => p.id === spec.postageId);
  if (!postage) return null;

  const resolvedAssembly = spec.assembly
    ? {
        ...spec.assembly,
        paper: spec.assembly.paperId
          ? papers.find((p) => p.id === spec.assembly!.paperId)
          : undefined,
      }
    : undefined;

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { postageId, assembly, ...rest } = spec;
  return {
    ...rest,
    postage,
    assembly: resolvedAssembly,
  };
}

// Build supplier reports from config repo data
async function buildSupplierReports(
  excludeDrafts = false
): Promise<Map<string, SupplierReportData>> {
  const reports = new Map<string, SupplierReportData>();

  // Load all data from the config repo
  const [suppliers, supplierPacks, supplierAllocations, volumeGroups, packs, postages, papers] = await Promise.all([
    configRepo.listSuppliers(),
    configRepo.listSupplierPacks(),
    configRepo.listSupplierAllocations(),
    configRepo.listVolumeGroups(),
    configRepo.listSpecifications(),
    configRepo.listPostages(),
    configRepo.listPapers(),
  ]);

  // Initialize reports for each supplier
  for (const supplier of suppliers) {
    reports.set(supplier.id, {
      supplier,
      packs: [],
      allocations: [],
      summary: {
        totalPacks: 0,
        approvedCount: 0,
        submittedCount: 0,
        draftCount: 0,
        prodCount: 0,
      },
    });
  }

  // Add allocations to suppliers
  for (const allocation of supplierAllocations) {
    const volumeGroup = volumeGroups.find(
      (vg) => vg.id === allocation.volumeGroupId
    );
    const report = reports.get(allocation.supplierId);
    if (report && volumeGroup) {
      report.allocations.push({ allocation, volumeGroup });
    }
  }

  // Add packs to suppliers
  for (const supplierPack of supplierPacks) {
    if (excludeDrafts && supplierPack.approval === "DRAFT") {
      continue;
    }

    const packSpec = packs.find(
      (p) => p.id === supplierPack.packSpecificationId
    );
    const report = reports.get(supplierPack.supplierId);

    if (report && packSpec) {
      const resolvedSpec = resolvePackSpecification(packSpec, postages, papers);
      if (resolvedSpec) {
        report.packs.push({ packSpecification: resolvedSpec, supplierPack });
      }
    }
  }

  // Calculate summaries
  for (const report of reports.values()) {
    report.summary.totalPacks = report.packs.length;
    report.summary.approvedCount = report.packs.filter(
      (p) => p.supplierPack.approval === "APPROVED"
    ).length;
    report.summary.submittedCount = report.packs.filter(
      (p) => p.supplierPack.approval === "SUBMITTED"
    ).length;
    report.summary.draftCount = report.packs.filter(
      (p) => p.supplierPack.approval === "DRAFT"
    ).length;
    report.summary.prodCount = report.packs.filter(
      (p) => p.supplierPack.status === "PROD"
    ).length;
  }

  return reports;
}

export const supplierReportRouter = router({
  // List all suppliers with summary info
  listSuppliers: publicProcedure.query(async () => {
    const reports = await buildSupplierReports();

    return Array.from(reports.values()).map((report) => ({
      id: report.supplier.id,
      name: report.supplier.name,
      channelType: report.supplier.channelType,
      status: report.supplier.status,
      packCount: report.summary.totalPacks,
      approvedCount: report.summary.approvedCount,
    }));
  }),

  // Get detailed report for a specific supplier
  getReport: publicProcedure
    .input(
      z.object({
        supplierId: z.string(),
        excludeDrafts: z.boolean().optional().default(false),
      })
    )
    .query(async ({ input }) => {
      const reports = await buildSupplierReports(input.excludeDrafts);
      const report = reports.get(input.supplierId);

      if (!report) {
        throw new Error(`Supplier ${input.supplierId} not found`);
      }

      // Sort packs: non-drafts first, then by ID
      const sortedPacks = [...report.packs].sort((a, b) => {
        const aIsDraft = a.supplierPack.approval === "DRAFT";
        const bIsDraft = b.supplierPack.approval === "DRAFT";
        if (aIsDraft !== bIsDraft) {
          return aIsDraft ? 1 : -1;
        }
        return a.packSpecification.id.localeCompare(b.packSpecification.id);
      });

      return {
        ...report,
        packs: sortedPacks,
      };
    }),
});
