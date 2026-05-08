import { EntityManager } from "@mikro-orm/core";
import { Role,User } from "src/server/db/entities/user";
import { baseProcedure } from "src/server/trpc/procedure/base"; // 使用 authProcedure 进行鉴权
import { forkEntityManager } from "src/utils/getOrm";
import { z } from "zod";

export const checkAdminExists = baseProcedure
  .meta({
    openapi: {
      method: "GET",
      path: "/auth/check-admin",
      tags: ["auth"],
      summary: "检查是否存在 admin 用户",
    },
  })
  .output(
    z.object({
      exists: z.boolean(), // 返回一个布尔值，表示是否存在 admin 用户
    }),
  )
  .query(async () => {
    const em: EntityManager = await forkEntityManager();

    // 查询是否存在角色为 admin 的用户
    const adminUser = await em.findOne(User, { role: Role.ADMIN });

    // 如果存在返回 true，否则返回 false
    return { exists: !!adminUser };
  });
