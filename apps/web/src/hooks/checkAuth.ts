import { message as antMessage } from "antd";
import jwt from "jsonwebtoken";
import { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";
import { destroyCookie,parseCookies } from "nookies";

// 定义检查用户是否登录的函数
export function checkAuth(router: AppRouterInstance): void {
  const cookies = parseCookies();
  const token = cookies.token;

  if (!token) {
    antMessage.error("请先登录！");
    router.push("/login");
    return;
  }

  try {
    const decoded = jwt.decode(token);

    if (!decoded) {
      throw new Error("无效的令牌");
    }
  } catch (error) {
    console.error("JWT verification error:", error);
    antMessage.error("登录已过期，请重新登录！");
    destroyCookie(null, "token");
    router.push("/login");
  }
}
