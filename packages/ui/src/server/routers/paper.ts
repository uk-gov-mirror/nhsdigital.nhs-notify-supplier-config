import { z } from "zod";
import { router, publicProcedure } from "../trpc";
import { ConfigRepo } from "../../config-repo";
import { $PaperForm } from "../../schemas";

const repo = new ConfigRepo();

export const paperRouter = router({
  list: publicProcedure.query(async () => {
    return repo.listPapers();
  }),

  get: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input }) => {
      return repo.getPaper(input.id);
    }),

  create: publicProcedure
    .input($PaperForm)
    .mutation(async ({ input }) => {
      return repo.createPaper(input);
    }),

  update: publicProcedure
    .input(z.object({ id: z.string(), data: $PaperForm.partial() }))
    .mutation(async ({ input }) => {
      return repo.updatePaper(input.id, input.data);
    }),

  delete: publicProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input }) => {
      await repo.deletePaper(input.id);
      return { success: true };
    }),
});
