import type { CreateNextContextOptions } from "@trpc/server/adapters/next";
import { verify } from "jsonwebtoken";
import type { NextApiRequest, NextApiResponse } from "next";
import { UserInfo } from "src/models/user";
import { JWT_SECRET } from "src/server/trpc/middleware/verifyToken";

export type Context = object;

export type SSRContext<R = any> = Context & {
  req: NextApiRequest;
  res: NextApiResponse<R>;
  user?: UserInfo;
  [key: string]: unknown;
};

export type GlobalContext = SSRContext;

export function isSSRContext(
  ctx: GlobalContext,
): ctx is SSRContext {
  return !!((ctx as SSRContext)?.req && (ctx as SSRContext)?.res);
}

export const createContext = async (
  ctx: CreateNextContextOptions,
): Promise<GlobalContext> => {

  let user: UserInfo | undefined = undefined;

  // 获取请求头中的 Authorization
  const authHeader = ctx.req.headers.authorization;

  if (authHeader) {
    const token = authHeader.split(" ")[1]; // 提取 token

    if (token) {
      try {
        // 使用 JWT 秘钥验证 token
        const decoded = verify(token, JWT_SECRET) as UserInfo;
        user = decoded; // 将解码后的用户信息赋值给 user
      } catch (err) {
        console.error("Invalid token", err);
      }
    }
  }

  return {
    req: ctx.req,
    res: ctx.res,
    user,
  };
};
