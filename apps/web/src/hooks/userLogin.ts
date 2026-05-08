import { useState } from "react";
import { trpc } from "src/server/trpc/api";

export function useLogin() {
  const [loading, setLoading] = useState(false);

  const userLogin = trpc.login.authRouter.login.useMutation();

  const login = async (identity: string, password: string) => {
    setLoading(true);
    try {
      const response = await userLogin.mutateAsync({ identity, password });
      localStorage.setItem("token", response.token);
      // 可以在此处添加重定向或更新UI逻辑
    } catch (error) {
      console.error("登录失败:", error);
    } finally {
      setLoading(false);
    }
  };

  return { login, loading };
}
