import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

interface UserState {
  id: number | null;
  username: string | null;
  role: string | null;
  envVariables: {
    LLM_R1?: string | undefined;
    LLM_V3?: string | undefined;
    MODEL_R1?: string | undefined;
    MODEL_V3?: string | undefined;
    MODEL3?: string | undefined; // 可选的模型变量
    MODEL4?: string | undefined; // 可选的模型变量
    LLM_MODEL3?: string | undefined;// 可选的模型变量
  };
  setUser: (id: number, username: string, role: string) => void;
  setEnvVariables: (env: { LLM_R1?: string | undefined; LLM_V3?: string | undefined; MODEL_R1?: string | undefined;
    MODEL_V3?: string | undefined; MODEL3?: string | undefined;
    MODEL4?: string | undefined; LLM_MODEL3?: string | undefined;
  }) => void;
  clearUser: () => void;
}

export const useUserStore = create<UserState>()(
  persist(
    (set) => ({
      id: null,
      username: null,
      role: null,
      envVariables: {
        LLM_R1: undefined,
        LLM_V3: undefined,
        MODEL_R1: undefined,
        MODEL_V3: undefined,
        MODEL3: undefined, // 可选的模型变量
        MODEL4: undefined, // 可选的模型变量
        LLM_MODEL3: undefined, // 可选的模型变量
      },
      setUser: (id, username, role) => set({ id, username, role }),
      setEnvVariables: (env) => set({ envVariables: env }),
      clearUser: () => set({ id: null, username: null, role: null, envVariables:  {
        LLM_R1: undefined,
        LLM_V3: undefined,
        MODEL_R1: undefined,
        MODEL_V3: undefined,
        MODEL3: undefined, // 可选的模型变量
        MODEL4: undefined, // 可选的模型变量
        LLM_MODEL3: undefined, // 可选的模型变量
      } }),
    }),
    {
      name: "user-store",
      storage: createJSONStorage(() => localStorage),
    },
  ),
);
