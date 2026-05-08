// src/server/trpc/api.ts
import { httpBatchLink } from "@trpc/client";
import { createTRPCReact } from "@trpc/react-query";
import { useRouter } from "next/navigation";
// 移除 path 的导入
// import { join } from "path"; // 删除这行
import { BASE_PATH } from "src/utils/processEnv";
import SuperJSON from "superjson";

import { AppRouter } from "./router";

export const trpc = createTRPCReact<AppRouter>({});

/**
 * 安全的路径拼接函数
 */
function buildApiPath(basePath: any): string {
  // 添加调试日志

  // 确保 basePath 是字符串
  let safePath = "";
  if (basePath !== null && basePath !== undefined) {
    // 转换为字符串
    safePath = String(basePath);
  }



  // 处理特殊情况
  if (!safePath || safePath === "/" || safePath === "0") {
    return "/api/trpc";
  }

  // 移除末尾的斜杠
  if (safePath.endsWith("/")) {
    safePath = safePath.slice(0, -1);
  }

  // 确保以斜杠开头
  if (!safePath.startsWith("/")) {
    safePath = "/" + safePath;
  }

  const result = `${safePath}/api/trpc`;

  return result;
}

export function createTrpcClient() {
  const router = useRouter();

  // 构建 API URL
  const apiUrl = buildApiPath(BASE_PATH);


  return trpc.createClient({
    links: [
      // 使用httpBatchLink来合并请求
      httpBatchLink({
        url: apiUrl, // 使用构建好的 URL
        async fetch(url, options) {
          const response = await fetch(url, options);

          if (response.status === 401) {
            router.push("/login"); // 重定向到登录页面
          }

          return response;
        },
      }),
    ],
    transformer: SuperJSON,
  });
}
