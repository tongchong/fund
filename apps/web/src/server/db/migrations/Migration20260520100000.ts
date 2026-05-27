import { Migration } from "@mikro-orm/migrations";

export class Migration20260520100000 extends Migration {

  async up(): Promise<void> {
    this.addSql("alter table `fund` add `source` varchar(32) null;");
  }

  async down(): Promise<void> {
    this.addSql("alter table `fund` drop column `source`;");
  }

}
