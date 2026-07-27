import { Migration } from "@mikro-orm/migrations";

export class Migration20260603100000 extends Migration {

  async up(): Promise<void> {
    this.addSql("alter table `fund` add `low_value` tinyint not null default false after `reviewed`;");
    this.addSql(
      "update `fund` set `low_value` = true "
      + "where `name` like '%定开%' or `name` like '%定期开放%' "
      + "or `fund_type` like '%定开%' or `fund_type` like '%定期开放%' "
      + "or `category` like '%定开%' or `category` like '%定期开放%';",
    );
  }

  async down(): Promise<void> {
    this.addSql("alter table `fund` drop column `low_value`;");
  }

}
