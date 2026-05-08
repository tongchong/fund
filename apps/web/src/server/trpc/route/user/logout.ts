import { TRPCError } from "@trpc/server";
import jwt from "jsonwebtoken";
import { procedure, router } from "src/server/trpc/def";
import redis from "src/utils/redis/redis";
import { z } from "zod";

// 定义用户退出登录输入模式
export const LogoutInput = z.object({
  token: z.string(),
});

// 定义用户退出登录响应模式
export const LogoutResponseSchema = z.object({
  status: z.string(),
  message: z.string(),
});

// 创建用户退出登录的路由器
export const logoutRouter = router({
  logout: procedure
    .meta({
      openapi: {
        method: "POST",
        path: "/auth/logout",
        tags: ["auth"],
        summary: "用户退出登录",
      },
    })
    .input(LogoutInput)
    .output(LogoutResponseSchema)
    .mutation(async ({ input }) => {
      try {
        const { token } = input;

        // 只删除当前token的session
        const decoded = jwt.decode(token) as { id: string | number } | null;
        if (!decoded?.id) {
          throw new TRPCError({
            code: "UNAUTHORIZED",
            message: "Invalid token",
          });
        }

        const sessionKey = `session:${decoded.id}:${token}`;
        const storedSession = await redis.get(sessionKey);

        if (!storedSession) {
          throw new TRPCError({
            code: "UNAUTHORIZED",
            message: "Session not found or already expired",
          });
        }

        // 删除 Redis 中的当前会话信息
        await redis.del(sessionKey);

        return { status: "success", message: "User logged out successfully" };
      } catch (error) {
        if (error instanceof TRPCError) {
          throw error; // 继续抛出已捕获的错误
        } else {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "An error occurred during logout",
          });
        }
      }
    }),
});
