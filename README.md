# Cashback Hub

一个基于 **pnpm workspace** 的外卖返利/优惠券全栈项目，逐步实现纯前端模式与前后端分离模式两种形态。项目遵循 `docs/development-guideline.md` 与 `docs/development-build-plan.md`，当前已完成第一阶段（纯前端应用）并正在构建第二阶段（Fastify 后端代理）。

## 目录结构

```
cashback-hub/
├── apps/
│   ├── frontend/    # Vue3 + Vite 前端，含密钥配置、活动列表/详情
│   └── backend/     # Fastify 后端（开发中）
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

### 启动后端（开发中）

后端服务在 `apps/backend`。待完成基础模块后，可通过：

```bash
pnpm --filter backend dev
```

后端将提供：

- 环境密钥集中管理（`.env.development` / `.env.production`）
- 折淘客 API 转发、签名与数据脱敏
- Redis 缓存（15-30 分钟 TTL）与手动失效接口
- 请求限流、结构化日志与统一响应体 `{ code, message, data, traceId }`

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

前端变量以 `VITE_` 前缀注入浏览器。后端则使用 `.env.development`、`.env.production` 或 deployment 平台注入，示例字段：

```
ZHE_TAOKE_APPKEY=xxx
ZHE_TAOKE_SID=xxx
ZHE_TAOKE_CUSTOMER_ID=xxx
REDIS_HOST=localhost
REDIS_PORT=6379
ALLOWED_ORIGINS=http://localhost:5173
```

## 架构亮点

- **策略模式**：美团、饿了么平台均实现 `fetchList` / `fetchDetail`，便于持续扩展。
- **缓存体系**：前端基于 alova IndexedDB，后端（规划中）基于 Redis 并提供命名规范 `platform:<platform>:api:<resource>`。
- **安全提示**：纯前端模式会在 UI 中告知密钥存储风险，后端模式将通过代理统一处理签名与脱敏。
- **统一追踪**：全链路传递 `traceId`，错误面板会显示相关 ID，便于排障。

## 关联文档

- [开发指南](docs/development-guideline.md)
- [实施计划](docs/development-build-plan.md)

欢迎基于以上文档继续迭代第二阶段：实现 Fastify 后端、Redis 缓存与 Docker 化部署。
