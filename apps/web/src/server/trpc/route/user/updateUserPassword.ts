import { EntityManager } from "@mikro-orm/core";
import { TRPCError } from "@trpc/server";
import bcrypt from "bcryptjs";
import CryptoJS from "crypto-js";
import { Role, User } from "src/server/db/entities/user";
import { authProcedure } from "src/server/trpc/procedure/base";
import { forkEntityManager } from "src/utils/getOrm";
import { z } from "zod";

// AES密钥，需与前端一致
const ENCRYPT_KEY = "xiaosuan";

// 输入模型：接收新密码
export const UpdateUserPasswordInput = z.object({
  userId: z.number().optional(), // 可选的用户ID，若为空则更新当前用户密码
  newPassword: z.string().min(6, "密码至少6位"), // 新密码（前端加密的密文）
});

// 输出模型：返回成功与否的信息
export const UpdateUserPasswordResponse = z.object({
  success: z.boolean(),
  message: z.string(),
});

// 后端函数：更新用户密码
export const updateUserPassword = authProcedure
  .meta({
    openapi: {
      method: "POST",
      path: "/user/update-password",
      tags: ["user"],
      summary: "修改用户密码",
    },
  })
  .input(UpdateUserPasswordInput)
  .output(UpdateUserPasswordResponse)
  .mutation(async ({ input, ctx:{ user } }) => {
    const em: EntityManager = await forkEntityManager();

    // 修改其他用户密码，检查用户角色是否为 ADMIN
    if (input.userId && input.userId !== user.id && user.role !== Role.ADMIN) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "用户没有 ADMIN 权限",
      });
    }

    const userId = input.userId ?? user?.id;
    // 查找要更新的用户
    const userToUpdate = await em.findOne(User, { id: userId });
    if (!userToUpdate) {
      throw new TRPCError({ code: "NOT_FOUND", message: "用户未找到" });
    }

    // 1. 先AES解密前端加密的新密码
    let decryptedPassword: string;
    try {
      decryptedPassword = CryptoJS.AES.decrypt(input.newPassword, ENCRYPT_KEY).toString(CryptoJS.enc.Utf8);
      console.log("Decrypted password invalid:", input.newPassword, decryptedPassword);
      if (!decryptedPassword || decryptedPassword.length < 6) {
        console.log("Decrypted password invalid:", decryptedPassword);
        throw new Error("密码解密失败或长度不足");
      }
    } catch (e: any) {
      throw new TRPCError({ code: "BAD_REQUEST", message: "新密码解密失败" + e.message });
    }

    // 判断新密码是否和原密码一致
    const isSame = await bcrypt.compare(decryptedPassword, userToUpdate.password);
    if (isSame) {
      throw new TRPCError({ code: "BAD_REQUEST", message: "新密码不能和原密码相同" });
    }

    // 加密新密码
    const hashedPassword = await bcrypt.hash(decryptedPassword, 10);
    userToUpdate.password = hashedPassword;
    userToUpdate.updateTime = new Date();

    // 保存更改
    await em.flush();

    return {
      success: true,
      message: `用户 ${userToUpdate.name} 的密码已成功修改`,
    };
  });
