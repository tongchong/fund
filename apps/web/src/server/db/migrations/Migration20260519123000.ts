import { Migration } from "@mikro-orm/migrations";

export class Migration20260519123000 extends Migration {

  async up(): Promise<void> {
    this.addSql(
      "insert into `market_index` (`code`, `market`, `name`) values ('000935', 1, '中证信息') "
      + "on duplicate key update `name` = values(`name`), `market` = values(`market`);",
    );
    this.addSql("update `fund` set `category` = '中证信息' where `code` = '160626';");
  }

  async down(): Promise<void> {
    this.addSql("update `fund` set `category` = null where `code` = '160626' and `category` = '中证信息';");
  }

}
