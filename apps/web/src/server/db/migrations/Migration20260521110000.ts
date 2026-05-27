import { Migration } from "@mikro-orm/migrations";

export class Migration20260521110000 extends Migration {

  async up(): Promise<void> {
    this.addSql("alter table `fund_daily` add `nav` decimal(12,4) null after `close_price`;");
  }

  async down(): Promise<void> {
    this.addSql("alter table `fund_daily` drop column `nav`;");
  }

}
