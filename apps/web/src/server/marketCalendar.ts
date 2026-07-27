const hongKongMarketHolidays = new Set([
  "2026-01-01",
  "2026-02-17",
  "2026-02-18",
  "2026-02-19",
  "2026-04-03",
  "2026-04-06",
  "2026-04-07",
  "2026-05-01",
  "2026-05-25",
  "2026-06-19",
  "2026-07-01",
  "2026-10-01",
  "2026-10-19",
  "2026-12-25",
]);

const hongKongDateFormatter = new Intl.DateTimeFormat("en-CA", {
  timeZone: "Asia/Hong_Kong",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

const hongKongWeekdayFormatter = new Intl.DateTimeFormat("en-US", {
  timeZone: "Asia/Hong_Kong",
  weekday: "short",
});

export function getHongKongDateKey(date: Date) {
  return hongKongDateFormatter.format(date);
}

export function isHongKongMarketTradingDay(date: Date) {
  const weekday = hongKongWeekdayFormatter.format(date);
  if (weekday === "Sat" || weekday === "Sun") return false;
  return !hongKongMarketHolidays.has(getHongKongDateKey(date));
}
