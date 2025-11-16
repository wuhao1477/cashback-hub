# Cashback Hub 技术/业务需求蓝图

> 目标：构建一个基于 **Node.js + TypeScript** 的外卖返利/优惠券领取全栈应用，支持纯前端与前后端分离两种部署模式。

## 1. 系统形态

### 1.1 纯前端模式
- 前端提供可视化密钥管理，允许输入与本地持久化以下字段：`appkey`、`sid`、（可选）客户 ID、其他鉴权参数。
- 使用 `alova.js`（或同能力库）实现 30 分钟默认过期的本地缓存，缓存键需要包含平台标识与 API 入口信息。
- 所有请求直接由浏览器发起，需实现 **请求签名**、**参数加密** 与失败重试策略。
- 前端 UI 提供密钥使用风险说明、调用状态展示与错误提示，默认使用 HTTPS API 域名。

### 1.2 前后端分离模式
- Node.js 后端暴露密钥管理接口，敏感信息统一存储在 `.env` 中，通过配置管理工具（如 dotenv + Vault）按环境加载。
- 提供 API 代理层：负责签名、参数补全、转发以及响应数据脱敏（隐藏密钥、客户标识等敏感字段）。
- 内建数据清洗模块（格式化字段、过滤空/无效数据、统一状态码）。
- 接入 Redis 作为缓存层，建议设置 15~30 分钟 TTL，并执行命名规范：`<platform>:api:<activityId|resource>`。
- 提供缓存手动失效 API（按键或按平台批量清理）。
- 实现请求限流（如 `rate-limiter-flexible`）与访问日志审计。

## 2. 平台对接

| 平台 | API | 描述 | 参考 URL |
| --- | --- | --- | --- |
| 美团 | 活动列表 | `http://api.zhetaoke.com:10000/api/api_activity.ashx?appkey=<APPKEY>&activityId=<ID>&type=10`（详情接口将 `activityId` 替换为实际 ID） | 文档：https://api.apifox.cn/temp-links/api/236860068?t=3f91b153-b52d-481f-8f90-452a39dc6cf9 |
| 美团 | 活动详情/转链 | `http://api.zhetaoke.com:10000/api/open_meituan_generateLink.ashx?appkey=<APPKEY>&sid=<SID>&actId=<ID>&linkType=1&miniCode=1`（详情接口将 `activityId` 替换为实际 ID；`linkType` 枚举：1-H5 长链，2-H5 短链，3-Deeplink/App 唤起，4-小程序唤起路径，5-团口令，默认返回短链） | 文档：请访问以下链接获取接口“美团根据ID获取返利物料”的接口定义信息：https://api.apifox.cn/temp-links/api/236860068?t=f4e1e56f-43bc-4f42-bde4-23ba535c9e45 |
| 饿了么 | 活动列表 | `http://api.zhetaoke.com:10000/api/api_activity.ashx?appkey=<APPKEY>&activityId=<ID>&type=11` | 文档：https://api.apifox.cn/temp-links/api/308160086?t=144e46ef-6dfb-49b7-8a9f-35fca4fbee1a |
| 饿了么 | 活动详情/转链 | `https://api.zhetaoke.com:10001/api/open_eleme_generateLink.ashx?appkey=<APPKEY>&sid=<SID>&activity_id=<ID>&customer_id=<CID>` | 文档：https://api.apifox.cn/temp-links/api/247121494?t=4841bfd8-29ee-4ba0-bb3c-d6f8caee7977 |

> 按策略模式实现平台适配器，每个平台需实现：`fetchList()`, `fetchDetail()`, `normalizeActivity()`，确保后续拓展.

## 3. 业务/体验要求

### 3.1 系统设计
- 活动列表仅拉取基础字段（标题、平台、封面、佣金、有效期），详情页二次按需加载。
- 实现分页/增量加载，并在前端缓存翻页数据以减少 API 压力。
- 统一 API 响应结构 `{ code, message, data, traceId }`，全链路记录 `traceId`。

### 3.2 UI/UX
- 响应式设计：以 H5 为主，保持 PC 端可用。
- 明确平台区分（徽标/配色），提供平台筛选组件。
- 引导用户在纯前端模式下完成密钥配置，并展示安全提示。
- 展示 API 调用状态（loading/success/error），并在错误面板中附带请求 ID。
- 美团二级展示要求：
  - **PC 端**：展示 `open_meituan_generateLink` 返回的二维码（`qrcode_chang_pic`、`qrcode_wx_pic`、`wx_mini_pic`）以及 H5 链接。
  - **H5 端**：展示多按钮入口（唤起 App、拉起小程序等），根据 `linkType` 字段选择合适的链接类型。

## 4. 安全、可维护与部署

- **数据安全**：前端弹窗告知密钥存在本地存储风险；后端全部链路走 HTTPS，关键端点开启速率限制。
- **日志与错误码**：后端使用结构化日志（JSON），错误码分层（平台错误、系统错误、参数错误），并在前端映射人性化提示。
- **部署**：提供 Dockerfile + docker-compose。区分开发/生产配置（`.env.development`, `.env.production`），并暴露 `/healthz` 健康检查接口。
- **监控与维护**：对接 APM 或至少提供慢查询日志；关键缓存命中率指标需可观测。

## 5. 验收清单

1. 前端配置面板可成功保存并更新本地密钥。
2. 纯前端请求可签名并成功访问美团/饿了么活动接口。
3. 后端代理可对响应字段脱敏且缓存命中率指标可查询。
4. 策略模式支持切换平台且能轻松扩展第三方平台（具备模板与单测）。
5. Docker 化部署可启动前端、后端、Redis，并通过 `/healthz` 返回 200。

以上内容可作为迭代基线，在迭代中进一步细化 API 协议、日志规范与安全策略。
