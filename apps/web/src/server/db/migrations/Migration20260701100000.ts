import { Migration } from "@mikro-orm/migrations";

export class Migration20260701100000 extends Migration {

  async up(): Promise<void> {
    this.addSql(
      "update `fund` set `fund_type` = '股票型基金', `category` = null, "
      + "`index_change_percent` = null, `valuation_details_json` = null where `code` = '501095';",
    );
  }

  async down(): Promise<void> {
    this.addSql("update `fund` set `fund_type` = 'A股指数基金' where `code` = '501095';");
  }

}
