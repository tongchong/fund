import { EntityManager } from "@mikro-orm/core";
import { TRPCError } from "@trpc/server";
import bcrypt from "bcryptjs";
import CryptoJS from "crypto-js";
import { sign } from "jsonwebtoken";
import { User } from "src/server/db/entities/user";
import { procedure, router } from "src/server/trpc/def";
import { JWT_SECRET } from "src/server/trpc/middleware/verifyToken";
import { forkEntityManager } from "src/utils/getOrm";
import redis from "src/utils/redis/redis";
import { z } from "zod";

export const LoginInput = z.object({
  identity: z.string(),
  password: z.string(),
});

export const LoginResponseSchema = z.object({
  token: z.string(),
  id: z.number(),
  username: z.string(),
  role: z.string(),
});

const MAX_FAIL = 5;
const LOCK_TIME_SECONDS = 2 * 60 * 60;
const ENCRYPT_KEY = "xiaosuan";

export const authRouter = router({
  login: procedure
    .meta({
      openapi: {
        method: "POST",
        path: "/auth/login",
        tags: ["auth"],
        summary: "用户登录",
      },
    })
    .input(LoginInput)
    .output(LoginResponseSchema)
    .mutation(async ({ input }) => {
      const em: EntityManager = await forkEntityManager();
      const lockKey = `login:lock:${input.identity}`;
      const failKey = `login:fail:${input.identity}`;

      if (await redis.get(lockKey)) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "该账号因连续输错密码已被锁定，请2小时后再试。",
        });
      }

      const user = await em.findOne(User, { identity: input.identity });
      if (!user) {
        throw new TRPCError({ code: "NOT_FOUND", message: "用户未找到" });
      }
      if (user.delete) {
        throw new TRPCError({ code: "FORBIDDEN", message: "该用户已被删除，请咨询系统管理员" });
      }
      if (!user.enabled) {
        throw new TRPCError({ code: "FORBIDDEN", message: "该用户已被停用，请咨询系统管理员" });
      }

      let decryptedPassword: string;
      try {
        decryptedPassword = CryptoJS.AES.decrypt(input.password, ENCRYPT_KEY).toString(CryptoJS.enc.Utf8);
        if (!decryptedPassword) throw new Error("密码解密失败");
      } catch {
        throw new TRPCError({ code: "UNAUTHORIZED", message: "密码解密失败" });
      }

      const isPasswordValid = await bcrypt.compare(decryptedPassword, user.password);
      if (!isPasswordValid) {
        const failCount = await redis.incr(failKey);
        if (failCount === 1) {
          await redis.expire(failKey, 24 * 60 * 60);
        }
        if (failCount >= MAX_FAIL) {
          await redis.set(lockKey, "1", "EX", LOCK_TIME_SECONDS);
          await redis.del(failKey);
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "该账号因连续输错密码已被锁定，请2小时后再试。",
          });
        }
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: `密码错误，累计${failCount}次，输错${MAX_FAIL}次将锁定账号2小时。`,
        });
      }

      await redis.del(failKey);
      await redis.del(lockKey);

      const token = sign({ id: user.id }, JWT_SECRET, { expiresIn: "1d" });
      await redis.set(
        `session:${user.id}:${token}`,
        JSON.stringify({ token, role: user.role }),
        "EX",
        36000,
      );

      return {
        token,
        id: user.id,
        username: user.identity,
        role: user.role,
      };
    }),
});
