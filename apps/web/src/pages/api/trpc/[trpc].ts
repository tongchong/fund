import { createNextApiHandler } from "@trpc/server/adapters/next";
// import { startHealthCheckScheduler } from "src/server/healthCheckScheduler";
import { createContext } from "src/server/trpc/context";
import { appRouter } from "src/server/trpc/router";

// 启动健康检查定时任务（进程级单例）
// startHealthCheckScheduler();

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
