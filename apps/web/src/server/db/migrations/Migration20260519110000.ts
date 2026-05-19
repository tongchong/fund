import { Migration } from "@mikro-orm/migrations";

export class Migration20260519110000 extends Migration {

  async up(): Promise<void> {
    this.addSql("update `fund` set `category` = '证券公司' where `code` in ('502010', '161720', '161027');");
  }

  async down(): Promise<void> {
    this.addSql(
      "update `fund` set `category` = null "
      + "where `code` in ('502010', '161720', '161027') and `category` = '证券公司';",
    );
  }

}
