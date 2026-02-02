import { z } from "zod";
import { router, publicProcedure } from "../trpc";
import { ConfigRepo } from "../../config-repo";
import { $InsertForm } from "../../schemas";

const repo = new ConfigRepo();

export const insertRouter = router({
  list: publicProcedure.query(async () => {
    return repo.listInserts();
  }),

  get: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input }) => {
      return repo.getInsert(input.id);
    }),

  create: publicProcedure
    .input($InsertForm)
    .mutation(async ({ input }) => {
      return repo.createInsert(input);
    }),

  update: publicProcedure
    .input(z.object({ id: z.string(), data: $InsertForm.partial() }))
    .mutation(async ({ input }) => {
      return repo.updateInsert(input.id, input.data);
    }),

  delete: publicProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input }) => {
      await repo.deleteInsert(input.id);
      return { success: true };
    }),
});
