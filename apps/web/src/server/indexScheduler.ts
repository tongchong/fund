import https from "node:https";
import { TextDecoder } from "node:util";

import cron from "node-cron";
import { Fund } from "src/server/db/entities/fund";
import { FundDaily } from "src/server/db/entities/fundDaily";
import { FundPricePin, FundPricePinType } from "src/server/db/entities/fundPricePin";
import { MarketIndex } from "src/server/db/entities/marketIndex";
import { FundIndexRelation, isHongKongMarketFund, resolveFundIndexRelation } from "src/server/fundIndexRelation";
import {
  getFundValuationModel,
  HoldingItem,
  MarketQuoteItem,
  parseFundHoldings,
} from "src/server/fundValuationModels";
import { getHongKongDateKey, isHongKongMarketTradingDay } from "src/server/marketCalendar";
import { forkEntityManager } from "src/utils/getOrm";

const FETCH_HEADERS = {
  // eslint-disable-next-line @stylistic/max-len
  "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36",
  "Referer": "https://quote.eastmoney.com/",
};

const INDEX_API_URL = "https://push2delay.eastmoney.com/api/qt/ulist.np/get"
  + "?fltt=2&invt=2&fields=f2,f3,f4,f12,f13,f14,f18,f124";
const INDEX_KLINE_API_URL = "https://push2his.eastmoney.com/api/qt/stock/kline/get";

const INDEX_SECIDS = [
  "0.399368", "0.399967", "0.399998", "0.399811", "2.931068", "0.399991",
  "0.399809", "1.000979", "1.000823", "1.000805", "0.399395", "1.000961",
  "0.399997", "0.399965", "2.930875", "2.930726", "0.399803", "0.399987",
  "1.000922", "2.930620", "0.399990", "2.930713", "2.930720", "2.930719", "0.399804",
  "0.399933", "0.399417", "0.399976", "2.930997", "0.399975", "1.000905", "0.399707",
  "0.399806", "0.399440", "0.399393", "2.930721", "0.399807", "2.950090",
  "1.000300", "1.000935", "1.000984", "1.000841", "2.930743", "0.399992", "0.399330", "0.399973", "2.H30094",
  "0.399006", "0.399001", "0.399971", "2.930917", "2.930914", "2.930792",
  "2.930746", "2.930791", "2.930641", "0.399396",
  "0.399986", "0.399313", "2.931069", "1.000903", "0.399005", "0.399974",
  "1.000974", "0.399966", "0.399989", "0.399993", "2.930790", "2.930820", "1.000016",
  "1.000852", "1.000906", "1.000998", "1.000827", "0.399995", "1.000925",
  "0.399441", "1.000971",
  "2.930965", "2.930967", "2.930709", "0.987016", "2.931722", "2.931024",
];

const LOF_LIST_URL = "https://push2delay.eastmoney.com/api/qt/clist/get";
const LOF_LIST_PARAMS = "po=1&np=1"
  + "&ut=bd1d9ddb04089700cf9c27f6f7426281"
  + "&fltt=2&invt=2&wbp2u=|0|0|0|web&fid=f3"
  + "&fs=b:MK0404,b:MK0405,b:MK0406,b:MK0407"
  + "&fields=f2,f3,f5,f6,f8,f12,f14,f18";

const NAV_API_BASE = "https://fundgz.1234567.com.cn/js";
const PUBLISHED_NAV_API_URL = "https://fundf10.eastmoney.com/F10DataApi.aspx";
const FUND_FEE_PAGE_BASE = "https://fundf10.eastmoney.com/jjfl";
const SINA_QUOTE_URL = "https://hq.sinajs.cn/list=";
const TENCENT_QUOTE_URL = "https://qt.gtimg.cn/q=";
const FUND_SYNC_CRON = process.env.FUND_SYNC_CRON || "*/10 * * * * *";
const HONG_KONG_INDEX_SYNC_CRON = process.env.HONG_KONG_INDEX_SYNC_CRON || "*/20 * * * * *";
const FUND_DAILY_SNAPSHOT_CRON = process.env.FUND_DAILY_SNAPSHOT_CRON || "20 9 * * *";
const FUND_DAILY_SNAPSHOT_TIMEZONE = process.env.FUND_DAILY_SNAPSHOT_TIMEZONE || "Asia/Shanghai";
const FUND_FEE_SYNC_CRON = process.env.FUND_FEE_SYNC_CRON || "15 6 * * *";
const FUND_PRICE_PIN_SCAN_CRON = process.env.FUND_PRICE_PIN_SCAN_CRON || "30 2 * * *";
const FUND_PRICE_PIN_THRESHOLD_PERCENT = Number(process.env.FUND_PRICE_PIN_THRESHOLD_PERCENT ?? 5);
const FUND_PRICE_PIN_NEEDLE_THRESHOLD_PERCENT = Number(process.env.FUND_PRICE_PIN_NEEDLE_THRESHOLD_PERCENT ?? 4);
const FUND_PRICE_PIN_LOOKBACK_YEARS = Number(process.env.FUND_PRICE_PIN_LOOKBACK_YEARS ?? 2);
const FUND_PRICE_PIN_FETCH_INTERVAL_MS = Number(process.env.FUND_PRICE_PIN_FETCH_INTERVAL_MS ?? 3000);
const SUCCESS_LOG_INTERVAL_MS = 5 * 60 * 1000;
const HOLDINGS_SYNC_INTERVAL_MS = Number(process.env.HOLDINGS_SYNC_INTERVAL_MS ?? 20 * 1000);
const SCHEDULER_STATE_KEY = "__fundIndexSchedulerState__";
const COMMODITY_QUOTES = [
  { symbol: "hf_GC", code: "HF_GC", name: "COMEX黄金" },
  { symbol: "hf_CL", code: "HF_CL", name: "NYMEX原油" },
  { symbol: "hf_OIL", code: "HF_OIL", name: "布伦特原油" },
  { symbol: "hf_SI", code: "HF_SI", name: "COMEX白银" },
  { symbol: "hf_CAD", code: "HF_CAD", name: "COMEX铜" },
];

const HONG_KONG_FUND_CODES = new Set([
  "159010", "501307", "160125", "160322", "160644", "160925", "161124", "501021",
  "501023", "501025", "501301", "501305", "501306", "501311",
]);

const HANG_SENG_DAILY_BULLETIN_URL = "https://www.hsi.com.hk/data/eng/download/daily-bulletin.json";
const HANG_SENG_REPORT_BASE_URL = "https://www.hsi.com.hk";
const AASTOCKS_HK_INDEX_URL = "https://www.aastocks.com/sc/stocks/market/index/hk-index.aspx";
const HANG_SENG_REPORT_INDEXES = [
  { code: "HSI", name: "恒生指数", seriesCode: "hsi", rowName: "Hang Seng Index" },
  { code: "HSTECH", name: "恒生科技指数", seriesCode: "hstech", rowName: "Hang Seng TECH Index" },
  { code: "HSSI", name: "恒生综合小型股指数", seriesCode: "hsci", rowName: "Hang Seng Composite SmallCap Index" },
  {
    code: "HSCHK30",
    name: "恒生中国(香港上市)30指数",
    seriesCode: "hschk25",
    rowName: "Hang Seng China (Hong Kong-listed) 30 Index",
  },
];

const TENCENT_HK_INDEX_SYMBOLS = [
  { symbol: "hkHSI", code: "HSI", name: "恒生指数" },
  { symbol: "hkHSTECH", code: "HSTECH", name: "恒生科技指数" },
];

const AASTOCKS_HK_INDEX_ROWS = [
  { code: "HSI", name: "恒生指数", rowLabel: "恒生指数" },
  { code: "HSTECH", name: "恒生科技指数", rowLabel: "恒生科技指数" },
  { code: "HSCEI", name: "恒生中国企业指数", rowLabel: "国企指数" },
  { code: "HSCCI", name: "恒生中国内地企业指数", rowLabel: "港中企业" },
  { code: "HSSI", name: "恒生综合小型股指数", rowLabel: "恒生综合小型股指数" },
];

const SINA_HK_INDEX_SYMBOLS = [
  { symbol: "int_hangseng", code: "HSI", name: "恒生指数" },
];

// ---------- types ----------

interface IndexItem {
  f2: number | string;
  f3: number | string;
  f4: number | string;
  f12: string;
  f13: number | string;
  f14: string;
  f18: number | string;
  source?: string;
}

interface LofItem {
  f2: number | string; // 最新价
  f3: number | string; // 涨跌幅
  f5: number | string; // 成交量
  f6: number | string; // 成交额
  f8: number | string; // 换手率
  f12: string; // 代码
  f14: string; // 名称
  f18: number | string; // 昨收
  source?: string;
}

interface NavData {
  nav: number;
  estimatedNav: number;
  navDate: string;
  navChangePercent?: number;
}

interface PublishedNavData {
  nav: number;
  navDate: string;
}

interface FundFeeData {
  purchaseFee?: number;
  redemptionFee7d?: number;
}

interface DataProvider<T> {
  name: string;
  fetch: () => Promise<T[]>;
}

interface ProviderResult<T> {
  source: string;
  items: T[];
}

interface CommodityQuoteItem {
  code: string;
  name: string;
  currentPrice: number;
  previousClose: number;
  changeAmount: number;
  changePercent: number;
}

interface FundKlineItem {
  date: Date;
  openPrice: number;
  closePrice: number;
  highPrice: number;
  lowPrice: number;
}

interface SchedulerState {
  consecutiveFailures: number;
  lastSuccessLogAt: number;
  isFetching: boolean;
  isFetchingHongKongIndices?: boolean;
  isScanningPricePins?: boolean;
  lastNavFetchHour: string;
  lastHoldingsFetchAt: number;
  started: boolean;
}

const schedulerState = ((globalThis as unknown as Record<string, SchedulerState>)[SCHEDULER_STATE_KEY] ??= {
  consecutiveFailures: 0,
  lastSuccessLogAt: 0,
  isFetching: false,
  lastNavFetchHour: "",
  lastHoldingsFetchAt: 0,
  started: false,
});

const FALLBACK_FUND_SECIDS = [
  "1.501019", "1.502003", "0.161024", "0.168204", "0.161032", "0.163116",
  "1.501090", "0.160638", "0.167301", "0.161715", "0.165520", "0.160620",
  "0.160221", "0.161217", "0.161725", "0.160628", "0.160643", "0.161726",
  "0.161031", "0.160632", "1.501227", "0.161724", "0.161631", "1.501007",
  "1.501008", "1.501005", "0.162412", "0.161030", "0.160635", "0.161035", "0.160225",
  "1.502010", "0.161720", "0.161027", "1.501036", "0.161017", "0.160119",
  "0.163113", "1.501030", "1.502023", "0.160218", "0.161033", "0.160639",
  "0.160135", "1.501050", "1.501057", "1.501058", "1.501029", "0.160706",
  "0.163407", "0.161028", "1.501009", "0.161123", "0.161227", "1.501016",
  "0.160630", "1.501089", "0.160223", "0.163109", "0.160629", "1.501307",
  "1.501305", "1.501306", "1.501303", "1.501302", "0.160924", "0.164705",
  "1.501311", "1.501021", "1.501025", "0.161124", "0.160125", "0.160322",
  "0.160644", "0.160925", "1.501023", "1.501301",
];

// ---------- HTTP helpers ----------

function httpGet(
  url: string,
  headers: Record<string, string> = FETCH_HEADERS,
  encoding: "utf-8" | "gbk" | "utf-16le" = "utf-8",
): Promise<string> {
  return new Promise((resolve, reject) => {
    const req = https.get(url, { headers, timeout: 15000 }, (res) => {
      const chunks: Buffer[] = [];
      res.on("data", (chunk: Buffer) => { chunks.push(chunk); });
      res.on("end", () => resolve(new TextDecoder(encoding).decode(Buffer.concat(chunks))));
      res.on("error", reject);
    });
    req.on("error", reject);
    req.on("timeout", () => { req.destroy(); reject(new Error("request timeout")); });
  });
}

// ---------- data fetchers ----------

async function fetchIndexItems(): Promise<IndexItem[]> {
  const url = `${INDEX_API_URL}&secids=${INDEX_SECIDS.join(",")}`;
  const text = await httpGet(url);
  const json = JSON.parse(text);
  const items = (json?.data?.diff ?? []) as IndexItem[];
  return enrichIndexItemsWithKlineFallback(items);
}

function indexItemToSecid(item: IndexItem) {
  if (!item.f12) return null;
  const market = toFiniteNumber(item.f13);
  return `${market ?? 0}.${item.f12}`;
}

async function fetchIndexKlineFallback(item: IndexItem): Promise<IndexItem | null> {
  const secid = indexItemToSecid(item);
  if (!secid) return null;

  const url = INDEX_KLINE_API_URL
    + `?secid=${secid}&fields1=f1,f2,f3,f4,f5,f6`
    + "&fields2=f51,f52,f53,f54,f55,f56,f57,f58,f59,f60,f61"
    + "&klt=101&fqt=0&end=20500101&lmt=1";
  const text = await httpGet(url);
  const json = JSON.parse(text);
  const latestKline = String(json?.data?.klines?.[0] ?? "");
  const cells = latestKline.split(",");
  const currentPrice = toFiniteNumber(cells[2]);
  const changePercent = toFiniteNumber(cells[8]);
  const changeAmount = toFiniteNumber(cells[9]);
  if (currentPrice === undefined || changePercent === undefined) return null;

  return {
    ...item,
    f2: currentPrice,
    f3: changePercent,
    f4: changeAmount ?? 0,
    f18: changeAmount === undefined ? item.f18 : currentPrice - changeAmount,
    source: "东方财富K线",
  };
}

async function enrichIndexItemsWithKlineFallback(items: IndexItem[]) {
  const enrichedItems = await Promise.all(items.map(async (item) => {
    if (toFiniteNumber(item.f2) !== undefined && toFiniteNumber(item.f3) !== undefined) return item;

    try {
      return await fetchIndexKlineFallback(item) ?? item;
    } catch {
      return item;
    }
  }));

  return enrichedItems;
}

async function fetchLofList(): Promise<LofItem[]> {
  const allItems: LofItem[] = [];
  const pageSize = 100;
  let page = 1;
  let total = Infinity;

  while ((page - 1) * pageSize < total) {
    const url = `${LOF_LIST_URL}?pn=${page}&pz=${pageSize}&${LOF_LIST_PARAMS}`;
    const text = await httpGet(url);
    const json = JSON.parse(text);
    total = json?.data?.total ?? 0;
    const items: LofItem[] = json?.data?.diff ?? [];
    allItems.push(...items);
    page++;
  }

  return allItems;
}

async function fetchFundQuoteBatch(codes: string[]): Promise<LofItem[]> {
  const symbols = [...new Set(codes.filter(isValidFundCode).map(codeToTencentSymbol))];
  if (!symbols.length) return [];

  const text = await httpGet(`${TENCENT_QUOTE_URL}${symbols.join(",")}`, {
    ...FETCH_HEADERS,
    "Referer": "https://gu.qq.com/",
  }, "gbk");

  return text.split(";\n").flatMap((row) => {
    const match = /v_([a-z0-9]+)="(.*)"/i.exec(row);
    if (!match) return [];

    const values = match[2].split("~");
    const code = tencentSymbolToCode(match[1]);
    const currentPrice = toFiniteNumber(values[3]);
    const previousClose = toFiniteNumber(values[4]);
    const changePercent = toFiniteNumber(values[32]);
    if (!isValidFundCode(code) || currentPrice === undefined || changePercent === undefined) return [];

    return [{
      f2: currentPrice,
      f3: changePercent,
      f5: toFiniteNumber(values[6]) ?? 0,
      f6: toFiniteNumber(values[37]) ?? 0,
      f8: 0,
      f12: code,
      f14: values[1],
      f18: previousClose ?? currentPrice,
      source: "腾讯基金行情",
    } satisfies LofItem];
  });
}

async function fetchFundKlines(code: string, lookbackYears: number): Promise<FundKlineItem[]> {
  const end = new Date();
  const begin = new Date(end.getTime());
  begin.setFullYear(begin.getFullYear() - lookbackYears);

  const url = INDEX_KLINE_API_URL
    + `?secid=${codeToEastmoneySecid(code)}`
    + "&fields1=f1,f2,f3,f4,f5,f6"
    + "&fields2=f51,f52,f53,f54,f55,f56,f57,f58,f59,f60,f61"
    + "&klt=101&fqt=0"
    + `&beg=${formatEastmoneyDate(begin)}&end=${formatEastmoneyDate(end)}&lmt=1000`;
  const text = await httpGet(url);
  const json = JSON.parse(text);
  const klines = (json?.data?.klines ?? []) as string[];

  return klines.flatMap((row) => {
    const cells = row.split(",");
    const date = parseEastmoneyTradeDate(cells[0]);
    const openPrice = toFiniteNumber(cells[1]);
    const closePrice = toFiniteNumber(cells[2]);
    const highPrice = toFiniteNumber(cells[3]);
    const lowPrice = toFiniteNumber(cells[4]);

    if (
      !date
      || openPrice === undefined
      || closePrice === undefined
      || highPrice === undefined
      || lowPrice === undefined
      || openPrice <= 0
      || closePrice <= 0
    ) {
      return [];
    }

    return [{ date, openPrice, closePrice, highPrice, lowPrice }];
  });
}

function codeToEastmoneySecid(code: string) {
  const market = code.startsWith("6") || code.startsWith("5") || code.startsWith("9") ? 1 : 0;
  return `${market}.${code}`;
}

function formatEastmoneyDate(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}${month}${day}`;
}

function parseEastmoneyTradeDate(value: string | undefined) {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const date = new Date(value + "T00:00:00.000Z");
  return Number.isFinite(date.getTime()) ? date : null;
}

function mergeFundQuoteItems(primary: LofItem[], realtime: LofItem[]) {
  const byCode = new Map<string, LofItem>();
  primary.forEach((item) => byCode.set(item.f12, item));
  realtime.forEach((item) => byCode.set(item.f12, {
    ...byCode.get(item.f12),
    ...item,
  }));
  return [...byCode.values()];
}

function toFiniteNumber(value: unknown) {
  if (value === null || value === undefined || value === "" || value === "-") return undefined;
  const numberValue = Number(value);
  return Number.isFinite(numberValue) ? numberValue : undefined;
}

function secidToSinaSymbol(secid: string) {
  const [, code] = secid.split(".");
  if (!code) return null;
  if (code.startsWith("399") || secid.startsWith("0.")) return `sz${code}`;
  return `sh${code.toLowerCase()}`;
}

function parseSinaRows(text: string) {
  return text
    .split(";\n")
    .map((row) => {
      const match = /var hq_str_([a-z0-9_]+)="(.*)"/i.exec(row);
      if (!match) return null;
      const values = match[2].split(",");
      if (!values[0]) return null;
      return { symbol: match[1], values };
    })
    .filter((row): row is { symbol: string; values: string[] } => !!row);
}

async function fetchSinaQuotes(secids: string[]) {
  const symbolPairs = secids
    .map((secid) => ({ secid, symbol: secidToSinaSymbol(secid) }))
    .filter((item): item is { secid: string; symbol: string } => !!item.symbol);
  const text = await httpGet(`${SINA_QUOTE_URL}${symbolPairs.map((item) => item.symbol).join(",")}`, {
    ...FETCH_HEADERS,
    "Referer": "https://finance.sina.com.cn/",
  }, "gbk");
  const rowBySymbol = new Map(parseSinaRows(text).map((row) => [row.symbol, row.values]));

  return symbolPairs.flatMap(({ secid, symbol }) => {
    const values = rowBySymbol.get(symbol);
    return values ? [{ secid, symbol, values }] : [];
  });
}

async function fetchSinaIndexItems(): Promise<IndexItem[]> {
  const rows = await fetchSinaQuotes(INDEX_SECIDS);

  return rows.flatMap(({ secid, values }) => {
    const [, code] = secid.split(".");
    const currentPrice = toFiniteNumber(values[1]);
    const changeAmount = toFiniteNumber(values[2]);
    const changePercent = toFiniteNumber(values[3]);
    if (!code || currentPrice === undefined || changePercent === undefined) return [];

    return [{
      f2: currentPrice,
      f3: changePercent,
      f4: changeAmount ?? 0,
      f12: code,
      f13: secid.startsWith("0.") ? 0 : 1,
      f14: values[0],
      f18: currentPrice - (changeAmount ?? 0),
    }];
  });
}

async function fetchSinaHongKongIndexItems(): Promise<IndexItem[]> {
  const text = await httpGet(`${SINA_QUOTE_URL}${SINA_HK_INDEX_SYMBOLS.map((item) => item.symbol).join(",")}`, {
    ...FETCH_HEADERS,
    "Referer": "https://finance.sina.com.cn/",
  }, "gbk");
  const rowBySymbol = new Map(parseSinaRows(text).map((row) => [row.symbol, row.values]));

  return SINA_HK_INDEX_SYMBOLS.flatMap((config) => {
    const values = rowBySymbol.get(config.symbol);
    const currentPrice = toFiniteNumber(values?.[1]);
    const changeAmount = toFiniteNumber(values?.[2]);
    const changePercent = toFiniteNumber(values?.[3]);
    if (currentPrice === undefined || changePercent === undefined) return [];

    return [{
      f2: currentPrice,
      f3: changePercent,
      f4: changeAmount ?? 0,
      f12: config.code,
      f13: 100,
      f14: config.name,
      f18: currentPrice - (changeAmount ?? 0),
      source: "新浪港股指数",
    } satisfies IndexItem];
  });
}

function parseTencentHongKongIndexRow(row: string): IndexItem | null {
  const match = /v_([a-z0-9]+)="(.*)"/i.exec(row);
  if (!match) return null;

  const config = TENCENT_HK_INDEX_SYMBOLS.find((item) => item.symbol.toLowerCase() === match[1].toLowerCase());
  if (!config) return null;

  const values = match[2].split("~");
  const currentPrice = toFiniteNumber(values[3]);
  const previousClose = toFiniteNumber(values[4]);
  const changeAmount = toFiniteNumber(values[31]);
  const changePercent = toFiniteNumber(values[32]);
  if (currentPrice === undefined || changePercent === undefined) return null;

  return {
    f2: currentPrice,
    f3: changePercent,
    f4: changeAmount ?? (previousClose === undefined ? 0 : currentPrice - previousClose),
    f12: config.code,
    f13: 100,
    f14: config.name,
    f18: previousClose ?? currentPrice,
    source: "腾讯港股指数",
  } satisfies IndexItem;
}

async function fetchTencentHongKongIndexItems(): Promise<IndexItem[]> {
  const symbols = TENCENT_HK_INDEX_SYMBOLS.map((item) => item.symbol).join(",");
  const text = await httpGet(`${TENCENT_QUOTE_URL}${symbols}`, {
    ...FETCH_HEADERS,
    "Referer": "https://gu.qq.com/",
  }, "gbk");

  return text
    .split(";\n")
    .map(parseTencentHongKongIndexRow)
    .filter((item): item is IndexItem => item !== null);
}

interface HangSengDailyBulletinReport {
  reportType?: string;
  reportDate?: { date?: string; url?: string }[];
}

interface HangSengDailyBulletinSeries {
  seriesCode?: string;
  reportList?: HangSengDailyBulletinReport[];
}

function parseHangSengReportLine(line: string) {
  return line
    .split("\t")
    .map((cell) => cell.replace(/^\uFEFF/, "").replace(/^"|"$/g, ""));
}

function findHangSengIndexRow(csv: string, rowName: string) {
  return csv
    .split(/\r?\n/)
    .map(parseHangSengReportLine)
    .find((cells) => cells[1]?.includes(rowName));
}

async function fetchHangSengDailyReportUrls() {
  const text = await httpGet(HANG_SENG_DAILY_BULLETIN_URL);
  const json = JSON.parse(text);
  const seriesList = (json?.indexSeriesList ?? []) as HangSengDailyBulletinSeries[];
  const urlsBySeriesCode = new Map<string, string>();

  for (const series of seriesList) {
    if (!series.seriesCode) continue;

    const idxReport = series.reportList?.find((report) => report.reportType === "idx");
    const latestReport = idxReport?.reportDate
      ?.filter((report) => report.url && report.date)
      .sort((a, b) => String(a.date).localeCompare(String(b.date)))
      .at(-1);
    if (latestReport?.url) urlsBySeriesCode.set(series.seriesCode, latestReport.url);
  }

  return urlsBySeriesCode;
}

async function fetchHangSengOfficialIndexItems(): Promise<IndexItem[]> {
  const urlsBySeriesCode = await fetchHangSengDailyReportUrls();
  const items: IndexItem[] = [];

  await Promise.all(HANG_SENG_REPORT_INDEXES.map(async (config) => {
    const url = urlsBySeriesCode.get(config.seriesCode);
    if (!url) return;

    const csv = await httpGet(`${HANG_SENG_REPORT_BASE_URL}${url}`, FETCH_HEADERS, "utf-16le");
    const cells = findHangSengIndexRow(csv, config.rowName);
    if (!cells) return;

    const currentPrice = toFiniteNumber(cells[5]);
    const changeAmount = toFiniteNumber(cells[6]);
    const changePercent = toFiniteNumber(cells[7]);
    if (currentPrice === undefined || changePercent === undefined) return;

    items.push({
      f2: currentPrice,
      f3: changePercent,
      f4: changeAmount ?? 0,
      f12: config.code,
      f13: 100,
      f14: config.name,
      f18: changeAmount === undefined ? currentPrice : currentPrice - changeAmount,
      source: "恒生指数公司",
    });
  }));

  return items;
}

function parseHtmlNumber(value: string | undefined) {
  if (!value) return undefined;
  const normalized = value
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, "")
    .replace(/,/g, "")
    .replace(/%/g, "")
    .replace(/▲|▼/g, "")
    .trim();
  return toFiniteNumber(normalized);
}

function extractAastocksCells(rowHtml: string) {
  return [...rowHtml.matchAll(/<td[^>]*>(.*?)<\/td>/gis)].map((cell) => cell[1]);
}

async function fetchAastocksHongKongIndexItems(): Promise<IndexItem[]> {
  const html = await httpGet(AASTOCKS_HK_INDEX_URL, {
    ...FETCH_HEADERS,
    "Referer": "https://www.aastocks.com/",
  });

  return AASTOCKS_HK_INDEX_ROWS.flatMap((config) => {
    const rowHtml = html
      .split(/<tr class="tblM_row[^>]*">/i)
      .find((row) => row.includes(`index=${config.code}`)
        || stripHtml(row).includes(config.rowLabel)
        || row.includes(`cusToolTip="${config.rowLabel}"`))
      ?.split("</tr>")[0];
    if (!rowHtml) return [];

    const cells = extractAastocksCells(rowHtml);
    const currentPrice = parseHtmlNumber(cells[1]);
    const changeAmount = parseHtmlNumber(cells[2]);
    const changePercent = parseHtmlNumber(cells[3]);
    if (currentPrice === undefined || changePercent === undefined) return [];

    return [{
      f2: currentPrice,
      f3: changePercent,
      f4: changeAmount ?? 0,
      f12: config.code,
      f13: 100,
      f14: config.name,
      f18: changeAmount === undefined ? currentPrice : currentPrice - changeAmount,
      source: "AASTOCKS港股指数",
    } satisfies IndexItem];
  });
}

function mergeIndexItems(primary: IndexItem[], fallback: IndexItem[]) {
  const byCode = new Map<string, IndexItem>();
  fallback.forEach((item) => byCode.set(item.f12, item));
  primary.forEach((item) => byCode.set(item.f12, item));
  return [...byCode.values()];
}

async function fetchHongKongIndexItems(): Promise<IndexItem[]> {
  const [aastocksResult, sinaResult, tencentResult, hangSengResult] = await Promise.allSettled([
    fetchAastocksHongKongIndexItems(),
    fetchSinaHongKongIndexItems(),
    fetchTencentHongKongIndexItems(),
    fetchHangSengOfficialIndexItems(),
  ]);
  const aastocksItems = aastocksResult.status === "fulfilled" ? aastocksResult.value : [];
  const sinaItems = sinaResult.status === "fulfilled" ? sinaResult.value : [];
  const tencentItems = tencentResult.status === "fulfilled" ? tencentResult.value : [];
  const hangSengItems = hangSengResult.status === "fulfilled" ? hangSengResult.value : [];

  if (!aastocksItems.length && !sinaItems.length && !tencentItems.length && !hangSengItems.length) {
    const errors = [aastocksResult, sinaResult, tencentResult, hangSengResult]
      .filter((result): result is PromiseRejectedResult => result.status === "rejected")
      .map((result) => result.reason?.message || String(result.reason));
    throw new Error(errors.join("; ") || "empty response");
  }

  const fallbackItems = mergeIndexItems(tencentItems, hangSengItems);
  const realtimeItems = mergeIndexItems(aastocksItems, sinaItems);
  return mergeIndexItems(realtimeItems, fallbackItems);
}
async function fetchSinaLofList(): Promise<LofItem[]> {
  const rows = await fetchSinaQuotes(FALLBACK_FUND_SECIDS);

  return rows.flatMap(({ secid, values }) => {
    const code = secid.split(".")[1]?.trim();
    const previousClose = toFiniteNumber(values[2]);
    const currentPrice = toFiniteNumber(values[3]);
    if (!isValidFundCode(code) || currentPrice === undefined || previousClose === undefined) return [];

    const changePercent = previousClose > 0
      ? Math.round(((currentPrice - previousClose) / previousClose) * 10000) / 100
      : 0;

    return [{
      f2: currentPrice,
      f3: changePercent,
      f5: toFiniteNumber(values[8]) ?? 0,
      f6: toFiniteNumber(values[9]) ?? 0,
      f8: 0,
      f12: code,
      f14: values[0],
      f18: previousClose,
    }];
  });
}

function isValidFundCode(code: string | null | undefined): code is string {
  return /^\d{6}$/.test(code ?? "");
}

function codeToTencentSymbol(code: string) {
  if (/^\d{5}$/.test(code)) return `hk${code}`;
  if (code.startsWith("6") || code.startsWith("5") || code.startsWith("9")) return `sh${code}`;
  return `sz${code}`;
}

function tencentSymbolToCode(symbol: string) {
  return symbol.replace(/^(sh|sz|hk)/i, "");
}

async function fetchTencentQuotes(codes: string[]) {
  const symbols = [...new Set(codes.filter(Boolean).map(codeToTencentSymbol))];
  if (!symbols.length) return new Map<string, { name: string; changePercent: number; currentPrice?: number }>();

  const text = await httpGet(`${TENCENT_QUOTE_URL}${symbols.join(",")}`, {
    ...FETCH_HEADERS,
    "Referer": "https://gu.qq.com/",
  }, "gbk");
  const quotes = new Map<string, { name: string; changePercent: number; currentPrice?: number }>();

  text.split(";\n").forEach((row) => {
    const match = /v_([a-z0-9]+)="(.*)"/i.exec(row);
    if (!match) return;
    const values = match[2].split("~");
    const changePercent = toFiniteNumber(values[32]);
    if (changePercent === undefined) return;
    quotes.set(tencentSymbolToCode(match[1]), {
      name: values[1],
      changePercent,
      currentPrice: toFiniteNumber(values[3]),
    });
  });

  return quotes;
}

async function fetchCommodityQuotes(): Promise<CommodityQuoteItem[]> {
  const text = await httpGet(`${SINA_QUOTE_URL}${COMMODITY_QUOTES.map((item) => item.symbol).join(",")}`, {
    ...FETCH_HEADERS,
    "Referer": "https://finance.sina.com.cn/",
  }, "gbk");
  const valuesBySymbol = new Map(parseSinaRows(text).map((row) => [row.symbol, row.values]));

  return COMMODITY_QUOTES.flatMap((item) => {
    const values = valuesBySymbol.get(item.symbol);
    const currentPrice = toFiniteNumber(values?.[0]);
    const previousClose = toFiniteNumber(values?.[7]);
    if (currentPrice === undefined || previousClose === undefined || previousClose <= 0) return [];

    const changeAmount = Math.round((currentPrice - previousClose) * 10000) / 10000;
    const changePercent = Math.round((changeAmount / previousClose) * 10000) / 100;

    return [{
      code: item.code,
      name: item.name,
      currentPrice,
      previousClose,
      changeAmount,
      changePercent,
    }];
  });
}

async function fetchFundHoldingsSingle(code: string): Promise<HoldingItem[]> {
  try {
    const url = "https://fundf10.eastmoney.com/FundArchivesDatas.aspx"
      + `?type=jjcc&code=${code}&topline=10&year=&month=&rt=${Date.now()}`;
    const text = await httpGet(url, {
      ...FETCH_HEADERS,
      "Referer": `https://fundf10.eastmoney.com/ccmx_${code}.html`,
    });
    const holdingRowPattern = new RegExp(
      "<tr><td>\\d+</td><td>.*?unify/r/(\\d)\\.(\\d{5,6}).*?</td>"
      + "<td class='tol'>.*?>([^<]+)</a>.*?<td[^>]*>([\\d.]+)%</td>",
      "g",
    );
    const rows = [...text.matchAll(holdingRowPattern)];

    return rows.flatMap((row) => {
      const weight = toFiniteNumber(row[4]);
      if (weight === undefined) return [];

      return [{
        code: row[2],
        market: Number(row[1]),
        name: row[3],
        weight,
      }];
    });
  } catch {
    return [];
  }
}

async function fetchHoldingsBatch(funds: Fund[]) {
  const result = new Map<string, HoldingItem[]>();
  const targets = funds.filter((fund) => shouldRefreshHoldings(fund));
  const concurrency = 5;

  for (let i = 0; i < targets.length; i += concurrency) {
    const batch = targets.slice(i, i + concurrency);
    await Promise.all(batch.map(async (fund) => {
      const holdings = await fetchFundHoldingsSingle(fund.code);
      if (holdings.length) result.set(fund.code, holdings);
    }));
  }

  return result;
}

async function fetchFundFeesSingle(code: string): Promise<FundFeeData | null> {
  try {
    const url = `${FUND_FEE_PAGE_BASE}_${code}.html`;
    const html = await httpGet(url, {
      ...FETCH_HEADERS,
      "Referer": `https://fundf10.eastmoney.com/jjfl_${code}.html`,
    });
    const purchaseFee = parsePurchaseFee(html);
    const redemptionFee7d = parseRedemptionFeeAfter7Days(html);

    if (purchaseFee === undefined && redemptionFee7d === undefined) return null;
    return { purchaseFee, redemptionFee7d };
  } catch {
    return null;
  }
}

function parsePurchaseFee(html: string) {
  const table = extractFeeTable(html, "申购费率");
  if (!table) return undefined;

  const firstRowCells = extractTableRows(table)[0];
  if (!firstRowCells) return undefined;
  return parseLastPercent(firstRowCells.at(-1) ?? "");
}

function parseRedemptionFeeAfter7Days(html: string) {
  const table = extractFeeTable(html, "赎回费率");
  if (!table) return undefined;

  for (const cells of extractTableRows(table)) {
    const periodText = stripHtml(cells[0] ?? "");
    if (!isRedemptionPeriodAfter7Days(periodText)) continue;

    return parseFirstPercent(cells[1] ?? "");
  }

  return undefined;
}

function extractFeeTable(html: string, title: string) {
  const titleIndex = html.indexOf(title);
  if (titleIndex < 0) return null;

  const tableStart = html.indexOf("<table", titleIndex);
  const tableEnd = html.indexOf("</table>", tableStart);
  if (tableStart < 0 || tableEnd < 0) return null;

  return html.slice(tableStart, tableEnd + "</table>".length);
}

function extractTableRows(tableHtml: string) {
  return [...tableHtml.matchAll(/<tr[^>]*>(.*?)<\/tr>/gis)]
    .map((row) => [...row[1].matchAll(/<td[^>]*>(.*?)<\/td>/gis)].map((cell) => cell[1]))
    .filter((cells) => cells.length >= 2);
}

function stripHtml(value: string) {
  return value
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, "")
    .replace(/\s/g, "");
}

function parseFirstPercent(value: string) {
  const match = /([0-9]+(?:\.[0-9]+)?)%/.exec(stripHtml(value));
  return match ? Number(match[1]) : undefined;
}

function parseLastPercent(value: string) {
  const matches = [...stripHtml(value).matchAll(/([0-9]+(?:\.[0-9]+)?)%/g)];
  const match = matches.at(-1);
  return match ? Number(match[1]) : undefined;
}

function isRedemptionPeriodAfter7Days(periodText: string) {
  const normalized = periodText
    .replace(/（含）|\(含\)|含/g, "")
    .replace(/≤|﹤|＜/g, "<")
    .replace(/≥|﹥|＞/g, ">")
    .replace(/＝/g, "=");

  if (!normalized.includes("7天")) return false;
  if (/小于7天|少于7天|不满7天|不足7天|7天以内|7天以下|<7天/.test(normalized)) return false;

  return /大于等于7天|大于7天|超过7天|不少于7天|不低于7天|7天以上|7天及以上|>=7天|>7天|7天<=|7天</.test(normalized);
}

async function fetchWithFallback<T>(label: string, providers: DataProvider<T>[]): Promise<ProviderResult<T>> {
  const errors: string[] = [];

  for (const provider of providers) {
    try {
      const items = await provider.fetch();
      if (items.length) {
        if (errors.length) {
          console.warn(`[indexScheduler] ${label} recovered by ${provider.name}`);
        }
        return { source: provider.name, items };
      }
      errors.push(`${provider.name}: empty response`);
    } catch (e) {
      const code = (e as NodeJS.ErrnoException)?.code;
      const message = (e as Error)?.message;
      errors.push(`${provider.name}: ${code || message || "unknown error"}`);
    }
  }

  throw new Error(errors.join("; "));
}

function fetchIndexItemsWithFallback() {
  return fetchWithFallback<IndexItem>("index", [
    { name: "东方财富", fetch: fetchIndexItems },
    { name: "新浪财经", fetch: fetchSinaIndexItems },
  ]);
}

function fetchLofListWithFallback() {
  return fetchWithFallback<LofItem>("fund", [
    { name: "东方财富", fetch: fetchLofList },
    { name: "新浪财经", fetch: fetchSinaLofList },
  ]);
}

async function fetchNavSingle(code: string): Promise<NavData | null> {
  const [realtimeNav, publishedNav] = await Promise.all([
    fetchRealtimeNavSingle(code),
    fetchPublishedNavSingle(code),
  ]);

  if (!realtimeNav && !publishedNav) return null;
  if (publishedNav) {
    return {
      nav: publishedNav.nav,
      estimatedNav: realtimeNav?.estimatedNav ?? publishedNav.nav,
      navDate: publishedNav.navDate,
    };
  }

  return realtimeNav;
}

async function fetchRealtimeNavSingle(code: string): Promise<NavData | null> {
  try {
    const text = await httpGet(`${NAV_API_BASE}/${code}.js`, {});
    const match = /jsonpgz\((.*)\)/.exec(text);
    if (!match) return null;
    const obj = JSON.parse(match[1]);
    const nav = parseFloat(obj.dwjz);
    const estimatedNav = parseFloat(obj.gsz);
    if (!Number.isFinite(nav)) return null;
    return {
      nav,
      estimatedNav: Number.isFinite(estimatedNav) ? estimatedNav : nav,
      navDate: obj.jzrq ?? "",
    };
  } catch {
    return null;
  }
}

async function fetchPublishedNavSingle(code: string): Promise<PublishedNavData | null> {
  try {
    const url = `${PUBLISHED_NAV_API_URL}?type=lsjz&code=${code}&page=1&per=1&rt=${Date.now()}`;
    const text = await httpGet(url, {
      ...FETCH_HEADERS,
      "Referer": `https://fundf10.eastmoney.com/jjjz_${code}.html`,
    });
    const rowMatch = /<td>(\d{4}-\d{2}-\d{2})<\/td>\s*<td[^>]*>([\d.]+)<\/td>/i.exec(text);
    if (!rowMatch) return null;
    const nav = toFiniteNumber(rowMatch[2]);
    if (nav === undefined) return null;

    return {
      nav,
      navDate: rowMatch[1],
    };
  } catch {
    return null;
  }
}

async function fetchNavBatch(codes: string[]): Promise<Map<string, NavData>> {
  const result = new Map<string, NavData>();
  const concurrency = 10;

  for (let i = 0; i < codes.length; i += concurrency) {
    const batch = codes.slice(i, i + concurrency);
    const settled = await Promise.allSettled(
      batch.map(async (code) => {
        const data = await fetchNavSingle(code);
        if (data) result.set(code, data);
      }),
    );
    void settled;
  }

  return result;
}

// ---------- update logic ----------

type SchedulerEntityManager = Awaited<ReturnType<typeof forkEntityManager>>;

async function findOrCreateFundByCode(
  em: SchedulerEntityManager,
  cache: Map<string, Fund>,
  init: ConstructorParameters<typeof Fund>[0],
) {
  let fund: Fund | null | undefined = cache.get(init.code);
  if (fund) return fund;

  fund = await em.findOne(Fund, { code: init.code });
  if (!fund) {
    fund = new Fund(init);
    em.persist(fund);
  }
  cache.set(fund.code, fund);
  return fund;
}

async function findOrCreateMarketIndexByCode(
  em: SchedulerEntityManager,
  cache: Map<string, MarketIndex>,
  init: ConstructorParameters<typeof MarketIndex>[0],
) {
  let index: MarketIndex | null | undefined = cache.get(init.code);
  if (index) return index;

  index = await em.findOne(MarketIndex, { code: init.code });
  if (!index) {
    index = new MarketIndex(init);
    em.persist(index);
  }
  cache.set(index.code, index);
  return index;
}

async function upsertMarketIndexItems(em: SchedulerEntityManager, items: IndexItem[], source: string) {
  const codes = [...new Set(items.map((item) => item.f12).filter(Boolean))];
  const existingIndices = await em.find(MarketIndex, { code: { $in: codes } });
  const indexByCode = new Map(existingIndices.map((index) => [index.code, index]));

  for (const item of items) {
    const currentPrice = toFiniteNumber(item.f2);
    const changePercent = toFiniteNumber(item.f3);
    const changeAmount = toFiniteNumber(item.f4);
    const previousClose = toFiniteNumber(item.f18);
    const market = toFiniteNumber(item.f13);
    let index = indexByCode.get(item.f12);
    if (!index) {
      index = await findOrCreateMarketIndexByCode(em, indexByCode, {
        code: item.f12,
        market: market ?? 0,
        name: item.f14,
        currentPrice,
        changePercent,
        changeAmount,
        previousClose,
        source: item.source ?? source,
      });
    }

    index.name = item.f14;
    index.market = market ?? index.market;
    index.source = item.source ?? source;
    index.instrumentType = undefined;
    if (currentPrice !== undefined) index.currentPrice = currentPrice;
    if (changePercent !== undefined) index.changePercent = changePercent;
    if (changeAmount !== undefined) index.changeAmount = changeAmount;
    if (previousClose !== undefined) index.previousClose = previousClose;
  }
}

async function updateFundIndexRelations(em: SchedulerEntityManager) {
  const [funds, marketIndices] = await Promise.all([
    em.find(Fund, {}),
    em.find(MarketIndex, {}),
  ]);

  for (const fund of funds) {
    const indexRelation = resolveFundIndexRelation(fund, marketIndices);
    applyFundIndexRelation(fund, indexRelation);
    fund.fundType = resolveFundType(fund, indexRelation.code !== null);
    markFixedOpenFundLowValue(fund);
  }
}

function applyFundIndexRelation(fund: Fund, indexRelation: FundIndexRelation) {
  if (!indexRelation.code || !indexRelation.name) {
    fund.indexChangePercent = undefined;
    return;
  }

  fund.category = indexRelation.name;
  fund.indexChangePercent = indexRelation.changePercent ?? undefined;
}

async function fetchAndUpdateIndices() {
  try {
    const { source, items: domesticItems } = await fetchIndexItemsWithFallback();
    const hongKongItems = await fetchHongKongIndexItems().catch((error) => {
      logFetchError("hong-kong-index", error);
      return [] as IndexItem[];
    });
    const items = mergeIndexItems(domesticItems, hongKongItems);
    if (!items.length) return;
    schedulerState.consecutiveFailures = 0;

    const em = await forkEntityManager();
    await upsertMarketIndexItems(em, items, source);
    await em.flush();
  } catch (e) {
    logFetchError("index", e);
  }
}

async function fetchAndUpdateHongKongIndices() {
  if (schedulerState.isFetchingHongKongIndices) return;

  schedulerState.isFetchingHongKongIndices = true;
  try {
    const items = await fetchHongKongIndexItems();
    if (!items.length) return;

    const em = await forkEntityManager();
    await upsertMarketIndexItems(em, items, "港股指数");
    await updateFundIndexRelations(em);
    await em.flush();
  } catch (e) {
    logFetchError("hong-kong-index", e);
  } finally {
    schedulerState.isFetchingHongKongIndices = false;
  }
}

async function fetchAndUpdateCommodities() {
  try {
    const items = await fetchCommodityQuotes();
    if (!items.length) return;

    const em = await forkEntityManager();
    const existingItems = await em.find(MarketIndex, { code: { $in: items.map((item) => item.code) } });
    const indexByCode = new Map(existingItems.map((index) => [index.code, index]));

    for (const item of items) {
      let index = indexByCode.get(item.code);
      if (!index) {
        index = await findOrCreateMarketIndexByCode(em, indexByCode, {
          code: item.code,
          market: 9,
          name: item.name,
          instrumentType: "FUTURE",
          source: "SINA_GLOBAL_FUTURES",
          currentPrice: item.currentPrice,
          changePercent: item.changePercent,
          changeAmount: item.changeAmount,
          previousClose: item.previousClose,
        });
      }
      index.name = item.name;
      index.market = 9;
      index.instrumentType = "FUTURE";
      index.source = "SINA_GLOBAL_FUTURES";
      index.currentPrice = item.currentPrice;
      index.changePercent = item.changePercent;
      index.changeAmount = item.changeAmount;
      index.previousClose = item.previousClose;
    }

    await em.flush();
  } catch (e) {
    logFetchError("commodity", e);
  }
}

async function fetchAndUpdateFunds() {
  try {
    const { source, items } = await fetchLofListWithFallback();
    const fetchedLofItems = items.filter((item) => isValidFundCode(item.f12));
    if (!fetchedLofItems.length) return;
    schedulerState.consecutiveFailures = 0;

    const em = await forkEntityManager();
    const marketIndices = await em.find(MarketIndex, {});
    const existingFunds = await em.find(Fund, {});
    const existingFundCodes = existingFunds.map((fund) => fund.code);
    const realtimeQuoteItems = await fetchFundQuoteBatch([
      ...existingFundCodes,
      ...fetchedLofItems.map((item) => item.f12),
    ]).catch((error) => {
      logFetchError("fund-realtime-quote", error);
      return [] as LofItem[];
    });
    const lofItems = mergeFundQuoteItems(fetchedLofItems, realtimeQuoteItems)
      .filter((item) => isValidFundCode(item.f12));
    const lofCodes = lofItems.map((item) => item.f12);
    const fundByCode = new Map(existingFunds.map((fund) => [fund.code, fund]));
    const navCodes = [...new Set([...lofCodes, ...existingFunds.map((fund) => fund.code)])];
    const navMap = shouldFetchNavNow() ? await fetchNavBatch(navCodes) : new Map<string, NavData>();
    const touchedCodes = new Set<string>();

    for (const fund of fundByCode.values()) {
      const indexRelation = resolveFundIndexRelation(fund, marketIndices);
      applyFundIndexRelation(fund, indexRelation);
      fund.fundType = resolveFundType(fund, indexRelation.code !== null);
      markFixedOpenFundLowValue(fund);
    }

    for (const item of lofItems) {
      const currentPrice = toFiniteNumber(item.f2);
      const dailyChangePercent = toFiniteNumber(item.f3);
      const dailyVolumeCount = toFiniteNumber(item.f5);
      const dailyVolume = toFiniteNumber(item.f6);
      const turnoverRate = toFiniteNumber(item.f8);
      const exchangeShares = calculateExchangeShares(dailyVolumeCount, turnoverRate);
      let fund = fundByCode.get(item.f12);
      if (fund) {
        fund.name = item.f14;
        fund.source = item.source ?? source;
        if (currentPrice !== undefined) fund.currentPrice = currentPrice;
        if (dailyChangePercent !== undefined) fund.dailyChangePercent = dailyChangePercent;
        if (dailyVolume !== undefined) fund.dailyVolume = dailyVolume;
        if (turnoverRate !== undefined) fund.turnoverRate = turnoverRate;
        if (exchangeShares !== undefined) fund.exchangeShares = exchangeShares;
      } else {
        fund = await findOrCreateFundByCode(em, fundByCode, {
          code: item.f12,
          name: item.f14,
          currentPrice,
          dailyChangePercent,
          exchangeShares,
          source: item.source ?? source,
        });
        fund.name = item.f14;
        fund.source = item.source ?? source;
        if (currentPrice !== undefined) fund.currentPrice = currentPrice;
        if (dailyChangePercent !== undefined) fund.dailyChangePercent = dailyChangePercent;
        if (dailyVolume !== undefined) fund.dailyVolume = dailyVolume;
        if (turnoverRate !== undefined) fund.turnoverRate = turnoverRate;
        if (exchangeShares !== undefined) fund.exchangeShares = exchangeShares;
      }
      touchedCodes.add(fund.code);

      const navData = navMap.get(item.f12);
      if (navData) {
        applyNavData(fund, navData);
        await recalculateFundNavChangePercent(em, fund);
        if (currentPrice !== undefined && Number.isFinite(navData.estimatedNav) && navData.estimatedNav > 0) {
          fund.estimatedPremiumRate = Math.round(
            ((currentPrice - navData.estimatedNav) / navData.estimatedNav) * 10000,
          ) / 100;
        }
      }

      const indexRelation = resolveFundIndexRelation(fund, marketIndices);
      applyFundIndexRelation(fund, indexRelation);
      fund.fundType = resolveFundType(fund, indexRelation.code !== null);
      markFixedOpenFundLowValue(fund);
    }

    for (const fund of fundByCode.values()) {
      if (touchedCodes.has(fund.code)) continue;
      const navData = navMap.get(fund.code);
      if (!navData) continue;
      applyNavData(fund, navData);
      await recalculateFundNavChangePercent(em, fund);

      if (fund.currentPrice !== undefined && navData.estimatedNav > 0) {
        fund.estimatedPremiumRate = Math.round(
          ((fund.currentPrice - navData.estimatedNav) / navData.estimatedNav) * 10000,
        ) / 100;
      }
      const indexRelation = resolveFundIndexRelation(fund, marketIndices);
      applyFundIndexRelation(fund, indexRelation);
      fund.fundType = resolveFundType(fund, indexRelation.code !== null);
      markFixedOpenFundLowValue(fund);
    }

    if (shouldFetchHoldingsNow()) {
      await updateHoldingsAndStockQuotes(em, [...fundByCode.values()]);
    }
    await estimateFunds([...fundByCode.values()], marketIndices);

    await em.flush();
    logFetchSuccess(lofItems.length, navMap.size);
  } catch (e) {
    logFetchError("fund", e);
  }
}

function shouldFetchNavNow() {
  const now = new Date();
  const currentHour = `${now.getFullYear()}-${now.getMonth()}-${now.getDate()}-${now.getHours()}`;
  if (now.getMinutes() !== 0 && schedulerState.lastNavFetchHour) return false;
  if (schedulerState.lastNavFetchHour === currentHour) return false;
  schedulerState.lastNavFetchHour = currentHour;
  return true;
}

function shouldFetchHoldingsNow() {
  const now = Date.now();
  if (schedulerState.lastHoldingsFetchAt && now - schedulerState.lastHoldingsFetchAt < HOLDINGS_SYNC_INTERVAL_MS) {
    return false;
  }

  schedulerState.lastHoldingsFetchAt = now;
  return true;
}

function calculateExchangeShares(volumeHands: number | undefined, turnoverRate: number | undefined) {
  if (volumeHands === undefined || turnoverRate === undefined || turnoverRate <= 0) return undefined;
  const volumeShares = volumeHands * 100;
  return Math.round((volumeShares / (turnoverRate / 100)) * 100) / 100;
}

const syncedFundTypes = new Set(["股票型基金", "欧美指数QDII", "亚洲指数QDII", "商品QDII"]);

function isSyncedFundType(fundType: string | undefined) {
  return fundType !== undefined && syncedFundTypes.has(fundType);
}

function isQdiiFundType(fundType: string | undefined) {
  return fundType === "QDII" || Boolean(fundType?.includes("QDII"));
}

function isStockFundType(fundType: string | undefined) {
  return fundType === "A股股票基金" || fundType === "股票型基金";
}

function resolveFundType(fund: Fund, hasIndexRelation: boolean) {
  if (fund.code === "501095") return "股票型基金";
  if (fund.code === "501227") return "混合型基金";
  if (fund.code === "162411") return "商品QDII";
  if (isSyncedFundType(fund.fundType)) return fund.fundType;

  const classifiedFundType = classifyFund(fund);
  if (isSyncedFundType(classifiedFundType) || isQdiiFundType(classifiedFundType)) return classifiedFundType;

  return hasIndexRelation ? "A股指数基金" : classifiedFundType;
}

function classifyFund(fund: Fund) {
  if (fund.code === "161715") return "A股指数基金";
  if (HONG_KONG_FUND_CODES.has(String(fund.code).trim())) return "亚洲指数QDII";

  const text = `${fund.name}${fund.category ?? ""}`.toLowerCase();
  if (/恒生|港股|香港|沪深港|h股|hk|红利低波港股|港中小企|港股通/i.test(text)) {
    return "亚洲指数QDII";
  }
  if (/白银|黄金|油气|原油|大宗商品|商品/i.test(text)) return "商品QDII";
  if (/qdii|纳斯达克|标普|海外|德国|印度|日本|越南|全球|美元|抗通胀/i.test(text)) return "QDII";
  if (/指数|300|500|1000|创业板|科创|中证|国证|深证|上证|沪深|行业|证券|信息|地产|传媒|国防|大宗商品/i.test(text)) {
    return "A股指数基金";
  }
  return "A股股票基金";
}

function markFixedOpenFundLowValue(fund: Fund) {
  const text = `${fund.name}${fund.fundType ?? ""}${fund.category ?? ""}`;
  if (/定开|定期开放/.test(text)) fund.lowValue = true;
}

function shouldRefreshHoldings(fund: Fund) {
  if (isStockFundType(fund.fundType) || isQdiiFundType(fund.fundType)) return true;
  return !resolveFundIndexRelation(fund, []).code;
}

async function updateHoldingsAndStockQuotes(em: Awaited<ReturnType<typeof forkEntityManager>>, funds: Fund[]) {
  const holdingsTargets = funds.filter((fund) => fund.code === "501095" || !fund.category || !fund.indexChangePercent);
  const holdingsMap = await fetchHoldingsBatch(holdingsTargets);
  const allStockCodes = [...new Set([...holdingsMap.values()].flat().map((holding) => holding.code))];
  const quoteMap = await fetchTencentQuotes(allStockCodes);

  const existingStocks = await em.find(MarketIndex, { code: { $in: allStockCodes } });
  const stockByCode = new Map(existingStocks.map((stock) => [stock.code, stock]));

  for (const [fundCode, holdings] of holdingsMap) {
    const fund = funds.find((item) => item.code === fundCode);
    if (!fund) continue;
    const enrichedHoldings = holdings.map((holding) => ({
      ...holding,
      changePercent: quoteMap.get(holding.code)?.changePercent,
    }));
    fund.holdingsJson = JSON.stringify(enrichedHoldings);

    for (const holding of enrichedHoldings) {
      const quote = quoteMap.get(holding.code);
      let stock = stockByCode.get(holding.code);
      if (!stock) {
        stock = await findOrCreateMarketIndexByCode(em, stockByCode, {
          code: holding.code,
          market: holding.market ?? 0,
          name: quote?.name ?? holding.name,
          instrumentType: "STOCK",
          source: "TENCENT",
          currentPrice: quote?.currentPrice,
          changePercent: quote?.changePercent,
        });
      }
      stock.name = quote?.name ?? holding.name;
      stock.instrumentType = "STOCK";
      stock.source = "TENCENT";
      if (quote?.currentPrice !== undefined) stock.currentPrice = quote.currentPrice;
      if (quote?.changePercent !== undefined) stock.changePercent = quote.changePercent;
    }
  }
}

async function estimateFunds(funds: Fund[], marketIndices: MarketIndex[] = []) {
  const now = new Date();
  const marketQuotes = new Map<string, MarketQuoteItem>(
    marketIndices.map((item) => [
      item.code,
      {
        code: item.code,
        name: item.name,
        currentPrice: item.currentPrice,
        changePercent: item.changePercent,
        previousClose: item.previousClose,
        updateTime: item.updateTime,
      },
    ]),
  );

  for (const fund of funds) {
    if (shouldFreezeHongKongFundEstimate(fund, now)) {
      applyHongKongMarketClosedEstimate(fund, now);
      continue;
    }

    const model = getFundValuationModel(fund);
    const result = await model(fund, {
      now,
      holdings: parseFundHoldings(fund),
      marketQuotes,
    });

    if (result.estimatedNav !== undefined) {
      fund.estimatedNav = result.estimatedNav;
    }
    fund.valuationDetailsJson = result.valuationDetails ? JSON.stringify(result.valuationDetails) : undefined;

    if (fund.code !== "161815" && fund.code !== "501227") {
      applyDomesticIndexRealtimeEstimate(fund, now, marketIndices);
    }

    if (fund.currentPrice !== undefined && fund.estimatedNav !== undefined && fund.estimatedNav > 0) {
      const premiumBase = shouldUseCurrentPriceAsPremiumBase(fund, now, marketIndices)
        ? fund.currentPrice
        : fund.estimatedNav;
      if (premiumBase > 0) {
        fund.estimatedPremiumRate = Math.round(
          ((fund.currentPrice - fund.estimatedNav) / premiumBase) * 10000,
        ) / 100;
      }
    }
  }
}

function shouldFreezeHongKongFundEstimate(fund: Fund, now: Date) {
  return isHongKongMarketFund(fund) && !isHongKongMarketTradingDay(now);
}

function applyHongKongMarketClosedEstimate(fund: Fund, now: Date) {
  fund.indexChangePercent = undefined;

  if (fund.nav !== undefined && fund.nav > 0) {
    fund.estimatedNav = fund.nav;
    fund.valuationDetailsJson = JSON.stringify({
      modelName: "hong-kong-market-closed-nav",
      baseDate: formatDateKey(fund.navDate ?? now),
      estimatedChangePercent: 0,
      components: [{
        symbol: "HKEX",
        name: `港股休市 ${getHongKongDateKey(now)}`,
        weight: 100,
        source: "market-calendar",
        totalChangePercent: 0,
        contributionPercent: 0,
      }],
    });
  } else {
    fund.valuationDetailsJson = undefined;
  }

  if (fund.currentPrice !== undefined && fund.estimatedNav !== undefined && fund.estimatedNav > 0) {
    fund.estimatedPremiumRate = Math.round(
      ((fund.currentPrice - fund.estimatedNav) / fund.estimatedNav) * 10000,
    ) / 100;
  }
}

function applyNavData(fund: Fund, navData: NavData) {
  fund.nav = navData.nav;
  if (navData.navChangePercent !== undefined) fund.navChangePercent = navData.navChangePercent;
  fund.estimatedNav = navData.estimatedNav;
  const navDate = new Date(navData.navDate);
  if (Number.isFinite(navDate.getTime())) fund.navDate = navDate;
}

function applyDomesticIndexRealtimeEstimate(fund: Fund, now: Date, marketIndices: MarketIndex[]) {
  if (!shouldUseCurrentPriceAsPremiumBase(fund, now, marketIndices)) return;
  if (fund.nav === undefined || fund.nav <= 0 || fund.indexChangePercent === undefined) return;

  // Before today's official NAV is published, estimate domestic index funds from latest official NAV and index move.
  fund.estimatedNav = Math.round(fund.nav * (1 + fund.indexChangePercent / 100) * 10000) / 10000;
}

function shouldUseCurrentPriceAsPremiumBase(fund: Fund, now: Date, marketIndices: MarketIndex[]) {
  if (hasTodayNav(fund, now)) return false;
  if (isQdiiFundType(fund.fundType) || fund.fundType === "港股指数基金") return false;
  return fund.fundType === "A股指数基金" || resolveFundIndexRelation(fund, marketIndices).code !== null;
}

function hasTodayNav(fund: Fund, now: Date) {
  if (!fund.navDate) return false;
  const navDate = fund.navDate instanceof Date ? fund.navDate : new Date(fund.navDate);
  if (!Number.isFinite(navDate.getTime())) return false;

  return navDate.getFullYear() === now.getFullYear()
    && navDate.getMonth() === now.getMonth()
    && navDate.getDate() === now.getDate();
}

function logFetchSuccess(fundCount: number, navCount: number) {
  const now = Date.now();
  if (now - schedulerState.lastSuccessLogAt < SUCCESS_LOG_INTERVAL_MS) return;
  schedulerState.lastSuccessLogAt = now;
  console.log(`[indexScheduler] updated ${fundCount} funds, ${navCount} with NAV`);
}

function logFetchError(label: string, e: unknown) {
  schedulerState.consecutiveFailures++;
  if (schedulerState.consecutiveFailures <= 3 || schedulerState.consecutiveFailures % 30 === 0) {
    const code = (e as NodeJS.ErrnoException)?.code ?? "";
    const msg = (e as Error)?.message ?? "";
    console.error(`[indexScheduler] ${label} error #${schedulerState.consecutiveFailures}: ${code || msg}`);
  }
}

async function fetchAll() {
  if (schedulerState.isFetching) {
    console.warn("[indexScheduler] previous run is still running, skipped this tick");
    return;
  }

  schedulerState.isFetching = true;
  try {
    await fetchAndUpdateIndices();
    await fetchAndUpdateCommodities();
    await fetchAndUpdateFunds();
  } finally {
    schedulerState.isFetching = false;
  }
}

async function updateFundFeesDaily() {
  try {
    const em = await forkEntityManager();
    const funds = await em.find(Fund, {});
    const concurrency = 5;
    let updatedCount = 0;

    for (let i = 0; i < funds.length; i += concurrency) {
      const batch = funds.slice(i, i + concurrency);
      await Promise.all(batch.map(async (fund) => {
        const feeData = await fetchFundFeesSingle(fund.code);
        if (!feeData) return;

        let changed = false;
        if (feeData.purchaseFee !== undefined && fund.purchaseFee !== feeData.purchaseFee) {
          fund.purchaseFee = feeData.purchaseFee;
          changed = true;
        }
        if (feeData.redemptionFee7d !== undefined && fund.redemptionFee7d !== feeData.redemptionFee7d) {
          fund.redemptionFee7d = feeData.redemptionFee7d;
          changed = true;
        }
        if (changed) updatedCount++;
      }));
    }

    await em.flush();
    console.log(`[indexScheduler] fund fees updated: ${updatedCount}/${funds.length}`);
  } catch (e) {
    logFetchError("fund fees", e);
  }
}

async function snapshotFundDaily() {
  try {
    const em = await forkEntityManager();
    const funds = await em.find(Fund, {});
    const marketIndices = await em.find(MarketIndex, {});
    const today = startOfDay(new Date());
    const navMap = await fetchNavBatch(funds.map((fund) => fund.code));

    for (const fund of funds) {
      const navData = navMap.get(fund.code);
      if (navData) {
        applyNavData(fund, navData);
        await recalculateFundNavChangePercent(em, fund);
      }
    }

    await estimateFunds(funds, marketIndices);
    const previous = await em.find(FundDaily, { date: { $lt: today } }, { orderBy: { date: "desc" } });
    const latestDailyByFundId = new Map<number, FundDaily>();
    previous.forEach((daily) => {
      const fund = daily.fund;
      if (!latestDailyByFundId.has(fund.id)) latestDailyByFundId.set(fund.id, daily);
    });

    const existingToday = await em.find(FundDaily, { date: today });
    const todayByFundId = new Map(existingToday.map((daily) => [(daily.fund).id, daily]));

    for (const fund of funds) {
      let daily = todayByFundId.get(fund.id);
      const previousDaily = latestDailyByFundId.get(fund.id);
      const exchangeSharesChange = fund.exchangeShares !== undefined && previousDaily?.exchangeShares !== undefined
        ? Math.round((fund.exchangeShares - previousDaily.exchangeShares) * 100) / 100
        : undefined;
      const calculatedNavChangePercent = calculateChangeRate(fund.nav, previousDaily?.nav);
      const navChangePercent = calculatedNavChangePercent ?? fund.navChangePercent;
      const closePremiumRate = calculatePremiumRate(fund.currentPrice, fund.estimatedNav, fund.estimatedNav);

      if (!daily) {
        daily = new FundDaily({
          fund,
          date: today,
          closePrice: fund.currentPrice,
          navChangePercent,
          estimatedNav: fund.estimatedNav,
          exchangeShares: fund.exchangeShares,
          exchangeSharesChange,
          closePremiumRate,
        });
        em.persist(daily);
      } else {
        daily.closePrice = fund.currentPrice;
        daily.navChangePercent = navChangePercent;
        daily.estimatedNav = fund.estimatedNav;
        daily.exchangeShares = fund.exchangeShares;
        daily.exchangeSharesChange = exchangeSharesChange;
        daily.closePremiumRate = closePremiumRate;
      }

      await applyPublishedNavToFundDaily(em, fund, daily);
    }

    await em.flush();
    console.log(`[indexScheduler] daily snapshot saved: ${funds.length} funds`);
  } catch (e) {
    logFetchError("daily snapshot", e);
  }
}

async function scanFundPricePinsDaily() {
  if (schedulerState.isScanningPricePins) {
    console.warn("[indexScheduler] previous price pin scan is still running, skipped this tick");
    return;
  }

  schedulerState.isScanningPricePins = true;
  try {
    const em = await forkEntityManager();
    const funds = await em.find(Fund, {}, { orderBy: { code: "asc" } });
    const thresholdPercent = normalizePositiveNumber(FUND_PRICE_PIN_THRESHOLD_PERCENT, 5);
    const needleThresholdPercent = normalizePositiveNumber(FUND_PRICE_PIN_NEEDLE_THRESHOLD_PERCENT, 4);
    const lookbackYears = normalizePositiveNumber(FUND_PRICE_PIN_LOOKBACK_YEARS, 2);
    const fetchIntervalMs = normalizePositiveNumber(FUND_PRICE_PIN_FETCH_INTERVAL_MS, 3000);
    let scannedCount = 0;
    let pinCount = 0;

    for (const fund of funds) {
      if (!isValidFundCode(fund.code)) continue;
      if (scannedCount > 0) await sleep(fetchIntervalMs);

      try {
        const klines = await fetchFundKlines(fund.code, lookbackYears);
        const pins = detectFundPricePins(klines, thresholdPercent, needleThresholdPercent);
        await replaceFundPricePins(em, fund, pins, thresholdPercent, needleThresholdPercent);
        await em.flush();
        scannedCount++;
        pinCount += pins.length;
      } catch (error) {
        logFetchError(`price pin ${fund.code}`, error);
      }
    }

    console.log(`[indexScheduler] price pin scan saved: ${pinCount} pins from ${scannedCount}/${funds.length} funds`);
  } catch (e) {
    logFetchError("price pin scan", e);
  } finally {
    schedulerState.isScanningPricePins = false;
  }
}

function detectFundPricePins(
  klines: FundKlineItem[],
  thresholdPercent: number,
  needleThresholdPercent: number,
) {
  return klines.flatMap((item) => {
    const highDeviationPercent = roundPercent((item.highPrice - item.closePrice) / item.closePrice * 100);
    const lowDeviationPercent = roundPercent((item.lowPrice - item.closePrice) / item.closePrice * 100);
    const isHighPin = highDeviationPercent >= thresholdPercent;
    const isLowPin = lowDeviationPercent <= -thresholdPercent;

    if (!isHighPin && !isLowPin) return [];

    const pinType = isHighPin && isLowPin
      ? FundPricePinType.BOTH
      : isHighPin ? FundPricePinType.HIGH : FundPricePinType.LOW;
    const needle = isNeedlePin(item, isHighPin, isLowPin, needleThresholdPercent);

    return [{
      ...item,
      highDeviationPercent,
      lowDeviationPercent,
      needle,
      pinType,
    }];
  });
}

function isNeedlePin(
  item: FundKlineItem,
  isHighPin: boolean,
  isLowPin: boolean,
  needleThresholdPercent: number,
) {
  const highOpenDeviationPercent = roundPercent((item.highPrice - item.openPrice) / item.openPrice * 100);
  const highCloseDeviationPercent = roundPercent((item.highPrice - item.closePrice) / item.closePrice * 100);
  const lowOpenDeviationPercent = roundPercent((item.openPrice - item.lowPrice) / item.openPrice * 100);
  const lowCloseDeviationPercent = roundPercent((item.closePrice - item.lowPrice) / item.closePrice * 100);

  const isHighNeedle = isHighPin
    && highOpenDeviationPercent >= needleThresholdPercent
    && highCloseDeviationPercent >= needleThresholdPercent;
  const isLowNeedle = isLowPin
    && lowOpenDeviationPercent >= needleThresholdPercent
    && lowCloseDeviationPercent >= needleThresholdPercent;

  return isHighNeedle || isLowNeedle;
}

async function replaceFundPricePins(
  em: SchedulerEntityManager,
  fund: Fund,
  pins: (FundKlineItem & {
    highDeviationPercent: number;
    lowDeviationPercent: number;
    needle: boolean;
    pinType: FundPricePinType;
  })[],
  thresholdPercent: number,
  needleThresholdPercent: number,
) {
  const existingItems = await em.find(FundPricePin, { fund });
  const existingByDate = new Map(existingItems.map((item) => [formatDateKey(item.pinDate), item]));
  const touchedDateKeys = new Set<string>();
  const detectedAt = new Date();

  for (const pin of pins) {
    const dateKey = formatDateKey(pin.date);
    touchedDateKeys.add(dateKey);
    let item = existingByDate.get(dateKey);

    if (!item) {
      item = new FundPricePin({
        fund,
        fundCode: fund.code,
        fundName: fund.name,
        pinDate: pin.date,
        openPrice: pin.openPrice,
        closePrice: pin.closePrice,
        highPrice: pin.highPrice,
        lowPrice: pin.lowPrice,
        highDeviationPercent: pin.highDeviationPercent,
        lowDeviationPercent: pin.lowDeviationPercent,
        thresholdPercent,
        needleThresholdPercent,
        needle: pin.needle,
        pinType: pin.pinType,
        source: "EASTMONEY",
        detectedAt,
      });
      em.persist(item);
    }

    item.fundCode = fund.code;
    item.fundName = fund.name;
    item.openPrice = pin.openPrice;
    item.closePrice = pin.closePrice;
    item.highPrice = pin.highPrice;
    item.lowPrice = pin.lowPrice;
    item.highDeviationPercent = pin.highDeviationPercent;
    item.lowDeviationPercent = pin.lowDeviationPercent;
    item.thresholdPercent = thresholdPercent;
    item.needleThresholdPercent = needleThresholdPercent;
    item.needle = pin.needle;
    item.pinType = pin.pinType;
    item.source = "EASTMONEY";
    item.detectedAt = detectedAt;
  }

  for (const item of existingItems) {
    if (!touchedDateKeys.has(formatDateKey(item.pinDate))) {
      em.remove(item);
    }
  }
}

async function applyPublishedNavToFundDaily(em: SchedulerEntityManager, fund: Fund, todayDaily: FundDaily) {
  const nav = toFiniteNumber(fund.nav);
  if (nav === undefined || !fund.navDate) return;

  const navDate = startOfDay(fund.navDate instanceof Date ? fund.navDate : new Date(fund.navDate));
  if (!Number.isFinite(navDate.getTime())) return;

  let daily = isSameDate(navDate, todayDaily.date)
    ? todayDaily
    : await em.findOne(FundDaily, { fund, date: navDate });

  if (!daily) {
    daily = new FundDaily({
      fund,
      date: navDate,
      nav,
    });
    em.persist(daily);
  }

  const previousNavDaily = await findPreviousNavDaily(em, fund, navDate);
  const calculatedNavChangePercent = calculateChangeRate(nav, previousNavDaily?.nav);
  daily.nav = nav;
  daily.navChangePercent = calculatedNavChangePercent ?? fund.navChangePercent;
  if (calculatedNavChangePercent !== undefined) fund.navChangePercent = calculatedNavChangePercent;
  daily.navPremiumRate = calculatePremiumRate(daily.closePrice, nav, nav);
  daily.premiumErrorRate = calculatePremiumRate(daily.estimatedNav, nav, nav);
}

async function recalculateFundNavChangePercent(em: SchedulerEntityManager, fund: Fund) {
  const nav = toFiniteNumber(fund.nav);
  if (nav === undefined || !fund.navDate) return;

  const navDate = startOfDay(fund.navDate instanceof Date ? fund.navDate : new Date(fund.navDate));
  if (!Number.isFinite(navDate.getTime())) return;

  const previousNavDaily = await findPreviousNavDaily(em, fund, navDate);
  const calculatedNavChangePercent = calculateChangeRate(nav, previousNavDaily?.nav);
  if (calculatedNavChangePercent !== undefined) fund.navChangePercent = calculatedNavChangePercent;
}

async function findPreviousNavDaily(em: SchedulerEntityManager, fund: Fund, navDate: Date) {
  return em.findOne(
    FundDaily,
    { fund, date: { $lt: navDate }, nav: { $ne: null } },
    { orderBy: { date: "desc" } },
  );
}

function calculateChangeRate(value: unknown, previousValue: unknown) {
  const numericValue = toFiniteNumber(value);
  const numericPreviousValue = toFiniteNumber(previousValue);
  if (numericValue === undefined || numericPreviousValue === undefined || numericPreviousValue <= 0) return undefined;
  return Math.round(((numericValue - numericPreviousValue) / numericPreviousValue) * 10000) / 100;
}

function calculatePremiumRate(value: unknown, base: unknown, denominator: unknown) {
  const numericValue = toFiniteNumber(value);
  const numericBase = toFiniteNumber(base);
  const numericDenominator = toFiniteNumber(denominator);
  if (numericValue === undefined || numericBase === undefined) return undefined;
  if (numericDenominator === undefined || numericDenominator <= 0) return undefined;
  return Math.round(((numericValue - numericBase) / numericDenominator) * 10000) / 100;
}

function normalizePositiveNumber(value: number, fallback: number) {
  return Number.isFinite(value) && value > 0 ? value : fallback;
}

function roundPercent(value: number) {
  return Math.round(value * 10000) / 10000;
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function startOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function formatDateKey(value: Date | string) {
  const date = value instanceof Date ? value : new Date(value);
  if (!Number.isFinite(date.getTime())) return String(value);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function isSameDate(value: Date | string | null | undefined, target: Date | string | null | undefined) {
  if (!value || !target) return false;
  const date = value instanceof Date ? value : new Date(value);
  const targetDate = target instanceof Date ? target : new Date(target);
  if (!Number.isFinite(date.getTime()) || !Number.isFinite(targetDate.getTime())) return false;

  return date.getFullYear() === targetDate.getFullYear()
    && date.getMonth() === targetDate.getMonth()
    && date.getDate() === targetDate.getDate();
}

export async function syncIndexDataOnce() {
  await fetchAll();
}

export async function snapshotFundDailyOnce() {
  await snapshotFundDaily();
}

export async function scanFundPricePinsOnce() {
  await scanFundPricePinsDaily();
}

export function startIndexScheduler() {
  if (schedulerState.started) return;
  schedulerState.started = true;

  cron.schedule(FUND_SYNC_CRON, fetchAll);
  cron.schedule(HONG_KONG_INDEX_SYNC_CRON, fetchAndUpdateHongKongIndices);
  cron.schedule(FUND_DAILY_SNAPSHOT_CRON, snapshotFundDaily, {
    timezone: FUND_DAILY_SNAPSHOT_TIMEZONE,
  });
  cron.schedule(FUND_FEE_SYNC_CRON, updateFundFeesDaily);
  cron.schedule(FUND_PRICE_PIN_SCAN_CRON, scanFundPricePinsDaily);
  void updateFundFeesDaily();
  console.log(
    `[indexScheduler] started, cron: ${FUND_SYNC_CRON}, hong kong index: ${HONG_KONG_INDEX_SYNC_CRON}, `
    + `daily snapshot: ${FUND_DAILY_SNAPSHOT_CRON} (${FUND_DAILY_SNAPSHOT_TIMEZONE}), `
    + `fee sync: ${FUND_FEE_SYNC_CRON}, `
    + `price pin scan: ${FUND_PRICE_PIN_SCAN_CRON}`,
  );
}
