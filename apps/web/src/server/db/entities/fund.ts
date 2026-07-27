import { EntitySchema } from "@mikro-orm/core";
import { CURRENT_TIMESTAMP, DATETIME_TYPE } from "src/utils/orm";

export class Fund {
  id!: number;
  favorite: boolean;
  reviewed: boolean;
  lowValue: boolean;
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
  redemptionFeeRule?: string;
  custodianFee?: number;
  holdingPeriod?: string;
  purchaseStatus?: string;
  applyStatus?: string;
  redeemStatus?: string;
  company?: string;
  source?: string;
  navDate?: Date;
  nav?: number;
  navChangePercent?: number;
  estimatedNav?: number;
  estimatedPremiumRate?: number;
  holdingsJson?: string;
  valuationDetailsJson?: string;
  createTime?: Date;
  updateTime?: Date;

  constructor(init: {
    favorite?: boolean;
    reviewed?: boolean;
    lowValue?: boolean;
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
    redemptionFeeRule?: string;
    custodianFee?: number;
    holdingPeriod?: string;
    purchaseStatus?: string;
    applyStatus?: string;
    redeemStatus?: string;
    company?: string;
    source?: string;
    navDate?: Date;
    nav?: number;
    navChangePercent?: number;
    estimatedNav?: number;
    estimatedPremiumRate?: number;
    holdingsJson?: string;
    valuationDetailsJson?: string;
  }) {
    this.favorite = init.favorite ?? false;
    this.reviewed = init.reviewed ?? false;
    this.lowValue = init.lowValue ?? false;
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
    this.redemptionFeeRule = init.redemptionFeeRule;
    this.custodianFee = init.custodianFee;
    this.holdingPeriod = init.holdingPeriod;
    this.purchaseStatus = init.purchaseStatus;
    this.applyStatus = init.applyStatus;
    this.redeemStatus = init.redeemStatus;
    this.company = init.company;
    this.source = init.source;
    this.navDate = init.navDate;
    this.nav = init.nav;
    this.navChangePercent = init.navChangePercent;
    this.estimatedNav = init.estimatedNav;
    this.estimatedPremiumRate = init.estimatedPremiumRate;
    this.holdingsJson = init.holdingsJson;
    this.valuationDetailsJson = init.valuationDetailsJson;
  }
}

export const fundEntitySchema = new EntitySchema({
  class: Fund,
  tableName: "fund",
  name: "fund",
});

fundEntitySchema.addPrimaryKey("id", Number);
fundEntitySchema.addProperty("favorite", Boolean, { default: false, columnType: "tinyint" });
fundEntitySchema.addProperty("reviewed", Boolean, { default: false, columnType: "tinyint" });
fundEntitySchema.addProperty("lowValue", Boolean, { default: false, columnType: "tinyint" });
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
fundEntitySchema.addProperty("redemptionFeeRule", String, { nullable: true, columnType: "text" });
fundEntitySchema.addProperty("custodianFee", Number, { nullable: true, columnType: "decimal(8,4)" });
fundEntitySchema.addProperty("holdingPeriod", String, { nullable: true, length: 64 });
fundEntitySchema.addProperty("purchaseStatus", String, { nullable: true, length: 32 });
fundEntitySchema.addProperty("applyStatus", String, { nullable: true, length: 32 });
fundEntitySchema.addProperty("redeemStatus", String, { nullable: true, length: 32 });
fundEntitySchema.addProperty("company", String, { nullable: true, length: 128 });
fundEntitySchema.addProperty("source", String, { nullable: true, length: 32 });
fundEntitySchema.addProperty("navDate", Date, { nullable: true, columnType: "DATE" });
fundEntitySchema.addProperty("nav", Number, { nullable: true, columnType: "decimal(12,4)" });
fundEntitySchema.addProperty("navChangePercent", Number, { nullable: true, columnType: "decimal(8,4)" });
fundEntitySchema.addProperty("estimatedNav", Number, { nullable: true, columnType: "decimal(12,4)" });
fundEntitySchema.addProperty("estimatedPremiumRate", Number, { nullable: true, columnType: "decimal(8,4)" });
fundEntitySchema.addProperty("holdingsJson", String, { nullable: true, columnType: "text" });
fundEntitySchema.addProperty("valuationDetailsJson", String, { nullable: true, columnType: "text" });
fundEntitySchema.addProperty("createTime", Date, { columnType: DATETIME_TYPE, defaultRaw: CURRENT_TIMESTAMP });
fundEntitySchema.addProperty("updateTime", Date, {
  columnType: DATETIME_TYPE, defaultRaw: CURRENT_TIMESTAMP, onUpdate: () => new Date(),
});
