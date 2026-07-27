import { Migration } from "@mikro-orm/migrations";

export class Migration20260618100000 extends Migration {

  async up(): Promise<void> {
    this.addSql("alter table `fund_price_pin` add `open_price` decimal(12,4) null after `pin_date`;");
    this.addSql(
      "alter table `fund_price_pin` add `needle_threshold_percent` decimal(8,4) not null "
      + "default 4 after `threshold_percent`;",
    );
    this.addSql(
      "alter table `fund_price_pin` add `needle` tinyint not null "
      + "default false after `needle_threshold_percent`;",
    );
  }

  async down(): Promise<void> {
    this.addSql("alter table `fund_price_pin` drop column `needle`;");
    this.addSql("alter table `fund_price_pin` drop column `needle_threshold_percent`;");
    this.addSql("alter table `fund_price_pin` drop column `open_price`;");
  }

}
