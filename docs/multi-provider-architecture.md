# 多供应商架构设计文档

## 一、背景与目标

### 1.1 现状分析

当前系统的转链服务仅支持单一供应商（折淘客），并且平台服务与供应商 API 紧密耦合。

**存在的问题：**

1. **供应商耦合**：所有平台服务直接依赖折淘客 API，硬编码了 API 端点和参数格式
2. **缺乏抽象**：没有统一的供应商抽象层，无法快速切换或添加新供应商
3. **配置固化**：配置中只有折淘客的凭证，不支持多供应商配置
4. **代码重复**：前端和后端各自实现了一套平台调用逻辑

### 1.2 设计目标

- 定义清晰的 Provider 抽象层，支持多供应商
- 实现配置化的供应商注册与选择机制
- 支持按平台配置不同供应商
- **前后端共用**同一套核心业务逻辑
- 保持现有业务逻辑不变，平滑迁移

## 二、架构设计

### 2.1 核心概念

```
平台(Platform) × 供应商(Provider) = 具体实现

美团 × 折淘客 = ZhetaokeMeituanProvider
美团 × 聚推客 = JutuikeMeituanProvider (未来)
饿了么 × 折淘客 = ZhetaokeElemeProvider
抖音 × 折淘客 = ZhetaokeDouyinProvider
```

### 2.2 整体架构

```
┌─────────────────────────────────────────────────────────────┐
│                        应用层                                │
│  ┌─────────────────┐           ┌─────────────────┐         │
│  │   apps/frontend │           │   apps/backend  │         │
│  │   (Vue3 + Vite) │           │    (Fastify)    │         │
│  └────────┬────────┘           └────────┬────────┘         │
│           │                             │                   │
│           │  usePlatformService()       │  createBackend    │
│           │                             │  PlatformService()│
└───────────┼─────────────────────────────┼───────────────────┘
            │                             │
            ▼                             ▼
┌─────────────────────────────────────────────────────────────┐
│                    @cashback/core                           │
│  ┌─────────────────────────────────────────────────────┐   │
│  │                  PlatformService                     │   │
│  │  - fetchActivityList()                               │   │
│  │  - fetchActivityDetail()                             │   │
│  │  - convertLink()                                     │   │
│  └──────────────────────┬──────────────────────────────┘   │
│                         │                                   │
│  ┌──────────────────────▼──────────────────────────────┐   │
│  │               ProviderRegistry                       │   │
│  │  - register(provider)                                │   │
│  │  - selectProvider(platform, strategy)                │   │
│  └──────────────────────┬──────────────────────────────┘   │
│                         │                                   │
│  ┌──────────────────────▼──────────────────────────────┐   │
│  │                   Providers                          │   │
│  │  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐    │   │
│  │  │  Zhetaoke   │ │  Jutuike    │ │   Custom    │    │   │
│  │  │  Provider   │ │  Provider   │ │  Provider   │    │   │
│  │  │  (折淘客)   │ │  (聚推客)   │ │   (自定义)  │    │   │
│  │  └─────────────┘ └─────────────┘ └─────────────┘    │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
            │
            ▼
┌─────────────────────────────────────────────────────────────┐
│                   @cashback/adapters                        │
│  - 数据格式转换（折淘客响应 → 标准格式）                    │
│  - ZtkMeituanAdapter / ZtkElemeAdapter / DouyinAdapter      │
└─────────────────────────────────────────────────────────────┘
```

### 2.3 包结构

```
packages/
├── core/                          # 核心业务逻辑包
│   └── src/
│       ├── types/                 # 统一类型定义
│       │   ├── platform.ts        # 平台类型（PlatformCode）
│       │   ├── provider.ts        # 供应商类型（ProviderConfig, PlatformProvider）
│       │   ├── activity.ts        # 活动类型（ActivitySummary, ActivityDetail）
│       │   └── http.ts            # HTTP 客户端接口
│       ├── providers/             # 供应商实现
│       │   ├── base.ts            # BaseProvider 抽象类
│       │   ├── registry.ts        # ProviderRegistry 注册中心
│       │   ├── factory.ts         # 工厂管理
│       │   └── zhetaoke/          # 折淘客供应商
│       │       ├── meituan.ts     # 美团实现
│       │       ├── eleme.ts       # 饿了么实现
│       │       └── douyin.ts      # 抖音实现
│       ├── services/              # 服务层
│       │   └── platform-service.ts
│       └── utils/                 # 工具函数
│           ├── signature.ts       # 签名工具
│           ├── trace.ts           # 追踪 ID 生成
│           └── errors.ts          # 错误类型
│
├── adapters/                      # 数据适配器包（保持不变）
│   └── src/
│       └── adapters/ztk/          # 折淘客响应格式适配
```

## 三、核心接口定义

### 3.1 供应商能力配置

```typescript
/**
 * 供应商能力配置
 */
interface ProviderCapabilities {
    code: ProviderCode;               // 供应商代码
    name: string;                     // 供应商名称
    description: string;              // 描述
    website?: string;                 // 网站/文档链接
    platforms: PlatformCapability[];  // 支持的平台和能力
}

/**
 * 平台能力配置
 */
interface PlatformCapability {
    platform: PlatformCode;           // 平台代码
    features: ProviderFeature[];      // 支持的能力
    supportedLinkTypes?: number[];    // 支持的链接类型
    notes?: string;                   // 备注
}

/**
 * 供应商能力类型
 */
type ProviderFeature = 
    | 'activityList'    // 活动列表
    | 'activityDetail'  // 活动详情
    | 'convertLink'     // 链接转换
    | 'qrcode'          // 二维码生成
    | 'deeplink'        // Deeplink/App 启动
    | 'miniProgram';    // 小程序链接
```

### 3.2 平台供应商接口

```typescript
/**
 * 平台供应商接口
 * 每个 平台×供应商 组合实现此接口
 */
interface PlatformProvider {
    /** 供应商代码 */
    readonly providerCode: ProviderCode;
    /** 平台代码 */
    readonly platformCode: PlatformCode;

    /** 获取活动列表 */
    fetchActivityList(options: FetchListOptions): Promise<ActivityListResult>;

    /** 获取活动详情 */
    fetchActivityDetail(options: FetchDetailOptions): Promise<ActivityDetail>;

    /** 转链（可选，部分平台支持） */
    convertLink?(options: ConvertLinkOptions): Promise<ConvertLinkResult>;

    /** 健康检查 */
    healthCheck(): Promise<boolean>;
}
```

### 3.3 HTTP 客户端接口

```typescript
/**
 * HTTP 客户端接口
 * 前后端各自实现，注入到 PlatformService
 */
interface HttpClient {
    get<T>(url: string, options?: HttpRequestOptions): Promise<T>;
    post<T>(url: string, data?: any, options?: HttpRequestOptions): Promise<T>;
}
```

### 3.3 供应商配置

```typescript
/**
 * 供应商配置
 */
interface ProviderConfig {
    name: ProviderCode;        // 供应商代码
    enabled: boolean;          // 是否启用
    priority: number;          // 优先级（数字越小越高）
    credentials: {
        appkey: string;
        sid: string;
        customerId?: string;
    };
    timeout?: number;          // 请求超时
    // 供应商能力配置
    cache?: {
        ttl: number;           // 缓存过期时间（秒）
    };
    rateLimit?: {
        max: number;           // 最大并发数
        duration: number;      // 限流时间窗口（秒）
    };
    fallback?: {
        enabled: boolean;      // 是否启用降级
        timeout: number;       // 降级超时时间（秒）
    };
}
```

## 四、使用方式

### 4.1 前端使用

```typescript
// apps/frontend/src/services/platformService.ts
import { createPlatformService } from '@cashback/core';

// 创建前端 HTTP 客户端（使用 fetch）
function createFrontendHttpClient(): HttpClient {
    return {
        async get(url, options) {
            const response = await fetch(url + '?' + new URLSearchParams(options?.params));
            return response.json();
        },
        // ...
    };
}

// 创建服务实例
export function usePlatformService() {
    const configStore = useConfigStore();
    return createPlatformService({
        httpClient: createFrontendHttpClient(),
        providers: [{
            name: 'zhetaoke',
            enabled: true,
            priority: 1,
            credentials: configStore.credentials,
            cache: {
                ttl: 300,         // 缓存 5 分钟
            },
            rateLimit: {
                max: 100,         // 最大并发数 100
                duration: 60,     // 限流时间窗口 1 分钟
            },
            fallback: {
                enabled: true,    // 启用降级
                timeout: 5000,    // 降级超时时间 5 秒
            },
        }],
    });
}

// 使用
const service = usePlatformService();
const result = await service.fetchActivityList('meituan', { page: 1, pageSize: 10 });
```

### 4.2 后端使用

```typescript
// apps/backend/src/services/platformService.ts
import crypto from 'node:crypto';
import { fetch } from 'undici';
import { createPlatformService, createNodeSignFunction } from '@cashback/core';

// 创建后端 HTTP 客户端（使用 undici）
function createBackendHttpClient(): HttpClient {
    return {
        async get(url, options) {
            const response = await fetch(url, { /* ... */ });
            return response.json();
        },
        // ...
    };
}

// 创建服务实例
export function createBackendPlatformService(config: AppConfig) {
    return createPlatformService({
        httpClient: createBackendHttpClient(),
        providers: [{
            name: 'zhetaoke',
            enabled: true,
            priority: 1,
            credentials: {
                appkey: config.ZHE_TAOKE_APPKEY,
                sid: config.ZHE_TAOKE_SID,
            },
        }],
        signFn: createNodeSignFunction(crypto),  // Node.js 签名函数
    });
}
```

## 五、缓存策略

`@cashback/core` 包**不处理缓存**，只负责业务逻辑。缓存由各端自行处理：

| 模式 | 缓存位置 | 实现方式 |
|------|----------|----------|
| 纯前端模式 | 浏览器端 | alova + IndexedDB（30分钟 TTL） |
| 前后端模式 | 后端服务 | Redis / 内存缓存（20分钟 TTL） |

```
纯前端模式:
  前端 activityService → alova 缓存 → @cashback/core → 折淘客 API

前后端模式:
  前端 activityService → 后端 API → Redis 缓存 → @cashback/core → 折淘客 API
```

## 六、扩展指南

### 6.1 添加新供应商

1. 在 `packages/core/src/providers/` 下创建新目录，如 `jutuike/`
2. 实现 `JutuikeProviderFactory` 和各平台 Provider
3. 在 `factory.ts` 中注册新工厂

```typescript
// packages/core/src/providers/jutuike/index.ts
export class JutuikeProviderFactory implements ProviderFactory {
    readonly code: ProviderCode = 'jutuike';
    readonly supportedPlatforms: PlatformCode[] = ['meituan', 'eleme'];

    createProvider(platform, config, httpClient) {
        switch (platform) {
            case 'meituan':
                return new JutuikeMeituanProvider(config, httpClient);
            // ...
        }
    }
}
```

### 6.2 添加新平台

1. 在 `types/platform.ts` 添加平台代码
2. 在对应供应商目录下添加平台实现
3. 更新 `ProviderFactory.supportedPlatforms`

## 七、迁移记录

### 已完成

- [x] 创建 `@cashback/core` 包
- [x] 定义核心类型（PlatformProvider, HttpClient 等）
- [x] 实现折淘客供应商（美团、饿了么、抖音）
- [x] 实现 ProviderRegistry 和 PlatformService
- [x] 重构前端使用 `@cashback/core`
- [x] 重构后端使用 `@cashback/core`
- [x] 删除冗余的 `services/platforms/` 目录

### 后续优化

- [ ] 添加聚推客供应商作为备用
- [ ] 实现供应商健康检查和自动降级
- [ ] 添加供应商性能监控指标
- [ ] 支持运行时热更新供应商配置
