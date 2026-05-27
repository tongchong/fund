import { Migration } from "@mikro-orm/migrations";

export class Migration20260520093000 extends Migration {

  async up(): Promise<void> {
    this.addSql(
      "insert into `market_index` (`code`, `market`, `name`) values ('000984', 1, '300等权') "
      + "on duplicate key update `name` = values(`name`), `market` = values(`market`);",
    );
    this.addSql("update `fund` set `category` = '300等权', `fund_type` = 'A股指数基金' where `code` = '163821';");
  }

  async down(): Promise<void> {
    this.addSql("update `fund` set `category` = null where `code` = '163821' and `category` = '300等权';");
  }

}
