import { createNextApiHandler } from "@trpc/server/adapters/next";
import { startIndexScheduler } from "src/server/indexScheduler";
import { createContext } from "src/server/trpc/context";
import { appRouter } from "src/server/trpc/router";

startIndexScheduler();

export default createNextApiHandler({
  router: appRouter,
  createContext,
  onError({ error }) {
    if (error.code === "INTERNAL_SERVER_ERROR") {
      // send to bug reporting
      console.error("Something went wrong", error);
    }
  },
  batching: {
    enabled: true,
  },
});

export const config = {
  api: {
    bodyParser: {
      sizeLimit: "5mb", // 或更大
    },
  },
};
