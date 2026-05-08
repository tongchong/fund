import { EntityManager } from "@mikro-orm/core";
import { TRPCError } from "@trpc/server";
import { User } from "src/server/db/entities/user";
import { Role } from "src/server/db/entities/user";
import { adminAuthProcedure } from "src/server/trpc/procedure/base";
import { forkEntityManager } from "src/utils/getOrm";
import { z } from "zod";

export const DeleteUserInput = z.object({
  userId: z.number().min(1),
});

export const DeleteUserResponse = z.object({
  success: z.boolean(),
  message: z.string(),
});

export const deleteUser = adminAuthProcedure
  .meta({
    openapi: {
      method: "POST",
      path: "/user/delete",
      tags: ["user"],
      summary: "逻辑删除用户",
    },
  })
  .input(DeleteUserInput)
  .output(DeleteUserResponse)
  .mutation(async ({ input, ctx }) => {
    const em: EntityManager = await forkEntityManager();

    const currentUser = ctx.user;

    if (currentUser.id === input.userId) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "不能删除自己",
      });
    }

    // ✅ 改为 false（查询未删除的用户，delete = 0）
    const userToDelete = await em.findOne(User, { id: input.userId, delete: false });
    if (!userToDelete) {
      throw new TRPCError({ code: "NOT_FOUND", message: "用户未找到或已被删除" });
    }

    // ✅ 改为 false（查询未删除的管理员）
    const adminCount = await em.count(User, { role: Role.ADMIN, delete: false });
    if (userToDelete.role === "ADMIN" && adminCount === 1) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "不能删除系统中的最后一个管理员用户",
      });
    }

    // ✅ 设置为 true（标记为已删除，delete = 1）
    userToDelete.delete = true;
    userToDelete.updateTime = new Date();

    const timestamp = new Date().getTime();
    userToDelete.identity = `${userToDelete.identity}_${timestamp}`;

    await em.flush();

    return {
      success: true,
      message: `用户 ${userToDelete.name} 已被标记为删除，且其身份标识已更新`,
    };
  });
