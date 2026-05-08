import { TRPCError } from "@trpc/server";
import jwt from "jsonwebtoken";
import { parseCookies } from "nookies";
import { Role } from "src/server/db/entities/user";
import { middleware } from "src/server/trpc/def";
import redis from "src/utils/redis/redis";

export const JWT_SECRET = process.env.JWT_SECRET || "";

// 定义 LIBRARY_ADMIN 或 ADMIN 权限验证的中间件
export const libraryAdminMiddleware = middleware(async ({ ctx, next }) => {
  // 从请求头中获取 cookie
  const cookies = parseCookies({ req: ctx.req });
  const token = cookies.token;

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

    // 多端支持：查 session:${userId}:${token}
    const session = await redis.get(`session:${userId}:${token}`);

    if (!session) {
      throw new TRPCError({
        code: "UNAUTHORIZED",
        message: "Redis 中的 session 不存在或已过期",
      });
    }

    const sessionData = JSON.parse(session) as { token: string; role: Role };

    // 检查用户角色是否为 LIBRARY_ADMIN 或 ADMIN
    if (sessionData.role !== Role.LIBRARY_ADMIN && sessionData.role !== Role.ADMIN) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "用户没有 LIBRARY_ADMIN 或 ADMIN 权限",
      });
    }

    // 通过校验，继续
    return next({
      ctx: {
        ...ctx,
        user: {
          id: userId,
          role: sessionData.role,
        },
      },
    });
  } catch {
    throw new TRPCError({ code: "UNAUTHORIZED", message: "无效的 token" });
  }
});
