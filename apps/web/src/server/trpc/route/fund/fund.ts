import { Fund } from "src/server/db/entities/fund";
import { MarketIndex } from "src/server/db/entities/marketIndex";
import { resolveFundIndexRelation } from "src/server/fundIndexRelation";
import { forkEntityManager } from "src/utils/getOrm";
import { paginationProps } from "src/utils/orm";
import { paginationSchema } from "src/utils/pagination";
import { z } from "zod";

import { authProcedure } from "../../procedure/base";

const nullableNumber = z.number().nullable();
const fundSortFieldSchema = z.enum(["dailyChangePercent", "turnoverRate", "estimatedPremiumRate"]);
const sortOrderSchema = z.enum(["asc", "desc"]);

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

export const FundListItemSchema = z.object({
  id: z.number(),
  favorite: z.boolean(),
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
    sortField: fundSortFieldSchema.optional(),
    sortOrder: sortOrderSchema.optional(),
  }))
  .output(z.object({ items: z.array(FundListItemSchema), count: z.number() }))
  .query(async ({ input }) => {
    const { pageSize, page, keyword, favoriteOnly, sortField, sortOrder } = input;
    const em = await forkEntityManager();
    const where: Record<string, unknown> = {};

    if (favoriteOnly) {
      where.favorite = true;
    }

    if (keyword) {
      where.$or = [
        { code: { $like: `%${keyword}%` } },
        { name: { $like: `%${keyword}%` } },
      ];
    }

    const orderBy = sortField && sortOrder
      ? { [sortField]: sortOrder, code: "asc" as const }
      : { code: "asc" as const };

    const [items, count] = await em.findAndCount(Fund, where, {
      ...paginationProps(page, pageSize),
      orderBy,
    });
    const marketIndices = await em.find(MarketIndex, {});

    return {
      items: items.map((item) => {
        const indexRelation = resolveFundIndexRelation(item, marketIndices);
        const indexChangePercent = indexRelation.changePercent ?? toNullableNumber(item.indexChangePercent);

        return {
          id: item.id,
          favorite: !!item.favorite,
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
          navDate: formatDate(item.navDate),
          nav: toNullableNumber(item.nav),
          estimatedNav: toNullableNumber(item.estimatedNav),
          estimatedPremiumRate: toNullableNumber(item.estimatedPremiumRate),
        };
      }),
      count,
    };
  });
