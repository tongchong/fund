import { Migration } from "@mikro-orm/migrations";

export class Migration20260520103000 extends Migration {

  async up(): Promise<void> {
    this.addSql("update `fund` set `category` = '香港小盘', `fund_type` = '港股指数基金' where `code` = '161124';");
  }

  async down(): Promise<void> {
    this.addSql(
      "update `fund` set `category` = null, `fund_type` = null "
      + "where `code` = '161124' and `category` = '香港小盘' and `fund_type` = '港股指数基金';",
    );
  }

}
