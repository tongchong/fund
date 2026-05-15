export interface FundIndexFundLike {
  code: string;
  name: string;
  category?: string | null;
}

export interface FundIndexMarketLike {
  code: string;
  name: string;
  changePercent?: number | string | null;
}

export interface FundIndexRelation {
  code: string | null;
  name: string | null;
  changePercent: number | null;
}

interface RelationRule {
  indexName: string;
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
  { indexName: "大宗商品", fundCodes: ["161715"], fundNameIncludes: ["大宗商品"]},
  { indexName: "800有色", fundCodes: ["165520"], fundNameIncludes: ["有色"]},
  { indexName: "A股资源", fundCodes: ["160620"], fundNameIncludes: ["资源"]},
  { indexName: "国证有色", fundCodes: ["160221"], fundNameIncludes: ["有色金属"]},
  { indexName: "中证上游", fundCodes: ["161217"], fundNameIncludes: ["国投资源"]},
  { indexName: "中证白酒", fundCodes: ["161725", "160632"], fundNameIncludes: ["白酒", "酒LOF"]},
  { indexName: "800地产", fundCodes: ["160628"], fundNameIncludes: ["地产"]},
  { indexName: "生物医药", fundCodes: ["161726"], fundNameIncludes: ["生物医药"]},
  { indexName: "工业40", fundCodes: ["161031"], fundNameIncludes: ["工业4"]},
  { indexName: "中证红利", fundCodes: ["501227"], fundNameIncludes: ["红利"]},
  { indexName: "CS人工智", fundCodes: ["161631"], fundNameIncludes: ["人工智能"]},
  { indexName: "CS互医疗", fundCodes: ["501007", "501008"], fundNameIncludes: ["互联网医疗"]},
  { indexName: "CS精准医", fundCodes: ["501005"], fundNameIncludes: ["精准医疗"]},
  { indexName: "中证体育", fundCodes: ["161030"], fundNameIncludes: ["体育"]},
  { indexName: "中证医药", fundCodes: ["160635", "161035"], fundNameIncludes: ["医药"]},
  { indexName: "新能源车", fundCodes: ["160225"], fundNameIncludes: ["新能源车"]},
  { indexName: "证券公司", fundCodes: ["502010", "161720", "161027"], fundNameIncludes: ["证券"]},
  { indexName: "中证500", fundCodes: ["501036"], fundNameIncludes: ["中证500"]},
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

function findMarketIndex(
  rule: RelationRule | undefined,
  fund: FundIndexFundLike,
  marketIndices: FundIndexMarketLike[],
) {
  const preferredNames = [
    rule?.indexName,
    fund.category,
    fund.name,
  ].filter(Boolean).map((name) => normalizeName(String(name)));

  for (const preferredName of preferredNames) {
    const exact = marketIndices.find((index) => normalizeName(index.name) === preferredName);
    if (exact) return exact;

    const partial = marketIndices.find((index) => {
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
