import jwt from "jsonwebtoken";
import type { NextApiRequest, NextApiResponse } from "next";
import { parseCookies, setCookie } from "nookies";
import { User } from "src/server/db/entities/user";
import { EXPIRE_TIME } from "src/server/trpc/middleware/verifyToken";
import { forkEntityManager } from "src/utils/getOrm";
import redis from "src/utils/redis/redis";

export interface VerifyTokenResult {
  success: true;
  user: User;
  userId: number;
  token: string;
}

export interface VerifyTokenError {
  success: false;
  error: string;
  statusCode: number;
}

export type VerifyTokenResponse = VerifyTokenResult | VerifyTokenError;

/**
 * 验证 API 请求的 Token
 * @param req NextApiRequest
 * @param res NextApiResponse (可选，用于刷新 cookie)
 * @returns 验证结果
 */
export async function verifyTokenFromApi(
  req: NextApiRequest,
  res?: NextApiResponse,
): Promise<VerifyTokenResponse> {
  try {
    // 1. 从 cookie 获取 token
    const cookies = parseCookies({ req });
    const token = cookies.token;

    if (!token) {
      return {
        success: false,
        error: "未提供身份验证 Token",
        statusCode: 401,
      };
    }

    // 2. 验证 token
    let decoded: { id: number; exp: number };
    try {
      decoded = jwt.verify(
        token,
        process.env.JWT_SECRET || "",
      ) as { id: number; exp: number };
    } catch (jwtError: any) {
      if (jwtError.name === "TokenExpiredError") {
        return {
          success: false,
          error: "Token 已过期，请重新登录",
          statusCode: 401,
        };
      }
      if (jwtError.name === "JsonWebTokenError") {
        return {
          success: false,
          error: "无效的 Token",
          statusCode: 401,
        };
      }
      throw jwtError;
    }

    const userId = decoded.id;

    // 3. 刷新 Redis session
    await redis.expire(`session:${userId}`, EXPIRE_TIME);

    // 4. 获取用户信息
    const em = await forkEntityManager();
    const user = await em.findOne(User, { id: userId });

    if (!user) {
      return {
        success: false,
        error: "用户不存在",
        statusCode: 401,
      };
    }

    // 5. 刷新 cookie（如果提供了 res）
    if (res) {
      setCookie({ res }, "token", token, {
        maxAge: EXPIRE_TIME,
        path: "/",
      });
    }

    return {
      success: true,
      user,
      userId,
      token,
    };
  } catch (error: any) {
    console.error("[verifyTokenFromApi] 验证失败:", error);
    return {
      success: false,
      error: error.message || "身份验证失败",
      statusCode: 401,
    };
  }
}

/**
 * 验证 Token 并自动返回错误响应的中间件风格函数
 * @param req NextApiRequest
 * @param res NextApiResponse
 * @returns 用户信息，如果验证失败则返回 null（已自动发送错误响应）
 */
export async function requireAuth(
  req: NextApiRequest,
  res: NextApiResponse,
): Promise<{ user: User; userId: number } | null> {
  const result = await verifyTokenFromApi(req, res);

  if (!result.success) {
    res.status(result.statusCode).json({ error: result.error });
    return null;
  }

  return {
    user: result.user,
    userId: result.userId,
  };
}
