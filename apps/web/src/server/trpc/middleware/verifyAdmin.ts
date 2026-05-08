import { TRPCError } from "@trpc/server";
import jwt from "jsonwebtoken";
import { parseCookies } from "nookies"; // 用于解析 cookies
import { Role } from "src/server/db/entities/user";
import { middleware } from "src/server/trpc/def";
import redis from "src/utils/redis/redis"; // 使用项目中的 Redis 客户端

export const JWT_SECRET = process.env.JWT_SECRET || "";

// 定义 ADMIN 权限验证的中间件
export const adminMiddleware = middleware(async ({ ctx, next }) => {
  // 从请求头中获取 cookie
  const cookies = parseCookies({ req: ctx.req });
  const token = cookies.token; // 获取名为 'token' 的 cookie

  if (!token) {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "Token is missing from cookies",
    });
  }

  try {
    // 验证 JWT token
    const decoded = jwt.verify(token, JWT_SECRET);

    // 检查 decoded 是否有效并且包含用户 ID
    if (typeof decoded === "string" || !("id" in decoded)) {
      throw new TRPCError({ code: "UNAUTHORIZED", message: "无效的 token" });
    }

    const userId = decoded.id as number;

    // 关键：查的是 session:${userId}:${token}
    const session = await redis.get(`session:${userId}:${token}`);

    if (!session) {
      throw new TRPCError({
        code: "UNAUTHORIZED",
        message: "Redis 中的 session 不存在或已过期",
      });
    }

    // 解析 Redis 中的 session 数据
    const sessionData = JSON.parse(session) as { token: string; role: Role };

    // 检查用户角色是否为 ADMIN
    if (sessionData.role !== Role.ADMIN) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "用户没有 ADMIN 权限",
      });
    }

    // 如果用户具有 ADMIN 权限，继续执行下一个中间件或 resolver
    return next({
      ctx: {
        ...ctx,
        user: {
          id: userId,
          role: sessionData.role, // 确保 role 属性在这里被赋值
        },
      },
    });
  } catch {
    throw new TRPCError({ code: "UNAUTHORIZED", message: "无效的 token" });
  }
});
