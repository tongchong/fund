import { EntityManager } from "@mikro-orm/core";
import { TRPCError } from "@trpc/server";
import bcrypt from "bcryptjs";
import CryptoJS from "crypto-js";
import { Role, User } from "src/server/db/entities/user";
import { baseProcedure } from "src/server/trpc/procedure/base";
import { forkEntityManager } from "src/utils/getOrm";
import { z } from "zod";

const ENCRYPT_KEY = "xiaosuan";

export const RegisterInput = z.object({
  identity: z.string().min(3, "用户ID至少3位"),
  name: z.string().min(1, "姓名必填"),
  password: z.string().min(6, "密码至少6位"),
  phone: z.string().optional(),
  email: z.string().optional(),
  title: z.string().optional(),
  remark: z.string().optional(),
  role: z.enum(["USER", "ADMIN", "LIBRARY_ADMIN"]).optional(),
});

export const RegisterResponseSchema = z.object({
  status: z.string(),
  message: z.string(),
  id: z.number(),
});

export const register = baseProcedure
  .meta({
    openapi: {
      method: "POST",
      path: "/auth/register",
      tags: ["auth"],
      summary: "用户注册",
    },
  })
  .input(RegisterInput)
  .output(RegisterResponseSchema)
  .mutation(async ({ input }) => {
    if (process.env.NEXT_PUBLIC_ALLOW_LOGON !== "1") {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "注册功能已关闭",
      });
    }

    const { identity, name, password, phone, email, title, remark, role } = input;
    const em: EntityManager = await forkEntityManager();

    const existingUser = await em.findOne(User, { identity });
    if (existingUser) {
      throw new TRPCError({ code: "CONFLICT", message: "用户ID已存在" });
    }

    let decryptedPassword: string;
    try {
      decryptedPassword = CryptoJS.AES.decrypt(password, ENCRYPT_KEY).toString(CryptoJS.enc.Utf8);
      if (!decryptedPassword) throw new Error("密码解密失败");
    } catch {
      throw new TRPCError({ code: "BAD_REQUEST", message: "密码解密失败" });
    }

    const newUser = new User({
      name,
      identity,
      role: role ? Role[role] : Role.USER,
      phone,
      email,
      password: await bcrypt.hash(decryptedPassword, 10),
      title,
      remark,
      delete: false,
      createTime: new Date(),
      updateTime: new Date(),
      enabled: true,
    });

    await em.persistAndFlush(newUser);

    return { status: "success", message: "用户注册成功", id: newUser.id };
  });
