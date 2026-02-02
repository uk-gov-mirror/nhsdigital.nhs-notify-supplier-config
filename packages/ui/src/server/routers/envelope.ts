import { z } from "zod";
import { router, publicProcedure } from "../trpc";
import { ConfigRepo } from "../../config-repo";
import { $EnvelopeForm } from "../../schemas";

const repo = new ConfigRepo();

export const envelopeRouter = router({
  list: publicProcedure.query(async () => {
    return repo.listEnvelopes();
  }),

  get: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input }) => {
      return repo.getEnvelope(input.id);
    }),

  create: publicProcedure
    .input($EnvelopeForm)
    .mutation(async ({ input }) => {
      return repo.createEnvelope(input);
    }),

  update: publicProcedure
    .input(z.object({ id: z.string(), data: $EnvelopeForm.partial() }))
    .mutation(async ({ input }) => {
      return repo.updateEnvelope(input.id, input.data);
    }),

  delete: publicProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input }) => {
      await repo.deleteEnvelope(input.id);
      return { success: true };
    }),
});
