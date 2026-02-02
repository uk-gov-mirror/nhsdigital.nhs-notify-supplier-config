import { z } from "zod";
import { router, publicProcedure } from "../trpc";
import { ConfigRepo } from "../../config-repo";
import { $PackSpecificationForm } from "../../schemas";

const repo = new ConfigRepo();

// Input schema for updates
const UpdateSpecificationInput = z.object({
  id: z.string(),
  data: $PackSpecificationForm.partial(),
});

export const specificationRouter = router({
  list: publicProcedure.query(async () => {
    return repo.listSpecifications();
  }),

  get: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input }) => {
      return repo.getSpecification(input.id);
    }),

  create: publicProcedure
    .input($PackSpecificationForm)
    .mutation(async ({ input }) => {
      return repo.createSpecification(input);
    }),

  update: publicProcedure
    .input(UpdateSpecificationInput)
    .mutation(async ({ input }) => {
      return repo.updateSpecification(input.id, input.data);
    }),

  delete: publicProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input }) => {
      await repo.deleteSpecification(input.id);
      return { success: true };
    }),
});
