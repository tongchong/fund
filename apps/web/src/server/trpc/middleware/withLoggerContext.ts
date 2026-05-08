import { middleware } from "src/server/trpc/def";

export const withLoggerContext = middleware(async ({ next }) => {
  return next();
});
