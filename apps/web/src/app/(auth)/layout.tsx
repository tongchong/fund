"use client";

import { message } from "antd";
import { usePathname, useRouter } from "next/navigation";
import { parseCookies } from "nookies";
import { PropsWithChildren, useEffect } from "react";
import Header from "src/components/Header";
import styled from "styled-components";

export default function Layout({ children }: PropsWithChildren) {
  const router = useRouter();
  const pathname = usePathname();
  const isFundPage = pathname === "/fund";

  useEffect(() => {
    const token = parseCookies().token;
    if (!token) {
      message.error("请先登录");
      router.push("/login");
    }
  }, [router]);

  return (
    <Wrapper $fullscreen={isFundPage}>
      {!isFundPage && <Header />}
      <PageContent>{children}</PageContent>
    </Wrapper>
  );
}

const Wrapper = styled.div<{ $fullscreen: boolean }>`
  display: flex;
  flex-direction: column;
  height: 100%;
  padding-top: ${({ $fullscreen }) => $fullscreen ? 0 : 64}px;
`;

const PageContent = styled.div`
  flex: 1;
  min-height: 0;
  overflow: hidden;
`;
