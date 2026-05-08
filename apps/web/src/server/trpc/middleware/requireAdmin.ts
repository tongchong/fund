import { TRPCError } from "@trpc/server";
import { JwtPayload } from "jsonwebtoken"; // 用于处理和验证 token
import { User } from "src/server/db/entities/user";
import { Role } from "src/server/db/entities/user";
import { middleware } from "src/server/trpc/def";
import { forkEntityManager } from "src/utils/getOrm";

// 定义用户类型
interface UserPayload extends JwtPayload {
  name?: string;
  email?: string;
  createTime?: string;
  id: number;
  role: Role; // role 应该是必填字段
}

// Admin 鉴权中间件
export const requireAdmin = middleware(async ({ ctx, next }) => {
  const user = ctx.user as UserPayload;

  // 确保用户有角色且是 Admin
  if (user.role !== "ADMIN") {
    throw new TRPCError({ code: "FORBIDDEN", message: "需要 Admin 权限" });
  }

  try {
    // 验证用户是否存在于数据库
    const em = await forkEntityManager();
    const foundUser = await em.findOne(User, { id: user.id });

    if (!foundUser) {
      throw new TRPCError({ code: "NOT_FOUND", message: "用户未找到" });
    }

    // 将用户信息存入上下文，并继续执行逻辑
    return next({
      ctx: {
        ...ctx,
        user: {
          id: foundUser.id,
          role: foundUser.role, // 确保 role 属性在这里被赋值
        },
      },
    });
  } catch {
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "验证用户过程中发生错误",
    });
  }
});
