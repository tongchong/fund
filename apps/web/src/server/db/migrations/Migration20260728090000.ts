import { Migration } from "@mikro-orm/migrations";

export class Migration20260728090000 extends Migration {

  async up(): Promise<void> {
    this.addSql("alter table `fund` add `index_code` varchar(32) null after `category`;");
    this.addSql(
      "update `fund` as `f` "
      + "inner join `market_index` as `mi` on `mi`.`name` = `f`.`category` "
      + "and `mi`.`instrument_type` is null and coalesce(`mi`.`source`, '') <> 'TENCENT' "
      + "set `f`.`index_code` = `mi`.`code` "
      + "where `f`.`reviewed` = 1 and `f`.`category` is not null;",
    );
  }

  async down(): Promise<void> {
    this.addSql("alter table `fund` drop column `index_code`;");
  }

}
