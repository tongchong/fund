import { useEffect } from "react";
import { createGlobalStyle } from "styled-components";

export default function useResponsiveTable(setPageSize) {

  const GlobalStyle = createGlobalStyle`
`;

  // 列表响应式分页
  const updatePageSize = () => {
    if (window.innerWidth >= 2000)
      setPageSize(20);
    else
      setPageSize(10);
  };

  useEffect(() => {
    // 初始设置
    updatePageSize();
    // 监听窗口大小变化
    window.addEventListener("resize", updatePageSize);
    return () => window.removeEventListener("resize", updatePageSize);
  }, []);

  return GlobalStyle;
}

