import { router } from "./trpc";
import { specificationRouter } from "./routers/specification";
import { envelopeRouter } from "./routers/envelope";
import { insertRouter } from "./routers/insert";
import { paperRouter } from "./routers/paper";
import { postageRouter } from "./routers/postage";
import { supplierReportRouter } from "./routers/supplier-report";

export const appRouter = router({
  specification: specificationRouter,
  envelope: envelopeRouter,
  insert: insertRouter,
  paper: paperRouter,
  postage: postageRouter,
  supplierReport: supplierReportRouter,
});

export type AppRouter = typeof appRouter;
