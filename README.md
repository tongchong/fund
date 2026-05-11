
```markdown
# **项目部署文档**

## **版本信息**
```yaml
version: "3"
```

## **服务描述**
该项目使用 Docker Compose 来管理多个服务，包括：
- **tiny-garlic-rag-dev**：主要应用服务。
- **db**：MySQL 数据库服务。
- **redis**：Redis 缓存服务。

### **1. 项目目录结构**
假设你的项目目录结构如下：

```
/project-root
├── docker-compose.yml
├── Dockerfile
├── .env
└── src/ (你的项目源代码)
```

### **2. 环境变量配置**
以下是项目所需的环境变量，你可以根据实际需求调整这些值。

#### **`.env` 文件**
建议将这些环境变量放到 `.env` 文件中，这样可以更方便地进行管理和配置。

```env
# Redis 配置
REDIS_HOST=redis
REDIS_PORT=6379
REDIS_PASSWORD=testfund!
REDIS_DB=0

# JWT 配置
JWT_SECRET=3x@mpl3!s3cR3tK3y!F0rJWTt0ken$

# 其他配置
NEXT_PUBLIC_USE_MOCK=1
```

#### **docker-compose.yml 环境变量**

在 **docker-compose.yml** 文件中，你可以通过环境变量来设置服务的配置项，避免在配置文件中硬编码敏感信息。例如：

```yaml
services:
  tiny-garlic-rag-dev:
    image: tiny-garlic-rag-dev
    build:
      context: .
      dockerfile: Dockerfile
    command: /bin/sh -c "while sleep 1000; do :; done"
    volumes:
      - ..:/workspace/fund:cached
    environment:
      - REDIS_HOST=${REDIS_HOST}
      - REDIS_PORT=${REDIS_PORT}
      - REDIS_PASSWORD=${REDIS_PASSWORD}
      - REDIS_DB=${REDIS_DB}
      - JWT_SECRET=${JWT_SECRET}
      - NEXT_PUBLIC_USE_MOCK=${NEXT_PUBLIC_USE_MOCK}

  db:
    image: mysql:8
    environment:
      MYSQL_ROOT_PASSWORD: ${MYSQL_ROOT_PASSWORD}
    volumes:
      - "db:/var/lib/mysql"
    ports:
      - 3301:3306

  redis:
    image: redis:alpine
    ports:
      - 6379:6379

volumes:
  db:
```

### **3. 服务配置**
#### **`tiny-garlic-rag-dev`**
- **镜像**：`tiny-garlic-rag-dev`，这是项目的自定义镜像。
- **构建命令**：通过 `Dockerfile` 文件构建镜像。
- **命令**：启动后容器会执行 `while sleep 1000; do :; done`，这意味着容器保持运行，直到你手动停止。
- **卷挂载**：将宿主机上的 `../` 目录挂载到容器的 `/workspace/fund`，确保本地文件能够同步到容器内。
- **环境变量**：通过 `.env` 文件提供 Redis 配置、JWT 密钥等环境变量。

#### **`db`**
- **镜像**：`mysql:8`，使用官方 MySQL 8 镜像。
- **环境变量**：`MYSQL_ROOT_PASSWORD` 用来设置 MySQL 的 root 密码。
- **卷挂载**：持久化存储 MySQL 数据文件。
- **端口映射**：将本地的 3301 端口映射到容器的 3306 端口。

#### **`redis`**
- **镜像**：`redis:alpine`，使用官方的 Redis 镜像，基于轻量级的 Alpine Linux。
- **端口映射**：将本地的 6379 端口映射到容器的 6379 端口。

### **4. 构建和启动服务**
在项目根目录下执行以下命令来构建并启动容器：

```bash
docker-compose up --build
```

该命令会根据 **docker-compose.yml** 中的配置自动构建所有服务的镜像，并启动相关服务。

- **`--build`** 参数表示在启动服务之前先构建镜像。
- 如果服务已经构建过，可以直接使用 `docker-compose up` 来启动。

### **5. 访问服务**
- **应用服务** (`tiny-garlic-rag-dev`) 会监听容器内部的端口。你可以通过配置的端口进行访问，通常你可以将它映射到宿主机的某个端口。
  
- **MySQL 服务**：
  - 端口：`3301`
  - 默认用户名：`root`
  - 默认密码：`mysqlrootpassword`（在 `.env` 文件中配置）
  - 可以使用 MySQL 客户端连接到数据库：`mysql -h 127.0.0.1 -P 3301 -u root -p`

- **Redis 服务**：
  - 端口：`6379`
  - 默认密码：`testfund!`（在 `.env` 文件中配置）
  - 可以使用 Redis 客户端进行连接：`redis-cli -h 127.0.0.1 -p 6379`

### **6. 停止服务**
要停止正在运行的容器，使用以下命令：

```bash
docker-compose down
```

此命令会停止并移除所有容器。如果你只想停止而不移除容器，可以使用：

```bash
docker-compose stop
```

### **7. 清理服务**
如果你希望清理容器、网络、卷和镜像，可以运行：

```bash
docker-compose down --volumes --rmi all
```

这个命令会删除与服务相关的所有容器、网络、卷以及构建的镜像。

---

## **常见问题**

### **1. 容器无法连接到 Redis 或数据库**
- 请检查你是否正确配置了 `.env` 文件中的环境变量 `REDIS_HOST`、`REDIS_PORT` 和 `MYSQL_ROOT_PASSWORD`。
- 确保相关服务已经成功启动并且端口没有冲突。

### **2. 如何查看容器日志？**
你可以使用以下命令查看容器的日志：

```bash
docker-compose logs <service-name>
```

例如，查看 `tiny-garlic-rag-dev` 服务的日志：

```bash
docker-compose logs tiny-garlic-rag-dev
```

### **3. 修改应用代码后如何重新部署？**
你可以通过以下命令重新构建并重新启动服务：

```bash
docker-compose up --build
```

这将重新构建应用容器并重新启动所有服务。

---

