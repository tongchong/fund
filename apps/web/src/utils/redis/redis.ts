import Redis from "ioredis";

// 创建 Redis 客户端实例
const redis = new Redis({
  // Redis 主机地址
  host: process.env.REDIS_HOST,

  // Redis 端口号
  port: Number(process.env.REDIS_PORT),

  // 如果 Redis 需要密码，请设置
  password:  process.env.REDIS_PASSWORD,

  // 使用的 Redis 数据库，默认是 0
  db: Number(process.env.REDIS_DB),
});

export default redis;
