import { EntitySchema } from "@mikro-orm/core";
import { CURRENT_TIMESTAMP, DATETIME_TYPE } from "src/utils/orm";

export class MarketIndex {
  id!: number;
  code: string;
  market: number;
  name: string;
  instrumentType?: string;
  source?: string;
  currentPrice?: number;
  changePercent?: number;
  changeAmount?: number;
  previousClose?: number;
  createTime?: Date;
  updateTime?: Date;

  constructor(init: {
    code: string;
    market: number;
    name: string;
    instrumentType?: string;
    source?: string;
    currentPrice?: number;
    changePercent?: number;
    changeAmount?: number;
    previousClose?: number;
  }) {
    this.code = init.code;
    this.market = init.market;
    this.name = init.name;
    this.instrumentType = init.instrumentType;
    this.source = init.source;
    this.currentPrice = init.currentPrice;
    this.changePercent = init.changePercent;
    this.changeAmount = init.changeAmount;
    this.previousClose = init.previousClose;
  }
}

export const marketIndexEntitySchema = new EntitySchema({
  class: MarketIndex,
  tableName: "market_index",
  name: "marketIndex",
});

marketIndexEntitySchema.addPrimaryKey("id", Number);
marketIndexEntitySchema.addProperty("code", String, { length: 32, unique: true });
marketIndexEntitySchema.addProperty("market", Number, { columnType: "tinyint" });
marketIndexEntitySchema.addProperty("name", String, { length: 128 });
marketIndexEntitySchema.addProperty("instrumentType", String, { nullable: true, length: 16 });
marketIndexEntitySchema.addProperty("source", String, { nullable: true, length: 32 });
marketIndexEntitySchema.addProperty("currentPrice", Number, { nullable: true, columnType: "decimal(12,4)" });
marketIndexEntitySchema.addProperty("changePercent", Number, { nullable: true, columnType: "decimal(8,4)" });
marketIndexEntitySchema.addProperty("changeAmount", Number, { nullable: true, columnType: "decimal(12,4)" });
marketIndexEntitySchema.addProperty("previousClose", Number, { nullable: true, columnType: "decimal(12,4)" });
marketIndexEntitySchema.addProperty("createTime", Date, { columnType: DATETIME_TYPE, defaultRaw: CURRENT_TIMESTAMP });
marketIndexEntitySchema.addProperty("updateTime", Date, {
  columnType: DATETIME_TYPE, defaultRaw: CURRENT_TIMESTAMP, onUpdate: () => new Date(),
});
