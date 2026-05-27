import { Migration } from "@mikro-orm/migrations";

export class Migration20260520110000 extends Migration {

  async up(): Promise<void> {
    this.addSql(
      "insert into `market_index` (`code`, `market`, `name`, `source`) values "
      + "('HSI', 100, '恒生指数', '腾讯港股指数'), "
      + "('HSTECH', 100, '恒生科技指数', '腾讯港股指数'), "
      + "('HSSI', 100, '恒生综合小型股指数', '恒生指数公司'), "
      + "('HSCHK30', 100, '恒生中国(香港上市)30指数', '恒生指数公司') "
      + "on duplicate key update `name` = values(`name`), `market` = values(`market`), `source` = values(`source`);",
    );
    this.addSql(
      "update `fund` set `fund_type` = '港股指数基金', `category` = case `code` "
      + "when '161124' then '恒生综合小型股指数' "
      + "when '501301' then '恒生中国(香港上市)30指数' "
      + "when '160925' then '恒生指数' "
      + "when '501021' then '标普香港上市中国中小盘精选指数' "
      + "when '501023' then '中证香港中小企业投资主题指数' "
      + "when '501305' then '中证港股通高股息投资指数' "
      + "when '501306' then '中证港股通高股息投资指数' "
      + "when '501307' then '中证沪港深高股息指数' "
      + "when '501311' then '中证港股通新经济指数' "
      + "when '501025' then '香港银行' "
      + "when '160125' then '港股相关' "
      + "when '160322' then '港股相关' "
      + "when '160644' then '港美互联网' "
      + "else `category` end "
      + "where `code` in ('501307', '160125', '160322', '160644', '160925', '161124', "
      + "'501021', '501023', '501025', '501301', '501305', '501306', '501311');",
    );
  }

  async down(): Promise<void> {
    this.addSql(
      "update `fund` set `fund_type` = null, `category` = null "
      + "where `code` in ('501307', '160125', '160322', '160644', '160925', '161124', "
      + "'501021', '501023', '501025', '501301', '501305', '501306', '501311') "
      + "and `fund_type` = '港股指数基金';",
    );
  }

}
