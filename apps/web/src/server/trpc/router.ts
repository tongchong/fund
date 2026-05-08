import { trpc } from "./def";
import { login } from "./route/login";
import { logon } from "./route/logon";
import { user } from "./route/user";

export const appRouter = trpc.router({
  user,
  login,
  logon,
});

export type AppRouter = typeof appRouter;

export type Caller = ReturnType<typeof appRouter.createCaller>;
