import { EntitySchema } from "@mikro-orm/core";
import { CURRENT_TIMESTAMP, DATETIME_TYPE } from "src/utils/orm";

import { Fund } from "./fund";

export enum FundPricePinType {
  HIGH = "HIGH",
  LOW = "LOW",
  BOTH = "BOTH",
}

export class FundPricePin {
  id!: number;
  fund!: Fund;
  fundCode: string;
  fundName: string;
  pinDate: Date;
  openPrice?: number;
  closePrice: number;
  highPrice: number;
  lowPrice: number;
  highDeviationPercent?: number;
  lowDeviationPercent?: number;
  thresholdPercent: number;
  needleThresholdPercent: number;
  needle: boolean;
  pinType: FundPricePinType;
  source?: string;
  detectedAt?: Date;
  createTime?: Date;
  updateTime?: Date;

  constructor(init: {
    fund: Fund;
    fundCode: string;
    fundName: string;
    pinDate: Date;
    openPrice?: number;
    closePrice: number;
    highPrice: number;
    lowPrice: number;
    highDeviationPercent?: number;
    lowDeviationPercent?: number;
    thresholdPercent: number;
    needleThresholdPercent: number;
    needle?: boolean;
    pinType: FundPricePinType;
    source?: string;
    detectedAt?: Date;
  }) {
    this.fund = init.fund;
    this.fundCode = init.fundCode;
    this.fundName = init.fundName;
    this.pinDate = init.pinDate;
    this.openPrice = init.openPrice;
    this.closePrice = init.closePrice;
    this.highPrice = init.highPrice;
    this.lowPrice = init.lowPrice;
    this.highDeviationPercent = init.highDeviationPercent;
    this.lowDeviationPercent = init.lowDeviationPercent;
    this.thresholdPercent = init.thresholdPercent;
    this.needleThresholdPercent = init.needleThresholdPercent;
    this.needle = init.needle ?? false;
    this.pinType = init.pinType;
    this.source = init.source;
    this.detectedAt = init.detectedAt;
  }
}

export const fundPricePinEntitySchema = new EntitySchema({
  class: FundPricePin,
  tableName: "fund_price_pin",
  name: "fundPricePin",
});

fundPricePinEntitySchema.addPrimaryKey("id", Number);
fundPricePinEntitySchema.addManyToOne(
  "fund", "fund", { entity: () => Fund, fieldName: "fund_id", referenceColumnName: "id" },
);
fundPricePinEntitySchema.addProperty("fundCode", String, { length: 32 });
fundPricePinEntitySchema.addProperty("fundName", String, { length: 128 });
fundPricePinEntitySchema.addProperty("pinDate", Date, { columnType: "DATE" });
fundPricePinEntitySchema.addProperty("openPrice", Number, { nullable: true, columnType: "decimal(12,4)" });
fundPricePinEntitySchema.addProperty("closePrice", Number, { columnType: "decimal(12,4)" });
fundPricePinEntitySchema.addProperty("highPrice", Number, { columnType: "decimal(12,4)" });
fundPricePinEntitySchema.addProperty("lowPrice", Number, { columnType: "decimal(12,4)" });
fundPricePinEntitySchema.addProperty("highDeviationPercent", Number, { nullable: true, columnType: "decimal(8,4)" });
fundPricePinEntitySchema.addProperty("lowDeviationPercent", Number, { nullable: true, columnType: "decimal(8,4)" });
fundPricePinEntitySchema.addProperty("thresholdPercent", Number, { columnType: "decimal(8,4)" });
fundPricePinEntitySchema.addProperty("needleThresholdPercent", Number, { columnType: "decimal(8,4)", default: 4 });
fundPricePinEntitySchema.addProperty("needle", Boolean, { default: false, columnType: "tinyint" });
fundPricePinEntitySchema.addEnum("pinType", String, { items: () => FundPricePinType, length: 16 });
fundPricePinEntitySchema.addProperty("source", String, { nullable: true, length: 32 });
fundPricePinEntitySchema.addProperty("detectedAt", Date, { columnType: DATETIME_TYPE, defaultRaw: CURRENT_TIMESTAMP });
fundPricePinEntitySchema.addProperty("createTime", Date, { columnType: DATETIME_TYPE, defaultRaw: CURRENT_TIMESTAMP });
fundPricePinEntitySchema.addProperty("updateTime", Date, {
  columnType: DATETIME_TYPE, defaultRaw: CURRENT_TIMESTAMP, onUpdate: () => new Date(),
});
