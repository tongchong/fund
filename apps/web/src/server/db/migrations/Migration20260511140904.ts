/* eslint-disable @stylistic/max-len */
import { Migration } from "@mikro-orm/migrations";

export class Migration20260511140904 extends Migration {

  async up(): Promise<void> {
    this.addSql("create table `market_index` (`id` int unsigned not null auto_increment primary key, `code` varchar(32) not null, `market` tinyint not null, `name` varchar(128) not null, `current_price` decimal(12,4) null, `change_percent` decimal(8,4) null, `change_amount` decimal(12,4) null, `previous_close` decimal(12,4) null, `create_time` DATETIME(6) not null default current_timestamp(6), `update_time` DATETIME(6) not null default current_timestamp(6)) default character set utf8mb4 engine = InnoDB;");
    this.addSql("alter table `market_index` add unique `market_index_code_unique`(`code`);");
  }


  async down(): Promise<void> {
    this.addSql("drop table if exists `market_index`;");
  }

}
