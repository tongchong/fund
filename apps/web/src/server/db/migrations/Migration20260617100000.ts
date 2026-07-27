import { Migration } from "@mikro-orm/migrations";

export class Migration20260617100000 extends Migration {

  async up(): Promise<void> {
    this.addSql(
      "create table `fund_price_pin` ("
      + "`id` int unsigned not null auto_increment primary key, "
      + "`fund_id` int unsigned not null, "
      + "`fund_code` varchar(32) not null, "
      + "`fund_name` varchar(128) not null, "
      + "`pin_date` date not null, "
      + "`close_price` decimal(12,4) not null, "
      + "`high_price` decimal(12,4) not null, "
      + "`low_price` decimal(12,4) not null, "
      + "`high_deviation_percent` decimal(8,4) null, "
      + "`low_deviation_percent` decimal(8,4) null, "
      + "`threshold_percent` decimal(8,4) not null, "
      + "`pin_type` varchar(16) not null, "
      + "`source` varchar(32) null, "
      + "`detected_at` datetime not null default CURRENT_TIMESTAMP, "
      + "`create_time` datetime not null default CURRENT_TIMESTAMP, "
      + "`update_time` datetime not null default CURRENT_TIMESTAMP on update CURRENT_TIMESTAMP"
      + ") default character set utf8mb4 engine = InnoDB;",
    );
    this.addSql(
      "alter table `fund_price_pin` add unique "
      + "`fund_price_pin_fund_id_pin_date_unique`(`fund_id`, `pin_date`);",
    );
    this.addSql("alter table `fund_price_pin` add index `fund_price_pin_pin_date_index`(`pin_date`);");
    this.addSql("alter table `fund_price_pin` add index `fund_price_pin_fund_code_index`(`fund_code`);");
    this.addSql(
      "alter table `fund_price_pin` add constraint `fund_price_pin_fund_id_foreign` "
      + "foreign key (`fund_id`) references `fund` (`id`) on update cascade;",
    );
  }

  async down(): Promise<void> {
    this.addSql("drop table if exists `fund_price_pin`;");
  }

}
