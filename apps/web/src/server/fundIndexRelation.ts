export interface FundIndexFundLike {
  code: string;
  name: string;
  category?: string | null;
  fundType?: string | null;
}

export interface FundIndexMarketLike {
  code: string;
  name: string;
  instrumentType?: string | null;
  source?: string | null;
  changePercent?: number | string | null;
}

export interface FundIndexRelation {
  code: string | null;
  name: string | null;
  changePercent: number | null;
}

interface RelationRule {
  indexName: string;
  indexCode?: string;
  fundCodes?: string[];
  fundNameIncludes?: string[];
}

const nonIndexFundCodes = new Set(["160128", "501095", "501227"]);

const unreviewedExactRelationRules: RelationRule[] = [
  { indexName: "\u4e0a\u8bc150", indexCode: "000016", fundCodes: ["502048"]},
  { indexName: "\u6caa\u6df1300", indexCode: "000300", fundCodes: ["160706", "160807", "165309", "501043", "501045"]},
  { indexName: "A\u80a1\u8d44\u6e90", indexCode: "000805", fundCodes: ["160620"]},
  { indexName: "800\u6709\u8272", indexCode: "000823", fundCodes: ["165520"]},
  { indexName: "\u4e2d\u8bc1\u73af\u4fdd", indexCode: "000827", fundCodes: ["163114"]},
  { indexName: "\u4e2d\u8bc11000", indexCode: "000852", fundCodes: ["161039"]},
  { indexName: "CS\u7cbe\u51c6\u533b", indexCode: "000863", fundCodes: ["501005"]},
  { indexName: "\u6e2f\u4e2d\u5c0f\u4f01", indexCode: "000867", fundCodes: ["501023"]},
  { indexName: "HK\u94f6\u884c", indexCode: "000869", fundCodes: ["160631", "501025"]},
  { indexName: "\u4e2d\u8bc1A100", indexCode: "000903", fundCodes: ["162307", "164508"]},
  {
    indexName: "\u4e2d\u8bc1500",
    indexCode: "000905",
    fundCodes: ["160119", "161017", "162216", "162711", "501036", "501037"],
  },
  { indexName: "\u4e2d\u8bc1800", indexCode: "000906", fundCodes: ["160806"]},
  { indexName: "\u4e2d\u8bc1\u7ea2\u5229", indexCode: "000922", fundCodes: ["501029", "501059"]},
  { indexName: "\u57fa\u672c\u976250", indexCode: "000925", fundCodes: ["160716"]},
  { indexName: "\u4e2d\u8bc1\u533b\u836f", indexCode: "000933", fundCodes: ["160219", "161035", "163118"]},
  { indexName: "\u4e2d\u8bc1\u4fe1\u606f", indexCode: "000935", fundCodes: ["161128"]},
  { indexName: "800\u91d1\u878d", indexCode: "000974", fundCodes: ["165521"]},
  { indexName: "300\u7b49\u6743", indexCode: "000984", fundCodes: ["163821"]},
  { indexName: "\u6df1\u8bc1\u6210\u6307", indexCode: "399001", fundCodes: ["163109"]},
  { indexName: "\u4e2d\u5c0f100", indexCode: "399005", fundCodes: ["163111"]},
  {
    indexName: "\u521b\u4e1a\u677f\u6307",
    indexCode: "399006",
    fundCodes: ["160143", "160223", "160325", "160529", "160926", "161914", "162720"],
  },
  { indexName: "\u5de8\u6f6e100", indexCode: "399313", fundCodes: ["161607"]},
  { indexName: "\u6df1\u8bc1100", indexCode: "399330", fundCodes: ["161227", "161812"]},
  { indexName: "\u56fd\u8bc1\u519b\u5de5", indexCode: "399368", fundCodes: ["501019"]},
  { indexName: "\u56fd\u8bc1\u5730\u4ea7", indexCode: "399393", fundCodes: ["160128"]},
  { indexName: "\u56fd\u8bc1\u6709\u8272", indexCode: "399395", fundCodes: ["160221"]},
  { indexName: "\u65b0\u80fd\u6e90\u8f66", indexCode: "399417", fundCodes: ["160225", "501057", "501058"]},
  { indexName: "\u56fd\u8bc1\u94a2\u94c1", indexCode: "399440", fundCodes: ["168203", "502023"]},
  { indexName: "\u751f\u7269\u533b\u836f", indexCode: "399441", fundCodes: ["161726"]},
  { indexName: "\u73af\u5883\u6cbb\u7406", indexCode: "399806", fundCodes: ["501030", "501031"]},
  { indexName: "\u9ad8\u94c1\u4ea7\u4e1a", indexCode: "399807", fundCodes: ["160639"]},
  { indexName: "\u4fdd\u9669\u4e3b\u9898", indexCode: "399809", fundCodes: ["167301"]},
  { indexName: "800\u975e\u94f6", indexCode: "399966", fundCodes: ["160625"]},
  { indexName: "\u4e2d\u8bc1\u519b\u5de5", indexCode: "399967", fundCodes: ["161024", "163115"]},
  { indexName: "\u4e2d\u8bc1\u4f20\u5a92", indexCode: "399971", fundCodes: ["160629"]},
  { indexName: "\u4e2d\u8bc1\u56fd\u9632", indexCode: "399973", fundCodes: ["160630"]},
  { indexName: "\u8bc1\u5238\u516c\u53f8", indexCode: "399975", fundCodes: ["160633", "502053"]},
  { indexName: "CS\u65b0\u80fd\u8f66", indexCode: "399976", fundCodes: ["161028"]},
  { indexName: "\u4e2d\u8bc1\u533b\u7597", indexCode: "399989", fundCodes: ["162412", "502056"]},
  { indexName: "\u57fa\u5efa\u5de5\u7a0b", indexCode: "399995", fundCodes: ["165525"]},
  { indexName: "\u4e2d\u8bc1\u767d\u9152", indexCode: "399997", fundCodes: ["160632", "161725"]},
  { indexName: "\u4e2d\u8bc1\u7164\u70ad", indexCode: "399998", fundCodes: ["161032", "168204"]},
  { indexName: "中证中药", indexCode: "930641", fundCodes: ["501011", "501012"]},
  { indexName: "香港证券", indexCode: "930709", fundCodes: ["513090"]},
  { indexName: "CS人工智", indexCode: "930713", fundCodes: ["161631"]},
  { indexName: "CS互医疗", indexCode: "930720", fundCodes: ["501007", "501008"]},
  { indexName: "CS智汽车", indexCode: "930721", fundCodes: ["161033"]},
  { indexName: "中证生科", indexCode: "930743", fundCodes: ["501009", "501010"]},
  { indexName: "CS娱乐TI", indexCode: "930790", fundCodes: ["161036"]},
  { indexName: "CS高端制", indexCode: "930820", fundCodes: ["161037"]},
  {
    indexName: "港股通高股息",
    indexCode: "930914",
    fundCodes: ["159127", "159277", "159302", "159331", "501305", "501306", "513530", "513820", "513830", "520810"],
  },
  { indexName: "SHS高股息", indexCode: "930917", fundCodes: ["501307"]},
  { indexName: "港股通医药C", indexCode: "930965", fundCodes: ["159718", "159776", "513200", "513700"]},
  {
    indexName: "港股通信息C",
    indexCode: "930967",
    fundCodes: ["159131", "159185", "159196", "159198", "513240", "526000", "526050"],
  },
  { indexName: "港股通非银", indexCode: "931024", fundCodes: ["513750"]},
  { indexName: "消费龙头", indexCode: "931068", fundCodes: ["501090"]},
  { indexName: "中金300", indexCode: "931069", fundCodes: ["501060", "501061"]},
  { indexName: "国新港股通央企红利", indexCode: "931722", fundCodes: ["520660", "520900", "520990"]},
  { indexName: "港股通红利低波", indexCode: "987016", fundCodes: ["159117", "159118", "159220", "513630", "520610"]},
  { indexName: "\u5185\u5730\u56fd\u6709", indexCode: "H11153", fundCodes: ["159519", "513810"]},
  { indexName: "消费红利", indexCode: "H30094", fundCodes: ["501089"]},
  { indexName: "恒生中国企业指数", indexCode: "HSCEI", fundCodes: ["159850", "159954", "159960", "160717", "161831", "510900"]},
  { indexName: "恒生中国(香港上市)30指数", indexCode: "HSCHK30", fundCodes: ["501301", "520560"]},
  {
    indexName: "\u6052\u751f\u6307\u6570",
    indexCode: "HSI",
    fundCodes: ["159271", "159920", "160924", "164705", "501302", "513210", "513600", "513660"],
  },
  { indexName: "恒生综合小型股指数", indexCode: "HSSI", fundCodes: ["161124"]},
  {
    indexName: "\u6052\u751f\u79d1\u6280\u6307\u6570",
    indexCode: "HSTECH",
    fundCodes: [
      "159740", "159741", "159742", "513010", "513130", "513180", "513260", "513380",
      "513580", "513890", "520570", "520590", "520920",
    ],
  },
  { indexName: "\u6807\u666e500", indexCode: "INX", fundCodes: ["159612", "159655", "161125", "513500", "513650"]},
  { indexName: "\u7eb3\u65af\u8fbe\u514b\u751f\u7269\u79d1\u6280\u6307\u6570", indexCode: "NBI", fundCodes: ["513290"]},
  {
    indexName: "\u7eb3\u65af\u8fbe\u514b100",
    indexCode: "NDX",
    fundCodes: [
      "159501", "159513", "159632", "159659", "159660", "159696", "159941", "161130",
      "513100", "513110", "513300", "513390", "513870",
    ],
  },
];

const hangSengIndexFundCodes = [
  "501302", "160924", "164705", "159920", "513660", "159271", "513600", "513210",
];
const hangSengTechFundCodes = [
  "513260", "520590", "513890", "520920", "513380", "513580", "513130",
  "159741", "159742", "513180", "520570", "513010", "159740",
];
const hangSengBiotechFundCodes = [
  "159615", "520760", "513280", "159892", "513930", "520930",
  "159130", "159132", "159102", "159105", "159169",
];
const hangSengChinaEnterprisesFundCodes = ["161831", "160717", "159954", "159850", "159960", "510900"];
const hangSengChinaHongKongListed30FundCodes = ["501301", "520560"];
const hangSengSmallCapFundCodes = ["161124"];

const relationRules: RelationRule[] = [
  ...unreviewedExactRelationRules,
  { indexName: "国证军工", fundCodes: ["501019"]},
  { indexName: "中证军工", fundCodes: ["502003", "161024"], fundNameIncludes: ["军工"]},
  { indexName: "空天军工", indexCode: "930875", fundCodes: ["160643"], fundNameIncludes: ["空天军工"]},
  { indexName: "中证煤炭", fundCodes: ["168204", "161032"], fundNameIncludes: ["煤炭"]},
  { indexName: "煤炭等权", fundCodes: ["161724"], fundNameIncludes: ["煤炭等权"]},
  { indexName: "CSSW电子", fundCodes: ["163116"], fundNameIncludes: ["申万电子"]},
  { indexName: "消费龙头", fundCodes: ["501090"], fundNameIncludes: ["消费龙头"]},
  { indexName: "中证申万一带一路主题投资指数", indexCode: "930620", fundCodes: ["502013"], fundNameIncludes: ["中证申万一带一路"]},
  { indexName: "一带一路", fundCodes: ["160638"], fundNameIncludes: ["带路"]},
  { indexName: "保险主题", fundCodes: ["167301"], fundNameIncludes: ["保险"]},
  { indexName: "大宗商品", indexCode: "000979", fundCodes: ["161715"], fundNameIncludes: ["大宗商品"]},
  { indexName: "中证A100", indexCode: "000903", fundCodes: ["162307", "162509", "164508"]},
  { indexName: "中小100", indexCode: "399005", fundCodes: ["161118", "163111"]},
  { indexName: "中证1000", indexCode: "000852", fundCodes: ["161039"]},
  { indexName: "中证800", indexCode: "000906", fundCodes: ["160806"]},
  { indexName: "上证50", indexCode: "000016", fundCodes: ["502048"]},
  { indexName: "基本面50", indexCode: "000925", fundCodes: ["160716"]},
  { indexName: "800有色", fundCodes: ["165520"], fundNameIncludes: ["有色"]},
  { indexName: "800金融", indexCode: "000974", fundCodes: ["165521"]},
  { indexName: "800非银", indexCode: "399966", fundCodes: ["160625"]},
  { indexName: "A股资源", fundCodes: ["160620"], fundNameIncludes: ["资源"]},
  { indexName: "国企改革", indexCode: "399974", fundCodes: ["161026", "502006"]},
  { indexName: "中证信息", indexCode: "000935", fundCodes: ["160626"], fundNameIncludes: ["信息LOF"]},
  { indexName: "国证有色", indexCode: "399395", fundCodes: ["160221"], fundNameIncludes: ["有色金属"]},
  { indexName: "中证上游", fundCodes: ["161217"], fundNameIncludes: ["国投资源"]},
  { indexName: "中证白酒", fundCodes: ["161725", "160632"], fundNameIncludes: ["白酒", "酒LOF"]},
  { indexName: "国证食品", indexCode: "399396", fundCodes: ["160222"], fundNameIncludes: ["食品LOF"]},
  { indexName: "国证地产", indexCode: "399393", fundCodes: ["160128", "160218"], fundNameIncludes: ["房地产LOF", "国证房地产"]},
  { indexName: "800地产", fundCodes: ["160628"], fundNameIncludes: ["地产"]},
  { indexName: "生物医药", indexCode: "399441", fundCodes: ["161726"], fundNameIncludes: ["生物医药"]},
  { indexName: "工业4.0", indexCode: "399803", fundCodes: ["161031"], fundNameIncludes: ["工业4"]},
  { indexName: "中证沪港深高股息指数", indexCode: "930917", fundCodes: ["501307"], fundNameIncludes: ["沪港深红利"]},
  { indexName: "消费红利", indexCode: "H30094", fundCodes: ["501089"], fundNameIncludes: ["消费红利"]},
  { indexName: "中证红利", fundCodes: ["501227"], fundNameIncludes: ["红利"]},
  { indexName: "CS人工智", fundCodes: ["161631"], fundNameIncludes: ["人工智能"]},
  { indexName: "CS互医疗", fundCodes: ["501007", "501008"], fundNameIncludes: ["互联网医疗"]},
  { indexName: "中证医疗", indexCode: "399989", fundCodes: ["162412", "502056"], fundNameIncludes: ["中证医疗"]},
  { indexName: "CSWD生科", indexCode: "399993", fundCodes: ["161122"]},
  { indexName: "CS娱乐TI", indexCode: "930790", fundCodes: ["161036"]},
  { indexName: "CS高端制", indexCode: "930820", fundCodes: ["161037"]},
  { indexName: "CS精准医", fundCodes: ["501005"], fundNameIncludes: ["精准医疗"]},
  { indexName: "中证TMT", indexCode: "000998", fundCodes: ["165522"]},
  { indexName: "中证环保", indexCode: "000827", fundCodes: ["163114"]},
  { indexName: "中证中药", indexCode: "930641", fundCodes: ["501011", "501012"], fundNameIncludes: ["中药"]},
  { indexName: "中证体育", fundCodes: ["161030"], fundNameIncludes: ["体育"]},
  { indexName: "CS医药TI", indexCode: "930791", fundCodes: ["161735"], fundNameIncludes: ["CS医药TI"]},
  { indexName: "800医药", indexCode: "000841", fundCodes: ["165519"], fundNameIncludes: ["医药生物科技"]},
  {
    indexName: "中证港股通医药卫生综合港元指数",
    indexCode: "930965",
    fundCodes: ["513200", "513700", "159776", "159718"],
  },
  {
    indexName: "中证港股通信息技术综合港元指数",
    indexCode: "930967",
    fundCodes: ["526000", "513240", "526050", "159196", "159198", "159185", "159131"],
  },
  { indexName: "中证香港证券投资主题港元指数", indexCode: "930709", fundCodes: ["513090"]},
  {
    indexName: "中证港股通高股息投资港元指数",
    indexCode: "930914",
    fundCodes: ["501305", "501306", "513830", "159302", "520810", "513530", "513820", "159331", "159277", "159127"],
  },
  {
    indexName: "中证国新港股通央企红利指数",
    indexCode: "931722",
    fundCodes: ["520900", "520990", "520660"],
  },
  {
    indexName: "港股通红利低波指数",
    indexCode: "987016",
    fundCodes: ["159117", "159118", "159220", "520610", "513630"],
  },
  {
    indexName: "恒生生物科技指数",
    fundCodes: hangSengBiotechFundCodes,
  },
  {
    indexName: "恒生科技指数",
    indexCode: "HSTECH",
    fundCodes: hangSengTechFundCodes,
  },
  {
    indexName: "恒生中国企业指数",
    indexCode: "HSCEI",
    fundCodes: hangSengChinaEnterprisesFundCodes,
  },
  {
    indexName: "恒生互联网科技业指数",
    fundCodes: ["159202", "159688", "513330"],
  },
  {
    indexName: "恒生消费指数",
    fundCodes: ["520620", "520520", "513970", "159699"],
  },
  {
    indexName: "恒生医疗保健指数",
    fundCodes: ["159557", "513060", "159303"],
  },
  {
    indexName: "恒生综合中型股指数",
    fundCodes: ["501303"],
  },
  {
    indexName: "恒生港股通新经济指数",
    fundCodes: ["501311", "513320"],
  },
  {
    indexName: "恒生港股通科技主题指数",
    fundCodes: ["520670", "520840", "159015", "159135", "159120", "159262", "159010", "159152"],
  },
  {
    indexName: "恒生港股通创新药精选指数",
    fundCodes: ["520690", "520880"],
  },
  {
    indexName: "恒生港股通创新药指数",
    fundCodes: ["159316"],
  },
  {
    indexName: "恒生创新药指数",
    fundCodes: ["520500"],
  },
  {
    indexName: "恒生港股通创新药及医疗保健指数",
    fundCodes: ["159506"],
  },
  {
    indexName: "恒生港股通中国科技指数",
    fundCodes: ["520980", "513160"],
  },
  {
    indexName: "恒生港股通50指数",
    fundCodes: ["520950", "159109"],
  },
  {
    indexName: "恒指港股通指数",
    fundCodes: ["159312", "520770", "159318", "520820", "159365", "520940", "520960", "526070"],
  },
  {
    indexName: "中华交易服务沪深港300人民币指数",
    fundCodes: ["160925"],
  },
  {
    indexName: "恒生沪深港通大湾区综合指数",
    fundCodes: ["167302"],
  },
  {
    indexName: "上证港股通指数",
    fundCodes: ["513990"],
  },
  {
    indexName: "恒生中国央企指数",
    fundCodes: ["513170"],
  },
  {
    indexName: "中证港股通科技指数",
    fundCodes: ["159751", "520530", "513150", "513860", "513020", "513980", "513560", "520860"],
  },
  {
    indexName: "国证港股通科技指数",
    fundCodes: ["159128", "159636", "159191", "159125", "159251", "159101"],
  },
  {
    indexName: "中证港股通互联网指数",
    fundCodes: ["513770", "520650", "520630", "520790", "513040", "520910", "159179", "513720", "159792", "159568"],
  },
  {
    indexName: "国证港股通互联网指数",
    fundCodes: ["159170", "159280"],
  },
  {
    indexName: "中证港股通汽车产业主题指数",
    fundCodes: ["159237", "520780", "159323", "520680", "159210", "520600", "520720"],
  },
  {
    indexName: "恒生港股通汽车主题指数",
    fundCodes: ["159186", "520730", "159028", "159121", "159239"],
  },
  {
    indexName: "中证港股通医疗主题指数",
    fundCodes: ["159366", "520850", "513620", "159167", "159137", "526010", "520510"],
  },
  {
    indexName: "中证港股通消费主题港元指数",
    fundCodes: ["513230", "159735", "513070", "513590"],
  },
  {
    indexName: "国证港股通消费主题指数",
    fundCodes: ["159285", "159265", "159245", "159268"],
  },
  {
    indexName: "恒生港股通高股息低波动指数",
    fundCodes: ["520890", "513950", "520550", "159545"],
  },
  {
    indexName: "中证港股通央企红利指数",
    fundCodes: ["159266", "159333", "513910", "159281"],
  },
  {
    indexName: "恒生港股通中国央企红利指数",
    fundCodes: ["513920", "159143"],
  },
  {
    indexName: "恒生港股通中国内地企业高股息率指数",
    fundCodes: ["159726"],
  },
  {
    indexName: "国证港股通红利低波动率指数",
    fundCodes: ["159569"],
  },
  {
    indexName: "中证港股通高股息精选港元指数",
    fundCodes: ["159691"],
  },
  {
    indexName: "港股通高股息率指数",
    fundCodes: ["513690"],
  },
  { indexName: "中证医药", fundCodes: ["160635", "161035"], fundNameIncludes: ["医药"]},
  { indexName: "CS新能车", indexCode: "399976", fundCodes: ["161028"]},
  { indexName: "新能源车", fundCodes: ["160225"], fundNameIncludes: ["新能源车"]},
  { indexName: "证券公司", indexCode: "399975", fundCodes: ["502010", "161720", "161027"], fundNameIncludes: ["证券"]},
  { indexName: "中证银行", indexCode: "399986", fundCodes: ["161029", "161121"]},
  { indexName: "中金300", indexCode: "931069", fundCodes: ["501060", "501061"]},
  { indexName: "巨潮100", indexCode: "399313", fundCodes: ["161607"]},
  { indexName: "基建工程", indexCode: "399995", fundCodes: ["165525"]},
  { indexName: "等权90", indexCode: "000971", fundCodes: ["161816"]},
  { indexName: "300等权", indexCode: "000984", fundCodes: ["163821"], fundNameIncludes: ["沪深300等权"]},
  { indexName: "中证500", fundCodes: ["501036"], fundNameIncludes: ["中证500"]},
  { indexName: "恒生指数", indexCode: "HSI", fundCodes: hangSengIndexFundCodes },
  { indexName: "恒生综合小型股指数", indexCode: "HSSI", fundCodes: hangSengSmallCapFundCodes },
  { indexName: "恒生中国(香港上市)30指数", indexCode: "HSCHK30", fundCodes: hangSengChinaHongKongListed30FundCodes },
  { indexName: "标普香港上市中国中小盘精选指数", fundCodes: ["501021"], fundNameIncludes: ["香港中小"]},
  {
    indexName: "S&P Oil & Gas Exploration & Production Select Industry Index",
    fundCodes: ["162411"],
    fundNameIncludes: ["标普油气", "美国石油天然气上游"],
  },
  { indexName: "中证香港中小企业投资主题指数", indexCode: "930746", fundCodes: ["501023"], fundNameIncludes: ["港中小企"]},
  { indexName: "中证港股通新经济指数", fundCodes: ["501311"], fundNameIncludes: ["新经济港股通"]},
  { indexName: "香港银行", indexCode: "930792", fundCodes: ["501025"], fundNameIncludes: ["香港银行"]},
  { indexName: "深证100", fundNameIncludes: ["深证100"]},
  { indexName: "创业板指", fundNameIncludes: ["创业板"]},
  { indexName: "创业成长", fundNameIncludes: ["创业成长"]},
];

function normalizeName(value: string) {
  return value
    .replace(/\s/g, "")
    .replace(/LOF|基金|主题|指数/gi, "")
    .toLowerCase();
}

function toNullableNumber(value: number | string | null | undefined) {
  if (value === null || value === undefined) return null;
  const numericValue = Number(value);
  return Number.isFinite(numericValue) ? numericValue : null;
}

function matchRule(fund: FundIndexFundLike) {
  return relationRules.find((rule) => rule.fundCodes?.includes(fund.code));
}

function isHongKongRelated(value: string) {
  return /港股|港股通|恒生|香港|h股|沪深港/i.test(value);
}

export function isHongKongMarketFund(fund: FundIndexFundLike) {
  const text = `${fund.name}${fund.category ?? ""}`;
  if (isHongKongRelated(text)) return true;
  const rule = matchRule(fund);
  return rule ? isHongKongRelated(rule.indexName) : false;
}

function isIndexCandidate(index: FundIndexMarketLike) {
  return !index.instrumentType && index.source !== "TENCENT";
}

function findMarketIndex(
  rule: RelationRule | undefined,
  fund: FundIndexFundLike,
  marketIndices: FundIndexMarketLike[],
) {
  const indexCandidates = marketIndices.filter(isIndexCandidate);

  if (rule?.indexCode) {
    const exactCode = indexCandidates.find((index) => index.code === rule.indexCode);
    if (exactCode) return exactCode;
  }

  if (!rule) return null;

  const preferredNames = [
    rule?.indexName,
  ].filter(Boolean).map((name) => normalizeName(String(name)));
  const allowPartialMatch = !(isHongKongRelated(`${fund.name}${fund.category ?? ""}${rule?.indexName ?? ""}`)
    && !rule?.indexCode);

  for (const preferredName of preferredNames) {
    const exact = indexCandidates.find((index) => normalizeName(index.name) === preferredName);
    if (exact) return exact;

    if (!allowPartialMatch) continue;

    const partial = indexCandidates.find((index) => {
      const indexName = normalizeName(index.name);
      return indexName.includes(preferredName) || preferredName.includes(indexName);
    });
    if (partial) return partial;
  }

  return null;
}

export function resolveFundIndexRelation(
  fund: FundIndexFundLike,
  marketIndices: FundIndexMarketLike[],
): FundIndexRelation {
  if (nonIndexFundCodes.has(fund.code)) {
    return {
      code: null,
      name: null,
      changePercent: null,
    };
  }

  const rule = matchRule(fund);
  const marketIndex = findMarketIndex(rule, fund, marketIndices);

  return {
    code: marketIndex?.code ?? rule?.indexCode ?? null,
    name: marketIndex?.name ?? rule?.indexName ?? null,
    changePercent: toNullableNumber(marketIndex?.changePercent),
  };
}
