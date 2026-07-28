# 使用 ARG 设置默认的 npm 镜像源，方便更改
ARG NPM_REGISTRY=https://registry.npmmirror.com

# Stage 1: 构建应用
FROM node:22-alpine AS builder

RUN sed -i 's/dl-cdn.alpinelinux.org/mirrors.ustc.edu.cn/g' /etc/apk/repositories

RUN apk update && apk add git tzdata

# 设置工作目录
WORKDIR /app

# 设置镜像源为国内镜像，加速依赖安装,安装 pnpm
RUN npm config set registry ${NPM_REGISTRY} && \
    npm install -g pnpm

# 复制 monorepo 根目录的 package.json、pnpm-lock.yaml 和 pnpm-workspace.yaml
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml tsconfig.json eslint.config.js turbo.json ./


# 复制子项目的所有文件
COPY apps/web ./apps/web

# 安装依赖
RUN pnpm install


# 构建应用
RUN pnpm run build

# Stage 2: 运行应用
FROM node:22-alpine AS runner

RUN sed -i 's/dl-cdn.alpinelinux.org/mirrors.ustc.edu.cn/g' /etc/apk/repositories

# 设置工作目录
WORKDIR /app

# 从第一个阶段复制构建的文件
COPY --from=builder /app/apps/web/.next ./.next
COPY --from=builder /app/apps/web/next.config.mjs ./next.config.mjs
COPY --from=builder /app/apps/web/start.mjs ./start.mjs
COPY --from=builder /app/apps/web/public ./public
COPY --from=builder /app/apps/web/package.json ./package.json
COPY --from=builder /app/pnpm-lock.yaml ./pnpm-lock.yaml
COPY --from=builder /app/pnpm-workspace.yaml ./pnpm-workspace.yaml


# 设置镜像源为国内镜像，加速依赖安装,安装 pnpm
RUN npm config set registry ${NPM_REGISTRY} && \
    npm install -g pnpm && \
    pnpm i --prod

# 设置环境变量
ENV NODE_ENV=production
ENV TZ=Asia/Shanghai

# 暴露端口
EXPOSE 3000

# 启动应用
CMD ["pnpm", "start"]
