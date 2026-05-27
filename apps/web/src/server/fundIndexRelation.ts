export interface FundIndexFundLike {
  code: string;
  name: string;
  category?: string | null;
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

const relationRules: RelationRule[] = [
  { indexName: "国证军工", fundCodes: ["501019"]},
  { indexName: "中证军工", fundCodes: ["502003", "161024"], fundNameIncludes: ["军工"]},
  { indexName: "空天军工", fundCodes: ["160643"], fundNameIncludes: ["空天军工"]},
  { indexName: "中证煤炭", fundCodes: ["168204", "161032"], fundNameIncludes: ["煤炭"]},
  { indexName: "煤炭等权", fundCodes: ["161724"], fundNameIncludes: ["煤炭等权"]},
  { indexName: "CSSW电子", fundCodes: ["163116"], fundNameIncludes: ["申万电子"]},
  { indexName: "消费龙头", fundCodes: ["501090"], fundNameIncludes: ["消费龙头"]},
  { indexName: "一带一路", fundCodes: ["160638"], fundNameIncludes: ["带路"]},
  { indexName: "保险主题", fundCodes: ["167301"], fundNameIncludes: ["保险"]},
  { indexName: "大宗商品", indexCode: "000979", fundCodes: ["161715"], fundNameIncludes: ["大宗商品"]},
  { indexName: "800有色", fundCodes: ["165520"], fundNameIncludes: ["有色"]},
  { indexName: "A股资源", fundCodes: ["160620"], fundNameIncludes: ["资源"]},
  { indexName: "中证信息", indexCode: "000935", fundCodes: ["160626"], fundNameIncludes: ["信息LOF"]},
  { indexName: "国证有色", indexCode: "399395", fundCodes: ["160221"], fundNameIncludes: ["有色金属"]},
  { indexName: "中证上游", fundCodes: ["161217"], fundNameIncludes: ["国投资源"]},
  { indexName: "中证白酒", fundCodes: ["161725", "160632"], fundNameIncludes: ["白酒", "酒LOF"]},
  { indexName: "国证地产", indexCode: "399393", fundCodes: ["160128", "160218"], fundNameIncludes: ["房地产LOF", "国证房地产"]},
  { indexName: "800地产", fundCodes: ["160628"], fundNameIncludes: ["地产"]},
  { indexName: "生物医药", fundCodes: ["161726"], fundNameIncludes: ["生物医药"]},
  { indexName: "工业40", fundCodes: ["161031"], fundNameIncludes: ["工业4"]},
  { indexName: "中证沪港深高股息指数", indexCode: "930917", fundCodes: ["501307"], fundNameIncludes: ["沪港深红利"]},
  { indexName: "中证红利", fundCodes: ["501227"], fundNameIncludes: ["红利"]},
  { indexName: "CS人工智", fundCodes: ["161631"], fundNameIncludes: ["人工智能"]},
  { indexName: "CS互医疗", fundCodes: ["501007", "501008"], fundNameIncludes: ["互联网医疗"]},
  { indexName: "CS精准医", fundCodes: ["501005"], fundNameIncludes: ["精准医疗"]},
  { indexName: "中证体育", fundCodes: ["161030"], fundNameIncludes: ["体育"]},
  { indexName: "CS医药TI", indexCode: "930791", fundCodes: ["161735"], fundNameIncludes: ["CS医药TI"]},
  { indexName: "800医药", indexCode: "000841", fundCodes: ["165519"], fundNameIncludes: ["医药生物科技"]},
  { indexName: "中证医药", fundCodes: ["160635", "161035"], fundNameIncludes: ["医药"]},
  { indexName: "新能源车", fundCodes: ["160225"], fundNameIncludes: ["新能源车"]},
  { indexName: "证券公司", indexCode: "399975", fundCodes: ["502010", "161720", "161027"], fundNameIncludes: ["证券"]},
  { indexName: "300等权", indexCode: "000984", fundCodes: ["163821"], fundNameIncludes: ["沪深300等权"]},
  { indexName: "中证500", fundCodes: ["501036"], fundNameIncludes: ["中证500"]},
  { indexName: "恒生指数", indexCode: "HSI", fundCodes: ["160925"], fundNameIncludes: ["恒生指数"]},
  { indexName: "恒生综合小型股指数", indexCode: "HSSI", fundCodes: ["161124"], fundNameIncludes: ["香港小盘", "恒生综合小型股"]},
  { indexName: "恒生中国(香港上市)30指数", indexCode: "HSCHK30", fundCodes: ["501301"], fundNameIncludes: ["香港大盘", "恒生中国"]},
  { indexName: "标普香港上市中国中小盘精选指数", fundCodes: ["501021"], fundNameIncludes: ["香港中小"]},
  { indexName: "中证香港中小企业投资主题指数", indexCode: "930746", fundCodes: ["501023"], fundNameIncludes: ["港中小企"]},
  { indexName: "中证港股通高股息投资指数", indexCode: "930914", fundCodes: ["501305", "501306"], fundNameIncludes: ["港股高股息"]},
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
  const normalizedFundName = normalizeName(fund.name);

  return relationRules.find((rule) => {
    if (rule.fundCodes?.includes(fund.code)) return true;
    return rule.fundNameIncludes?.some((keyword) => normalizedFundName.includes(normalizeName(keyword)));
  });
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

  const preferredNames = [
    rule?.indexName,
    rule ? undefined : fund.category,
    fund.name,
  ].filter(Boolean).map((name) => normalizeName(String(name)));

  for (const preferredName of preferredNames) {
    const exact = indexCandidates.find((index) => normalizeName(index.name) === preferredName);
    if (exact) return exact;

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
  const rule = matchRule(fund);
  const marketIndex = findMarketIndex(rule, fund, marketIndices);

  return {
    code: marketIndex?.code ?? null,
    name: marketIndex?.name ?? rule?.indexName ?? fund.category ?? null,
    changePercent: toNullableNumber(marketIndex?.changePercent),
  };
}
