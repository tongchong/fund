import { EntitySchema } from "@mikro-orm/core";
import { CURRENT_TIMESTAMP, DATETIME_TYPE } from "src/utils/orm";

import { Fund } from "./fund";

export class FundDaily {
  id!: number;
  fund!: Fund;
  date!: Date;
  closePrice?: number;
  nav?: number;
  estimatedNav?: number;
  exchangeShares?: number;
  exchangeSharesChange?: number;
  closePremiumRate?: number;
  navPremiumRate?: number;
  premiumErrorRate?: number;
  createTime?: Date;
  updateTime?: Date;

  constructor(init: {
    fund: Fund;
    date: Date;
    closePrice?: number;
    nav?: number;
    estimatedNav?: number;
    exchangeShares?: number;
    exchangeSharesChange?: number;
    closePremiumRate?: number;
    navPremiumRate?: number;
    premiumErrorRate?: number;
  }) {
    this.fund = init.fund;
    this.date = init.date;
    this.closePrice = init.closePrice;
    this.nav = init.nav;
    this.estimatedNav = init.estimatedNav;
    this.exchangeShares = init.exchangeShares;
    this.exchangeSharesChange = init.exchangeSharesChange;
    this.closePremiumRate = init.closePremiumRate;
    this.navPremiumRate = init.navPremiumRate;
    this.premiumErrorRate = init.premiumErrorRate;
  }
}

export const fundDailyEntitySchema = new EntitySchema({
  class: FundDaily,
  tableName: "fund_daily",
  name: "fundDaily",
});

fundDailyEntitySchema.addPrimaryKey("id", Number);
fundDailyEntitySchema.addManyToOne(
  "fund", "fund", { entity: () => Fund, fieldName: "fundId", referenceColumnName: "id" },
);
fundDailyEntitySchema.addProperty("date", Date, { columnType: "DATE" });
fundDailyEntitySchema.addProperty("closePrice", Number, { nullable: true, columnType: "decimal(12,4)" });
fundDailyEntitySchema.addProperty("nav", Number, { nullable: true, columnType: "decimal(12,4)" });
fundDailyEntitySchema.addProperty("estimatedNav", Number, { nullable: true, columnType: "decimal(12,4)" });
fundDailyEntitySchema.addProperty("exchangeShares", Number, { nullable: true, columnType: "decimal(20,2)" });
fundDailyEntitySchema.addProperty("exchangeSharesChange", Number, { nullable: true, columnType: "decimal(20,2)" });
fundDailyEntitySchema.addProperty("closePremiumRate", Number, { nullable: true, columnType: "decimal(8,4)" });
fundDailyEntitySchema.addProperty("navPremiumRate", Number, { nullable: true, columnType: "decimal(8,4)" });
fundDailyEntitySchema.addProperty("premiumErrorRate", Number, { nullable: true, columnType: "decimal(8,4)" });
fundDailyEntitySchema.addProperty("createTime", Date, { columnType: DATETIME_TYPE, defaultRaw: CURRENT_TIMESTAMP });
fundDailyEntitySchema.addProperty("updateTime", Date, {
  columnType: DATETIME_TYPE, defaultRaw: CURRENT_TIMESTAMP, onUpdate: () => new Date(),
});
