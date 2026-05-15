import { trpc } from "./def";
import { fund } from "./route/fund";
import { login } from "./route/login";
import { logon } from "./route/logon";
import { user } from "./route/user";

export const appRouter = trpc.router({
  user,
  login,
  logon,
  fund,
});

export type AppRouter = typeof appRouter;

export type Caller = ReturnType<typeof appRouter.createCaller>;
