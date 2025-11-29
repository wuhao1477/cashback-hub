# 供应商凭证配置重构计划

## 一、背景与目标

### 1.1 当前问题

1. **UI 布局问题**
   - 供应商选择和密钥管理分散在不同区块，信息预览不直观
   - 表单字段固定为 `appkey`、`sid`、`customerId`，无法适应不同供应商

2. **类型设计问题**
   - `ApiCredentials` 接口硬编码了折淘客的字段名
   - 新增供应商时需要修改多处代码
   - 缺乏字段元数据（标签、占位符、是否必填等）

### 1.2 目标

1. **动态凭证字段**：每个供应商自定义所需的凭证字段
2. **强类型支持**：保持 TypeScript 类型安全
3. **优化 UI 布局**：供应商卡片式展示，信息一目了然
4. **可扩展性**：新增供应商只需添加配置文件

---

## 二、技术方案

### 2.1 凭证字段定义

在 `ProviderCapabilities` 中新增 `credentialFields` 配置：

```typescript
/** 凭证字段类型 */
export type CredentialFieldType = 'text' | 'password' | 'select';

/** 凭证字段定义 */
export interface CredentialFieldDefinition {
    /** 字段键名 */
    key: string;
    /** 显示标签 */
    label: string;
    /** 占位符提示 */
    placeholder: string;
    /** 是否必填 */
    required: boolean;
    /** 字段类型 */
    type: CredentialFieldType;
    /** 选项列表(type=select时使用) */
    options?: { label: string; value: string }[];
    /** 帮助文本 */
    helpText?: string;
}

/** 扩展 ProviderCapabilities */
export interface ProviderCapabilities {
    code: ProviderCode;
    name: string;
    description: string;
    website?: string;
    platforms: PlatformCapability[];
    /** 凭证字段定义 */
    credentialFields: CredentialFieldDefinition[];
}
```

### 2.2 折淘客凭证配置示例

```typescript
// packages/core/src/providers/zhetaoke/capabilities.ts
export const ZHETAOKE_CAPABILITIES: ProviderCapabilities = {
    code: 'zhetaoke',
    name: '折淘客',
    description: '专业的外卖/电商返利API服务商',
    website: 'https://www.zhetaoke.com',
    credentialFields: [
        {
            key: 'appkey',
            label: 'AppKey',
            placeholder: '请输入折淘客 AppKey',
            required: true,
            type: 'text',
            helpText: '在折淘客控制台获取',
        },
        {
            key: 'sid',
            label: 'SID',
            placeholder: '请输入 SID',
            required: true,
            type: 'text',
            helpText: '推广位ID',
        },
        {
            key: 'customerId',
            label: '客户ID',
            placeholder: '可选，若账号要求可填写',
            required: false,
            type: 'text',
        },
    ],
    platforms: [/* ... */],
};
```

### 2.3 聚推客凭证配置示例（假设）

```typescript
export const JUTUIKE_CAPABILITIES: ProviderCapabilities = {
    code: 'jutuike',
    name: '聚推客',
    description: '聚推客返利API服务',
    website: 'https://www.jutuike.com',
    credentialFields: [
        {
            key: 'apiKey',
            label: 'API Key',
            placeholder: '请输入聚推客 API Key',
            required: true,
            type: 'text',
        },
        {
            key: 'secretKey',
            label: 'Secret Key',
            placeholder: '请输入 Secret Key',
            required: true,
            type: 'password',
        },
        {
            key: 'channelId',
            label: '渠道ID',
            placeholder: '请输入渠道ID',
            required: true,
            type: 'text',
        },
    ],
    platforms: [/* ... */],
};
```

### 2.4 动态凭证类型

```typescript
/** 动态凭证类型 - 键值对形式 */
export type DynamicCredentials = Record<string, string>;

/** 供应商配置（更新） */
export interface ProviderConfig {
    name: ProviderCode;
    enabled: boolean;
    priority: number;
    /** 动态凭证 */
    credentials: DynamicCredentials;
    timeout?: number;
}
```

### 2.5 前端 Store 更新

```typescript
// apps/frontend/src/stores/config.ts

/** 供应商配置 */
export interface ProviderSettings {
    activeProvider: ProviderCode;
    /** 各供应商的凭证（动态键值对） */
    credentials: Record<ProviderCode, DynamicCredentials>;
}

/** 初始化供应商设置 */
function initProviderSettings(): ProviderSettings {
    return {
        activeProvider: 'zhetaoke',
        credentials: {
            zhetaoke: {},
            jutuike: {},
        },
    };
}
```

---

## 三、UI 设计方案

### 3.1 新布局结构

```
┌─────────────────────────────────────────────────────────┐
│  系统配置                                                │
├─────────────────────────────────────────────────────────┤
│  ┌─────────────────────────────────────────────────────┐│
│  │ 运行模式                                             ││
│  │ ○ 纯前端  ● 前后端分离                               ││
│  └─────────────────────────────────────────────────────┘│
│                                                         │
│  ┌─────────────────────────────────────────────────────┐│
│  │ 供应商配置                                           ││
│  │                                                     ││
│  │ ┌───────────────┐  ┌───────────────┐               ││
│  │ │ ✓ 折淘客      │  │   聚推客      │               ││
│  │ │ ─────────────│  │ ─────────────│               ││
│  │ │ 美团 饿了么   │  │ 美团 京东    │               ││
│  │ │ 抖音         │  │              │               ││
│  │ │              │  │              │               ││
│  │ │ [已配置 ✓]   │  │ [未配置]     │               ││
│  │ └───────────────┘  └───────────────┘               ││
│  │                                                     ││
│  │ ─────────────── 折淘客 凭证配置 ───────────────     ││
│  │                                                     ││
│  │ AppKey *        [________________]                  ││
│  │                 在折淘客控制台获取                   ││
│  │                                                     ││
│  │ SID *           [________________]                  ││
│  │                 推广位ID                            ││
│  │                                                     ││
│  │ 客户ID          [________________]                  ││
│  │                 可选，若账号要求可填写               ││
│  │                                                     ││
│  │ [     保存配置     ]  [  清除配置  ]                ││
│  └─────────────────────────────────────────────────────┘│
│                                                         │
│  ┌─────────────────────────────────────────────────────┐│
│  │ 后端缓存管理 (仅后端模式)                            ││
│  │ ...                                                 ││
│  └─────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────┘
```

### 3.2 供应商卡片设计

- **选中状态**：边框高亮 + 勾选图标
- **配置状态**：显示"已配置"/"未配置"标签
- **平台标签**：展示支持的平台
- **点击切换**：点击卡片切换供应商

### 3.3 动态表单渲染

根据 `credentialFields` 动态渲染表单字段：

```vue
<template>
  <van-field
    v-for="field in currentCredentialFields"
    :key="field.key"
    v-model="form[field.key]"
    :name="field.key"
    :label="field.label"
    :placeholder="field.placeholder"
    :required="field.required"
    :type="field.type === 'password' ? 'password' : 'text'"
    :disabled="runtimeMode === 'backend'"
  >
    <template v-if="field.helpText" #extra>
      <span class="field-help">{{ field.helpText }}</span>
    </template>
  </van-field>
</template>
```

---

## 四、实施步骤

### Phase 1: 类型定义更新 (core 包)

1. [ ] 在 `provider.ts` 中添加 `CredentialFieldDefinition` 类型
2. [ ] 扩展 `ProviderCapabilities` 接口
3. [ ] 更新 `ProviderCredentials` 为 `DynamicCredentials`
4. [ ] 更新 `ProviderConfig` 使用动态凭证

### Phase 2: 供应商配置更新

1. [ ] 更新 `ZHETAOKE_CAPABILITIES` 添加 `credentialFields`
2. [ ] 创建 `JUTUIKE_CAPABILITIES` 示例（占位）
3. [ ] 导出新类型和配置

### Phase 3: 前端 Store 更新

1. [ ] 更新 `ApiCredentials` 为动态类型
2. [ ] 更新 `ProviderSettings` 接口
3. [ ] 添加凭证验证辅助函数

### Phase 4: ConfigPage UI 重构

1. [ ] 实现供应商卡片组件
2. [ ] 实现动态表单渲染
3. [ ] 优化整体布局
4. [ ] 添加配置状态指示

### Phase 5: 测试与验证

1. [ ] 类型检查通过
2. [ ] 构建成功
3. [ ] 功能测试

---

## 五、文件变更清单

| 文件路径 | 变更类型 | 说明 |
|---------|---------|------|
| `packages/core/src/types/provider.ts` | 修改 | 添加凭证字段类型定义 |
| `packages/core/src/providers/zhetaoke/capabilities.ts` | 修改 | 添加 credentialFields |
| `packages/core/src/index.ts` | 修改 | 导出新类型 |
| `apps/frontend/src/stores/config.ts` | 修改 | 使用动态凭证类型 |
| `apps/frontend/src/pages/ConfigPage.vue` | 重构 | UI 布局优化 |
| `apps/frontend/src/components/ProviderCard.vue` | 新增 | 供应商卡片组件 |

---

## 六、注意事项

1. **向后兼容**：需要处理旧版凭证数据的迁移
2. **类型安全**：虽然凭证是动态的，但通过 `credentialFields` 定义保证结构可预测
3. **验证逻辑**：根据 `required` 字段动态验证必填项
4. **存储格式**：localStorage 中的数据格式需要兼容处理

---

## 七、预期效果

1. **开发体验**：新增供应商只需添加配置文件
2. **用户体验**：清晰的卡片式布局，一目了然
3. **可维护性**：凭证字段集中管理，易于修改
4. **类型安全**：TypeScript 类型检查覆盖全流程
