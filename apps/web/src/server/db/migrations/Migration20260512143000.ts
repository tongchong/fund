/* eslint-disable @stylistic/max-len */
import { Migration } from "@mikro-orm/migrations";

export class Migration20260512143000 extends Migration {

  async up(): Promise<void> {
    this.addSql("alter table `fund` add `fund_type` varchar(32) null, add `exchange_shares` decimal(20,2) null, add `holdings_json` text null;");
    this.addSql("alter table `market_index` add `instrument_type` varchar(16) null, add `source` varchar(32) null;");
    this.addSql("alter table `fund_daily` add `estimated_nav` decimal(12,4) null, add `exchange_shares` decimal(20,2) null, add `exchange_shares_change` decimal(20,2) null;");
  }

  async down(): Promise<void> {
    this.addSql("alter table `fund_daily` drop column `estimated_nav`, drop column `exchange_shares`, drop column `exchange_shares_change`;");
    this.addSql("alter table `market_index` drop column `instrument_type`, drop column `source`;");
    this.addSql("alter table `fund` drop column `fund_type`, drop column `exchange_shares`, drop column `holdings_json`;");
  }

}
