import { Migration } from "@mikro-orm/migrations";

export class Migration20260518120000 extends Migration {

  async up(): Promise<void> {
    this.addSql("alter table `user` add `favorite_fund_codes_json` text null;");
  }

  async down(): Promise<void> {
    this.addSql("alter table `user` drop column `favorite_fund_codes_json`;");
  }

}
