"use client";

import { message } from "antd";
import { useRouter } from "next/navigation";
import { parseCookies } from "nookies";
import { PropsWithChildren, useEffect } from "react";
import Header from "src/components/Header";
import styled from "styled-components";

export default function Layout({ children }: PropsWithChildren) {
  const router = useRouter();

  useEffect(() => {
    const token = parseCookies().token;
    if (!token) {
      message.error("请先登录");
      router.push("/login");
    }
  }, [router]);

  return (
    <Wrapper>
      <Header />
      <PageContent>{children}</PageContent>
    </Wrapper>
  );
}

const Wrapper = styled.div`
  display: flex;
  flex-direction: column;
  height: 100%;
  padding-top: 64px;
`;

const PageContent = styled.div`
  flex: 1;
  min-height: 0;
  overflow: hidden;
`;
