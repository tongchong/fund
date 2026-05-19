import { Migration } from "@mikro-orm/migrations";

export class Migration20260519103000 extends Migration {

  async up(): Promise<void> {
    this.addSql("update `fund` set `category` = '国证地产' where `code` in ('160128', '160218');");
  }

  async down(): Promise<void> {
    this.addSql("update `fund` set `category` = null where `code` in ('160128', '160218') and `category` = '国证地产';");
  }

}
