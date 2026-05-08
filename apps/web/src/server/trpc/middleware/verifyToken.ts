import { TRPCError } from "@trpc/server";
import jwt from "jsonwebtoken";
import { parseCookies } from "nookies";
import { Role } from "src/server/db/entities/user";
import { middleware } from "src/server/trpc/def";
import redis from "src/utils/redis/redis";

export const JWT_SECRET = process.env.JWT_SECRET || "";
export const EXPIRE_TIME = Number(process.env.EXPIRE_TIME) || 36000;

export const authMiddleware = middleware(async ({ ctx, next }) => {
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
    const decoded = jwt.verify(token, JWT_SECRET);

    // 确保 decoded 是 JwtPayload 并且包含 id
    if (typeof decoded === "string" || !("id" in decoded)) {
      throw new TRPCError({ code: "UNAUTHORIZED", message: "无效的 token" });
    }

    const userId = decoded.id as number;

    // 多端支持：查 session:${userId}:${token}
    const session = await redis.get(`session:${userId}:${token}`);

    if (!session) {
      throw new TRPCError({ code: "UNAUTHORIZED", message: "Redis 中的 session 不存在或已过期" });
    }

    const sessionData = JSON.parse(session) as { token: string; role: Role };

    // 不再需要比对 token，因为 key 已唯一
    // if (sessionData.token !== token) {
    //   throw new TRPCError({ code: "UNAUTHORIZED", message: "Redis 中的 token 不匹配" });
    // }

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
