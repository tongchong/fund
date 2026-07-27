import { Migration } from "@mikro-orm/migrations";

export class Migration20260707100000 extends Migration {

  async up(): Promise<void> {
    this.addSql(
      "update `fund` set `category` = '国证有色' "
      + "where `code` = '160221' and `category` = '800有色';",
    );
    this.addSql(
      "update `fund` set `category` = '中证上游' "
      + "where `code` = '161217' and `category` = 'A股资源';",
    );
    this.addSql(
      "update `fund` set `category` = '煤炭等权' "
      + "where `code` = '161724' and `category` = '中证煤炭';",
    );
    this.addSql(
      "update `fund` set `category` = '空天军工' "
      + "where `code` = '160643' and `category` = '中证军工';",
    );
    this.addSql(
      "update `fund` set `category` = 'CS新能车' "
      + "where `code` = '161028' and `category` = '新能源车';",
    );
  }

  async down(): Promise<void> {
    this.addSql(
      "update `fund` set `category` = '800有色' "
      + "where `code` = '160221' and `category` = '国证有色';",
    );
    this.addSql(
      "update `fund` set `category` = 'A股资源' "
      + "where `code` = '161217' and `category` = '中证上游';",
    );
    this.addSql(
      "update `fund` set `category` = '中证煤炭' "
      + "where `code` = '161724' and `category` = '煤炭等权';",
    );
    this.addSql(
      "update `fund` set `category` = '中证军工' "
      + "where `code` = '160643' and `category` = '空天军工';",
    );
    this.addSql(
      "update `fund` set `category` = '新能源车' "
      + "where `code` = '161028' and `category` = 'CS新能车';",
    );
  }

}
