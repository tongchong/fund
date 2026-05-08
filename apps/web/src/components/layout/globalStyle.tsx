"use client";
import { createGlobalStyle } from "styled-components";

export const GlobalStyle = createGlobalStyle`
 @import url('https://fonts.font.im/css2?family=Noto+Sans+SC:wght@400;500;700&display=swap');

  #nprogress .bar {
    background-color: ${({ theme }) => theme.token.colorPrimary};
  }

  /* 全局字体设置，强制覆盖所有元素 */
  * {
    font-family: 'Noto Sans SC', -apple-system, BlinkMacSystemFont,
      'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif !important;
    margin: 0;
    padding: 0;
    box-sizing: border-box;
  }

  body {
    font-family: 'Noto Sans SC', -apple-system, BlinkMacSystemFont,
     'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif !important;
  }

 // HACK
  a {
    color: ${({ theme }) => theme.token.colorPrimaryText};
  }

 // 对日期组件在手机端展示做样式兼容处理(起)
  .ant-picker-dropdown {
    max-width: 100%;
  }

  .ant-picker-dropdown .ant-picker-panel-layout {
    overflow-y: scroll;
  }
 // 对日期组件在手机端展示做样式兼容处理(止)

 //  对表格组件样式统一处理
  .ant-table-wrapper .ant-table-thead >tr>th, .ant-table-wrapper .ant-table-thead >tr>td {
    white-space: nowrap;
  }

  // 表格单元格数字与英文字母分词换行处理
  .ant-table-wrapper .ant-table-tbody > tr > td {
    word-break: break-word;
  }

  /* 全局滚动条：平时隐藏，滚动时淡入浅色细条 */
  * {
    scrollbar-width: thin;
    scrollbar-color: transparent transparent;
    transition: scrollbar-color 0.3s ease;
  }

  *:hover {
    scrollbar-color: rgba(0, 0, 0, 0.18) transparent;
  }

  /* Webkit (Chrome / Safari / Edge) */
  ::-webkit-scrollbar {
    width: 5px;
    height: 5px;
  }

  ::-webkit-scrollbar-track {
    background: transparent;
  }

  ::-webkit-scrollbar-thumb {
    background: transparent;
    border-radius: 999px;
    transition: background 0.3s ease;
  }

  *:hover::-webkit-scrollbar-thumb {
    background: rgba(0, 0, 0, 0.18);
  }

  ::-webkit-scrollbar-thumb:hover {
    background: rgba(0, 0, 0, 0.32);
  }

  // Markdown 标题字号（h1 对齐原 h2 大小，依次递减）
  .markdown-body h1 { font-size: 1.5em !important; }
  .markdown-body h2 { font-size: 1.25em !important; }
  .markdown-body h3 { font-size: 1.1em !important; }
  .markdown-body h4 { font-size: 1em !important; }
  .markdown-body h5 { font-size: 0.9em !important; }
  .markdown-body h6 { font-size: 0.85em !important; }
`;

