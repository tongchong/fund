import { Migration } from "@mikro-orm/migrations";

export class Migration20260626100000 extends Migration {

  async up(): Promise<void> {
    this.addSql("alter table `fund` add `valuation_details_json` text null after `holdings_json`;");
  }

  async down(): Promise<void> {
    this.addSql("alter table `fund` drop column `valuation_details_json`;");
  }

}
