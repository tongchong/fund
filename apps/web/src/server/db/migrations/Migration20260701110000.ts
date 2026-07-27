import { Migration } from "@mikro-orm/migrations";

export class Migration20260701110000 extends Migration {

  async up(): Promise<void> {
    this.addSql(
      "update `fund` set `estimated_nav` = `nav`, `index_change_percent` = null, "
      + "`estimated_premium_rate` = case when `current_price` is not null and `nav` > 0 "
      + "then round(((`current_price` - `nav`) / `nav`) * 100, 2) else `estimated_premium_rate` end, "
      + "`valuation_details_json` = '{\"modelName\":\"hong-kong-market-closed-nav\","
      + "\"estimatedChangePercent\":0,\"components\":[]}' "
      + "where `nav` is not null and `nav` > 0 and ("
      + "`name` like '%港股%' or coalesce(`category`, '') like '%港股%' "
      + "or `name` like '%恒生%' or coalesce(`category`, '') like '%恒生%' "
      + "or `name` like '%香港%' or coalesce(`category`, '') like '%香港%' "
      + "or `name` like '%H股%' or coalesce(`category`, '') like '%H股%' "
      + "or `name` like '%沪深港%' or coalesce(`category`, '') like '%沪深港%');",
    );
  }

  async down(): Promise<void> {
    this.addSql(
      "update `fund` set `valuation_details_json` = null "
      + "where `valuation_details_json` = '{\"modelName\":\"hong-kong-market-closed-nav\","
      + "\"estimatedChangePercent\":0,\"components\":[]}';",
    );
  }

}
