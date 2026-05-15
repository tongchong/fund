import { EntitySchema } from "@mikro-orm/core";
import { CURRENT_TIMESTAMP, DATETIME_TYPE } from "src/utils/orm";

export class Fund {
  id!: number;
  favorite: boolean;
  category?: string;
  fundType?: string;
  code: string;
  name: string;
  currentPrice?: number;
  dailyChangePercent?: number;
  dailyVolume?: number;
  exchangeShares?: number;
  turnoverRate?: number;
  indexChangePercent?: number;
  purchaseFee?: number;
  redemptionFee7d?: number;
  holdingPeriod?: string;
  purchaseStatus?: string;
  company?: string;
  navDate?: Date;
  nav?: number;
  estimatedNav?: number;
  estimatedPremiumRate?: number;
  holdingsJson?: string;
  createTime?: Date;
  updateTime?: Date;

  constructor(init: {
    favorite?: boolean;
    category?: string;
    fundType?: string;
    code: string;
    name: string;
    currentPrice?: number;
    dailyChangePercent?: number;
    dailyVolume?: number;
    exchangeShares?: number;
    turnoverRate?: number;
    indexChangePercent?: number;
    purchaseFee?: number;
    redemptionFee7d?: number;
    holdingPeriod?: string;
    purchaseStatus?: string;
    company?: string;
    navDate?: Date;
    nav?: number;
    estimatedNav?: number;
    estimatedPremiumRate?: number;
    holdingsJson?: string;
  }) {
    this.favorite = init.favorite ?? false;
    this.category = init.category;
    this.fundType = init.fundType;
    this.code = init.code;
    this.name = init.name;
    this.currentPrice = init.currentPrice;
    this.dailyChangePercent = init.dailyChangePercent;
    this.dailyVolume = init.dailyVolume;
    this.exchangeShares = init.exchangeShares;
    this.turnoverRate = init.turnoverRate;
    this.indexChangePercent = init.indexChangePercent;
    this.purchaseFee = init.purchaseFee;
    this.redemptionFee7d = init.redemptionFee7d;
    this.holdingPeriod = init.holdingPeriod;
    this.purchaseStatus = init.purchaseStatus;
    this.company = init.company;
    this.navDate = init.navDate;
    this.nav = init.nav;
    this.estimatedNav = init.estimatedNav;
    this.estimatedPremiumRate = init.estimatedPremiumRate;
    this.holdingsJson = init.holdingsJson;
  }
}

export const fundEntitySchema = new EntitySchema({
  class: Fund,
  tableName: "fund",
  name: "fund",
});

fundEntitySchema.addPrimaryKey("id", Number);
fundEntitySchema.addProperty("favorite", Boolean, { default: false, columnType: "tinyint" });
fundEntitySchema.addProperty("category", String, { nullable: true, length: 64 });
fundEntitySchema.addProperty("fundType", String, { nullable: true, length: 32 });
fundEntitySchema.addProperty("code", String, { length: 32, unique: true });
fundEntitySchema.addProperty("name", String, { length: 128 });
fundEntitySchema.addProperty("currentPrice", Number, { nullable: true, columnType: "decimal(12,4)" });
fundEntitySchema.addProperty("dailyChangePercent", Number, { nullable: true, columnType: "decimal(8,4)" });
fundEntitySchema.addProperty("dailyVolume", Number, { nullable: true, columnType: "decimal(16,2)" });
fundEntitySchema.addProperty("exchangeShares", Number, { nullable: true, columnType: "decimal(20,2)" });
fundEntitySchema.addProperty("turnoverRate", Number, { nullable: true, columnType: "decimal(8,4)" });
fundEntitySchema.addProperty("indexChangePercent", Number, { nullable: true, columnType: "decimal(8,4)" });
fundEntitySchema.addProperty("purchaseFee", Number, { nullable: true, columnType: "decimal(8,4)" });
fundEntitySchema.addProperty("redemptionFee7d", Number, { nullable: true, columnType: "decimal(8,4)" });
fundEntitySchema.addProperty("holdingPeriod", String, { nullable: true, length: 64 });
fundEntitySchema.addProperty("purchaseStatus", String, { nullable: true, length: 32 });
fundEntitySchema.addProperty("company", String, { nullable: true, length: 128 });
fundEntitySchema.addProperty("navDate", Date, { nullable: true, columnType: "DATE" });
fundEntitySchema.addProperty("nav", Number, { nullable: true, columnType: "decimal(12,4)" });
fundEntitySchema.addProperty("estimatedNav", Number, { nullable: true, columnType: "decimal(12,4)" });
fundEntitySchema.addProperty("estimatedPremiumRate", Number, { nullable: true, columnType: "decimal(8,4)" });
fundEntitySchema.addProperty("holdingsJson", String, { nullable: true, columnType: "text" });
fundEntitySchema.addProperty("createTime", Date, { columnType: DATETIME_TYPE, defaultRaw: CURRENT_TIMESTAMP });
fundEntitySchema.addProperty("updateTime", Date, {
  columnType: DATETIME_TYPE, defaultRaw: CURRENT_TIMESTAMP, onUpdate: () => new Date(),
});
