import { Migration } from "@mikro-orm/migrations";

export class Migration20260528100000 extends Migration {

  async up(): Promise<void> {
    this.addSql("alter table `fund` add `custodian_fee` decimal(8,4) null after `redemption_fee7d`;");
    this.addSql("alter table `fund` add `apply_status` varchar(32) null after `purchase_status`;");
    this.addSql("alter table `fund` add `redeem_status` varchar(32) null after `apply_status`;");
    this.addSql("alter table `fund` add `nav_change_percent` decimal(8,4) null after `nav`;");
    this.addSql("alter table `fund_daily` add `nav_change_percent` decimal(8,4) null after `nav`;");
  }

  async down(): Promise<void> {
    this.addSql("alter table `fund_daily` drop column `nav_change_percent`;");
    this.addSql("alter table `fund` drop column `nav_change_percent`;");
    this.addSql("alter table `fund` drop column `redeem_status`;");
    this.addSql("alter table `fund` drop column `apply_status`;");
    this.addSql("alter table `fund` drop column `custodian_fee`;");
  }

}
