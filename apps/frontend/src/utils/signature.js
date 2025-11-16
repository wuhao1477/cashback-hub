import CryptoJS from 'crypto-js';
function cleanParams(params) {
    const sanitized = {};
    Object.entries(params).forEach(([key, value]) => {
        if (value === undefined || value === null || value === '')
            return;
        sanitized[key] = String(value);
    });
    return sanitized;
}
function encryptValue(value, secret) {
    if (!secret)
        return value;
    try {
        return CryptoJS.AES.encrypt(value, secret).toString();
    }
    catch (error) {
        console.warn('参数加密失败', error);
        return value;
    }
}
// 生成 HMAC-SHA256 签名，默认将字段按字典序拼接
function createSignature(payload, secret) {
    if (!secret)
        return '';
    const sorted = Object.keys(payload)
        .sort()
        .map((key) => `${key}=${payload[key]}`)
        .join('&');
    return CryptoJS.HmacSHA256(sorted, secret).toString(CryptoJS.enc.Hex);
}
export function buildSecureParams(params, secret) {
    const normalized = cleanParams(params);
    if (normalized.customer_id) {
        normalized.customer_id = encryptValue(normalized.customer_id, secret);
    }
    const signature = createSignature(normalized, secret);
    return {
        ...normalized,
        sign: signature,
    };
}
