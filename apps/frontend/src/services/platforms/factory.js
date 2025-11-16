import { ElemePlatform } from './eleme';
import { MeituanPlatform } from './meituan';
const registry = {
    meituan: MeituanPlatform,
    eleme: ElemePlatform,
};
export function createPlatform(code, context) {
    const PlatformCtor = registry[code];
    if (!PlatformCtor) {
        throw new Error(`未支持的平台：${code}`);
    }
    return new PlatformCtor(context);
}
export function supportedPlatforms() {
    return Object.keys(registry);
}
