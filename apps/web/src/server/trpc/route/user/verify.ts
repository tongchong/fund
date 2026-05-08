import { TRPCError } from "@trpc/server";
import jwt from "jsonwebtoken";
import { procedure, router } from "src/server/trpc/def";
import { JWT_SECRET } from "src/server/trpc/middleware/verifyToken";
import redis from "src/utils/redis/redis";
import { z } from "zod";

// 定义 Token 验证输入模式
export const VerifyTokenInput = z.object({
  token: z.string(),
});

// 定义 Token 验证响应模式
export const VerifyTokenResponseSchema = z.object({
  isValid: z.boolean(),
  role: z.string().nullable(), // 添加 role 字段
  message: z.string(),
});

// 创建 auth 路由器
export const verifyToken = router({
  verifyToken: procedure
    .meta({
      openapi: {
        method: "POST",
        path: "/auth/verify-token",
        tags: ["auth"],
        summary: "验证用户 Token",
      },
    })
    .input(VerifyTokenInput)
    .output(VerifyTokenResponseSchema)
    .mutation(async ({ input }) => {
      try {
        const { token } = input;

        // 解码 JWT 以获取用户ID和过期时间
        const decoded = jwt.verify(token, JWT_SECRET) as { id: string, exp: number };

        // 从 Redis 中获取存储的令牌
        const storedSession = await redis.get(`session:${decoded.id}`);

        if (!storedSession) {
          throw new TRPCError({
            code: "UNAUTHORIZED",
            message: "Token not found or expired",
          });
        }

        const { token: storedToken, role } = JSON.parse(storedSession);

        // 检查 token 是否匹配
        if (storedToken !== token) {
          throw new TRPCError({
            code: "UNAUTHORIZED",
            message: "Invalid token",
          });
        }

        // 成功验证，返回 isValid 和 role
        return { isValid: true, role, message: "Token is valid" };
      } catch (error) {
        if (error instanceof jwt.TokenExpiredError) {
          throw new TRPCError({
            code: "UNAUTHORIZED",
            message: "Token has expired" + " " + "exp time:" + error.expiredAt.toISOString(),
          });
        } else if (error instanceof jwt.JsonWebTokenError) {
          throw new TRPCError({
            code: "UNAUTHORIZED",
            message: "Invalid token",
          });
        } else {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "An unknown error occurred",
          });
        }
      }
    }),
});
