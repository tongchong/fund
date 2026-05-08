// utils/pathUtils.ts
export const joinPaths = (...paths: (string | undefined)[]): string => {
  // 过滤掉 undefined、null 和空字符串
  const validPaths = paths.filter((p) => p && p !== "/");

  if (validPaths.length === 0) {
    return "/";
  }

  // 拼接路径
  let result = validPaths.join("/");

  // 确保以 / 开头
  if (!result.startsWith("/")) {
    result = "/" + result;
  }

  // 移除多余的斜杠，但保留协议后的双斜杠（如 http://）
  result = result.replace(/([^:]\/)\/+/g, "$1");

  return result;
};
