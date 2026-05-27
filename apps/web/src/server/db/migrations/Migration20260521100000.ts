import { Migration } from "@mikro-orm/migrations";

export class Migration20260521100000 extends Migration {

  async up(): Promise<void> {
    this.addSql(
      "insert into `market_index` (`code`, `market`, `name`) values ('930791', 2, 'CS医药TI') "
      + "on duplicate key update `name` = values(`name`), `market` = values(`market`);",
    );
    this.addSql(
      "update `fund` set `category` = 'CS医药TI', `fund_type` = 'A股指数基金' "
      + "where `code` = '161735';",
    );
  }

  async down(): Promise<void> {
    this.addSql(
      "update `fund` set `category` = null, `fund_type` = null "
      + "where `code` = '161735' and `category` = 'CS医药TI';",
    );
  }

}
