"use client";

import { legacyLogicalPropertiesTransformer, StyleProvider } from "@ant-design/cssinjs";
import { QueryClient } from "@tanstack/react-query";
import { httpBatchLink } from "@trpc/client";
import { usePathname } from "next/navigation";
import { AntdConfigProvider } from "src/components/layout/AntdConfigProvider";
import { ErrorBoundary } from "src/components/layout/ErrorBoundary";
import { GlobalStyle } from "src/components/layout/globalStyle";
import { AntdStyleRegistry } from "src/components/layout/styleRegistry/AntdRegistry";
import StyledComponentsRegistry from "src/components/layout/styleRegistry/StyledComponentsRegistry";
import { ServerErrorPage } from "src/components/SeverErrorPage";
import { createTrpcClient, trpc } from "src/server/trpc/api";
import SuperJSON from "superjson";

export const DEFAULT_PRIMARY_COLOR = process.env.NEXT_PUBLIC_PRIMARY_COLOR || "#1890ff";
export const ICON_COLOR = process.env.NEXT_PUBLIC_ICON_COLOR || "rgba(201, 227, 255, 0.4)";
export const DEFAULT_BACKGROUND_COLOR = process.env.NEXT_PUBLIC_BACKGROUND_COLOR || "rgba(230, 243, 255, 0.4)";
export const ICON_COLOR_HOVER = process.env.NEXT_PUBLIC_ICON_COLOR_HOVER || "rgba(201, 227, 255, 0.8)";

export function ClientLayout(props: { children: React.ReactNode }) {
  const pathname = usePathname();

  let client;
  try {
    client = createTrpcClient();
  } catch (error) {
    console.error("Failed to create TRPC client:", error);
    client = trpc.createClient({
      links: [
        httpBatchLink({
          url: "/api/trpc",
        }),
      ],
      transformer: SuperJSON,
    });
  }

  return (
    <StyleProvider hashPriority="high" transformers={[legacyLogicalPropertiesTransformer]}>
      <StyledComponentsRegistry>
        <AntdStyleRegistry>
          <trpc.Provider client={client} queryClient={new QueryClient()}>
            {/* ✅ 不设置 overflow，让各页面自己决定 */}
            <div style={{ margin: "0px", height: "100%" }}>
              <AntdConfigProvider color={DEFAULT_PRIMARY_COLOR}>
                <GlobalStyle />
                <ErrorBoundary Component={ServerErrorPage} pathname={pathname ?? ""}>
                  {props.children}
                </ErrorBoundary>
              </AntdConfigProvider>
            </div>
          </trpc.Provider>
        </AntdStyleRegistry>
      </StyledComponentsRegistry>
    </StyleProvider>
  );
}
