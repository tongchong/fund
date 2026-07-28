import { Fund } from "src/server/db/entities/fund";
import { FundArbitrageBuyMethod, FundArbitrageRedemption } from "src/server/db/entities/fundArbitrageRedemption";
import { FundDaily } from "src/server/db/entities/fundDaily";
import { FundPricePin, FundPricePinType } from "src/server/db/entities/fundPricePin";
import { MarketIndex } from "src/server/db/entities/marketIndex";
import { User } from "src/server/db/entities/user";
import { isHongKongMarketFund, resolveFundIndexRelation } from "src/server/fundIndexRelation";
import { isHongKongMarketTradingDay } from "src/server/marketCalendar";
import { forkEntityManager } from "src/utils/getOrm";
import { paginationSchema } from "src/utils/pagination";
import { z } from "zod";

import { adminAuthProcedure, authProcedure } from "../../procedure/base";

const nullableNumber = z.number().nullable();
const arbitrageBuyMethodSchema = z.nativeEnum(FundArbitrageBuyMethod);
const fundSortFieldSchema = z.enum([
  "dailyChangePercent",
  "turnoverRate",
  "estimatedPremiumRate",
  "purchaseFee",
  "redemptionFee7d",
]);
const sortOrderSchema = z.enum(["asc", "desc"]);
const pricePinSortFieldSchema = z.enum(["pinDate", "fundCode", "highDeviationPercent", "lowDeviationPercent"]);
const fundTypeFilterSchema = z.enum([
  "index",
  "qdii",
  "stockWithoutIndex",
  "stock",
  "europeAmericaQdii",
  "asiaQdii",
  "commodityQdii",
]);

function toNullableNumber(value: number | string | null | undefined) {
  if (value === null || value === undefined) return null;
  const numericValue = Number(value);
  return Number.isFinite(numericValue) ? numericValue : null;
}

function formatDate(value: Date | string | null | undefined) {
  if (!value) return null;
  if (value instanceof Date) return value.toISOString().slice(0, 10);

  const dateText = String(value);
  return dateText.includes("T") ? dateText.slice(0, 10) : dateText;
}

function formatDateTime(value: Date | string | null | undefined) {
  if (!value) return null;
  if (value instanceof Date) return value.toISOString();
  return String(value);
}

export const FundDailyItemSchema = z.object({
  id: z.number(),
  date: z.string().nullable(),
  closePrice: nullableNumber,
  nav: nullableNumber,
  navChangePercent: nullableNumber,
  estimatedNav: nullableNumber,
  exchangeShares: nullableNumber,
  exchangeSharesChange: nullableNumber,
  closePremiumRate: nullableNumber,
  navPremiumRate: nullableNumber,
  premiumErrorRate: nullableNumber,
  createTime: z.string().nullable(),
  updateTime: z.string().nullable(),
});

export const FundArbitrageRedemptionItemSchema = z.object({
  id: z.number(),
  fundName: z.string(),
  fundCode: z.string(),
  shares: nullableNumber,
  buyDate: z.string().nullable(),
  redeemableDate: z.string().nullable(),
  redemptionFee: nullableNumber,
  buyMethod: arbitrageBuyMethodSchema,
  remark: z.string().nullable(),
  createTime: z.string().nullable(),
  updateTime: z.string().nullable(),
});

export const FundPricePinItemSchema = z.object({
  id: z.number(),
  fundCode: z.string(),
  fundName: z.string(),
  occurrenceCount: z.number(),
  pinDate: z.string().nullable(),
  openPrice: nullableNumber,
  closePrice: nullableNumber,
  highPrice: nullableNumber,
  lowPrice: nullableNumber,
  highDeviationPercent: nullableNumber,
  lowDeviationPercent: nullableNumber,
  thresholdPercent: nullableNumber,
  needleThresholdPercent: nullableNumber,
  needle: z.boolean(),
  pinType: z.nativeEnum(FundPricePinType),
  source: z.string().nullable(),
  detectedAt: z.string().nullable(),
});

export const FundListItemSchema = z.object({
  id: z.number(),
  favorite: z.boolean(),
  reviewed: z.boolean(),
  lowValue: z.boolean(),
  category: z.string().nullable(),
  fundType: z.string().nullable(),
  marketIndexCode: z.string().nullable(),
  marketIndexName: z.string().nullable(),
  code: z.string(),
  name: z.string(),
  currentPrice: nullableNumber,
  dailyChangePercent: nullableNumber,
  dailyVolume: nullableNumber,
  exchangeShares: nullableNumber,
  turnoverRate: nullableNumber,
  indexChangePercent: nullableNumber,
  purchaseFee: nullableNumber,
  redemptionFee7d: nullableNumber,
  redemptionFeeRule: z.string().nullable(),
  custodianFee: nullableNumber,
  holdingPeriod: z.string().nullable(),
  purchaseStatus: z.string().nullable(),
  applyStatus: z.string().nullable(),
  redeemStatus: z.string().nullable(),
  company: z.string().nullable(),
  source: z.string().nullable(),
  navDate: z.string().nullable(),
  nav: nullableNumber,
  navChangePercent: nullableNumber,
  estimatedNav: nullableNumber,
  estimatedPremiumRate: nullableNumber,
  valuationDetailsJson: z.string().nullable(),
  arbitrageRecordCount: z.number(),
});

export const list = authProcedure
  .input(z.object({
    ...paginationSchema.shape,
    keyword: z.string().trim().optional(),
    favoriteOnly: z.boolean().optional(),
    reviewedOnly: z.boolean().optional(),
    includeLowValue: z.boolean().optional(),
    typeFilter: fundTypeFilterSchema.optional(),
    sortField: fundSortFieldSchema.optional(),
    sortOrder: sortOrderSchema.optional(),
  }))
  .output(z.object({ items: z.array(FundListItemSchema), count: z.number() }))
  .query(async ({ input, ctx }) => {
    const { keyword, favoriteOnly, reviewedOnly, includeLowValue, typeFilter, sortField, sortOrder } = input;
    const pageSize = input.pageSize ?? 50;
    const page = input.page ?? 1;
    const em = await forkEntityManager();
    const user = await em.findOneOrFail(User, { id: ctx.user.id });
    const favoriteCodes = parseFavoriteFundCodes(user?.favoriteFundCodesJson);
    const favoriteCodeSet = new Set(favoriteCodes);
    const where: Record<string, unknown> = {};

    if (favoriteOnly) {
      if (!favoriteCodes.length) return { items: [], count: 0 };
      where.code = { $in: favoriteCodes };
    }

    if (reviewedOnly) {
      where.reviewed = true;
    }

    if (!includeLowValue) {
      where.lowValue = false;
    }

    if (keyword) {
      where.$or = [
        { code: { $like: `%${keyword}%` } },
        { name: { $like: `%${keyword}%` } },
      ];
    }

    const items = await em.find(Fund, where, { orderBy: { code: "asc" } });
    const marketIndices = await em.find(MarketIndex, {});
    const filteredItems = filterFundsByType(items, marketIndices, typeFilter);
    const count = filteredItems.length;
    const sortedItems = sortFundsForUser(filteredItems, favoriteCodeSet, marketIndices, sortField, sortOrder);
    const pagedItems = sortedItems.slice((page - 1) * pageSize, page * pageSize);
    const pagedCodes = pagedItems.map((item) => item.code);
    const arbitrageRecords = pagedCodes.length
      ? await em.find(FundArbitrageRedemption, { user, fundCode: { $in: pagedCodes } })
      : [];
    const arbitrageRecordCountMap = arbitrageRecords.reduce<Record<string, number>>((map, item) => {
      map[item.fundCode] = (map[item.fundCode] ?? 0) + 1;
      return map;
    }, {});
    const now = new Date();

    return {
      items: pagedItems.map((item) => {
        const indexRelation = resolveFundIndexRelation(item, marketIndices);
        const isHongKongMarketClosedFund = isHongKongMarketFund(item)
          && !isHongKongMarketTradingDay(now);
        const indexChangePercent = isHongKongMarketClosedFund
          ? null
          : indexRelation.changePercent ?? toNullableNumber(item.indexChangePercent);

        return {
          id: item.id,
          favorite: favoriteCodeSet.has(item.code),
          reviewed: Boolean(item.reviewed),
          lowValue: Boolean(item.lowValue),
          category: indexRelation.name ?? item.category ?? null,
          fundType: item.fundType ?? null,
          marketIndexCode: indexRelation.code,
          marketIndexName: indexRelation.name,
          code: item.code,
          name: item.name,
          currentPrice: toNullableNumber(item.currentPrice),
          dailyChangePercent: toNullableNumber(item.dailyChangePercent),
          dailyVolume: toNullableNumber(item.dailyVolume),
          exchangeShares: toNullableNumber(item.exchangeShares),
          turnoverRate: toNullableNumber(item.turnoverRate),
          indexChangePercent,
          purchaseFee: toNullableNumber(item.purchaseFee),
          redemptionFee7d: toNullableNumber(item.redemptionFee7d),
          redemptionFeeRule: item.redemptionFeeRule ?? null,
          custodianFee: toNullableNumber(item.custodianFee),
          holdingPeriod: item.holdingPeriod ?? null,
          purchaseStatus: item.purchaseStatus ?? null,
          applyStatus: item.applyStatus ?? null,
          redeemStatus: item.redeemStatus ?? null,
          company: item.company ?? null,
          source: item.source ?? null,
          navDate: formatDate(item.navDate),
          nav: toNullableNumber(item.nav),
          navChangePercent: toNullableNumber(item.navChangePercent),
          estimatedNav: toNullableNumber(item.estimatedNav),
          estimatedPremiumRate: toNullableNumber(item.estimatedPremiumRate),
          valuationDetailsJson: item.valuationDetailsJson ?? null,
          arbitrageRecordCount: arbitrageRecordCountMap[item.code] ?? 0,
        };
      }),
      count,
    };
  });

export const updateReviewed = authProcedure
  .input(z.object({
    code: z.string().trim().min(1),
    reviewed: z.boolean().optional(),
  }))
  .output(z.object({ reviewed: z.boolean() }))
  .mutation(async ({ input }) => {
    const em = await forkEntityManager();
    const fund = await em.findOneOrFail(Fund, { code: input.code });
    const nextReviewed = input.reviewed ?? !fund.reviewed;

    if (nextReviewed && !fund.reviewed) {
      const marketIndices = await em.find(MarketIndex, {});
      const indexRelation = resolveFundIndexRelation(fund, marketIndices);
      fund.indexCode = indexRelation.code ?? undefined;
      if (indexRelation.name) fund.category = indexRelation.name;
    }
    fund.reviewed = nextReviewed;
    await em.flush();

    return { reviewed: nextReviewed };
  });

export const updateLowValue = adminAuthProcedure
  .input(z.object({
    code: z.string().trim().min(1),
    lowValue: z.boolean().optional(),
  }))
  .output(z.object({ lowValue: z.boolean() }))
  .mutation(async ({ input }) => {
    const em = await forkEntityManager();
    const fund = await em.findOneOrFail(Fund, { code: input.code });
    const nextLowValue = input.lowValue ?? !fund.lowValue;

    fund.lowValue = nextLowValue;
    await em.flush();

    return { lowValue: nextLowValue };
  });

export const daily = authProcedure
  .input(z.object({
    code: z.string().trim().min(1),
  }))
  .output(z.object({
    fund: z.object({
      code: z.string(),
      name: z.string(),
    }),
    items: z.array(FundDailyItemSchema),
  }))
  .query(async ({ input }) => {
    const em = await forkEntityManager();
    const fund = await em.findOneOrFail(Fund, { code: input.code });
    const items = await em.find(FundDaily, { fund }, { orderBy: { date: "desc", id: "desc" } });

    return {
      fund: {
        code: fund.code,
        name: fund.name,
      },
      items: items.map((item) => ({
        id: item.id,
        date: formatDate(item.date),
        closePrice: toNullableNumber(item.closePrice),
        nav: toNullableNumber(item.nav),
        navChangePercent: toNullableNumber(item.navChangePercent),
        estimatedNav: toNullableNumber(item.estimatedNav),
        exchangeShares: toNullableNumber(item.exchangeShares),
        exchangeSharesChange: toNullableNumber(item.exchangeSharesChange),
        closePremiumRate: toNullableNumber(item.closePremiumRate),
        navPremiumRate: toNullableNumber(item.navPremiumRate),
        premiumErrorRate: toNullableNumber(item.premiumErrorRate),
        createTime: formatDateTime(item.createTime),
        updateTime: formatDateTime(item.updateTime),
      })),
    };
  });

export const listPricePins = authProcedure
  .input(z.object({
    ...paginationSchema.shape,
    keyword: z.string().trim().optional(),
    pinType: z.nativeEnum(FundPricePinType).optional(),
    needle: z.boolean().optional(),
    sortField: pricePinSortFieldSchema.optional(),
    sortOrder: sortOrderSchema.optional(),
  }))
  .output(z.object({ items: z.array(FundPricePinItemSchema), count: z.number() }))
  .query(async ({ input }) => {
    const pageSize = input.pageSize ?? 50;
    const page = input.page ?? 1;
    const em = await forkEntityManager();
    const where: Record<string, unknown> = {};

    if (input.keyword) {
      where.$or = [
        { fundCode: { $like: `%${input.keyword}%` } },
        { fundName: { $like: `%${input.keyword}%` } },
      ];
    }
    if (input.pinType) where.pinType = input.pinType;
    if (input.needle !== undefined) where.needle = input.needle;

    const orderBy = input.sortField && input.sortOrder
      ? { [input.sortField]: input.sortOrder, id: "desc" as const }
      : { pinDate: "desc" as const, id: "desc" as const };
    const [[items, count], matchingItems] = await Promise.all([
      em.findAndCount(FundPricePin, where, {
        orderBy,
        limit: pageSize,
        offset: (page - 1) * pageSize,
      }),
      em.find(FundPricePin, where, { fields: ["fundCode"]}),
    ]);
    const occurrenceCountByFundCode = matchingItems.reduce<Record<string, number>>((result, item) => {
      result[item.fundCode] = (result[item.fundCode] ?? 0) + 1;
      return result;
    }, {});

    return {
      items: items.map((item) => ({
        id: item.id,
        fundCode: item.fundCode,
        fundName: item.fundName,
        occurrenceCount: occurrenceCountByFundCode[item.fundCode] ?? 0,
        pinDate: formatDate(item.pinDate),
        openPrice: toNullableNumber(item.openPrice),
        closePrice: toNullableNumber(item.closePrice),
        highPrice: toNullableNumber(item.highPrice),
        lowPrice: toNullableNumber(item.lowPrice),
        highDeviationPercent: toNullableNumber(item.highDeviationPercent),
        lowDeviationPercent: toNullableNumber(item.lowDeviationPercent),
        thresholdPercent: toNullableNumber(item.thresholdPercent),
        needleThresholdPercent: toNullableNumber(item.needleThresholdPercent),
        needle: Boolean(item.needle),
        pinType: item.pinType,
        source: item.source ?? null,
        detectedAt: formatDateTime(item.detectedAt),
      })),
      count,
    };
  });

export const listArbitrageRedemptions = authProcedure
  .input(z.object({
    fundCode: z.string().trim().min(1),
  }))
  .output(z.object({ items: z.array(FundArbitrageRedemptionItemSchema) }))
  .query(async ({ input, ctx }) => {
    const em = await forkEntityManager();
    const user = await em.findOneOrFail(User, { id: ctx.user.id });
    const items = await em.find(
      FundArbitrageRedemption,
      { user, fundCode: input.fundCode },
      { orderBy: { buyDate: "desc", id: "desc" } },
    );

    return { items: items.map(formatArbitrageRedemptionItem) };
  });

export const createArbitrageRedemption = authProcedure
  .input(z.object({
    fundCode: z.string().trim().min(1),
    buyDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    shares: z.number().positive(),
    buyMethod: arbitrageBuyMethodSchema,
    remark: z.string().trim().max(1000).optional(),
  }))
  .output(FundArbitrageRedemptionItemSchema)
  .mutation(async ({ input, ctx }) => {
    const em = await forkEntityManager();
    const user = await em.findOneOrFail(User, { id: ctx.user.id });
    const fund = await em.findOneOrFail(Fund, { code: input.fundCode });
    const buyDate = parseTradeDate(input.buyDate);
    const redeemableDate = calculateRedeemableDate(fund, buyDate, input.buyMethod);
    const redemptionFee = calculateRedemptionFee(fund, buyDate, redeemableDate);
    const item = new FundArbitrageRedemption({
      user,
      fundName: fund.name,
      fundCode: fund.code,
      shares: input.shares,
      buyDate,
      redeemableDate,
      redemptionFee,
      buyMethod: input.buyMethod,
      remark: input.remark || undefined,
    });

    em.persist(item);
    await em.flush();

    return formatArbitrageRedemptionItem(item);
  });


export const deleteArbitrageRedemption = authProcedure
  .input(z.object({
    id: z.number().int().positive(),
  }))
  .output(z.object({ success: z.boolean() }))
  .mutation(async ({ input, ctx }) => {
    const em = await forkEntityManager();
    const user = await em.findOneOrFail(User, { id: ctx.user.id });
    const item = await em.findOneOrFail(FundArbitrageRedemption, { id: input.id, user });

    await em.removeAndFlush(item);

    return { success: true };
  });

export const updateFavorite = authProcedure
  .input(z.object({
    code: z.string().trim().min(1),
    favorite: z.boolean().optional(),
  }))
  .output(z.object({ favorite: z.boolean(), favoriteFundCodes: z.array(z.string()) }))
  .mutation(async ({ input, ctx }) => {
    const em = await forkEntityManager();
    const user = await em.findOneOrFail(User, { id: ctx.user.id });
    const fund = await em.findOneOrFail(Fund, { code: input.code });
    const favoriteCodes = parseFavoriteFundCodes(user.favoriteFundCodesJson);
    const favoriteCodeSet = new Set(favoriteCodes);
    const nextFavorite = input.favorite ?? !favoriteCodeSet.has(fund.code);

    if (nextFavorite) favoriteCodeSet.add(fund.code);
    else favoriteCodeSet.delete(fund.code);

    const nextFavoriteCodes = [...favoriteCodeSet].sort();
    user.favoriteFundCodesJson = JSON.stringify(nextFavoriteCodes);
    await em.flush();

    return {
      favorite: nextFavorite,
      favoriteFundCodes: nextFavoriteCodes,
    };
  });

function formatArbitrageRedemptionItem(item: FundArbitrageRedemption) {
  return {
    id: item.id,
    fundName: item.fundName,
    fundCode: item.fundCode,
    shares: toNullableNumber(item.shares),
    buyDate: formatDate(item.buyDate),
    redeemableDate: formatDate(item.redeemableDate),
    redemptionFee: toNullableNumber(item.redemptionFee),
    buyMethod: item.buyMethod,
    remark: item.remark ?? null,
    createTime: formatDateTime(item.createTime),
    updateTime: formatDateTime(item.updateTime),
  };
}

function parseTradeDate(value: string) {
  return new Date(value + "T00:00:00.000Z");
}

function addTradingDays(value: Date, days: number) {
  const next = new Date(value.getTime());
  let remaining = days;

  while (remaining > 0) {
    next.setUTCDate(next.getUTCDate() + 1);
    const day = next.getUTCDay();
    if (day !== 0 && day !== 6) remaining -= 1;
  }

  return next;
}

function calculateRedeemableDate(fund: Fund, buyDate: Date, buyMethod: FundArbitrageBuyMethod) {
  const isQdii = Boolean(fund.fundType?.includes("QDII"));
  const tradingDays = isQdii
    ? buyMethod === FundArbitrageBuyMethod.EXCHANGE_SUBSCRIBE ? 5 : 3
    : buyMethod === FundArbitrageBuyMethod.EXCHANGE_SUBSCRIBE ? 5 : 4;

  return addTradingDays(buyDate, tradingDays);
}

function calculateRedemptionFee(fund: Fund, buyDate: Date, redeemableDate: Date) {
  const holdingDays = Math.floor((redeemableDate.getTime() - buyDate.getTime()) / 86400000);
  const feeFromRule = parseRedemptionFeeByHoldingDays(fund.redemptionFeeRule, holdingDays);
  if (feeFromRule !== undefined) return feeFromRule;
  if (holdingDays < 7) return 1.5;
  return toNullableNumber(fund.redemptionFee7d) ?? undefined;
}

function parseRedemptionFeeByHoldingDays(rule: string | null | undefined, holdingDays: number) {
  if (!rule) return undefined;

  for (const line of rule.split(/\r?\n|;|；/)) {
    const normalized = normalizeRedemptionRuleLine(line);
    if (!normalized || !redemptionRuleMatchesDays(normalized, holdingDays)) continue;

    const fee = parseLastPercentNumber(normalized);
    if (fee !== undefined) return fee;
  }

  return undefined;
}

function normalizeRedemptionRuleLine(value: string) {
  return value
    .replace(/（含）|\(含\)|含/g, "")
    .replace(/≤|﹤|＜/g, "<")
    .replace(/≥|﹥|＞/g, ">")
    .replace(/＝/g, "=")
    .replace(/日/g, "天")
    .replace(/\s/g, "");
}

function redemptionRuleMatchesDays(line: string, holdingDays: number) {
  const range = /(\d+)天[-~至](\d+)天/.exec(line);
  if (range) return holdingDays >= Number(range[1]) && holdingDays <= Number(range[2]);

  const bounded = /(\d+)天(<=|<)[^<>=]*(<|<=)(\d+)天/.exec(line);
  if (bounded) {
    const lower = Number(bounded[1]);
    const upper = Number(bounded[4]);
    const lowerMatches = bounded[2] === "<" ? holdingDays > lower : holdingDays >= lower;
    const upperMatches = bounded[3] === "<" ? holdingDays < upper : holdingDays <= upper;
    return lowerMatches && upperMatches;
  }

  const lessThan = /(?:小于|少于|不足|不满|<)(\d+)天/.exec(line);
  if (lessThan) return holdingDays < Number(lessThan[1]);

  const lessOrEqual = /(?:<=)(\d+)天/.exec(line);
  if (lessOrEqual) return holdingDays <= Number(lessOrEqual[1]);

  const greaterOrEqual = /(?:>=|不少于|不低于|大于等于)(\d+)天/.exec(line);
  if (greaterOrEqual) return holdingDays >= Number(greaterOrEqual[1]);

  const greaterThan = /(?:>|超过|大于)(\d+)天/.exec(line);
  if (greaterThan) return holdingDays > Number(greaterThan[1]);

  const above = /(\d+)天(?:及以上|以上)/.exec(line);
  if (above) return holdingDays >= Number(above[1]);

  const within = /(\d+)天(?:以内|以下|内)/.exec(line);
  if (within) return holdingDays <= Number(within[1]);

  return false;
}

function parseLastPercentNumber(value: string) {
  const matches = [...value.matchAll(/(\d+(?:\.\d+)?)%/g)];
  const match = matches.at(-1);
  return match ? Number(match[1]) : undefined;
}

function parseFavoriteFundCodes(value: string | null | undefined) {
  if (!value) return [];

  try {
    const parsed = JSON.parse(value) as unknown;
    if (!Array.isArray(parsed)) return [];

    return parsed
      .filter((item): item is string => typeof item === "string" && item.trim().length > 0)
      .map((item) => item.trim());
  } catch {
    return [];
  }
}


function filterFundsByType(
  items: Fund[],
  marketIndices: MarketIndex[],
  typeFilter: z.infer<typeof fundTypeFilterSchema> | undefined,
) {
  if (!typeFilter) return items;

  return items.filter((fund) => {
    const hasMarketIndex = hasQueriedMarketIndex(fund, marketIndices);

    if (typeFilter === "index") return hasMarketIndex && fund.fundType === "A股指数基金";
    if (typeFilter === "qdii") return fund.fundType === "QDII" || Boolean(fund.fundType?.includes("QDII"));
    if (typeFilter === "stock") return fund.fundType === "股票型基金";
    if (typeFilter === "europeAmericaQdii") return fund.fundType === "欧美指数QDII";
    if (typeFilter === "asiaQdii") return fund.fundType === "亚洲指数QDII";
    if (typeFilter === "commodityQdii") return fund.fundType === "商品QDII";
    return (fund.fundType === "A股股票基金" || fund.fundType === "股票型基金") && !hasMarketIndex;
  });
}

function sortFundsForUser(
  items: Fund[],
  favoriteCodeSet: Set<string>,
  marketIndices: MarketIndex[],
  sortField: z.infer<typeof fundSortFieldSchema> | undefined,
  sortOrder: z.infer<typeof sortOrderSchema> | undefined,
) {
  return [...items].sort((a, b) => {
    if (sortField && sortOrder) {
      const sortDiff = compareNullableNumber(a[sortField], b[sortField]);
      if (sortDiff !== 0) return sortOrder === "asc" ? sortDiff : -sortDiff;
      return a.code.localeCompare(b.code);
    }

    const favoriteDiff = Number(favoriteCodeSet.has(b.code)) - Number(favoriteCodeSet.has(a.code));
    if (favoriteDiff !== 0) return favoriteDiff;

    const indexRelationDiff = Number(hasQueriedMarketIndex(b, marketIndices))
      - Number(hasQueriedMarketIndex(a, marketIndices));
    if (indexRelationDiff !== 0) return indexRelationDiff;

    return a.code.localeCompare(b.code);
  });
}

function hasQueriedMarketIndex(fund: Fund, marketIndices: MarketIndex[]) {
  return resolveFundIndexRelation(fund, marketIndices).code !== null;
}

function compareNullableNumber(a: number | undefined, b: number | undefined) {
  if (a === undefined && b === undefined) return 0;
  if (a === undefined) return 1;
  if (b === undefined) return -1;
  return a - b;
}
