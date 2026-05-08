import { trpc } from "src/server/trpc/def";
import { adminMiddleware } from "src/server/trpc/middleware/verifyAdmin";
import { libraryAdminMiddleware } from "src/server/trpc/middleware/verifyLibAdmin";
import { authMiddleware } from "src/server/trpc/middleware/verifyToken";
import { withLoggerContext } from "src/server/trpc/middleware/withLoggerContext";

export const baseProcedure = trpc.procedure;

export const authProcedure = baseProcedure.use(withLoggerContext).use(authMiddleware);

export const adminAuthProcedure = baseProcedure.use(adminMiddleware).use(withLoggerContext);

export const libraryAdminAuthProcedure = baseProcedure
  .use(withLoggerContext)
  .use(libraryAdminMiddleware);
