"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { httpBatchLink, loggerLink } from "@trpc/react-query";
import { useState } from "react";
import { trpc } from "src/server/trpc/api";
import { joinWithUrl } from "src/utils/url";
import superjson from "superjson";

export function TrpcClientProvider(props: {
  baseUrl: string;
  basePath: string;
  children: React.ReactNode
}) {
  const [queryClient] = useState(() => new QueryClient());

  const [trpcClient] = useState(() => {
    // 确保所有值都是字符串
    const safeBaseUrl = String(props.baseUrl || "");
    const safeBasePath = String(props.basePath || "");

    // 规范化 basePath
    const normalizedBasePath =
      !safeBasePath || safeBasePath === "/" || safeBasePath === "0"
        ? ""
        : safeBasePath;

    // 构建 URL
    const buildUrl = () => {
      let url = "";
      try {
        if (typeof window === "undefined") {
          // 服务端
          url = joinWithUrl(safeBaseUrl, normalizedBasePath, "/api/trpc");
        } else {
          // 客户端
          if (!normalizedBasePath) {
            url = "/api/trpc";
          } else {
            const base = normalizedBasePath.endsWith("/")
              ? normalizedBasePath.slice(0, -1)
              : normalizedBasePath;
            url = `${base}/api/trpc`;
          }
        }
      } catch (error) {
        console.error("Error building URL:", error);
        // 返回默认值
        url = "/api/trpc";
      }
      return url;
    };

    const finalUrl = buildUrl();

    return trpc.createClient({
      links: [
        loggerLink({
          enabled: () => process.env.NODE_ENV === "development",
        }),
        httpBatchLink({
          url: finalUrl,
        }),
      ],
      transformer: superjson,
    });
  });

  return (
    <trpc.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>
        {props.children}
      </QueryClientProvider>
    </trpc.Provider>
  );
}
