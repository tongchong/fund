import { jsonrepair } from "jsonrepair";

/**
 * 检查字符串是否为合法的 JSON 格式
 * @param str - 待验证的字符串
 * @returns 是否是合法 JSON
 */
export function isValidJSON(str: string): boolean {
  try {
    JSON.parse(str);
    return true;
  } catch {
    return false;
  }
}

/**
 * 尝试修复并格式化不合法的 JSON 字符串
 * @param str - 待修复的字符串
 * @returns 修复后的合法 JSON 字符串
 */
export function formatToValidJSON(input: string): string {
  let formattedStr = input.trim();

  // 使用 jsonrepair 修复 JSON
  try {
    formattedStr = jsonrepair(formattedStr); // 尝试修复 JSON
    return formattedStr;
  } catch (repairError) {
    console.warn("jsonrepair 修复失败，尝试手动修复:", repairError);
    return "{\"error\": \"Invalid JSON format\"}";
  }
}
