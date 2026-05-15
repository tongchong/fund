import https from "node:https";

import cron from "node-cron";
import { Fund } from "src/server/db/entities/fund";
import { FundDaily } from "src/server/db/entities/fundDaily";
import { MarketIndex } from "src/server/db/entities/marketIndex";
import { resolveFundIndexRelation } from "src/server/fundIndexRelation";
import {
  getFundValuationModel,
  HoldingItem,
  MarketQuoteItem,
  parseFundHoldings,
} from "src/server/fundValuationModels";
import { forkEntityManager } from "src/utils/getOrm";

const FETCH_HEADERS = {
  // eslint-disable-next-line @stylistic/max-len
  "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36",
  "Referer": "https://quote.eastmoney.com/",
};

const INDEX_API_URL = "https://push2delay.eastmoney.com/api/qt/ulist.np/get"
  + "?fltt=2&invt=2&fields=f2,f3,f4,f12,f13,f14,f18,f124";

const INDEX_SECIDS = [
  "0.399368", "0.399967", "0.399998", "0.399811", "2.931068", "0.399991",
  "0.399809", "1.000979", "1.000823", "1.000805", "0.399395", "1.000961",
  "0.399997", "0.399965", "2.930875", "2.930726", "0.399803", "0.399987",
  "1.000922", "0.399990", "2.930713", "2.930720", "2.930719", "0.399804",
  "0.399933", "0.399417", "2.930997", "0.399975", "1.000905", "0.399707",
  "0.399806", "0.399440", "0.399393", "2.930721", "0.399807", "2.950090",
  "1.000300", "2.930743", "0.399992", "0.399330", "0.399973", "2.H30094",
  "0.399006", "0.399001", "0.399971", "2.930917", "2.930914", "2.930792",
];

const LOF_LIST_URL = "https://push2delay.eastmoney.com/api/qt/clist/get";
const LOF_LIST_PARAMS = "po=1&np=1"
  + "&ut=bd1d9ddb04089700cf9c27f6f7426281"
  + "&fltt=2&invt=2&wbp2u=|0|0|0|web&fid=f3"
  + "&fs=b:MK0404,b:MK0405,b:MK0406,b:MK0407"
  + "&fields=f2,f3,f5,f6,f8,f12,f14,f18";

const NAV_API_BASE = "https://fundgz.1234567.com.cn/js";
const PUBLISHED_NAV_API_URL = "https://fundf10.eastmoney.com/F10DataApi.aspx";
const SINA_QUOTE_URL = "https://hq.sinajs.cn/list=";
const TENCENT_QUOTE_URL = "https://qt.gtimg.cn/q=";
const FUND_SYNC_CRON = process.env.FUND_SYNC_CRON || "0 * * * * *";
const FUND_DAILY_SNAPSHOT_CRON = process.env.FUND_DAILY_SNAPSHOT_CRON || "1 15 * * *";
const SUCCESS_LOG_INTERVAL_MS = 5 * 60 * 1000;
const SCHEDULER_STATE_KEY = "__fundIndexSchedulerState__";
const COMMODITY_QUOTES = [
  { symbol: "hf_GC", code: "HF_GC", name: "COMEX黄金" },
  { symbol: "hf_CL", code: "HF_CL", name: "NYMEX原油" },
  { symbol: "hf_OIL", code: "HF_OIL", name: "布伦特原油" },
  { symbol: "hf_SI", code: "HF_SI", name: "COMEX白银" },
  { symbol: "hf_CAD", code: "HF_CAD", name: "COMEX铜" },
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
}

interface NavData {
  nav: number;
  estimatedNav: number;
  navDate: string;
}

interface PublishedNavData {
  nav: number;
  navDate: string;
}

interface DataProvider<T> {
  name: string;
  fetch: () => Promise<T[]>;
}

interface CommodityQuoteItem {
  code: string;
  name: string;
  currentPrice: number;
  previousClose: number;
  changeAmount: number;
  changePercent: number;
}

interface SchedulerState {
  consecutiveFailures: number;
  lastSuccessLogAt: number;
  isFetching: boolean;
  lastNavFetchHour: string;
  started: boolean;
}

const schedulerState = ((globalThis as unknown as Record<string, SchedulerState>)[SCHEDULER_STATE_KEY] ??= {
  consecutiveFailures: 0,
  lastSuccessLogAt: 0,
  isFetching: false,
  lastNavFetchHour: "",
  started: false,
});

const FALLBACK_FUND_SECIDS = [
  "1.501019", "1.502003", "0.161024", "0.168204", "0.161032", "0.163116",
  "1.501090", "0.160638", "0.167301", "0.161715", "0.165520", "0.160620",
  "0.160221", "0.161217", "0.161725", "0.160628", "0.160643", "0.161726",
  "0.161031", "0.160632", "1.501227", "0.161724", "0.161631", "1.501007",
  "1.501008", "1.501005", "0.161030", "0.160635", "0.161035", "0.160225",
  "1.502010", "0.161720", "0.161027", "1.501036", "0.161017", "0.160119",
  "0.163113", "1.501030", "1.502023", "0.160218", "0.161033", "0.160639",
  "0.160135", "1.501050", "1.501057", "1.501058", "1.501029", "0.160706",
  "0.163407", "0.161028", "1.501009", "0.161123", "0.161227", "1.501016",
  "0.160630", "1.501089", "0.160223", "0.163109", "0.160629", "1.501307",
  "1.501305", "1.501306", "1.501303", "1.501302", "0.160924", "0.164705",
  "1.501311", "1.501021", "1.501025", "0.161124",
];

// ---------- HTTP helpers ----------

function httpGet(url: string, headers: Record<string, string> = FETCH_HEADERS): Promise<string> {
  return new Promise((resolve, reject) => {
    const req = https.get(url, { headers, timeout: 15000 }, (res) => {
      let data = "";
      res.on("data", (chunk: string) => { data += chunk; });
      res.on("end", () => resolve(data));
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
  return json?.data?.diff ?? [];
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
      const match = /var hq_str_([a-z0-9]+)="(.*)"/i.exec(row);
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
  });
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

async function fetchSinaLofList(): Promise<LofItem[]> {
  const rows = await fetchSinaQuotes(FALLBACK_FUND_SECIDS);

  return rows.flatMap(({ values }) => {
    const code = values[30]?.trim();
    const previousClose = toFiniteNumber(values[2]);
    const currentPrice = toFiniteNumber(values[3]);
    if (!code || currentPrice === undefined || previousClose === undefined) return [];

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
  });
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
  });
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

async function fetchWithFallback<T>(label: string, providers: DataProvider<T>[]) {
  const errors: string[] = [];

  for (const provider of providers) {
    try {
      const items = await provider.fetch();
      if (items.length) {
        if (errors.length) {
          console.warn(`[indexScheduler] ${label} recovered by ${provider.name}`);
        }
        return items;
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
  if (!realtimeNav && publishedNav) {
    return {
      nav: publishedNav.nav,
      estimatedNav: publishedNav.nav,
      navDate: publishedNav.navDate,
    };
  }
  if (realtimeNav && !publishedNav) return realtimeNav;

  const realtimeDate = realtimeNav ? parseDateTime(realtimeNav.navDate) : 0;
  const publishedDate = publishedNav ? parseDateTime(publishedNav.navDate) : 0;

  if (publishedNav && publishedDate >= realtimeDate) {
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

function parseDateTime(value: string) {
  const time = new Date(value).getTime();
  return Number.isFinite(time) ? time : 0;
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

async function fetchAndUpdateIndices() {
  try {
    const items = await fetchIndexItemsWithFallback();
    if (!items.length) return;
    schedulerState.consecutiveFailures = 0;

    const em = await forkEntityManager();
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
      if (index) {
        index.name = item.f14;
        index.market = market ?? index.market;
        if (currentPrice !== undefined) index.currentPrice = currentPrice;
        if (changePercent !== undefined) index.changePercent = changePercent;
        if (changeAmount !== undefined) index.changeAmount = changeAmount;
        if (previousClose !== undefined) index.previousClose = previousClose;
      } else {
        index = new MarketIndex({
          code: item.f12,
          market: market ?? 0,
          name: item.f14,
          currentPrice,
          changePercent,
          changeAmount,
          previousClose,
        });
        em.persist(index);
        indexByCode.set(index.code, index);
      }
    }
    await em.flush();
  } catch (e) {
    logFetchError("index", e);
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
        index = new MarketIndex({
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
        em.persist(index);
        indexByCode.set(index.code, index);
      } else {
        index.name = item.name;
        index.market = 9;
        index.instrumentType = "FUTURE";
        index.source = "SINA_GLOBAL_FUTURES";
        index.currentPrice = item.currentPrice;
        index.changePercent = item.changePercent;
        index.changeAmount = item.changeAmount;
        index.previousClose = item.previousClose;
      }
    }

    await em.flush();
  } catch (e) {
    logFetchError("commodity", e);
  }
}

async function fetchAndUpdateFunds() {
  try {
    const lofItems = await fetchLofListWithFallback();
    if (!lofItems.length) return;
    schedulerState.consecutiveFailures = 0;

    const em = await forkEntityManager();
    const marketIndices = await em.find(MarketIndex, {});
    const lofCodes = lofItems.map((item) => item.f12);
    const existingFunds = await em.find(Fund, {});
    const fundByCode = new Map(existingFunds.map((fund) => [fund.code, fund]));
    const navCodes = [...new Set([...lofCodes, ...existingFunds.map((fund) => fund.code)])];
    const navMap = shouldFetchNavNow() ? await fetchNavBatch(navCodes) : new Map<string, NavData>();
    const touchedCodes = new Set<string>();

    for (const fund of fundByCode.values()) {
      fund.fundType = classifyFund(fund);
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
        if (currentPrice !== undefined) fund.currentPrice = currentPrice;
        if (dailyChangePercent !== undefined) fund.dailyChangePercent = dailyChangePercent;
        if (dailyVolume !== undefined) fund.dailyVolume = dailyVolume;
        if (turnoverRate !== undefined) fund.turnoverRate = turnoverRate;
        if (exchangeShares !== undefined) fund.exchangeShares = exchangeShares;
      } else {
        fund = new Fund({
          code: item.f12,
          name: item.f14,
          currentPrice,
          dailyChangePercent,
          exchangeShares,
        });
        fund.dailyVolume = dailyVolume;
        fund.turnoverRate = turnoverRate;
        em.persist(fund);
        fundByCode.set(fund.code, fund);
      }
      touchedCodes.add(fund.code);

      const navData = navMap.get(item.f12);
      if (navData) {
        applyNavData(fund, navData);
        if (currentPrice !== undefined && Number.isFinite(navData.estimatedNav) && navData.estimatedNav > 0) {
          fund.estimatedPremiumRate = Math.round(
            ((currentPrice - navData.estimatedNav) / navData.estimatedNav) * 10000,
          ) / 100;
        }
      }

      const indexRelation = resolveFundIndexRelation(fund, marketIndices);
      fund.category = indexRelation.name ?? fund.category;
      fund.indexChangePercent = indexRelation.changePercent ?? fund.indexChangePercent;
      fund.fundType = classifyFund(fund);
    }

    for (const fund of fundByCode.values()) {
      if (touchedCodes.has(fund.code)) continue;
      const navData = navMap.get(fund.code);
      if (!navData) continue;
      applyNavData(fund, navData);

      if (fund.currentPrice !== undefined && navData.estimatedNav > 0) {
        fund.estimatedPremiumRate = Math.round(
          ((fund.currentPrice - navData.estimatedNav) / navData.estimatedNav) * 10000,
        ) / 100;
      }
      fund.fundType = classifyFund(fund);
    }

    await updateHoldingsAndStockQuotes(em, [...fundByCode.values()]);
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

function calculateExchangeShares(volume: number | undefined, turnoverRate: number | undefined) {
  if (volume === undefined || turnoverRate === undefined || turnoverRate <= 0) return undefined;
  return Math.round((volume / (turnoverRate / 100)) * 100) / 100;
}

function classifyFund(fund: Fund) {
  const text = `${fund.name}${fund.category ?? ""}`.toLowerCase();
  if (/qdii|纳斯达克|标普|海外|德国|印度|日本|越南|全球|油气|美元|抗通胀|商品/i.test(text)) return "QDII";
  if (/恒生|港股|香港|中概|h股|h股|红利低波港股/i.test(text)) return "港股指数基金";
  if (/指数|300|500|1000|创业板|科创|中证|国证|深证|上证|沪深|行业/i.test(text)) return "A股指数基金";
  return "A股股票基金";
}

function shouldRefreshHoldings(fund: Fund) {
  if (fund.fundType === "A股股票基金" || fund.fundType === "QDII") return true;
  return !resolveFundIndexRelation(fund, []).code;
}

async function updateHoldingsAndStockQuotes(em: Awaited<ReturnType<typeof forkEntityManager>>, funds: Fund[]) {
  const fundsWithoutIndex = funds.filter((fund) => !fund.category || !fund.indexChangePercent);
  const holdingsMap = await fetchHoldingsBatch(fundsWithoutIndex);
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
        stock = new MarketIndex({
          code: holding.code,
          market: holding.market ?? 0,
          name: quote?.name ?? holding.name,
          instrumentType: "STOCK",
          source: "TENCENT",
          currentPrice: quote?.currentPrice,
          changePercent: quote?.changePercent,
        });
        em.persist(stock);
        stockByCode.set(stock.code, stock);
      } else {
        stock.name = quote?.name ?? holding.name;
        stock.instrumentType = "STOCK";
        stock.source = "TENCENT";
        if (quote?.currentPrice !== undefined) stock.currentPrice = quote.currentPrice;
        if (quote?.changePercent !== undefined) stock.changePercent = quote.changePercent;
      }
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
        changePercent: item.changePercent,
      },
    ]),
  );

  for (const fund of funds) {
    const model = getFundValuationModel(fund);
    const result = await model(fund, {
      now,
      holdings: parseFundHoldings(fund),
      marketQuotes,
    });

    if (result.estimatedNav !== undefined) {
      fund.estimatedNav = result.estimatedNav;
    }

    if (fund.currentPrice !== undefined && fund.estimatedNav !== undefined && fund.estimatedNav > 0) {
      fund.estimatedPremiumRate = Math.round(
        ((fund.currentPrice - fund.estimatedNav) / fund.estimatedNav) * 10000,
      ) / 100;
    }
  }
}

function applyNavData(fund: Fund, navData: NavData) {
  fund.nav = navData.nav;
  fund.estimatedNav = navData.estimatedNav;
  const navDate = new Date(navData.navDate);
  if (Number.isFinite(navDate.getTime())) fund.navDate = navDate;
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

async function snapshotFundDaily() {
  try {
    const em = await forkEntityManager();
    const funds = await em.find(Fund, {});
    const marketIndices = await em.find(MarketIndex, {});
    await estimateFunds(funds, marketIndices);

    const today = startOfDay(new Date());
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

      if (!daily) {
        daily = new FundDaily({
          fund,
          date: today,
          closePrice: fund.currentPrice,
          estimatedNav: fund.estimatedNav,
          exchangeShares: fund.exchangeShares,
          exchangeSharesChange,
          closePremiumRate: fund.estimatedPremiumRate,
        });
        em.persist(daily);
      } else {
        daily.closePrice = fund.currentPrice;
        daily.estimatedNav = fund.estimatedNav;
        daily.exchangeShares = fund.exchangeShares;
        daily.exchangeSharesChange = exchangeSharesChange;
        daily.closePremiumRate = fund.estimatedPremiumRate;
      }
    }

    await em.flush();
    console.log(`[indexScheduler] daily snapshot saved: ${funds.length} funds`);
  } catch (e) {
    logFetchError("daily snapshot", e);
  }
}

function startOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

export function startIndexScheduler() {
  if (schedulerState.started) return;
  schedulerState.started = true;

  cron.schedule(FUND_SYNC_CRON, fetchAll);
  cron.schedule(FUND_DAILY_SNAPSHOT_CRON, snapshotFundDaily);
  console.log(`[indexScheduler] started, cron: ${FUND_SYNC_CRON}, daily snapshot: ${FUND_DAILY_SNAPSHOT_CRON}`);
}
