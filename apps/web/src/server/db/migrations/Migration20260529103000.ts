import { Migration } from "@mikro-orm/migrations";

export class Migration20260529103000 extends Migration {

  async up(): Promise<void> {
    this.addSql("alter table `fund` add `redemption_fee_rule` text null after `redemption_fee7d`;");
  }

  async down(): Promise<void> {
    this.addSql("alter table `fund` drop column `redemption_fee_rule`;");
  }

}
