import { join } from "node:path";

import { Migrator } from "@mikro-orm/migrations";
import { defineConfig } from "@mikro-orm/mysql";
import { SeedManager } from "@mikro-orm/seeder";
import { entities } from "src/server/db/entities";
import { migrations } from "src/server/db/migrations";


const distPath = "src/server/db";


export const ormConfigs = defineConfig({
  host:process.env.DB_HOST,
  port:Number(process.env.DB_PORT),
  user:process.env.DB_USER,
  dbName:process.env.DB_NAME,
  password:process.env.DB_PASSWORD,
  debug: true,
  forceUndefined: true,
  extensions: [Migrator, SeedManager],
  // 连接池配置
  pool: {
    idleTimeoutMillis: 30000, // 连接空闲超时（毫秒），超时会自动关闭
    acquireTimeoutMillis: 30000, // 获取连接的超时时间
    min: 2, // 连接池的最小连接数
    max: 10, // 连接池的最大连接数
  },
  migrations: {
    pathTs: join(distPath, "migrations"),
    migrationsList: migrations,
  },
  entities: entities,
});

export default Promise.resolve({ ...ormConfigs });
