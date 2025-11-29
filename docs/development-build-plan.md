# 外卖返利/优惠券领取全栈项目实施计划

## 项目结构

采用 pnpm workspace Monorepo 结构：

```
cashback-hub/
├── apps/
│   ├── frontend/          # Vue 3 + Vite 前端应用
│   └── backend/           # Fastify 后端服务
├── packages/
│   ├── core/              # @cashback/core - 核心业务逻辑（前后端共用）
│   └── adapters/          # @cashback/adapters - 数据格式适配器
├── docs/                  # 设计文档
├── package.json           # 根 package.json
├── pnpm-workspace.yaml    # pnpm workspace 配置
├── tsconfig.base.json     # 共享 TypeScript 配置
├── docker-compose.yml     # Docker 编排配置
└── .env.example           # 环境变量示例
```

## 第一阶段：纯前端模式实现

### 1.1 项目初始化

- 创建 Monorepo 结构，配置 pnpm workspace
- 初始化前端 Vue 3 + Vite 项目（apps/frontend）
- 配置 TypeScript、ESLint、Prettier
- 设置共享 TypeScript 基础配置

### 1.2 前端核心功能

**依赖安装：**

- `vue@^3.x`, `vite`, `vue-router`, `pinia`
- `alova` (HTTP 请求和缓存)
- `@alova/adapter-fetch` 或 `@alova/adapter-axios`
- UI 框架：`vant` (移动端优先) 或 `element-plus`
- 工具库：`crypto-js` (签名加密), `dayjs` (时间处理)

**核心模块实现：**

1. **配置管理模块** (`apps/frontend/src/stores/config.ts`)

   - Pinia store 管理 API 密钥配置
   - 使用 localStorage/IndexedDB 持久化配置
   - 提供配置表单组件

2. **API 请求模块** (`apps/frontend/src/services/`)

   - 使用 alova.js 创建请求实例
   - 实现 IndexedDB 缓存（30分钟过期）
   - 实现请求签名和参数加密（`apps/frontend/src/utils/signature.ts`）
   - 统一错误处理和响应格式

3. **平台服务** (`apps/frontend/src/services/platformService.ts`)

   - 使用 `@cashback/core` 的 `PlatformService`
   - 封装前端 HTTP 客户端（fetch API）
   - 支持多供应商切换

4. **页面组件**

   - 配置页面：密钥配置表单、配置指引
   - 活动列表页：平台筛选、分页加载、基础信息展示
   - 活动详情页：按需加载详情数据
   - 响应式布局（移动端优先，兼容 PC）

### 1.3 业务逻辑实现

**美团平台对接：**

- 活动列表：`http://api.zhetaoke.com:10000/api/api_activity.ashx?appkey={appkey}&activityId={activityId}&type=10`
- 活动详情：同上，使用实际 activityId

**饿了么平台对接：**

- 活动列表：`http://api.zhetaoke.com:10000/api/api_activity.ashx?appkey={appkey}&activityId={activityId}&type=11`
- 活动详情：`https://api.zhetaoke.com:10001/api/open_eleme_generateLink.ashx?appkey={appkey}&sid={sid}&activity_id={id}&customer_id={customer_id}`

**功能特性：**

- 平台标识和筛选
- 分页加载（虚拟滚动或传统分页）
- API 调用状态提示（loading/error/success）
- 缓存状态显示

## 第二阶段：前后端分离模式实现

### 2.1 后端项目初始化

- 初始化 Fastify + TypeScript 项目（apps/backend）
- 安装依赖：`fastify`, `@fastify/env`, `@fastify/redis`, `@fastify/cors`, `@fastify/rate-limit`
- 配置 TypeScript 编译和开发环境

### 2.2 后端核心功能

**环境变量管理** (`apps/backend/.env`):

```
ZHE_TAOKE_APPKEY=xxx
ZHE_TAOKE_SID=xxx
REDIS_HOST=localhost
REDIS_PORT=6379
```

**核心模块实现：**

1. **密钥管理** (`apps/backend/src/config/keys.ts`)

   - 从环境变量读取 API 密钥
   - 密钥验证和加密存储

2. **API 代理服务** (`apps/backend/src/services/proxy.ts`)

   - 统一代理转发到折淘客 API
   - 请求签名和参数处理
   - 错误处理和重试机制

3. **Redis 缓存层** (`apps/backend/src/services/cache.ts`)

   - 缓存键命名规范：`platform:{platform}:api:{endpoint}:{params_hash}`
   - 缓存过期策略：15-30分钟
   - 缓存清除接口：`DELETE /api/cache/:key`

4. **数据脱敏和清洗** (`apps/backend/src/utils/data-processor.ts`)

   - 敏感字段脱敏（如手机号、身份证等）
   - 数据格式化（日期、金额等）
   - 无效数据过滤

5. **路由设计** (`apps/backend/src/routes/`)

   - `GET /api/health` - 健康检查
   - `GET /api/platforms` - 平台列表
   - `GET /api/activities/:platform` - 活动列表（支持分页）
   - `GET /api/activities/:platform/:id` - 活动详情
   - `DELETE /api/cache/:key` - 清除缓存

6. **中间件**

   - 请求频率限制（rate limiting）
   - CORS 配置
   - 请求日志记录
   - 统一错误处理

### 2.3 前端适配后端模式

- 添加模式切换（纯前端/后端代理）
- 更新 API 请求路径指向后端
- 保留配置管理（用于纯前端模式）

## 技术细节

### 多供应商架构

详见 [多供应商架构文档](multi-provider-architecture.md)

```typescript
// 使用 @cashback/core 的 PlatformService
import { createPlatformService } from '@cashback/core';

const service = createPlatformService({
  httpClient: createFrontendHttpClient(),
  providers: [{ name: 'zhetaoke', enabled: true, priority: 1, credentials }],
});

// 获取活动列表
const result = await service.fetchActivityList('meituan', { page: 1, pageSize: 10 });
```

### 缓存实现

- **前端（alova.js）**：IndexedDB 存储，30分钟 TTL
- **后端（Redis）**：键值存储，15-30分钟 TTL，支持手动清除

### 响应式设计

- 移动端优先（375px+）
- 使用 Vant 或类似移动端 UI 库
- PC 端适配（媒体查询，最大宽度限制）

## 部署方案

### Docker 配置

- `apps/frontend/Dockerfile` - 前端构建和 Nginx 服务
- `apps/backend/Dockerfile` - 后端 Node.js 服务
- `docker-compose.yml` - 包含前端、后端、Redis 服务
- 环境变量分离（.env.development, .env.production）

### 健康检查

- 后端：`GET /api/health` 返回服务状态
- Docker healthcheck 配置

## 安全性和可维护性

- **安全性**：
  - 纯前端模式：密钥存储风险提示
  - 后端模式：rate limiting、HTTPS 强制
  - 请求签名和加密

- **可维护性**：
  - 统一 API 响应格式：`{ code, data, message, timestamp }`
  - Winston 或 Pino 日志系统
  - 错误代码体系（如：1001-平台错误，2001-参数错误）

## 开发顺序

1. ✅ 项目初始化和 Monorepo 配置
2. ✅ 前端基础框架和路由
3. ✅ 配置管理模块（纯前端模式）
4. ✅ 平台策略模式实现
5. ✅ API 请求和缓存（alova.js）
6. ✅ 活动列表和详情页面
7. ✅ 响应式 UI 实现
8. ✅ 后端项目初始化（第二阶段）
9. ✅ 后端 API 代理和缓存
10. ✅ @cashback/core 多供应商架构重构
11. ⏸️ Docker 部署配置
12. ⏸️ 添加更多供应商（聚推客等）