# Cashback Hub

一个基于 **pnpm workspace** 的外卖返利/优惠券全栈项目，逐步实现纯前端模式与前后端分离模式两种形态。项目遵循 `docs/development-guideline.md` 与 `docs/development-build-plan.md`，当前已完成第一阶段（纯前端应用）并正在构建第二阶段（Fastify 后端代理）。

## 目录结构

```
cashback-hub/
├── apps/
│   ├── frontend/    # Vue3 + Vite 前端，含密钥配置、活动列表/详情
│   └── backend/     # Fastify 后端服务
├── docs/            # 设计规范与实施计划
├── package.json     # 根脚本，统一调试/构建
├── pnpm-workspace.yaml
├── tsconfig.base.json
└── README.md
```

## 快速开始

> 先确保安装 pnpm（推荐 8.x+）与 Node.js 18+。

```bash
pnpm install
```

### 启动前端（纯前端模式）

```bash
pnpm --filter frontend dev
```

- 默认端口：`http://localhost:5173`
- 首次打开请进入“密钥配置”页，填写折淘客 `appkey`、`sid`、`customer_id` 等字段。
- 活动列表使用 alova + IndexedDB 缓存 30 分钟，能在 UI 中看到“缓存”标记。

### 启动后端

后端服务在 `apps/backend`，提供折淘客 API 代理、缓存与日志能力：

```bash
pnpm --filter backend dev
```

> 默认监听 `http://0.0.0.0:3333`，可通过 `.env` 覆盖。

核心能力：

- 环境密钥集中管理（`.env.development` / `.env.production`）
- 折淘客 API 转发、签名与数据脱敏
- Redis 缓存（TTL 默认 20 分钟）+ 手动失效接口
- 请求限流、结构化 JSON 日志、统一响应 `{ code, message, data, traceId }`

## 常用脚本

| 命令 | 说明 |
| --- | --- |
| `pnpm install` | 安装所有 workspace 依赖 |
| `pnpm dev` | 同时启动所有子项目的 dev 脚本（可并行调试） |
| `pnpm -F <app> build` | 构建指定子项目，如 `pnpm -F frontend build` |
| `pnpm -F <app> lint/test/typecheck` | 针对子项目的静态检查与测试（需自行按需补充） |

## 配置与环境变量

复制 `.env.example` 至对应环境，如：

```bash
cp .env.example apps/frontend/.env
```

前端变量以 `VITE_` 前缀注入浏览器。Vite 已配置 `envDir` 指向仓库根目录，可直接在根目录创建 `.env`、`.env.development` 等文件（当然也可在 `apps/frontend` 下单独放置）：

```
VITE_RUNTIME_MODE=frontend        # frontend：直接调用折淘客；backend：交由 Fastify 代理
VITE_API_BASE_URL=http://localhost:3333   # 当运行于 backend 模式时指向代理地址
VITE_ZHE_TAOKE_APPKEY=xxx         # 纯前端模式下在浏览器持久化
VITE_ZHE_TAOKE_SID=xxx
VITE_ZHE_TAOKE_CUSTOMER_ID=xxx
```

后端 `.env` 示例：

```
ZHE_TAOKE_APPKEY=xxx
ZHE_TAOKE_SID=xxx
ZHE_TAOKE_CUSTOMER_ID=xxx
REDIS_HOST=localhost
REDIS_PORT=6379
ALLOWED_ORIGINS=http://localhost:5173
```

## 运行模式切换

1. **纯前端模式**（默认）：在“密钥配置”页面填写折淘客凭证，所有请求由浏览器发起，alova IndexedDB 缓存 30 分钟。
2. **前后端分离模式**：将 `VITE_RUNTIME_MODE` 设为 `backend` 并配置 `VITE_API_BASE_URL`（若同源可置空）。此时前端转发到 Fastify，后端负责签名、缓存、脱敏，前端无需填写密钥即可拉取活动。页面将显示“后端缓存管理”面板，可一键清理所有缓存或按平台调用 `DELETE /api/cache`。

两种模式可在 UI TabBar 中的“密钥配置”页随时切换。

## 架构亮点

- **策略模式**：美团、饿了么平台均实现 `fetchList` / `fetchDetail`，便于持续扩展。
- **缓存体系**：前端基于 alova IndexedDB，后端（规划中）基于 Redis 并提供命名规范 `platform:<platform>:api:<resource>`。
- **安全提示**：纯前端模式会在 UI 中告知密钥存储风险，后端模式将通过代理统一处理签名与脱敏。
- **统一追踪**：全链路传递 `traceId`，错误面板会显示相关 ID，便于排障。

## 关联文档

- [开发指南](docs/development-guideline.md)
- [实施计划](docs/development-build-plan.md)

欢迎基于以上文档继续迭代第二阶段：实现 Fastify 后端、Redis 缓存与 Docker 化部署。
