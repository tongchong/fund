"use client";
import { Layout } from "antd";
import React from "react";

import { ClientLayout } from "./clientLayout";
import { ServerClientProvider } from "./ServerClientProvider";

const { Content } = Layout;

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html style={{ height: "100%" }}>
      <head>
        <title>测试</title>
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no"
        />
        <link rel="preconnect" href="https://fonts.font.im" />
      </head>
      {/*
        ✅ body 不再 overflow: hidden
        聊天页面自己用 overflow: hidden 固定高度
        管理页面自然撑开，body 滚动
      */}
      <body style={{ margin: "0px", height: "100%", overscrollBehavior: "none" }}>
        <ServerClientProvider>
          <ClientLayout>
            <Layout style={{ minHeight: "100%" }}>
              <Content
                style={{
                  display: "flex",
                  flexDirection: "column",
                  flex: 1,
                }}
              >
                {children}
              </Content>
            </Layout>
          </ClientLayout>
        </ServerClientProvider>
      </body>
    </html>
  );
}
