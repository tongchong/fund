import { Migration } from "@mikro-orm/migrations";

export class Migration20260529100000 extends Migration {

  async up(): Promise<void> {
    this.addSql(
      "create table `fund_arbitrage_redemption` ("
      + "`id` int unsigned not null auto_increment primary key, "
      + "`user_id` int unsigned not null, `fund_name` varchar(128) not null, "
      + "`fund_code` varchar(32) not null, `shares` decimal(20,4) null, "
      + "`buy_date` DATE not null, `redeemable_date` DATE not null, "
      + "`redemption_fee` decimal(8,4) null, `buy_method` varchar(32) not null, "
      + "`remark` text null, `create_time` datetime not null default CURRENT_TIMESTAMP, "
      + "`update_time` datetime not null default CURRENT_TIMESTAMP"
      + ") default character set utf8mb4 engine = InnoDB;",
    );
    this.addSql(
      "alter table `fund_arbitrage_redemption` "
      + "add index `fund_arbitrage_redemption_user_id_index`(`user_id`);",
    );
    this.addSql(
      "alter table `fund_arbitrage_redemption` "
      + "add index `fund_arbitrage_redemption_user_fund_code_index`(`user_id`, `fund_code`);",
    );
    this.addSql(
      "alter table `fund_arbitrage_redemption` "
      + "add constraint `fund_arbitrage_redemption_user_id_foreign` "
      + "foreign key (`user_id`) references `user` (`id`) "
      + "on update cascade on delete cascade;",
    );
  }

  async down(): Promise<void> {
    this.addSql("drop table if exists `fund_arbitrage_redemption`;");
  }

}
