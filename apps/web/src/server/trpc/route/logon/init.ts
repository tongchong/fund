import { EntityManager } from "@mikro-orm/core";
import { TRPCError } from "@trpc/server";
import bcrypt from "bcryptjs";
import { Role, User } from "src/server/db/entities/user";
import { baseProcedure } from "src/server/trpc/procedure/base";
import { forkEntityManager } from "src/utils/getOrm";

import { RegisterInput, RegisterResponseSchema } from "./userLogon";

export const init = baseProcedure
  .meta({
    openapi: {
      method: "POST",
      path: "/init",
      tags: ["auth"],
      summary: "平台初始化，创建管理员用户",
    },
  })
  .input(RegisterInput)
  .output(RegisterResponseSchema)
  .mutation(async ({ input }) => {
    const em: EntityManager = await forkEntityManager();
    const existUser = await em.count(User);
    if (existUser > 0) {
      throw new TRPCError({ code: "CONFLICT", message: "系统已初始化过，请直接登录" });
    }

    const existingIdentity = await em.findOne(User, { identity: input.identity });
    if (existingIdentity) {
      throw new TRPCError({ code: "CONFLICT", message: "用户ID已存在" });
    }

    const newUser = new User({
      name: input.name,
      identity: input.identity,
      role: Role.ADMIN,
      phone: input.phone,
      email: input.email,
      password: await bcrypt.hash(input.password, 10),
      title: input.title,
      remark: input.remark,
      delete: false,
      createTime: new Date(),
      updateTime: new Date(),
      enabled: true,
    });

    await em.persistAndFlush(newUser);

    return { status: "success", message: "系统初始化成功，管理员账号已创建", id: newUser.id };
  });
