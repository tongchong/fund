import { procedure, router } from "src/server/trpc/def";
import { z } from "zod";

// 定义环境变量的返回结构
export const EnvVariablesResponseSchema = z.object({
  LLM_R1: z.string().optional(), // 可选的模型变量
  LLM_V3: z.string().optional(), // 可选的模型变量
  MODEL_R1: z.string().optional(), // 可选的模型变量
  MODEL_V3: z.string().optional(), // 可选的模型变量
  MODEL3: z.string().optional(), // 可选的模型变量
  MODEL4: z.string().optional(), // 可选的模型变量
  LLM_MODEL3: z.string().optional(), // 可选的模型变量
});

export const envRouter = router({
  getEnvVariables: procedure
    .meta({
      openapi: {
        method: "GET",
        path: "/env/variables",
        tags: ["env"],
        summary: "获取环境变量",
      },
    })
    .output(EnvVariablesResponseSchema)
    .query(async () => {
      // 获取环境变量
      const envVariables = {
        LLM_R1: process.env.NEXT_PUBLIC_LLM_R1,
        LLM_V3: process.env.NEXT_PUBLIC_LLM_V3,
        MODEL_R1: process.env.NEXT_PUBLIC_DEEPSEEKR1,
        MODEL_V3: process.env.NEXT_PUBLIC_DEEPSEEKV3,
        MODEL3: process.env.NEXT_PUBLIC_MODEL3,
        MODEL4: process.env.NEXT_PUBLIC_MODEL4,
        LLM_MODEL3: process.env.NEXT_PUBLIC_LLM_MODEL3,
      };

      return envVariables;
    }),
});
