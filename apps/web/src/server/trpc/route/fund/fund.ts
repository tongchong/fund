import { Fund } from "src/server/db/entities/fund";
import { FundDaily } from "src/server/db/entities/fundDaily";
import { MarketIndex } from "src/server/db/entities/marketIndex";
import { User } from "src/server/db/entities/user";
import { resolveFundIndexRelation } from "src/server/fundIndexRelation";
import { forkEntityManager } from "src/utils/getOrm";
import { paginationSchema } from "src/utils/pagination";
import { z } from "zod";

import { authProcedure } from "../../procedure/base";

const nullableNumber = z.number().nullable();
const fundSortFieldSchema = z.enum([
  "dailyChangePercent",
  "turnoverRate",
  "estimatedPremiumRate",
  "purchaseFee",
  "redemptionFee7d",
]);
const sortOrderSchema = z.enum(["asc", "desc"]);
const fundTypeFilterSchema = z.enum(["index", "qdii", "stockWithoutIndex"]);

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
  estimatedNav: nullableNumber,
  exchangeShares: nullableNumber,
  exchangeSharesChange: nullableNumber,
  closePremiumRate: nullableNumber,
  navPremiumRate: nullableNumber,
  premiumErrorRate: nullableNumber,
  createTime: z.string().nullable(),
  updateTime: z.string().nullable(),
});

export const FundListItemSchema = z.object({
  id: z.number(),
  favorite: z.boolean(),
  reviewed: z.boolean(),
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
  holdingPeriod: z.string().nullable(),
  purchaseStatus: z.string().nullable(),
  company: z.string().nullable(),
  source: z.string().nullable(),
  navDate: z.string().nullable(),
  nav: nullableNumber,
  estimatedNav: nullableNumber,
  estimatedPremiumRate: nullableNumber,
});

export const list = authProcedure
  .input(z.object({
    ...paginationSchema.shape,
    keyword: z.string().trim().optional(),
    favoriteOnly: z.boolean().optional(),
    reviewedOnly: z.boolean().optional(),
    typeFilter: fundTypeFilterSchema.optional(),
    sortField: fundSortFieldSchema.optional(),
    sortOrder: sortOrderSchema.optional(),
  }))
  .output(z.object({ items: z.array(FundListItemSchema), count: z.number() }))
  .query(async ({ input, ctx }) => {
    const { keyword, favoriteOnly, reviewedOnly, typeFilter, sortField, sortOrder } = input;
    const pageSize = input.pageSize ?? 50;
    const page = input.page ?? 1;
    const em = await forkEntityManager();
    const user = await em.findOne(User, { id: ctx.user.id });
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

    return {
      items: pagedItems.map((item) => {
        const indexRelation = resolveFundIndexRelation(item, marketIndices);
        const indexChangePercent = indexRelation.changePercent ?? toNullableNumber(item.indexChangePercent);

        return {
          id: item.id,
          favorite: favoriteCodeSet.has(item.code),
          reviewed: item.reviewed,
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
          holdingPeriod: item.holdingPeriod ?? null,
          purchaseStatus: item.purchaseStatus ?? null,
          company: item.company ?? null,
          source: item.source ?? null,
          navDate: formatDate(item.navDate),
          nav: toNullableNumber(item.nav),
          estimatedNav: toNullableNumber(item.estimatedNav),
          estimatedPremiumRate: toNullableNumber(item.estimatedPremiumRate),
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

    fund.reviewed = nextReviewed;
    await em.flush();

    return { reviewed: nextReviewed };
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

    if (typeFilter === "index") return hasMarketIndex;
    if (typeFilter === "qdii") return fund.fundType === "QDII";
    return fund.fundType === "A股股票基金" && !hasMarketIndex;
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
