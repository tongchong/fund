/* eslint-disable @stylistic/max-len */
import { TextDecoder } from "node:util";

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
  valuationDetails?: FundValuationDetails;
}

export type FundValuationModel = (
  fund: Fund,
  context: FundValuationContext,
) => FundValuationResult | Promise<FundValuationResult>;

type DailyCloseSource = "yahoo" | "nasdaq" | "lse";

interface DailyClose {
  date: string;
  close: number;
  source: DailyCloseSource;
}

interface CloseReturn {
  symbol: string;
  baseDate: string;
  baseClose: number;
  targetDate: string;
  targetClose: number;
  return: number;
  source: DailyCloseSource;
  baseSource: DailyCloseSource;
  targetSource: DailyCloseSource;
}

interface YahooFutureReturn {
  symbol: string;
  previousClose: number;
  regularMarketPrice?: number;
  lastPrice: number;
  return: number;
  lastTime: string | null;
  source: "yahoo" | "tencent";
}

export interface FundValuationDetails {
  modelName: string;
  baseDate?: string;
  totalWeight?: number;
  cashWeight?: number;
  estimatedChangePercent?: number;
  components: FundValuationDetailComponent[];
}

export interface FundValuationDetailComponent {
  symbol: string;
  name: string;
  weight: number;
  source: string;
  baseDate?: string;
  baseClose?: number;
  previousClose?: number;
  regularMarketPrice?: number;
  lastPrice?: number;
  lastTime?: string | null;
  totalChangePercent?: number;
  regularChangePercent?: number;
  extendedHoursChangePercent?: number;
  contributionPercent?: number;
  error?: string;
}

interface Adjusted161815Holding {
  symbol: string;
  name: string;
  weight: number;
  stage1ReturnSymbol?: string;
  overlayFuture: string | null;
  overlayMultiplier?: number;
  fallbackStage1Return: number;
}

interface Inferred161815Weights {
  cashOther: number;
  [key: string]: number;
}

interface Adjusted161815Config {
  fundCode: string;
  modelName: string;
  inferredWeights: Inferred161815Weights;
  includeComtBcdLookthrough: boolean;
  fxExposure: number;
  holdings: Adjusted161815Holding[];
  lookthrough: Record<string, Record<string, number>>;
  effectiveFutureOverlay?: Record<string, number>;
  manualFutureReturns: Record<string, number>;
}

interface FundNavBase {
  baseDate: string;
  baseNav: number;
}

interface BenchmarkComponentConfig {
  weight: number;
  codes: string[];
  names: string[];
  fallbackChangePercent?: (fund: Fund) => number | undefined;
}

interface EquityBasketComponentConfig {
  symbol: string;
  name: string;
  weight: number;
  quoteCodes?: string[];
  fallbackChangePercent?: (fund: Fund, context: FundValuationContext) => number | undefined;
}

interface EquityBasketConfig {
  fundCode: string;
  modelName: string;
  cashWeight: number;
  fxExposure?: number;
  components: EquityBasketComponentConfig[];
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


const inferredWeights161815V11: Inferred161815Weights = {
  goldEtfs: 0.322,
  oilEtcs: 0.186,
  COMT: 0.196,
  BCD: 0.094,
  SLV: 0.020,
  cashOther: 0.182,
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

const effectiveFutureOverlay161815V11: Record<string, number> = {
  "GC=F": 0.349451,
  "BZ=F": 0.155467,
  "CL=F": 0.114643,
  "SI=F": 0.024918,
  "HG=F": 0.016674,
  "NG=F": 0.014277,
  "HO=F": 0.021800,
  "RB=F": 0.008295,
  "ZC=F": 0.014469,
  "ZW=F": 0.011383,
  "ZS=F": 0.011383,
  "ZM=F": 0.003086,
  "ZL=F": 0.003086,
  "LE=F": 0.013698,
  "GF=F": 0.004823,
  "HE=F": 0.007910,
  "KC=F": 0.006559,
  "SB=F": 0.006366,
  "CC=F": 0.004051,
  "CT=F": 0.003280,
  "ALI=F": 0.012154,
  NICKEL_PROXY: 0.004051,
  ZINC_PROXY: 0.004051,
  LEAD_PROXY: 0.002122,
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
  modelName: "161815-adjusted-v11-full-lookthrough",
  inferredWeights: inferredWeights161815V11,
  includeComtBcdLookthrough: true,
  fxExposure: 1 - inferredWeights161815V11.cashOther,
  holdings: [
    // V11 原油ETC：合计 18.6%
    // 按原 BRNT/CRUD 比例分摊
    {
      symbol: "BRNT.L",
      name: "WisdomTree Brent Crude Oil",
      weight: inferredWeights161815V11.oilEtcs * oilEtcSplit161815.brent,
      stage1ReturnSymbol: "BZ=F",
      overlayFuture: "BZ=F",
      fallbackStage1Return: -0.0169,
    },
    {
      symbol: "CRUD.L",
      name: "WisdomTree WTI Crude Oil",
      weight: inferredWeights161815V11.oilEtcs * oilEtcSplit161815.wti,
      stage1ReturnSymbol: "CL=F",
      overlayFuture: "CL=F",
      fallbackStage1Return: -0.0143,
    },

    // V11 黄金ETF：合计 32.2%
    // 按原 IAU/GLD/AAAU/SGOL 比例分摊
    {
      symbol: "IAU",
      name: "iShares Gold Trust",
      weight: inferredWeights161815V11.goldEtfs * goldEtfSplit161815.IAU,
      overlayFuture: "GC=F",
      fallbackStage1Return: -0.00748,
    },
    {
      symbol: "GLD",
      name: "SPDR Gold Shares",
      weight: inferredWeights161815V11.goldEtfs * goldEtfSplit161815.GLD,
      overlayFuture: "GC=F",
      fallbackStage1Return: -0.00762,
    },
    {
      symbol: "AAAU",
      name: "Goldman Sachs Physical Gold ETF",
      weight: inferredWeights161815V11.goldEtfs * goldEtfSplit161815.AAAU,
      overlayFuture: "GC=F",
      fallbackStage1Return: -0.00735,
    },
    {
      symbol: "SGOL",
      name: "abrdn Physical Gold Shares ETF",
      weight: inferredWeights161815V11.goldEtfs * goldEtfSplit161815.SGOL,
      overlayFuture: "GC=F",
      fallbackStage1Return: -0.00784,
    },

    // V11 综合商品与白银；cashOther 18.2% 不参与盘中商品波动
    {
      symbol: "COMT",
      name: "iShares GSCI Commodity Dynamic Roll Strategy ETF",
      weight: inferredWeights161815V11.COMT,
      overlayFuture: null,
      fallbackStage1Return: -0.00425,
    },
    {
      symbol: "BCD",
      name: "abrdn Bloomberg All Commodity Longer Dated ETF",
      weight: inferredWeights161815V11.BCD,
      overlayFuture: null,
      fallbackStage1Return: -0.00935,
    },
    {
      symbol: "SLV",
      name: "iShares Silver Trust",
      weight: inferredWeights161815V11.SLV,
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

  effectiveFutureOverlay: effectiveFutureOverlay161815V11,

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

const adjusted165513Config: Adjusted161815Config = {
  fundCode: "165513",
  modelName: "165513-adjusted-gold-heavy-v1",
  inferredWeights: {
    goldEtfs: 0.8039,
    cashOther: 0.1961,
  },
  includeComtBcdLookthrough: false,
  fxExposure: 0.8039,
  holdings: [
    {
      symbol: "SGLD.L",
      name: "Invesco Physical Gold ETC",
      weight: 0.1625,
      overlayFuture: "GC=F",
      fallbackStage1Return: 0,
    },
    {
      symbol: "GLDM",
      name: "SPDR Gold MiniShares",
      weight: 0.1540,
      overlayFuture: "GC=F",
      fallbackStage1Return: 0,
    },
    {
      symbol: "SGOL",
      name: "abrdn Physical Gold Shares ETF",
      weight: 0.1477,
      overlayFuture: "GC=F",
      fallbackStage1Return: 0,
    },
    {
      symbol: "IAU",
      name: "iShares Gold Trust",
      weight: 0.1477,
      overlayFuture: "GC=F",
      fallbackStage1Return: 0,
    },
    {
      symbol: "GLD",
      name: "SPDR Gold Shares",
      weight: 0.1302,
      overlayFuture: "GC=F",
      fallbackStage1Return: 0,
    },
    {
      symbol: "DGP",
      name: "DB Gold Double Long ETN",
      weight: 0.0618,
      overlayFuture: "GC=F",
      overlayMultiplier: 2,
      fallbackStage1Return: 0,
    },
  ],
  lookthrough: {},
  manualFutureReturns: adjusted161815Config.manualFutureReturns,
};

const adjusted161116Config: Adjusted161815Config = {
  fundCode: "161116",
  modelName: "161116-adjusted-gold-fof-v1",
  inferredWeights: {
    goldEtfs: 0.9246,
    cashOther: 0.0754,
  },
  includeComtBcdLookthrough: false,
  fxExposure: 0.9246,
  holdings: [
    {
      symbol: "GLDM",
      name: "SPDR Gold MiniShares",
      weight: 0.1954,
      overlayFuture: "GC=F",
      fallbackStage1Return: 0,
    },
    {
      symbol: "GLD",
      name: "SPDR Gold Shares",
      weight: 0.1953,
      overlayFuture: "GC=F",
      fallbackStage1Return: 0,
    },
    {
      symbol: "IAU",
      name: "iShares Gold Trust",
      weight: 0.1951,
      overlayFuture: "GC=F",
      fallbackStage1Return: 0,
    },
    {
      symbol: "SGOL",
      name: "abrdn Physical Gold Shares ETF",
      weight: 0.1833,
      overlayFuture: "GC=F",
      fallbackStage1Return: 0,
    },
    {
      symbol: "AUUSI.SW",
      name: "UBS ETF CH-Gold",
      weight: 0.1555,
      overlayFuture: "GC=F",
      fallbackStage1Return: 0,
    },
  ],
  lookthrough: {},
  manualFutureReturns: adjusted161815Config.manualFutureReturns,
};

const adjusted160216Config: Adjusted161815Config = {
  fundCode: "160216",
  modelName: "160216-adjusted-commodity-holdings-v1",
  inferredWeights: {
    goldEtfs: 0.4637,
    oilEtfs: 0.1455,
    silverEtfs: 0.1157,
    copperEtfs: 0.1095,
    bondEtfs: 0.0547,
    cashOther: 0.1109,
  },
  includeComtBcdLookthrough: false,
  fxExposure: 0.8891,
  holdings: [
    {
      symbol: "SGOL",
      name: "abrdn Physical Gold Shares ETF",
      weight: 0.1788,
      overlayFuture: "GC=F",
      fallbackStage1Return: 0,
    },
    {
      symbol: "GLD",
      name: "SPDR Gold Shares",
      weight: 0.1474,
      overlayFuture: "GC=F",
      fallbackStage1Return: 0,
    },
    {
      symbol: "GLDM",
      name: "SPDR Gold MiniShares",
      weight: 0.1181,
      overlayFuture: "GC=F",
      fallbackStage1Return: 0,
    },
    {
      symbol: "USO",
      name: "United States Oil Fund",
      weight: 0.1167,
      overlayFuture: "CL=F",
      fallbackStage1Return: 0,
    },
    {
      symbol: "SLV",
      name: "iShares Silver Trust",
      weight: 0.1157,
      overlayFuture: "SI=F",
      fallbackStage1Return: 0,
    },
    {
      symbol: "CPER",
      name: "United States Copper Index Fund",
      weight: 0.1095,
      overlayFuture: "HG=F",
      fallbackStage1Return: 0,
    },
    {
      symbol: "TMF",
      name: "Direxion Daily 20+ Year Treasury Bull 3X Shares",
      weight: 0.0402,
      overlayFuture: null,
      fallbackStage1Return: 0,
    },
    {
      symbol: "XOP",
      name: "SPDR S&P Oil & Gas Exploration & Production ETF",
      weight: 0.0288,
      overlayFuture: "CL=F",
      fallbackStage1Return: 0,
    },
    {
      symbol: "NUGT",
      name: "Direxion Daily Gold Miners Index Bull 2X Shares",
      weight: 0.0197,
      overlayFuture: "GC=F",
      overlayMultiplier: 2,
      fallbackStage1Return: 0,
    },
    {
      symbol: "IEI",
      name: "iShares 3-7 Year Treasury Bond ETF",
      weight: 0.0145,
      overlayFuture: null,
      fallbackStage1Return: 0,
    },
  ],
  lookthrough: {},
  manualFutureReturns: adjusted161815Config.manualFutureReturns,
};

[
  adjusted161815Config,
  adjusted165513Config,
  adjusted161116Config,
  adjusted160216Config,
].forEach(assert161815Config);

setFundValuationModel("161815", (fund, context) => estimate161815Adjusted(fund, context, adjusted161815Config));
setFundValuationModel("165513", (fund, context) => estimate161815Adjusted(fund, context, adjusted165513Config));
setFundValuationModel("161116", (fund, context) => estimate161815Adjusted(fund, context, adjusted161116Config));
setFundValuationModel("160216", (fund, context) => estimate161815Adjusted(fund, context, adjusted160216Config));
setFundValuationModel("160644", (fund, context) => estimateAdjustedEquityBasket(fund, context, adjusted160644Config));
setFundValuationModel("501227", estimate501227BenchmarkComposite);
setFundValuationModel("501208", estimate501208PartialHoldingsBenchmark);
setFundValuationModel("162411", (fund, context) => estimateAdjustedEquityBasket(fund, context, adjusted162411Config));

const demandDepositAnnualRate = 0.05;
const adjusted160644Config: EquityBasketConfig = {
  fundCode: "160644",
  modelName: "160644-2026q2-holdings",
  cashWeight: 21.82,
  fxExposure: 78.18,
  components: [
    { symbol: "MU", name: "美光科技", weight: 10.64 },
    { symbol: "SNDK", name: "闪迪", weight: 10.54 },
    { symbol: "1888.HK", name: "建滔积层板", weight: 10.40, quoteCodes: ["01888", "01888.HK", "1888.HK"]},
    { symbol: "0992.HK", name: "联想集团", weight: 9.35, quoteCodes: ["00992", "00992.HK", "0992.HK"]},
    { symbol: "0148.HK", name: "建滔集团", weight: 8.92, quoteCodes: ["00148", "00148.HK", "0148.HK"]},
    { symbol: "3690.HK", name: "美团-W", weight: 7.23, quoteCodes: ["03690", "03690.HK", "3690.HK"]},
    { symbol: "9988.HK", name: "阿里巴巴-W", weight: 6.87, quoteCodes: ["09988", "09988.HK", "9988.HK"]},
    { symbol: "NVDA", name: "英伟达", weight: 5.69 },
    { symbol: "TSM", name: "台积电", weight: 5.01 },
    { symbol: "AMD", name: "超威半导体", weight: 3.53 },
  ],
};
const adjusted162411Config: EquityBasketConfig = {
  fundCode: "162411",
  modelName: "162411-2026q2-holdings",
  cashWeight: 6.97,
  fxExposure: 93.03,
  components: [
    { symbol: "TPL", name: "Texas Pacific Land", weight: 3.01 },
    { symbol: "PBF", name: "PBF Energy", weight: 2.76 },
    { symbol: "DK", name: "Delek US Holdings", weight: 2.66 },
    { symbol: "EXE", name: "Expand Energy", weight: 2.65 },
    { symbol: "CNX", name: "CNX Resources", weight: 2.63 },
    { symbol: "EQT", name: "EQT", weight: 2.61 },
    { symbol: "VLO", name: "Valero Energy", weight: 2.60 },
    { symbol: "AR", name: "Antero Resources", weight: 2.54 },
    { symbol: "DINO", name: "HF Sinclair", weight: 2.54 },
    { symbol: "PARR", name: "Par Pacific Holdings", weight: 2.51 },
    { symbol: "XOP", name: "二季度其余油气上游持仓（XOP代理）", weight: 66.52 },
  ],
};
const benchmark501208RemainderComponents: BenchmarkComponentConfig[] = [
  {
    weight: 0.6,
    codes: ["000906"],
    names: ["中证800"],
    fallbackChangePercent: () => 0,
  },
  {
    weight: 0.2,
    codes: ["HSI"],
    names: ["恒生指数"],
    fallbackChangePercent: () => 0,
  },
  {
    weight: 0.2,
    codes: [],
    names: ["银行活期存款利率"],
    fallbackChangePercent: () => demandDepositAnnualRate / 365,
  },
];

const benchmark501227Components: BenchmarkComponentConfig[] = [
  {
    weight: 0.9,
    codes: ["000922"],
    names: ["中证红利指数", "中证红利"],
    fallbackChangePercent: (fund) => fund.indexChangePercent,
  },
  {
    weight: 0.1,
    codes: ["CB", "CBA00101"],
    names: ["中国债券综合全价指数", "中债综合全价指数", "中债综合指数(总值)全价指数"],
    fallbackChangePercent: () => 0,
  },
];

function estimate501227BenchmarkComposite(fund: Fund, context: FundValuationContext): FundValuationResult {
  if (hasTodayNav(fund, context.now)) {
    return {
      estimatedNav: fund.nav,
      estimatedChangePercent: 0,
      modelName: "501227-benchmark-composite-today-nav",
    };
  }

  const benchmarkChangePercent = benchmark501227Components.reduce((sum, component) => {
    const changePercent = resolveBenchmarkComponentChangePercent(component, fund, context);
    return sum + component.weight * (changePercent ?? 0);
  }, 0);

  return estimateByChange(fund, benchmarkChangePercent, "501227-benchmark-composite");
}

function estimate501208PartialHoldingsBenchmark(fund: Fund, context: FundValuationContext): FundValuationResult {
  if (hasTodayNav(fund, context.now)) {
    return {
      estimatedNav: fund.nav,
      estimatedChangePercent: 0,
      modelName: "501208-partial-holdings-benchmark-today-nav",
    };
  }

  if (fund.nav === undefined || fund.nav <= 0) return { modelName: "501208-partial-holdings-benchmark" };

  let coveredWeight = 0;
  let coveredContribution = 0;
  context.holdings.forEach((holding) => {
    if (holding.changePercent === undefined || !Number.isFinite(holding.changePercent)) return;
    if (!Number.isFinite(holding.weight) || holding.weight <= 0) return;
    coveredWeight += holding.weight;
    coveredContribution += holding.weight * holding.changePercent;
  });

  const boundedCoveredWeight = Math.min(Math.max(coveredWeight, 0), 100);
  const remainderWeight = 100 - boundedCoveredWeight;
  const remainderChangePercent = benchmark501208RemainderComponents.reduce((sum, component) => {
    const changePercent = resolveBenchmarkComponentChangePercent(component, fund, context) ?? 0;
    return sum + component.weight * changePercent;
  }, 0);
  const estimatedChangePercent = (coveredContribution + remainderWeight * remainderChangePercent) / 100;

  return estimateByChange(fund, estimatedChangePercent, "501208-partial-holdings-benchmark");
}

function resolveBenchmarkComponentChangePercent(
  component: BenchmarkComponentConfig,
  fund: Fund,
  context: FundValuationContext,
) {
  for (const code of component.codes) {
    const quote = context.marketQuotes.get(code);
    const changePercent = quote ? Number(quote.changePercent) : undefined;
    if (Number.isFinite(changePercent)) return changePercent;
  }

  const names = component.names.map(normalizeBenchmarkName);
  for (const quote of context.marketQuotes.values()) {
    const quoteName = normalizeBenchmarkName(quote.name);
    if (!quoteName) continue;
    const matched = names.some((name) => quoteName === name || quoteName.includes(name) || name.includes(quoteName));
    if (!matched) continue;

    const changePercent = Number(quote.changePercent);
    if (Number.isFinite(changePercent)) return changePercent;
  }

  return component.fallbackChangePercent?.(fund);
}

function normalizeBenchmarkName(value: string) {
  return value.replace(/\s/g, "").toLowerCase();
}

async function estimateAdjustedEquityBasket(
  fund: Fund,
  context: FundValuationContext,
  config: EquityBasketConfig,
): Promise<FundValuationResult> {
  const base = resolveFundNavBase(fund);
  if (!base) return { modelName: config.modelName };

  const totalWeight = config.cashWeight
    + config.components.reduce((sum, component) => sum + component.weight, 0);
  const componentRows = await Promise.all(
    config.components.map(async (component) => {
      const detail = await resolveEquityBasketComponentDetail(component, fund, context, base.baseDate);
      return {
        contribution: component.weight * ((detail.totalChangePercent ?? 0) / 100),
        detail,
      };
    }),
  );
  const componentChangePercent = componentRows.reduce((sum, row) => sum + row.contribution, 0);
  const cashContribution = config.cashWeight * 0;
  const fxReturn = await resolveUsdCnyIntradayReturn(context);
  const fxContribution = (config.fxExposure ?? 0) * fxReturn;
  const estimatedChangePercent = componentChangePercent + cashContribution + fxContribution;
  const result = estimateByChange(fund, estimatedChangePercent, config.modelName);
  const fxDetail: FundValuationDetailComponent | undefined = config.fxExposure === undefined
    ? undefined
    : {
      symbol: "USD/CNY",
      name: "美元兑人民币汇率修正",
      weight: config.fxExposure,
      source: "fx",
      totalChangePercent: roundPercent(fxReturn * 100),
      contributionPercent: roundPercent(fxContribution),
    };

  return {
    ...result,
    valuationDetails: {
      modelName: config.modelName,
      baseDate: base.baseDate,
      totalWeight: roundPercent(totalWeight),
      cashWeight: config.cashWeight,
      estimatedChangePercent: estimatedChangePercent === undefined ? undefined : roundPercent(estimatedChangePercent),
      components: [
        ...componentRows.map((row) => ({
          ...row.detail,
          contributionPercent: roundPercent(row.contribution),
        })),
        ...(fxDetail ? [fxDetail] : []),
      ],
    },
  };
}

async function resolveEquityBasketComponentDetail(
  component: EquityBasketComponentConfig,
  fund: Fund,
  context: FundValuationContext,
  baseDate: string,
): Promise<FundValuationDetailComponent> {
  try {
    return await fetchCurrentReturnDetailSinceBase(component, baseDate);
  } catch (error) {
    const currentDetail = await resolveCurrentReturnDetail(component, error);
    if (currentDetail) return currentDetail;

    const quoteDetail = resolveEquityBasketQuoteDetail(component, context, baseDate);
    if (quoteDetail) return quoteDetail;

    const fallbackChangePercent = component.fallbackChangePercent?.(fund, context);
    if (fallbackChangePercent !== undefined && Number.isFinite(fallbackChangePercent)) {
      return {
        symbol: component.symbol,
        name: component.name,
        weight: component.weight,
        source: "fallback",
        totalChangePercent: roundPercent(fallbackChangePercent),
        error: error instanceof Error ? error.message : String(error),
      };
    }

    return {
      symbol: component.symbol,
      name: component.name,
      weight: component.weight,
      source: "missing",
      totalChangePercent: 0,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

function resolveEquityBasketQuoteDetail(
  component: EquityBasketComponentConfig,
  context: FundValuationContext,
  baseDate: string,
) {
  const symbols = [component.symbol, ...(component.quoteCodes ?? [])];
  if (baseDate < getLatestCompletedEtfCloseDate(context.now)) return undefined;

  for (const symbol of symbols) {
    const quote = context.marketQuotes.get(symbol);
    if (!quote) continue;

    const quoteReturn = resolveQuoteReturnBySymbols([symbol], context);
    if (quoteReturn === undefined) continue;

    return {
      symbol: component.symbol,
      name: component.name,
      weight: component.weight,
      source: `quote:${symbol}`,
      previousClose: quote.previousClose,
      lastPrice: quote.currentPrice,
      totalChangePercent: roundPercent(quoteReturn * 100),
    };
  }

  return undefined;
}

async function resolveCurrentReturnDetail(component: EquityBasketComponentConfig, error: unknown) {
  try {
    const current = await fetchCurrentReturnForComponent(component);
    const regularReturn = current.regularMarketPrice && current.regularMarketPrice > 0
      ? current.regularMarketPrice / current.previousClose - 1
      : undefined;
    const extendedHoursReturn = current.regularMarketPrice && current.regularMarketPrice > 0
      ? current.lastPrice / current.regularMarketPrice - 1
      : undefined;

    return {
      symbol: component.symbol,
      name: component.name,
      weight: component.weight,
      source: "yahoo-daily-fallback",
      previousClose: roundNav(current.previousClose),
      regularMarketPrice: current.regularMarketPrice === undefined ? undefined : roundNav(current.regularMarketPrice),
      lastPrice: roundNav(current.lastPrice),
      lastTime: current.lastTime,
      totalChangePercent: roundPercent(current.return * 100),
      regularChangePercent: regularReturn === undefined ? undefined : roundPercent(regularReturn * 100),
      extendedHoursChangePercent: extendedHoursReturn === undefined ? undefined : roundPercent(extendedHoursReturn * 100),
      error: error instanceof Error ? error.message : String(error),
    };
  } catch {
    return undefined;
  }
}

async function fetchCurrentReturnDetailSinceBase(component: EquityBasketComponentConfig, baseDate: string) {
  const [base, current] = await Promise.all([
    fetchDailyCloseOnOrBefore(component.symbol, baseDate),
    fetchCurrentReturnForComponent(component),
  ]);

  if (base.close <= 0) throw new Error(`Cannot calculate current return for ${component.symbol}`);
  const totalReturn = current.lastPrice / base.close - 1;
  const regularReturn = current.regularMarketPrice && current.regularMarketPrice > 0
    ? current.regularMarketPrice / current.previousClose - 1
    : undefined;
  const extendedHoursReturn = current.regularMarketPrice && current.regularMarketPrice > 0
    ? current.lastPrice / current.regularMarketPrice - 1
    : undefined;

  return {
    symbol: component.symbol,
    name: component.name,
    weight: component.weight,
    source: current.source,
    baseDate: base.date,
    baseClose: roundNav(base.close),
    previousClose: roundNav(current.previousClose),
    regularMarketPrice: current.regularMarketPrice === undefined ? undefined : roundNav(current.regularMarketPrice),
    lastPrice: roundNav(current.lastPrice),
    lastTime: current.lastTime,
    totalChangePercent: roundPercent(totalReturn * 100),
    regularChangePercent: regularReturn === undefined ? undefined : roundPercent(regularReturn * 100),
    extendedHoursChangePercent: extendedHoursReturn === undefined ? undefined : roundPercent(extendedHoursReturn * 100),
  };
}

async function fetchCurrentReturnForComponent(component: EquityBasketComponentConfig) {
  const tencentSymbols = getTencentHongKongSymbols(component);

  if (tencentSymbols.length) {
    try {
      return await fetchTencentCurrentReturn(tencentSymbols, component.symbol);
    } catch {
      // Fall through to Yahoo below.
    }
  }

  return fetchCurrentFutureReturn(component.symbol);
}

function getTencentHongKongSymbols(component: EquityBasketComponentConfig) {
  return [component.symbol, ...(component.quoteCodes ?? [])].flatMap((symbol) => {
    const normalized = normalizeHongKongStockCode(symbol);
    return normalized ? [`hk${normalized}`] : [];
  }).filter((symbol, index, list) => list.indexOf(symbol) === index);
}

function normalizeHongKongStockCode(symbol: string) {
  const directCode = /^0?\d{4,5}$/.exec(symbol);
  if (directCode) return directCode[0].padStart(5, "0");

  const hkCode = /^0?(\d{4,5})\.HK$/i.exec(symbol);
  if (hkCode) return hkCode[1].padStart(5, "0");

  return undefined;
}

async function fetchTencentCurrentReturn(symbols: string[], originalSymbol: string): Promise<YahooFutureReturn> {
  const url = `https://qt.gtimg.cn/q=${symbols.join(",")}`;
  const res = await fetch(url, {
    headers: {
      "User-Agent": "Mozilla/5.0 fund-web valuation",
      Referer: "https://gu.qq.com/",
    },
  });

  if (!res.ok) throw new Error(`Tencent quote HTTP ${res.status}: ${originalSymbol}`);

  const text = new TextDecoder("gbk").decode(await res.arrayBuffer());

  for (const row of text.split(";\n")) {
    const match = /v_([a-z0-9]+)="(.*)"/i.exec(row);
    if (!match) continue;

    const values = match[2].split("~");
    const lastPrice = parseTencentQuoteNumber(values[3]);
    const previousClose = parseTencentQuoteNumber(values[4]);
    const changePercent = parseTencentQuoteNumber(values[32]);

    if (lastPrice === undefined || previousClose === undefined || previousClose <= 0) continue;

    return {
      symbol: originalSymbol,
      previousClose,
      regularMarketPrice: lastPrice,
      lastPrice,
      return: changePercent === undefined ? lastPrice / previousClose - 1 : changePercent / 100,
      lastTime: parseTencentQuoteTime(values[30]),
      source: "tencent",
    };
  }

  throw new Error(`Tencent quote empty: ${originalSymbol}`);
}

function parseTencentQuoteNumber(value: unknown) {
  if (typeof value !== "string" && typeof value !== "number") return undefined;
  const numeric = Number(String(value).replace(/,/g, ""));
  return Number.isFinite(numeric) ? numeric : undefined;
}

function parseTencentQuoteTime(value: string | undefined) {
  if (!value) return null;
  const match = /^(\d{4})\/(\d{2})\/(\d{2}) (\d{2}):(\d{2}):(\d{2})$/.exec(value);
  if (!match) return value;

  return new Date(`${match[1]}-${match[2]}-${match[3]}T${match[4]}:${match[5]}:${match[6]}+08:00`).toISOString();
}

function resolveQuoteReturnBySymbols(symbols: string[], context: FundValuationContext) {
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

async function estimate161815Adjusted(
  fund: Fund,
  context: FundValuationContext,
  config: Adjusted161815Config,
): Promise<FundValuationResult> {
  const base = resolveFundNavBase(fund);
  if (!base) return { modelName: config.modelName };

  const etfCloseDate = getLatestCompletedEtfCloseDate(context.now);
  const stage1Rows = await Promise.all(
    config.holdings.map(async (holding) => {
      if (base.baseDate >= etfCloseDate) return { contribution: 0 };

      try {
        const item = await fetchStage1CloseReturn(holding, base.baseDate, etfCloseDate);
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
    modelName: config.modelName,
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

function resolveFundNavBase(fund: Fund): FundNavBase | undefined {
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

function nasdaqHistoricalUrl(symbol: string, startDate: string, endDate: string) {
  const query = new URLSearchParams({
    assetclass: "etf",
    fromdate: startDate,
    todate: endDate,
    limit: "20",
  });
  return `https://api.nasdaq.com/api/quote/${encodeURIComponent(symbol)}/historical?${query.toString()}`;
}

function lseInstrumentDataUrl(symbol: string) {
  return `https://api.londonstockexchange.com/api/gw/lse/instruments/alldata/${encodeURIComponent(symbol)}`;
}

async function fetchJson(url: string) {
  let lastError: unknown;

  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const res = await fetch(url, {
        headers: {
          "User-Agent": "Mozilla/5.0 fund-web 161815 valuation",
          Accept: "application/json,text/plain,*/*",
        },
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}: ${url}`);
      return res.json();
    } catch (error) {
      lastError = error;
    }
  }

  throw lastError;
}

function parseNasdaqNumber(value: unknown) {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value !== "string") return undefined;

  const parsed = Number(value.replace(/[$,]/g, ""));
  return Number.isFinite(parsed) ? parsed : undefined;
}

function parseNasdaqDate(value: unknown) {
  if (typeof value !== "string") return undefined;

  const parts = value.split("/");
  if (parts.length !== 3) return undefined;

  const [month, day, year] = parts;
  if (!month || !day || !year) return undefined;

  return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
}

async function fetchYahooDailyCloseOnOrBefore(symbol: string, targetDate: string): Promise<DailyClose> {
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
      source: "yahoo" as const,
    }))
    .filter((row: DailyClose) => row.date <= targetDate && isNum(row.close))
    .sort((a: DailyClose, b: DailyClose) => a.date.localeCompare(b.date));
  const picked = rows.at(-1);

  if (!picked) throw new Error(`No daily close found for ${symbol} on/before ${targetDate}`);
  return picked;
}

async function fetchNasdaqDailyCloseOnOrBefore(symbol: string, targetDate: string): Promise<DailyClose> {
  if (symbol.includes(".")) throw new Error(`Nasdaq daily fallback does not support ${symbol}`);

  const url = nasdaqHistoricalUrl(symbol, addDays(targetDate, -14), targetDate);
  const json = await fetchJson(url);
  const rows = json?.data?.tradesTable?.rows;

  if (!Array.isArray(rows)) throw new Error(`Nasdaq daily result empty for ${symbol}`);

  const dailyRows: DailyClose[] = rows.flatMap((row: Record<string, unknown>) => {
    const date = parseNasdaqDate(row.date);
    const close = parseNasdaqNumber(row.close);

    if (date === undefined || date > targetDate || !isNum(close)) return [];
    return [{ date, close, source: "nasdaq" as const }];
  });

  const picked = dailyRows
    .sort((a, b) => a.date.localeCompare(b.date))
    .at(-1);

  if (!picked) throw new Error(`No Nasdaq daily close found for ${symbol} on/before ${targetDate}`);
  return picked;
}

async function fetchLseDailyCloseOnOrBefore(symbol: string, targetDate: string): Promise<DailyClose> {
  if (!symbol.endsWith(".L")) throw new Error(`LSE daily fallback does not support ${symbol}`);

  const lseSymbol = symbol.slice(0, -2);
  const json = await fetchJson(lseInstrumentDataUrl(lseSymbol));
  const close = Number(json?.lastclose ?? json?.previousreferenceprice);
  const dateValue = json?.lastclosedate;
  const date = typeof dateValue === "string" ? dateValue.slice(0, 10) : undefined;

  if (!date || date > targetDate || !isNum(close)) {
    throw new Error(`No LSE daily close found for ${symbol} on/before ${targetDate}`);
  }

  return { date, close, source: "lse" };
}

async function fetchDailyCloseOnOrBefore(symbol: string, targetDate: string): Promise<DailyClose> {
  if (symbol.endsWith(".L")) {
    try {
      return await fetchLseDailyCloseOnOrBefore(symbol, targetDate);
    } catch {
      // Fall back to Yahoo for historical LSE dates that the LSE snapshot API no longer exposes.
    }
  }

  let yahooClose: DailyClose | undefined;
  let yahooError: unknown;

  try {
    yahooClose = await fetchYahooDailyCloseOnOrBefore(symbol, targetDate);
    if (yahooClose.date === targetDate) return yahooClose;
  } catch (error) {
    yahooError = error;
  }

  try {
    const lseClose = await fetchLseDailyCloseOnOrBefore(symbol, targetDate);
    if (!yahooClose || lseClose.date > yahooClose.date) return lseClose;
  } catch {
    // Keep trying other fallbacks.
  }

  try {
    const nasdaqClose = await fetchNasdaqDailyCloseOnOrBefore(symbol, targetDate);
    if (!yahooClose || nasdaqClose.date > yahooClose.date) return nasdaqClose;
  } catch {
    if (!yahooClose) throw yahooError ?? new Error(`No daily close found for ${symbol}`);
  }

  if (yahooClose) return yahooClose;
  throw yahooError ?? new Error(`No daily close found for ${symbol}`);
}

async function fetchCloseReturn(
  symbol: string,
  baseDate: string,
  targetDate: string,
): Promise<CloseReturn> {
  const base = await fetchDailyCloseOnOrBefore(symbol, baseDate);
  const target = await fetchDailyCloseOnOrBefore(symbol, targetDate);

  return {
    symbol,
    baseDate: base.date,
    baseClose: base.close,
    targetDate: target.date,
    targetClose: target.close,
    return: target.close / base.close - 1,
    source: target.source,
    baseSource: base.source,
    targetSource: target.source,
  };
}

async function fetchStage1CloseReturn(
  holding: Adjusted161815Holding,
  baseDate: string,
  targetDate: string,
): Promise<CloseReturn> {
  const stage1Symbol = holding.stage1ReturnSymbol ?? holding.symbol;
  const item = await fetchCloseReturn(stage1Symbol, baseDate, targetDate);

  if (
    holding.stage1ReturnSymbol
    && holding.stage1ReturnSymbol !== holding.symbol
    && item.targetDate <= item.baseDate
  ) {
    return fetchCloseReturn(holding.symbol, baseDate, targetDate);
  }

  return item;
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

  if (!timestamps.length && last === previousClose) {
    throw new Error(`No intraday ticks found for ${symbol}`);
  }

  return {
    symbol,
    previousClose,
    regularMarketPrice: isNum(meta.regularMarketPrice) ? meta.regularMarketPrice : undefined,
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

  config.holdings.forEach((holding) => {
    add(holding.overlayFuture, holding.weight * (holding.overlayMultiplier ?? 1));
  });

  if (config.includeComtBcdLookthrough) {
    config.holdings.forEach((holding) => {
      addLookthroughOverlay(map, config.lookthrough[holding.symbol], holding.weight);
    });
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
    console.warn(`[${config.fundCode}] holdings weight mismatch`, {
      holdingsWeight,
      expectedHoldingsWeight,
      cashOther: config.inferredWeights.cashOther,
    });
  }

  if (config.effectiveFutureOverlay) {
    const overlayWeight = Object.values(config.effectiveFutureOverlay).reduce((sum, weight) => sum + weight, 0);
    const expectedOverlayWeight = 1 - config.inferredWeights.cashOther;

    if (Math.abs(overlayWeight - expectedOverlayWeight) > 0.01) {
      console.warn(`[${config.fundCode}] effective futures overlay mismatch`, {
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
  if (fund.code === "501095") return stockHoldingWeightedOnlyModel;
  if (fund.fundType === "A股股票基金" || fund.fundType === "股票型基金") return stockHoldingWeightedModel;
  if (fund.fundType === "QDII" || Boolean(fund.fundType?.includes("QDII")) || fund.fundType === "港股股票基金") return qdiiHoldingWeightedModel;
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
    calculateHoldingChangeWithIndexRemainder(context.holdings, fund.indexChangePercent) ?? fund.indexChangePercent,
    "stock-holding-weighted-index-remainder",
  );
}

function stockHoldingWeightedOnlyModel(fund: Fund, context: FundValuationContext): FundValuationResult {
  return estimateByChange(
    fund,
    calculateHoldingChange(context.holdings),
    "stock-holding-weighted",
  );
}

function qdiiHoldingWeightedModel(fund: Fund, context: FundValuationContext): FundValuationResult {
  return estimateByChange(
    fund,
    calculateHoldingChangeWithIndexRemainder(context.holdings, fund.indexChangePercent) ?? fund.indexChangePercent,
    "qdii-holding-weighted-index-remainder",
  );
}

function hybridFallbackModel(fund: Fund, context: FundValuationContext): FundValuationResult {
  const holdingChange = calculateHoldingChangeWithIndexRemainder(context.holdings, fund.indexChangePercent);
  return estimateByChange(fund, holdingChange ?? fund.indexChangePercent, "hybrid-fallback-index-remainder");
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

function calculateHoldingChangeWithIndexRemainder(
  holdings: HoldingItem[],
  indexChangePercent: number | undefined,
) {
  let weightedChange = 0;
  let totalWeight = 0;

  holdings.forEach((holding) => {
    if (holding.changePercent === undefined || !Number.isFinite(holding.changePercent)) return;
    if (!Number.isFinite(holding.weight) || holding.weight <= 0) return;
    weightedChange += holding.changePercent * holding.weight;
    totalWeight += holding.weight;
  });

  if (totalWeight <= 0) return undefined;

  const boundedTotalWeight = Math.min(totalWeight, 100);
  if (boundedTotalWeight < 50 && indexChangePercent !== undefined && Number.isFinite(indexChangePercent)) {
    return (weightedChange + (100 - boundedTotalWeight) * indexChangePercent) / 100;
  }

  return weightedChange / totalWeight;
}


function hasTodayNav(fund: Fund, now: Date) {
  if (!fund.navDate) return false;
  const navDate = fund.navDate instanceof Date ? fund.navDate : new Date(fund.navDate);
  if (!Number.isFinite(navDate.getTime())) return false;

  return navDate.getFullYear() === now.getFullYear()
    && navDate.getMonth() === now.getMonth()
    && navDate.getDate() === now.getDate();
}
