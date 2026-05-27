import { Migration } from "@mikro-orm/migrations";

export class Migration20260521103000 extends Migration {

  async up(): Promise<void> {
    this.addSql(
      "insert into `market_index` (`code`, `market`, `name`) values ('000841', 1, '800医药') "
      + "on duplicate key update `name` = values(`name`), `market` = values(`market`);",
    );
    this.addSql(
      "update `fund` set `category` = '800医药', `fund_type` = 'A股指数基金' "
      + "where `code` = '165519';",
    );
  }

  async down(): Promise<void> {
    this.addSql(
      "update `fund` set `category` = null, `fund_type` = null "
      + "where `code` = '165519' and `category` = '800医药';",
    );
  }

}
