"use client";
import { App, ConfigProvider, theme } from "antd";
import zhCNlocale from "antd/locale/zh_CN";
import { useState } from "react";
import { ThemeProvider } from "styled-components";

type Props = React.PropsWithChildren<{
  color: string | undefined;
}>;

type StyledProps = React.PropsWithChildren<{
  color: string | undefined;
  isDark: boolean;
}>;

const StyledComponentsThemeProvider: React.FC<StyledProps> = ({
  children,
  isDark,
}) => {
  const { token } = theme.useToken();

  return <ThemeProvider theme={{ token, isDark }}>{children}</ThemeProvider>;
};

export const AntdConfigProvider: React.FC<Props> = ({ children, color }) => {
  const [dark, _setDark] = useState<boolean>(false);

  // 暗黑模式设置，此处预留，暂时不使用
  // 在组件加载时检查暗黑模式的设置
  // useEffect(() => {
  //   // 创建一个 MediaQueryList 对象来监听暗黑模式的变化
  //   const mediaQueryList = window.matchMedia("(prefers-color-scheme: dark)");

  //   // 设置初始的暗黑模式状态
  //   setDark(mediaQueryList.matches);

  //   // 监听暗黑模式偏好变化
  //   const handleChange = (e: MediaQueryListEvent) => {
  //     setDark(e.matches);
  //   };

  //   // 添加事件监听器以检测暗黑模式变化
  //   mediaQueryList.addEventListener("change", handleChange);

  //   // 在组件卸载时清除事件监听器
  //   return () => {
  //     mediaQueryList.removeEventListener("change", handleChange);
  //   };
  // }, []); 

  // 预留国际化配置
  return (
    <ConfigProvider
      locale={zhCNlocale}
      theme={{
        token: { colorPrimary: color, colorInfo: color },
        // 暗黑模式设置，此处预留，暂时不使用
        // algorithm: dark ? theme.darkAlgorithm : undefined,
      }}
    >
      <StyledComponentsThemeProvider color={color} isDark={dark}>
        <App>{children}</App>
      </StyledComponentsThemeProvider>
    </ConfigProvider>
  );
};