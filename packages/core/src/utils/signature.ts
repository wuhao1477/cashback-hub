/**
 * 签名工具
 * 支持浏览器（安全和非安全上下文）和 Node.js 环境
 */

export type PlainParams = Record<string, string | number | boolean | undefined | null>;

/** 签名函数类型 */
export type SignFunction = (message: string, secret: string) => string | Promise<string>;

/**
 * 清理参数，移除空值并转换为字符串
 */
function cleanParams(params: PlainParams): Record<string, string> {
    const normalized: Record<string, string> = {};
    for (const [key, value] of Object.entries(params)) {
        if (value === undefined || value === null || value === '') continue;
        normalized[key] = String(value);
    }
    return normalized;
}

/**
 * 将参数按字典序排序并拼接
 */
function sortAndJoin(payload: Record<string, string>): string {
    return Object.keys(payload)
        .sort()
        .map((key) => `${key}=${payload[key]}`)
        .join('&');
}

// ============================================================================
// 纯 JavaScript SHA-256 和 HMAC 实现（用于非安全上下文 HTTP）
// ============================================================================

const K = [
    0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
    0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
    0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
    0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
    0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
    0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
    0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
    0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2,
];

function sha256(message: Uint8Array): Uint8Array {
    let h0 = 0x6a09e667, h1 = 0xbb67ae85, h2 = 0x3c6ef372, h3 = 0xa54ff53a;
    let h4 = 0x510e527f, h5 = 0x9b05688c, h6 = 0x1f83d9ab, h7 = 0x5be0cd19;

    const msgLen = message.length;
    const bitLen = msgLen * 8;
    
    // 计算填充后的总长度（必须是 64 的倍数）
    // 需要: 原消息 + 1字节(0x80) + 填充 + 8字节(长度)
    const totalLen = Math.ceil((msgLen + 9) / 64) * 64;
    const padded = new Uint8Array(totalLen);
    padded.set(message);
    padded[msgLen] = 0x80;
    
    // 在最后 8 字节写入消息长度（大端序，只用低 32 位）
    const view = new DataView(padded.buffer);
    view.setUint32(totalLen - 4, bitLen, false);

    const w = new Uint32Array(64);

    for (let i = 0; i < totalLen; i += 64) {
        for (let j = 0; j < 16; j++) {
            w[j] = view.getUint32(i + j * 4, false);
        }
        for (let j = 16; j < 64; j++) {
            const s0 = (rotr(w[j - 15], 7) ^ rotr(w[j - 15], 18) ^ (w[j - 15] >>> 3)) >>> 0;
            const s1 = (rotr(w[j - 2], 17) ^ rotr(w[j - 2], 19) ^ (w[j - 2] >>> 10)) >>> 0;
            w[j] = (w[j - 16] + s0 + w[j - 7] + s1) >>> 0;
        }

        let a = h0, b = h1, c = h2, d = h3, e = h4, f = h5, g = h6, h = h7;

        for (let j = 0; j < 64; j++) {
            const S1 = (rotr(e, 6) ^ rotr(e, 11) ^ rotr(e, 25)) >>> 0;
            const ch = ((e & f) ^ (~e & g)) >>> 0;
            const temp1 = (h + S1 + ch + K[j] + w[j]) >>> 0;
            const S0 = (rotr(a, 2) ^ rotr(a, 13) ^ rotr(a, 22)) >>> 0;
            const maj = ((a & b) ^ (a & c) ^ (b & c)) >>> 0;
            const temp2 = (S0 + maj) >>> 0;

            h = g; g = f; f = e; e = (d + temp1) >>> 0;
            d = c; c = b; b = a; a = (temp1 + temp2) >>> 0;
        }

        h0 = (h0 + a) >>> 0; h1 = (h1 + b) >>> 0; h2 = (h2 + c) >>> 0; h3 = (h3 + d) >>> 0;
        h4 = (h4 + e) >>> 0; h5 = (h5 + f) >>> 0; h6 = (h6 + g) >>> 0; h7 = (h7 + h) >>> 0;
    }

    const result = new Uint8Array(32);
    const rv = new DataView(result.buffer);
    rv.setUint32(0, h0, false); rv.setUint32(4, h1, false); rv.setUint32(8, h2, false); rv.setUint32(12, h3, false);
    rv.setUint32(16, h4, false); rv.setUint32(20, h5, false); rv.setUint32(24, h6, false); rv.setUint32(28, h7, false);
    return result;
}

function rotr(x: number, n: number): number {
    return ((x >>> n) | (x << (32 - n))) >>> 0;
}

function hmacSha256(key: Uint8Array, message: Uint8Array): Uint8Array {
    const blockSize = 64;
    let keyBlock = key;

    if (key.length > blockSize) {
        keyBlock = sha256(key);
    }
    if (keyBlock.length < blockSize) {
        const padded = new Uint8Array(blockSize);
        padded.set(keyBlock);
        keyBlock = padded;
    }

    const oKeyPad = new Uint8Array(blockSize);
    const iKeyPad = new Uint8Array(blockSize);
    for (let i = 0; i < blockSize; i++) {
        oKeyPad[i] = keyBlock[i] ^ 0x5c;
        iKeyPad[i] = keyBlock[i] ^ 0x36;
    }

    const inner = new Uint8Array(blockSize + message.length);
    inner.set(iKeyPad);
    inner.set(message, blockSize);
    const innerHash = sha256(inner);

    const outer = new Uint8Array(blockSize + 32);
    outer.set(oKeyPad);
    outer.set(innerHash, blockSize);
    return sha256(outer);
}

function toHex(bytes: Uint8Array): string {
    return Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * 纯 JavaScript HMAC-SHA256 签名（用于非安全上下文）
 */
function createSignatureWithPureJS(message: string, secret: string): string {
    const encoder = new TextEncoder();
    const keyData = encoder.encode(secret);
    const messageData = encoder.encode(message);
    const hash = hmacSha256(keyData, messageData);
    return toHex(hash);
}

// ============================================================================
// Web Crypto API 实现（用于安全上下文 HTTPS/localhost）
// ============================================================================

/**
 * 检查 Web Crypto API 是否可用
 */
function isWebCryptoAvailable(): boolean {
    return typeof globalThis.crypto?.subtle?.importKey === 'function';
}

/**
 * 使用 Web Crypto API 创建 HMAC-SHA256 签名
 */
async function createSignatureWithWebCrypto(message: string, secret: string): Promise<string> {
    const encoder = new TextEncoder();
    const keyData = encoder.encode(secret);
    const messageData = encoder.encode(message);

    const cryptoKey = await globalThis.crypto.subtle.importKey(
        'raw',
        keyData,
        { name: 'HMAC', hash: 'SHA-256' },
        false,
        ['sign']
    );

    const signature = await globalThis.crypto.subtle.sign('HMAC', cryptoKey, messageData);
    const hashArray = Array.from(new Uint8Array(signature));
    return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

/**
 * 创建签名 - 自动选择可用的实现
 * 使用 try-catch 确保运行时检测，避免被 tree-shaking 优化掉
 */
async function createSignature(message: string, secret: string): Promise<string> {
    // 尝试使用 Web Crypto API（仅在安全上下文中可用）
    // 注意：在 HTTP 非安全上下文中，crypto.subtle 为 undefined
    try {
        const subtle = globalThis.crypto?.subtle;
        if (subtle && typeof subtle.importKey === 'function') {
            return await createSignatureWithWebCrypto(message, secret);
        }
    } catch {
        // Web Crypto 不可用，回退到纯 JS 实现
    }
    // 回退到纯 JS 实现（用于 HTTP 非安全上下文）
    return createSignatureWithPureJS(message, secret);
}

/**
 * 构建带签名的请求参数
 * @param params 原始参数
 * @param secret 签名密钥
 * @param signFn 可选的自定义签名函数（用于 Node.js 环境注入 crypto 模块）
 */
export async function buildSignedParams(
    params: PlainParams,
    secret: string,
    signFn?: SignFunction
): Promise<Record<string, string>> {
    const normalized = cleanParams(params);
    const message = sortAndJoin(normalized);

    let signature: string;
    if (signFn) {
        signature = await signFn(message, secret);
    } else {
        // 自动选择：安全上下文使用 Web Crypto，否则使用纯 JS 实现
        signature = await createSignature(message, secret);
    }

    return { ...normalized, sign: signature };
}

/**
 * 创建 Node.js 环境的签名函数
 * 需要在 Node.js 环境中调用，传入 crypto 模块
 */
export function createNodeSignFunction(crypto: typeof import('node:crypto')): SignFunction {
    return (message: string, secret: string) => {
        return crypto.createHmac('sha256', secret).update(message).digest('hex');
    };
}
