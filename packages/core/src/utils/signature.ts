/**
 * 签名工具
 * 支持浏览器和 Node.js 环境
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
        signature = await createSignatureWithWebCrypto(message, secret);
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
