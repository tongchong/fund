// 此处仅放默认public环境变量，私有环境变量仅可在后端使用，前端无法访问
// 开发时环境变量请放在.env.development

export const USE_MOCK = process.env.NEXT_PUBLIC_USE_MOCK === "1";

export const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH || "/demo/xiaosuan";
