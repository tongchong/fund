import { Migration } from "@mikro-orm/migrations";

export class Migration20260527120000 extends Migration {

  async up(): Promise<void> {
    this.addSql("alter table `fund` add `reviewed` tinyint not null default false after `favorite`;");
  }

  async down(): Promise<void> {
    this.addSql("alter table `fund` drop column `reviewed`;");
  }

}
