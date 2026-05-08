import dayjs from "dayjs";
import timezone from "dayjs/plugin/timezone";
import utc from "dayjs/plugin/utc";

dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.tz.setDefault("Asia/Shanghai");

export const tz = "Asia/Shanghai";
export default dayjs;

// 生成指定时间段内的每一天字符串
export function eachDayOfInterval({ start, end }) {
  // 1. 使用 dayjs.tz(start, 'Asia/Shanghai') 来解析，确保按东八区处理
  const startDate = dayjs.tz(start, tz).startOf("day");
  const endDate = dayjs.tz(end, tz).startOf("day");

  // 2. 若开始时间大于结束时间，直接抛错
  if (startDate.isAfter(endDate)) {
    throw new Error("The start of the interval cannot be after its end");
  }

  // 3. 遍历区间
  const days: string[] = [];
  let currentDay = startDate.clone(); // 注意要 clone()，不然会直接改动 startDate

  // 4. 保证包含 endDate 当天
  while (currentDay.isBefore(endDate) || currentDay.isSame(endDate, "day")) {
    days.push(currentDay.format("YYYY-MM-DD")); // 这里返回原生 Date，如果想要字符串可以 .format()
    currentDay = currentDay.add(1, "day");
  }

  return days;
}

export function formatDate(date: Date | string | undefined | null): string {
  if (!date) return "未知"; // 如果是 undefined 或 null 则返回 "未知"

  // 如果传入的是字符串，则先转换为 Date 对象
  const dateObj = typeof date === "string" ? new Date(date) : date;

  if (isNaN(dateObj.getTime())) return "未知";

  const year = dateObj.getFullYear();
  const month = String(dateObj.getMonth() + 1).padStart(2, "0"); // 获取月份（从0开始），确保两位数
  const day = String(dateObj.getDate()).padStart(2, "0"); // 确保两位数

  return `${year}-${month}-${day}`;
}

export function formatDateWithSeconds(date: Date | string | null | undefined): string {
  if (!date) return "未知";

  // 如果是字符串，则尝试转换为 Date 对象
  const dateObj = typeof date === "string" ? new Date(date) : date;

  // 检查是否为有效日期
  if (!(dateObj instanceof Date) || isNaN(dateObj.getTime())) {
    return "未知";
  }

  const year = dateObj.getFullYear();
  const month = String(dateObj.getMonth() + 1).padStart(2, "0"); // 月份从 0 开始
  const day = String(dateObj.getDate()).padStart(2, "0");
  const hours = String(dateObj.getHours()).padStart(2, "0");
  const minutes = String(dateObj.getMinutes()).padStart(2, "0");
  const seconds = String(dateObj.getSeconds()).padStart(2, "0");

  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}

export function formatDateRelative(date: Date): string {
  const period = Date.now() - date.getTime();
  if (period < 60 * 1000) {
    return "刚刚";
  }
  if (period < 60 * 60 * 1000) {
    const minutes = Math.floor(period / (60 * 1000));
    return `${minutes} 分钟前`;
  }
  if (period < 24 * 60 * 60 * 1000) {
    const hours = Math.floor(period / (60 * 60 * 1000));
    return `${hours} 小时前`;
  }
  if (period < 7 * 24 * 60 * 60 * 1000) {
    const days = Math.floor(period / (24 * 60 * 60 * 1000));
    return `${days} 天前`;
  }
  return new Date(date).toLocaleString("zh-CN", {
    timeZone: "Asia/Shanghai",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).replaceAll("/", "-");
};
