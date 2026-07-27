import { Migration } from "@mikro-orm/migrations";

export class Migration20260529110000 extends Migration {

  async up(): Promise<void> {
    this.addSql("alter table `fund_arbitrage_redemption` add `shares` decimal(20,4) null after `fund_code`;");
  }

  async down(): Promise<void> {
    this.addSql("alter table `fund_arbitrage_redemption` drop column `shares`;");
  }

}
