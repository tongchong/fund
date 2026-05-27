/* eslint-disable @stylistic/max-len */
import { Fund } from "src/server/db/entities/fund";

export interface HoldingItem {
  code: string;
  name: string;
  weight: number;
  market?: number;
  changePercent?: number;
}

export interface MarketQuoteItem {
  code: string;
  name: string;
  currentPrice?: number;
  changePercent?: number;
  previousClose?: number;
  updateTime?: Date | string;
}

export interface FundValuationContext {
  now: Date;
  holdings: HoldingItem[];
  marketQuotes: Map<string, MarketQuoteItem>;
}

export interface FundValuationResult {
  estimatedNav?: number;
  estimatedChangePercent?: number;
  modelName: string;
}

export type FundValuationModel = (
  fund: Fund,
  context: FundValuationContext,
) => FundValuationResult | Promise<FundValuationResult>;

interface YahooDailyClose {
  date: string;
  close: number;
}

interface YahooCloseReturn {
  symbol: string;
  baseDate: string;
  baseClose: number;
  targetDate: string;
  targetClose: number;
  return: number;
  source: "yahoo";
}

interface YahooFutureReturn {
  symbol: string;
  previousClose: number;
  lastPrice: number;
  return: number;
  lastTime: string | null;
  source: "yahoo";
}

interface Adjusted161815Holding {
  symbol: string;
  name: string;
  weight: number;
  overlayFuture: string | null;
  fallbackStage1Return: number;
}

interface Inferred161815Weights {
  goldEtfs: number;
  oilEtcs: number;
  COMT: number;
  BCD: number;
  SLV: number;
  cashOther: number;
}

interface Adjusted161815Config {
  fundCode: string;
  inferredWeights: Inferred161815Weights;
  includeComtBcdLookthrough: boolean;
  fxExposure: number;
  holdings: Adjusted161815Holding[];
  lookthrough: Record<string, Record<string, number>>;
  effectiveFutureOverlay?: Record<string, number>;
  manualFutureReturns: Record<string, number>;
}

interface Dynamic161815Base {
  baseDate: string;
  baseNav: number;
}

export const currentFundCodes = [
  "160105", "160106", "160119", "160125", "160127", "160128", "160133", "160135", "160140", "160142", "160143", "160211",
  "160212", "160215", "160216", "160218", "160219", "160220", "160221", "160222", "160223", "160225", "160311", "160314",
  "160322", "160323", "160324", "160325", "160416", "160421", "160505", "160512", "160513", "160515", "160518", "160526",
  "160527", "160529", "160607", "160610", "160611", "160613", "160615", "160616", "160617", "160618", "160620", "160621",
  "160622", "160625", "160626", "160628", "160629", "160630", "160631", "160632", "160633", "160635", "160637", "160638",
  "160639", "160641", "160642", "160643", "160644", "160706", "160716", "160717", "160719", "160722", "160723", "160726",
  "160805", "160806", "160807", "160812", "160813", "160910", "160916", "160918", "160919", "160921", "160924", "160925",
  "160926", "161005", "161010", "161014", "161015", "161017", "161019", "161024", "161025", "161026", "161027", "161028",
  "161029", "161030", "161031", "161032", "161033", "161035", "161036", "161037", "161038", "161039", "161040", "161115",
  "161116", "161117", "161118", "161119", "161121", "161122", "161123", "161124", "161125", "161126", "161127", "161128",
  "161129", "161130", "161131", "161132", "161216", "161217", "161219", "161222", "161224", "161225", "161226", "161227",
  "161229", "161232", "161233", "161505", "161607", "161610", "161614", "161626", "161631", "161706", "161713", "161715",
  "161716", "161720", "161722", "161724", "161725", "161726", "161727", "161728", "161729", "161810", "161811", "161812",
  "161815", "161816", "161820", "161831", "161834", "161837", "161903", "161908", "161912", "161914", "162006", "162105",
  "162108", "162207", "162215", "162216", "162307", "162411", "162412", "162414", "162415", "162509", "162605", "162607",
  "162703", "162711", "162712", "162715", "162719", "162720", "163001", "163003", "163005", "163109", "163110", "163111",
  "163113", "163114", "163115", "163116", "163118", "163208", "163302", "163402", "163406", "163407", "163409", "163412",
  "163415", "163417", "163418", "163503", "163801", "163819", "163821", "163907", "164105", "164206", "164208", "164210",
  "164403", "164508", "164509", "164606", "164701", "164703", "164705", "164808", "164810", "164814", "164824", "164902",
  "164906", "165309", "165311", "165313", "165508", "165509", "165511", "165512", "165513", "165515", "165516", "165517",
  "165519", "165520", "165521", "165522", "165525", "165528", "166001", "166006", "166008", "166009", "166011", "166016",
  "166023", "166024", "166025", "166027", "166105", "166107", "166401", "167001", "167002", "167003", "167301", "167302",
  "167501", "167506", "167508", "168101", "168102", "168103", "168104", "168105", "168203", "168204", "168301", "168401",
  "168701", "169101", "169104", "169105", "169106", "169201", "501001", "501005", "501007", "501008", "501009", "501010",
  "501011", "501012", "501015", "501016", "501017", "501018", "501019", "501021", "501022", "501023", "501025", "501026",
  "501028", "501029", "501030", "501031", "501032", "501036", "501037", "501038", "501043", "501045", "501046", "501047",
  "501048", "501050", "501051", "501053", "501057", "501058", "501059", "501060", "501061", "501062", "501064", "501065",
  "501070", "501071", "501073", "501075", "501076", "501077", "501078", "501079", "501080", "501081", "501082", "501083",
  "501085", "501087", "501088", "501089", "501090", "501091", "501092", "501093", "501095", "501096", "501097", "501098",
  "501099", "501186", "501188", "501189", "501200", "501201", "501202", "501203", "501205", "501206", "501207", "501208",
  "501209", "501219", "501225", "501227", "501300", "501301", "501302", "501303", "501305", "501306", "501307", "501310",
  "501311", "501312", "502000", "502003", "502006", "502010", "502013", "502023", "502048", "502053", "502056", "506000",
  "506001", "506002", "506003", "506005", "506006", "506008",
] as const;

export type CurrentFundCode = typeof currentFundCodes[number];

const fundSpecificValuationModels: Record<string, FundValuationModel> = Object.fromEntries(
  currentFundCodes.map((code) => [code, createCodeNamedValuationModel(code)]),
);


const inferredWeights161815V10: Inferred161815Weights = {
  goldEtfs: 0.350,
  oilEtcs: 0.130,
  COMT: 0.170,
  BCD: 0.095,
  SLV: 0.045,
  cashOther: 0.210,
};

const oilEtcSplit161815 = {
  brent: 0.6033333333,
  wti: 0.3966666667,
};

const goldEtfSplit161815 = {
  IAU: 0.3002777778,
  GLD: 0.2747222222,
  AAAU: 0.2163888889,
  SGOL: 0.2086111111,
};

const effectiveFutureOverlay161815V10: Record<string, number> = {
  "GC=F": 0.376463,
  "BZ=F": 0.117357,
  "CL=F": 0.088116,
  "SI=F": 0.049843,
  "HG=F": 0.015350,
  "NG=F": 0.013073,
  "HO=F": 0.019963,
  "RB=F": 0.007597,
  "ZC=F": 0.013250,
  "ZW=F": 0.010423,
  "ZS=F": 0.010423,
  "ZM=F": 0.002827,
  "ZL=F": 0.002827,
  "LE=F": 0.012543,
  "GF=F": 0.004417,
  "HE=F": 0.007243,
  "KC=F": 0.006007,
  "SB=F": 0.005830,
  "CC=F": 0.003710,
  "CT=F": 0.003003,
  "ALI=F": 0.011130,
  NICKEL_PROXY: 0.003710,
  ZINC_PROXY: 0.003710,
  LEAD_PROXY: 0.001943,
};

const futureMarketQuoteAliases161815: Record<string, string[]> = {
  "GC=F": ["HF_GC"],
  "BZ=F": ["HF_OIL"],
  "CL=F": ["HF_CL"],
  "SI=F": ["HF_SI"],
  "HG=F": ["HF_CAD"],
};

const yahooFutureFetchAllowlist161815 = new Set(["GC=F", "BZ=F", "CL=F", "SI=F", "HG=F"]);
const futureQuoteStaleMs161815 = 5 * 60 * 1000;

const adjusted161815Config: Adjusted161815Config = {
  fundCode: "161815",
  inferredWeights: inferredWeights161815V10,
  includeComtBcdLookthrough: true,
  fxExposure: 1 - inferredWeights161815V10.cashOther,
  holdings: [
    // V10 原油ETC：合计 13.0%
    // 按原 BRNT/CRUD 比例分摊
    {
      symbol: "BRNT.L",
      name: "WisdomTree Brent Crude Oil",
      weight: inferredWeights161815V10.oilEtcs * oilEtcSplit161815.brent,
      overlayFuture: "BZ=F",
      fallbackStage1Return: -0.0169,
    },
    {
      symbol: "CRUD.L",
      name: "WisdomTree WTI Crude Oil",
      weight: inferredWeights161815V10.oilEtcs * oilEtcSplit161815.wti,
      overlayFuture: "CL=F",
      fallbackStage1Return: -0.0143,
    },

    // V10 黄金ETF：合计 35.0%
    // 按原 IAU/GLD/AAAU/SGOL 比例分摊
    {
      symbol: "IAU",
      name: "iShares Gold Trust",
      weight: inferredWeights161815V10.goldEtfs * goldEtfSplit161815.IAU,
      overlayFuture: "GC=F",
      fallbackStage1Return: -0.00748,
    },
    {
      symbol: "GLD",
      name: "SPDR Gold Shares",
      weight: inferredWeights161815V10.goldEtfs * goldEtfSplit161815.GLD,
      overlayFuture: "GC=F",
      fallbackStage1Return: -0.00762,
    },
    {
      symbol: "AAAU",
      name: "Goldman Sachs Physical Gold ETF",
      weight: inferredWeights161815V10.goldEtfs * goldEtfSplit161815.AAAU,
      overlayFuture: "GC=F",
      fallbackStage1Return: -0.00735,
    },
    {
      symbol: "SGOL",
      name: "abrdn Physical Gold Shares ETF",
      weight: inferredWeights161815V10.goldEtfs * goldEtfSplit161815.SGOL,
      overlayFuture: "GC=F",
      fallbackStage1Return: -0.00784,
    },

    // V10 综合商品与白银；cashOther 21.0% 不参与盘中商品波动
    {
      symbol: "COMT",
      name: "iShares GSCI Commodity Dynamic Roll Strategy ETF",
      weight: inferredWeights161815V10.COMT,
      overlayFuture: null,
      fallbackStage1Return: -0.00425,
    },
    {
      symbol: "BCD",
      name: "abrdn Bloomberg All Commodity Longer Dated ETF",
      weight: inferredWeights161815V10.BCD,
      overlayFuture: null,
      fallbackStage1Return: -0.00935,
    },
    {
      symbol: "SLV",
      name: "iShares Silver Trust",
      weight: inferredWeights161815V10.SLV,
      overlayFuture: "SI=F",
      fallbackStage1Return: -0.04865,
    },
  ],

  lookthrough: {
    COMT: {
      "CL=F": 0.177892,
      "BZ=F": 0.182246,
      "GC=F": 0.072423,
      "SI=F": 0.006451,
      "HG=F": 0.054743,
    },
    BCD: {
      "CL=F": 0.066398,
      "BZ=F": 0.083602,
      "GC=F": 0.148957,
      "SI=F": 0.039436,
      "HG=F": 0.063620,
    },
  },

  effectiveFutureOverlay: effectiveFutureOverlay161815V10,

  manualFutureReturns: {
    "GC=F": 0,
    "SI=F": 0,
    "BZ=F": 0,
    "CL=F": 0,
    "HG=F": 0,
    "NG=F": 0,
    "HO=F": 0,
    "RB=F": 0,
    "ZC=F": 0,
    "ZW=F": 0,
    "ZS=F": 0,
    "ZM=F": 0,
    "ZL=F": 0,
    "LE=F": 0,
    "GF=F": 0,
    "HE=F": 0,
    "KC=F": 0,
    "SB=F": 0,
    "CC=F": 0,
    "CT=F": 0,
    "ALI=F": 0,
    NICKEL_PROXY: 0,
    ZINC_PROXY: 0,
    LEAD_PROXY: 0,
  },
};

assert161815Config(adjusted161815Config);

setFundValuationModel("161815", (fund, context) => estimate161815Adjusted(fund, context, adjusted161815Config));

async function estimate161815Adjusted(
  fund: Fund,
  context: FundValuationContext,
  config: Adjusted161815Config,
): Promise<FundValuationResult> {
  const base = resolve161815Base(fund);
  if (!base) return { modelName: "161815-adjusted-v10-full-lookthrough" };

  const etfCloseDate = getLatestCompletedEtfCloseDate(context.now);
  const stage1Rows = await Promise.all(
    config.holdings.map(async (holding) => {
      if (base.baseDate >= etfCloseDate) return { contribution: 0 };

      try {
        const item = await fetchCloseReturn(holding.symbol, base.baseDate, etfCloseDate);
        return { contribution: holding.weight * item.return };
      } catch {
        const fallback = getStage1FallbackReturn(holding, base.baseDate, etfCloseDate);
        return { contribution: holding.weight * fallback };
      }
    }),
  );

  const stage1AssetReturn = stage1Rows.reduce((sum, row) => sum + row.contribution, 0);
  const navAfterStage1 = base.baseNav * (1 + stage1AssetReturn);
  const overlayWeights = buildOverlayWeights(config);
  const stage2Rows = await Promise.all(
    overlayWeights.map(async (item) => {
      const itemReturn = await resolveFutureReturn(item.symbol, context, config);
      return { contribution: item.weight * itemReturn };
    }),
  );

  const stage2AssetReturn = stage2Rows.reduce((sum, row) => sum + row.contribution, 0);
  const fxReturn = await resolveUsdCnyIntradayReturn(context);
  const stage2FxReturn = config.fxExposure * fxReturn;
  const navNow = navAfterStage1 * (1 + stage2AssetReturn + stage2FxReturn);

  return {
    estimatedNav: roundNav(navNow),
    estimatedChangePercent: roundPercent((navNow / base.baseNav - 1) * 100),
    modelName: "161815-adjusted-v10-full-lookthrough",
  };
}

async function resolveUsdCnyIntradayReturn(context: FundValuationContext) {
  const quoteReturn = resolveUsdCnyReturnFromMarketQuotes(context);
  if (quoteReturn !== undefined) return quoteReturn;

  try {
    const fx = await fetchCurrentFutureReturn("CNY=X");
    return fx.return;
  } catch {
    return 0;
  }
}

function resolveUsdCnyReturnFromMarketQuotes(context: FundValuationContext) {
  const symbols = ["USDCNY", "CNY=X", "USD/CNY", "FX_USDCNY"];

  for (const symbol of symbols) {
    const quote = context.marketQuotes.get(symbol);
    if (!quote) continue;

    const changePercent = Number(quote.changePercent);
    if (Number.isFinite(changePercent)) return changePercent / 100;

    const currentPrice = Number(quote.currentPrice);
    const previousClose = Number(quote.previousClose);
    if (Number.isFinite(currentPrice) && Number.isFinite(previousClose) && previousClose > 0) {
      return currentPrice / previousClose - 1;
    }
  }

  return undefined;
}

function resolve161815Base(fund: Fund): Dynamic161815Base | undefined {
  if (fund.nav === undefined || fund.nav <= 0 || !fund.navDate) return undefined;

  const navDate = fund.navDate instanceof Date ? fund.navDate : new Date(fund.navDate);
  if (!Number.isFinite(navDate.getTime())) return undefined;

  return {
    baseDate: toUtcDateString(navDate),
    baseNav: fund.nav,
  };
}

function getStage1FallbackReturn(holding: Adjusted161815Holding, baseDate: string, etfCloseDate: string) {
  if (baseDate === "2026-05-13" && etfCloseDate === "2026-05-14") return holding.fallbackStage1Return;
  return 0;
}

function toUnix(dateStr: string) {
  return Math.floor(new Date(`${dateStr}T00:00:00Z`).getTime() / 1000);
}

function addDays(dateStr: string, days: number) {
  const date = new Date(`${dateStr}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

function toUtcDateString(date: Date) {
  return date.toISOString().slice(0, 10);
}

function getLatestCompletedEtfCloseDate(now: Date) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/New_York",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(now);
  const partMap = new Map(parts.map((part) => [part.type, part.value]));
  const date = `${partMap.get("year")}-${partMap.get("month")}-${partMap.get("day")}`;
  const weekday = new Date(`${date}T00:00:00Z`).getUTCDay();
  const minutes = Number(partMap.get("hour")) * 60 + Number(partMap.get("minute"));

  if (weekday !== 0 && weekday !== 6 && minutes >= 16 * 60 + 15) return date;
  return getPreviousWeekday(date);
}

function getPreviousWeekday(dateStr: string) {
  let date = addDays(dateStr, -1);

  while (true) {
    const day = new Date(`${date}T00:00:00Z`).getUTCDay();
    if (day !== 0 && day !== 6) return date;
    date = addDays(date, -1);
  }
}

function isNum(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function yahooChartUrl(symbol: string, params: Record<string, string>) {
  const query = new URLSearchParams(params);
  return `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?${query.toString()}`;
}

async function fetchJson(url: string) {
  const res = await fetch(url, {
    headers: {
      "User-Agent": "Mozilla/5.0 fund-web 161815 valuation",
      Accept: "application/json,text/plain,*/*",
    },
  });

  if (!res.ok) throw new Error(`HTTP ${res.status}: ${url}`);
  return res.json();
}

async function fetchDailyCloseOnOrBefore(symbol: string, targetDate: string): Promise<YahooDailyClose> {
  const period1 = toUnix(addDays(targetDate, -14));
  const period2 = toUnix(addDays(targetDate, 3));
  const url = yahooChartUrl(symbol, {
    period1: String(period1),
    period2: String(period2),
    interval: "1d",
    events: "history",
    includeAdjustedClose: "true",
  });
  const json = await fetchJson(url);
  const result = json?.chart?.result?.[0];

  if (!result) throw new Error(`Yahoo daily result empty for ${symbol}`);

  const timestamps = result.timestamp || [];
  const closes = result.indicators?.quote?.[0]?.close || [];
  const rows = timestamps
    .map((ts: number, index: number) => ({
      date: new Date(ts * 1000).toISOString().slice(0, 10),
      close: closes[index],
    }))
    .filter((row: YahooDailyClose) => row.date <= targetDate && isNum(row.close))
    .sort((a: YahooDailyClose, b: YahooDailyClose) => a.date.localeCompare(b.date));
  const picked = rows.at(-1);

  if (!picked) throw new Error(`No daily close found for ${symbol} on/before ${targetDate}`);
  return picked;
}

async function fetchCloseReturn(
  symbol: string,
  baseDate: string,
  targetDate: string,
): Promise<YahooCloseReturn> {
  const base = await fetchDailyCloseOnOrBefore(symbol, baseDate);
  const target = await fetchDailyCloseOnOrBefore(symbol, targetDate);

  return {
    symbol,
    baseDate: base.date,
    baseClose: base.close,
    targetDate: target.date,
    targetClose: target.close,
    return: target.close / base.close - 1,
    source: "yahoo",
  };
}

async function fetchCurrentFutureReturn(symbol: string): Promise<YahooFutureReturn> {
  const url = yahooChartUrl(symbol, {
    range: "1d",
    interval: "1m",
    includePrePost: "true",
  });
  const json = await fetchJson(url);
  const result = json?.chart?.result?.[0];

  if (!result) throw new Error(`Yahoo intraday result empty for ${symbol}`);

  const meta = result.meta || {};
  const closes = result.indicators?.quote?.[0]?.close || [];
  const timestamps = result.timestamp || [];
  let last = meta.regularMarketPrice;

  for (let index = closes.length - 1; index >= 0; index--) {
    if (isNum(closes[index])) {
      last = closes[index];
      break;
    }
  }

  const previousClose = meta.previousClose ?? meta.chartPreviousClose ?? meta.regularMarketPreviousClose;

  if (!isNum(last) || !isNum(previousClose)) {
    throw new Error(`Cannot calculate intraday return for ${symbol}`);
  }

  return {
    symbol,
    previousClose,
    lastPrice: last,
    return: last / previousClose - 1,
    lastTime: timestamps.length ? new Date(timestamps.at(-1) * 1000).toISOString() : null,
    source: "yahoo",
  };
}


function buildOverlayWeights(config: Adjusted161815Config) {
  if (config.effectiveFutureOverlay) {
    return Object.entries(config.effectiveFutureOverlay)
      .filter(([, weight]) => Number.isFinite(weight) && Math.abs(weight) > 0)
      .map(([symbol, weight]) => ({ symbol, weight }));
  }

  const map = new Map<string, number>();
  const add = (symbol: string | null, weight: number) => {
    if (!symbol || !weight) return;
    map.set(symbol, (map.get(symbol) || 0) + weight);
  };

  const weights = config.inferredWeights;
  add("GC=F", weights.goldEtfs);
  add("BZ=F", weights.oilEtcs * oilEtcSplit161815.brent);
  add("CL=F", weights.oilEtcs * oilEtcSplit161815.wti);
  add("SI=F", weights.SLV);

  if (config.includeComtBcdLookthrough) {
    addLookthroughOverlay(map, config.lookthrough.COMT, weights.COMT);
    addLookthroughOverlay(map, config.lookthrough.BCD, weights.BCD);
  }

  return [...map.entries()].map(([symbol, weight]) => ({ symbol, weight }));
}

function addLookthroughOverlay(map: Map<string, number>, lookthrough: Record<string, number> | undefined, weight: number) {
  if (!lookthrough) return;

  for (const [future, componentWeight] of Object.entries(lookthrough)) {
    map.set(future, (map.get(future) || 0) + weight * componentWeight);
  }
}

async function resolveFutureReturn(
  symbol: string,
  context: FundValuationContext,
  config: Adjusted161815Config,
): Promise<number> {
  const directReturn = resolveFutureReturnFromMarketQuotes(symbol, context);
  if (directReturn !== undefined) return directReturn;

  const proxySymbol = getProxyFutureSymbol(symbol);
  const proxyReturn = proxySymbol !== symbol ? resolveFutureReturnFromMarketQuotes(proxySymbol, context) : undefined;
  if (proxyReturn !== undefined) return proxyReturn;

  if (!yahooFutureFetchAllowlist161815.has(proxySymbol)) {
    return config.manualFutureReturns[symbol] ?? config.manualFutureReturns[proxySymbol] ?? 0;
  }

  try {
    const future = await fetchCurrentFutureReturn(proxySymbol);
    return future.return;
  } catch {
    return config.manualFutureReturns[symbol] ?? config.manualFutureReturns[proxySymbol] ?? 0;
  }
}

function resolveFutureReturnFromMarketQuotes(symbol: string, context: FundValuationContext) {
  const symbols = [symbol, ...(futureMarketQuoteAliases161815[symbol] ?? [])];

  for (const quoteSymbol of symbols) {
    const quote = context.marketQuotes.get(quoteSymbol);
    if (!quote || isStaleFutureQuote(quote, context.now)) continue;

    const changePercent = Number(quote.changePercent);
    if (Number.isFinite(changePercent)) {
      return changePercent / 100;
    }
  }

  return undefined;
}

function isStaleFutureQuote(quote: MarketQuoteItem, now: Date) {
  if (!quote.code.startsWith("HF_")) return false;
  if (!quote.updateTime) return false;

  const updateTime = quote.updateTime instanceof Date ? quote.updateTime : new Date(quote.updateTime);
  if (!Number.isFinite(updateTime.getTime())) return false;

  return now.getTime() - updateTime.getTime() > futureQuoteStaleMs161815;
}

function getProxyFutureSymbol(symbol: string) {
  if (symbol === "NICKEL_PROXY") return "HG=F";
  if (symbol === "ZINC_PROXY") return "HG=F";
  if (symbol === "LEAD_PROXY") return "HG=F";
  return symbol;
}

function assert161815Config(config: Adjusted161815Config) {
  const holdingsWeight = config.holdings.reduce((sum, holding) => sum + holding.weight, 0);
  const expectedHoldingsWeight = 1 - config.inferredWeights.cashOther;

  if (Math.abs(holdingsWeight - expectedHoldingsWeight) > 0.002) {
    console.warn("[161815] holdings weight mismatch", {
      holdingsWeight,
      expectedHoldingsWeight,
      cashOther: config.inferredWeights.cashOther,
    });
  }

  if (config.effectiveFutureOverlay) {
    const overlayWeight = Object.values(config.effectiveFutureOverlay).reduce((sum, weight) => sum + weight, 0);
    const expectedOverlayWeight = 1 - config.inferredWeights.cashOther;

    if (Math.abs(overlayWeight - expectedOverlayWeight) > 0.01) {
      console.warn("[161815] effective futures overlay mismatch", {
        overlayWeight,
        expectedOverlayWeight,
        cashOther: config.inferredWeights.cashOther,
      });
    }
  }
}

function roundNav(value: number) {
  return Math.round(value * 10000) / 10000;
}

function roundPercent(value: number) {
  return Math.round(value * 10000) / 10000;
}

export function getFundValuationModel(fund: Fund) {
  return fundSpecificValuationModels[fund.code] ?? getDefaultValuationModel(fund);
}

export function setFundValuationModel(code: string, model: FundValuationModel) {
  fundSpecificValuationModels[code] = createNamedValuationModel(code, model);
}

function createCodeNamedValuationModel(code: CurrentFundCode) {
  return createNamedValuationModel(code, (fund, context) => getDefaultValuationModel(fund)(fund, context));
}

function createNamedValuationModel(code: string, model: FundValuationModel) {
  Object.defineProperty(model, "name", {
    configurable: true,
    value: code,
  });
  return model;
}

export function parseFundHoldings(fund: Fund) {
  if (!fund.holdingsJson) return [];
  try {
    const holdings = JSON.parse(fund.holdingsJson) as HoldingItem[];
    return holdings.filter((holding) => Number.isFinite(holding.weight));
  } catch {
    return [];
  }
}

function getDefaultValuationModel(fund: Fund): FundValuationModel {
  if (fund.fundType === "A股股票基金") return stockHoldingWeightedModel;
  if (fund.fundType === "QDII" || fund.fundType === "港股股票基金") return qdiiHoldingWeightedModel;
  if (fund.fundType === "A股指数基金" || fund.fundType === "港股指数基金") return indexTrackingModel;
  return hybridFallbackModel;
}

function indexTrackingModel(fund: Fund, context: FundValuationContext): FundValuationResult {
  if (hasTodayNav(fund, context.now)) {
    return {
      estimatedNav: fund.nav,
      estimatedChangePercent: 0,
      modelName: "index-today-nav",
    };
  }

  const holdingChange = fund.fundType === "港股指数基金" ? calculateHoldingChange(context.holdings) : undefined;
  return estimateByChange(fund, fund.indexChangePercent ?? holdingChange, "index-change");
}

function stockHoldingWeightedModel(fund: Fund, context: FundValuationContext): FundValuationResult {
  return estimateByChange(
    fund,
    calculateHoldingChange(context.holdings) ?? fund.indexChangePercent,
    "stock-holding-weighted",
  );
}

function qdiiHoldingWeightedModel(fund: Fund, context: FundValuationContext): FundValuationResult {
  return estimateByChange(
    fund,
    calculateHoldingChange(context.holdings) ?? fund.indexChangePercent,
    "qdii-holding-weighted",
  );
}

function hybridFallbackModel(fund: Fund, context: FundValuationContext): FundValuationResult {
  const holdingChange = calculateHoldingChange(context.holdings);
  return estimateByChange(fund, holdingChange ?? fund.indexChangePercent, "hybrid-fallback");
}

function estimateByChange(
  fund: Fund,
  changePercent: number | undefined,
  modelName: string,
): FundValuationResult {
  if (fund.nav === undefined || fund.nav <= 0 || changePercent === undefined) {
    return { modelName };
  }

  return {
    estimatedNav: Math.round(fund.nav * (1 + changePercent / 100) * 10000) / 10000,
    estimatedChangePercent: changePercent,
    modelName,
  };
}

function calculateHoldingChange(holdings: HoldingItem[]) {
  let weightedChange = 0;
  let totalWeight = 0;

  holdings.forEach((holding) => {
    if (holding.changePercent === undefined || !Number.isFinite(holding.changePercent)) return;
    weightedChange += holding.changePercent * holding.weight;
    totalWeight += holding.weight;
  });

  return totalWeight > 0 ? weightedChange / totalWeight : undefined;
}


function hasTodayNav(fund: Fund, now: Date) {
  if (!fund.navDate) return false;
  const navDate = fund.navDate instanceof Date ? fund.navDate : new Date(fund.navDate);
  if (!Number.isFinite(navDate.getTime())) return false;

  return navDate.getFullYear() === now.getFullYear()
    && navDate.getMonth() === now.getMonth()
    && navDate.getDate() === now.getDate();
}
