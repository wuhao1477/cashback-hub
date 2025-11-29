# HTTP 环境下 Web Crypto API 不可用问题

## 问题背景

在纯前端模式下，应用需要调用折淘客等第三方 API，这些 API 需要 HMAC-SHA256 签名。

### 环境差异

| 环境 | URL | crypto.subtle | 状态 |
|------|-----|---------------|------|
| 本地开发 | http://localhost:5173 | ✅ 可用 | 正常 |
| 本地预览 | http://localhost:4173 | ✅ 可用 | 正常 |
| 线上 HTTP | http://coupon.12240403.xyz | ❌ 不可用 | **失败** |
| 线上 HTTPS | https://coupon.12240403.xyz | ✅ 可用 | 正常 |

### 根本原因

**Web Crypto API (`crypto.subtle`) 只在"安全上下文"中可用：**
- ✅ HTTPS 协议
- ✅ localhost（任何协议）
- ❌ HTTP 协议（非 localhost）

折淘客 API 使用 HTTP 协议（`http://api.zhetaoke.com:10000`），如果网站使用 HTTPS，会遇到**混合内容**问题（HTTPS 页面无法请求 HTTP 资源）。

因此，网站必须使用 HTTP，但 HTTP 环境下 `crypto.subtle` 不可用。

## 已尝试的解决方案

### 方案 1：添加纯 JavaScript HMAC-SHA256 实现

在 `packages/core/src/utils/signature.ts` 中添加了纯 JS 的 SHA-256 和 HMAC 实现：

```typescript
// SHA-256 常量
const K = [0x428a2f98, 0x71374491, ...];

// 纯 JS SHA-256 实现
function sha256(message: Uint8Array): Uint8Array { ... }

// 纯 JS HMAC-SHA256 实现
function hmacSha256(key: Uint8Array, message: Uint8Array): Uint8Array { ... }

// 纯 JS 签名函数
function createSignatureWithPureJS(message: string, secret: string): string { ... }
```

### 方案 2：运行时检测并自动选择

```typescript
async function createSignature(message: string, secret: string): Promise<string> {
    try {
        const subtle = globalThis.crypto?.subtle;
        if (subtle && typeof subtle.importKey === 'function') {
            return await createSignatureWithWebCrypto(message, secret);
        }
    } catch {
        // Web Crypto 不可用
    }
    return createSignatureWithPureJS(message, secret);
}
```

### 问题：Tree-shaking 移除了纯 JS 实现

Vite/Rollup 在构建时进行静态分析，可能认为 `createSignatureWithPureJS` 永远不会被调用，从而将其移除。

**验证方法：**
```bash
# 检查构建产物是否包含 SHA-256 常量
grep "1116352408" dist/assets/platformService-*.js
```

## 当前状态

- 本地 preview (localhost:4173) 正常工作
- 线上 HTTP 环境仍然失败

## 问题发现与修复

### 问题 1：Tree-shaking 移除纯 JS 实现

**原因**：Vite/Rollup 静态分析认为 `isWebCryptoAvailable()` 总是返回 `true`，从而移除了 `createSignatureWithPureJS`。

**解决**：修改检测逻辑，使用 try-catch 和运行时变量：

```typescript
async function createSignature(message: string, secret: string): Promise<string> {
    try {
        const subtle = globalThis.crypto?.subtle;
        if (subtle && typeof subtle.importKey === 'function') {
            return await createSignatureWithWebCrypto(message, secret);
        }
    } catch {
        // Web Crypto 不可用
    }
    return createSignatureWithPureJS(message, secret);
}
```

### 问题 2：SHA-256 padding 计算错误

**错误**：`RangeError: Offset is outside the bounds of the DataView`

**原因**：原始 padding 计算公式有误：
```typescript
// 错误的计算
const padLen = ((msgLen + 8) % 64 < 56 ? 56 : 120) - ((msgLen + 8) % 64);
```

**修复**：使用更简单可靠的计算：
```typescript
// 正确的计算
const totalLen = Math.ceil((msgLen + 9) / 64) * 64;
```

## 当前状态

- ✅ 本地 preview (localhost:4173) 正常工作
- ⏳ 等待部署到线上环境测试

## 验证方法

```bash
# 检查构建产物是否包含 SHA-256 常量
grep "1116352408" dist/assets/platformService-*.js
```

## 部署后测试

部署新的 `dist` 目录后，访问 `http://coupon.12240403.xyz/activities` 应该能正常加载数据。
