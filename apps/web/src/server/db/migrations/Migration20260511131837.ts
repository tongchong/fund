/* eslint-disable @stylistic/max-len */
import { Migration } from "@mikro-orm/migrations";

export class Migration20260511131837 extends Migration {

  async up(): Promise<void> {
    this.addSql("create table `fund` (`id` int unsigned not null auto_increment primary key, `favorite` tinyint not null default false, `category` varchar(64) null, `code` varchar(32) not null, `name` varchar(128) not null, `current_price` decimal(12,4) null, `daily_change_percent` decimal(8,4) null, `daily_volume` decimal(16,2) null, `turnover_rate` decimal(8,4) null, `index_change_percent` decimal(8,4) null, `purchase_fee` decimal(8,4) null, `redemption_fee7d` decimal(8,4) null, `holding_period` varchar(64) null, `purchase_status` varchar(32) null, `company` varchar(128) null, `nav_date` DATE null, `nav` decimal(12,4) null, `estimated_nav` decimal(12,4) null, `estimated_premium_rate` decimal(8,4) null, `create_time` DATETIME(6) not null default current_timestamp(6), `update_time` DATETIME(6) not null default current_timestamp(6)) default character set utf8mb4 engine = InnoDB;");
    this.addSql("alter table `fund` add unique `fund_code_unique`(`code`);");

    this.addSql("create table `fund_daily` (`id` int unsigned not null auto_increment primary key, `fundId` int unsigned not null, `date` DATE not null, `close_price` decimal(12,4) null, `close_premium_rate` decimal(8,4) null, `nav_premium_rate` decimal(8,4) null, `premium_error_rate` decimal(8,4) null, `create_time` DATETIME(6) not null default current_timestamp(6), `update_time` DATETIME(6) not null default current_timestamp(6)) default character set utf8mb4 engine = InnoDB;");
    this.addSql("alter table `fund_daily` add index `fund_daily_fundId_index`(`fundId`);");

    this.addSql("create table `user` (`id` int unsigned not null auto_increment primary key, `name` varchar(255) not null, `identity` varchar(255) not null, `role` enum('USER', 'LIBRARY_ADMIN', 'ADMIN') not null, `phone` varchar(255) null, `email` varchar(255) null, `password` varchar(255) not null, `delete` tinyint not null default false, `title` varchar(255) null, `remark` varchar(255) null, `enabled` tinyint not null default true, `create_time` DATETIME(6) not null default current_timestamp(6), `update_time` DATETIME(6) not null default current_timestamp(6)) default character set utf8mb4 engine = InnoDB;");

    this.addSql("alter table `fund_daily` add constraint `fund_daily_fundId_foreign` foreign key (`fundId`) references `fund` (`id`) on update cascade;");
  }


  async down(): Promise<void> {
    this.addSql("alter table `fund_daily` drop foreign key `fund_daily_fundId_foreign`;");

    this.addSql("drop table if exists `fund`;");

    this.addSql("drop table if exists `fund_daily`;");

    this.addSql("drop table if exists `user`;");
  }

}
