import { z } from "zod";
import { router, publicProcedure } from "../trpc";
import { ConfigRepo } from "../../config-repo";
import { $PostageForm } from "../../schemas";

const repo = new ConfigRepo();

export const postageRouter = router({
  list: publicProcedure.query(async () => {
    return repo.listPostages();
  }),

  get: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input }) => {
      return repo.getPostage(input.id);
    }),

  create: publicProcedure
    .input($PostageForm)
    .mutation(async ({ input }) => {
      return repo.createPostage(input);
    }),

  update: publicProcedure
    .input(z.object({ id: z.string(), data: $PostageForm.partial() }))
    .mutation(async ({ input }) => {
      return repo.updatePostage(input.id, input.data);
    }),

  delete: publicProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input }) => {
      await repo.deletePostage(input.id);
      return { success: true };
    }),
});
