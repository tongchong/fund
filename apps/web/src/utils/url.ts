/**
 * Copyright (c) 2022 Peking University and Peking University Institute for Computing and Digital Economy
 * SCOW is licensed under Mulan PSL v2.
 * You can use this software according to the terms and conditions of the Mulan PSL v2.
 * You may obtain a copy of Mulan PSL v2 at:
 *          http://license.coscl.org.cn/MulanPSL2
 * THIS SOFTWARE IS PROVIDED ON AN "AS IS" BASIS, WITHOUT WARRANTIES OF ANY KIND,
 * EITHER EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO NON-INFRINGEMENT,
 * MERCHANTABILITY OR FIT FOR A PARTICULAR PURPOSE.
 * See the Mulan PSL v2 for more details.
 */

/**
 * 跨平台的路径规范化函数
 * 替代 Node.js 的 path.normalize
 */
function normalizePath(path: string): string {
  // 确保 path 是字符串
  const safePath = String(path || "");

  // 处理空路径
  if (!safePath || safePath === "/") {
    return "/";
  }

  // 分割路径
  const parts = safePath.split("/");
  const normalizedParts: string[] = [];

  for (const part of parts) {
    if (part === "..") {
      // 返回上一级目录
      if (normalizedParts.length > 0 && normalizedParts[normalizedParts.length - 1] !== "..") {
        normalizedParts.pop();
      } else if (!safePath.startsWith("/")) {
        // 相对路径的情况
        normalizedParts.push("..");
      }
    } else if (part !== "." && part !== "") {
      // 忽略 '.' 和空字符串
      normalizedParts.push(part);
    }
  }

  // 重新组合路径
  let result = normalizedParts.join("/");

  // 保持原始路径的开头斜杠
  if (safePath.startsWith("/")) {
    result = "/" + result;
  }

  // 保持原始路径的结尾斜杠（如果有）
  if (safePath.endsWith("/") && !result.endsWith("/")) {
    result = result + "/";
  }

  // 处理空结果
  return result || (safePath.startsWith("/") ? "/" : ".");
}

/**
 * 跨平台的路径连接函数
 * 替代 Node.js 的 path.join
 */
function joinPaths(...paths: (string | number | undefined | null)[]): string {
  // 确保所有参数都是字符串，过滤掉无效值
  const validPaths = paths
    .map((p) => {
      // 转换为字符串，处理各种类型
      if (p === null || p === undefined) return "";
      if (typeof p === "number" && p === 0) return "";
      return String(p);
    })
    .filter((p) => p !== ""); // 过滤掉空字符串

  if (validPaths.length === 0) {
    return ".";
  }

  // 连接路径
  let joined = validPaths.join("/");

  // 规范化路径
  joined = normalizePath(joined);

  return joined;
}

/**
 * Join paths to base url or pathname
 * @param base base url. can be a URL or a pathname
 * @param paths other paths
 * @returns joined url
 */
export function joinWithUrl(base:
  string | number | undefined | null, ...paths: (string | number | undefined | null)[]): string {
  // 确保 base 是字符串
  const safeBase = String(base || "");

  // 处理特殊情况：如果 base 是 '0' 或 '/'，视为空
  if (safeBase === "0" || safeBase === "/") {
    // 直接连接 paths
    const joined = joinPaths(...paths);
    return joined.startsWith("/") ? joined : "/" + joined;
  }

  // 提取协议部分
  const protocolIndex = safeBase.indexOf("://");
  const protocol = protocolIndex === -1 ? "" : safeBase.slice(0, protocolIndex + "://".length);
  const noProtocol = safeBase.slice(protocol.length);

  // 提取查询字符串
  const qsIndex = noProtocol.indexOf("?");
  const pathname = noProtocol.slice(0, qsIndex === -1 ? undefined : qsIndex);
  const query = qsIndex === -1 ? "" : noProtocol.slice(qsIndex);

  // 连接路径
  const joinedPathname = joinPaths(pathname, ...paths);

  // 组合最终 URL
  return protocol + joinedPathname + query;
}

/**
 * Normalize pathname with query
 * @param pathnameWithQuery pathname possibly with query
 * @returns normalized pathname
 */
export function normalizePathnameWithQuery(pathnameWithQuery: string | number | undefined | null): string {
  // 确保输入是字符串
  const safePathname = String(pathnameWithQuery || "");

  // 处理特殊情况
  if (safePathname === "0" || !safePathname) {
    return "/";
  }

  // 提取查询字符串
  const qsIndex = safePathname.indexOf("?");
  const pathname = safePathname.slice(0, qsIndex === -1 ? undefined : qsIndex);
  const qs = qsIndex === -1 ? "" : safePathname.slice(qsIndex);

  // 规范化路径
  const normalizedPathname = normalizePath(pathname);

  return normalizedPathname + qs;
}

/**
 * 用于调试的辅助函数
 */
export function debugJoinWithUrl(base: any, ...paths: any[]): string {
  return joinWithUrl(base, ...paths);
}
