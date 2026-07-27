import { EntitySchema } from "@mikro-orm/core";
import { CURRENT_TIMESTAMP, DATETIME_TYPE } from "src/utils/orm";

import { User } from "./user";

export enum FundArbitrageBuyMethod {
  EXCHANGE_BUY = "EXCHANGE_BUY",
  EXCHANGE_SUBSCRIBE = "EXCHANGE_SUBSCRIBE",
}

export class FundArbitrageRedemption {
  id!: number;
  user!: User;
  fundName: string;
  fundCode: string;
  shares?: number;
  buyDate: Date;
  redeemableDate: Date;
  redemptionFee?: number;
  buyMethod: FundArbitrageBuyMethod;
  remark?: string;
  createTime?: Date;
  updateTime?: Date;

  constructor(init: {
    user: User;
    fundName: string;
    fundCode: string;
    shares?: number;
    buyDate: Date;
    redeemableDate: Date;
    redemptionFee?: number;
    buyMethod: FundArbitrageBuyMethod;
    remark?: string;
  }) {
    this.user = init.user;
    this.fundName = init.fundName;
    this.fundCode = init.fundCode;
    this.shares = init.shares;
    this.buyDate = init.buyDate;
    this.redeemableDate = init.redeemableDate;
    this.redemptionFee = init.redemptionFee;
    this.buyMethod = init.buyMethod;
    this.remark = init.remark;
  }
}

export const fundArbitrageRedemptionEntitySchema = new EntitySchema({
  class: FundArbitrageRedemption,
  tableName: "fund_arbitrage_redemption",
  name: "fundArbitrageRedemption",
});

fundArbitrageRedemptionEntitySchema.addPrimaryKey("id", Number);
fundArbitrageRedemptionEntitySchema.addManyToOne(
  "user", "user", { entity: () => User, fieldName: "user_id", referenceColumnName: "id" },
);
fundArbitrageRedemptionEntitySchema.addProperty("fundName", String, { length: 128 });
fundArbitrageRedemptionEntitySchema.addProperty("fundCode", String, { length: 32 });
fundArbitrageRedemptionEntitySchema.addProperty("shares", Number, {
  nullable: true,
  columnType: "decimal(20,4)",
});
fundArbitrageRedemptionEntitySchema.addProperty("buyDate", Date, { columnType: "DATE" });
fundArbitrageRedemptionEntitySchema.addProperty("redeemableDate", Date, { columnType: "DATE" });
fundArbitrageRedemptionEntitySchema.addProperty("redemptionFee", Number, {
  nullable: true,
  columnType: "decimal(8,4)",
});
fundArbitrageRedemptionEntitySchema.addEnum("buyMethod", String, {
  items: () => FundArbitrageBuyMethod,
  length: 32,
});
fundArbitrageRedemptionEntitySchema.addProperty("remark", String, { nullable: true, columnType: "text" });
fundArbitrageRedemptionEntitySchema.addProperty("createTime", Date, {
  columnType: DATETIME_TYPE,
  defaultRaw: CURRENT_TIMESTAMP,
});
fundArbitrageRedemptionEntitySchema.addProperty("updateTime", Date, {
  columnType: DATETIME_TYPE, defaultRaw: CURRENT_TIMESTAMP, onUpdate: () => new Date(),
});
