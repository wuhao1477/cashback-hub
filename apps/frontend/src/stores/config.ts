import { defineStore } from 'pinia';
import type { ProviderCode, DynamicCredentials, CredentialFieldDefinition } from '@cashback/core';
import { ZHETAOKE_CAPABILITIES, JUTUIKE_CAPABILITIES } from '@cashback/core';

export type RuntimeMode = 'frontend' | 'backend';

/** 动态凭证类型（从 core 包导入） */
export type { DynamicCredentials };

/** 旧版凭证接口（保持向后兼容） */
export interface ApiCredentials {
  appkey: string;
  sid: string;
  customerId?: string;
  [key: string]: string | undefined;
}

/** 供应商配置 */
export interface ProviderSettings {
  /** 当前选中的供应商 */
  activeProvider: ProviderCode;
  /** 各供应商的凭证（动态键值对） */
  credentials: Record<ProviderCode, DynamicCredentials>;
}

/** 所有供应商能力配置 */
export const ALL_PROVIDER_CAPABILITIES = [
  ZHETAOKE_CAPABILITIES,
  JUTUIKE_CAPABILITIES,
];

/** 根据供应商代码获取能力配置 */
export function getProviderCapabilities(code: ProviderCode) {
  return ALL_PROVIDER_CAPABILITIES.find(p => p.code === code);
}

/** 根据供应商代码获取凭证字段定义 */
export function getCredentialFields(code: ProviderCode): CredentialFieldDefinition[] {
  return getProviderCapabilities(code)?.credentialFields || [];
}

/** 验证凭证是否完整（所有必填字段都有值） */
export function validateCredentials(code: ProviderCode, credentials: DynamicCredentials): boolean {
  const fields = getCredentialFields(code);
  return fields
    .filter(f => f.required)
    .every(f => credentials[f.key]?.trim());
}

/** 检查供应商是否已配置 */
export function isProviderConfigured(code: ProviderCode, credentials: DynamicCredentials): boolean {
  return validateCredentials(code, credentials);
}

interface ConfigState {
  /** 当前凭证（兼容旧版，使用动态类型） */
  credentials: DynamicCredentials;
  runtimeMode: RuntimeMode;
  lastSyncedAt?: number;
  /** 供应商设置 */
  providerSettings: ProviderSettings;
}

const STORAGE_KEY = 'cashback-hub:credentials';
const RUNTIME_MODE_KEY = 'cashback-hub:runtime-mode';
const PROVIDER_SETTINGS_KEY = 'cashback-hub:provider-settings';

/** 默认供应商 */
const DEFAULT_PROVIDER: ProviderCode = 'zhetaoke';

/** 初始化供应商设置 */
function initProviderSettings(): ProviderSettings {
  return {
    activeProvider: DEFAULT_PROVIDER,
    credentials: {
      zhetaoke: {},
      jutuike: {},
    },
  };
}

/** 从 localStorage 加载供应商设置 */
function loadProviderSettings(): ProviderSettings {
  try {
    const cached = localStorage.getItem(PROVIDER_SETTINGS_KEY);
    if (cached) {
      const parsed = JSON.parse(cached) as ProviderSettings;
      // 确保所有供应商都有凭证对象
      const settings = initProviderSettings();
      settings.activeProvider = parsed.activeProvider || DEFAULT_PROVIDER;
      if (parsed.credentials) {
        Object.assign(settings.credentials, parsed.credentials);
      }
      return settings;
    }
  } catch (error) {
    console.warn('读取供应商设置失败', error);
  }
  return initProviderSettings();
}

/** 保存供应商设置到 localStorage */
function persistProviderSettings(settings: ProviderSettings) {
  try {
    localStorage.setItem(PROVIDER_SETTINGS_KEY, JSON.stringify(settings));
  } catch (error) {
    console.warn('保存供应商设置失败', error);
  }
}

const envCredentials = resolveEnvCredentials();
const hasEnvDefaults = Object.values(envCredentials).some((value) => Boolean(value));

function resolveEnvCredentials(): ApiCredentials {
  return {
    appkey: import.meta.env.VITE_ZHE_TAOKE_APPKEY || '',
    sid: import.meta.env.VITE_ZHE_TAOKE_SID || '',
    customerId: import.meta.env.VITE_ZHE_TAOKE_CUSTOMER_ID || '',
  };
}

function loadFromStorage(): ApiCredentials | null {
  try {
    const cached = localStorage.getItem(STORAGE_KEY);
    return cached ? (JSON.parse(cached) as ApiCredentials) : null;
  } catch (error) {
    console.warn('读取本地配置失败', error);
    return null;
  }
}

function loadRuntimeMode(): RuntimeMode {
  try {
    const cached = localStorage.getItem(RUNTIME_MODE_KEY) as RuntimeMode | null;
    if (cached === 'frontend' || cached === 'backend') {
      return cached;
    }
  } catch (error) {
    console.warn('读取运行模式失败', error);
  }
  return (import.meta.env.VITE_RUNTIME_MODE as RuntimeMode) || 'frontend';
}

function persistRuntimeMode(mode: RuntimeMode) {
  try {
    localStorage.setItem(RUNTIME_MODE_KEY, mode);
  } catch (error) {
    console.warn('保存运行模式失败', error);
  }
}

function persistToStorage(data: ApiCredentials) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (error) {
    console.warn('本地持久化失败', error);
  }
}

export const useConfigStore = defineStore('config', {
  state: (): ConfigState => {
    const providerSettings = loadProviderSettings();
    return {
      credentials: { ...envCredentials },
      runtimeMode: loadRuntimeMode(),
      lastSyncedAt: undefined,
      providerSettings,
    };
  },
  getters: {
    /** 前端模式是否就绪 */
    isFrontendReady: (state) => {
      if (state.runtimeMode === 'backend') return true;
      const creds = state.providerSettings.credentials[state.providerSettings.activeProvider];
      return validateCredentials(state.providerSettings.activeProvider, creds || {});
    },
    /** 当前活动的供应商 */
    activeProvider: (state): ProviderCode => state.providerSettings.activeProvider,
    /** 当前供应商的凭证 */
    activeCredentials: (state): DynamicCredentials => {
      return state.providerSettings.credentials[state.providerSettings.activeProvider] || {};
    },
    /** 当前供应商是否已配置 */
    isCurrentProviderConfigured: (state): boolean => {
      const creds = state.providerSettings.credentials[state.providerSettings.activeProvider];
      return isProviderConfigured(state.providerSettings.activeProvider, creds || {});
    },
  },
  actions: {
    bootstrapFromStorage() {
      // 加载旧版凭证(兼容旧版本)
      const credentials = loadFromStorage();
      if (credentials) {
        this.credentials = credentials;
        // 迁移到新的供应商设置中
        this.providerSettings.credentials.zhetaoke = { ...credentials };
        persistProviderSettings(this.providerSettings);
        this.lastSyncedAt = Date.now();
        return;
      }
      if (this.runtimeMode === 'frontend' && hasEnvDefaults) {
        this.credentials = { ...envCredentials };
        this.providerSettings.credentials.zhetaoke = { ...envCredentials };
      }
    },
    /** 更新当前供应商的凭证 */
    updateCredentials(payload: DynamicCredentials) {
      this.credentials = { ...this.credentials, ...payload };
      this.providerSettings.credentials[this.providerSettings.activeProvider] = { ...payload };
      this.lastSyncedAt = Date.now();
      persistToStorage(this.credentials as ApiCredentials);
      persistProviderSettings(this.providerSettings);
    },
    /** 切换供应商 */
    switchProvider(provider: ProviderCode) {
      this.providerSettings.activeProvider = provider;
      // 同步当前凭证
      this.credentials = { ...this.providerSettings.credentials[provider] };
      this.lastSyncedAt = Date.now();
      persistProviderSettings(this.providerSettings);
    },
    /** 更新指定供应商的凭证 */
    updateProviderCredentials(provider: ProviderCode, payload: DynamicCredentials) {
      this.providerSettings.credentials[provider] = { ...payload };
      // 如果是当前供应商，同步到 credentials
      if (provider === this.providerSettings.activeProvider) {
        this.credentials = { ...this.credentials, ...payload };
        persistToStorage(this.credentials as ApiCredentials);
      }
      this.lastSyncedAt = Date.now();
      persistProviderSettings(this.providerSettings);
    },
    applyCredentialsFromQuery(searchParams: URLSearchParams) {
      if (this.runtimeMode !== 'frontend') return;
      const appkey = getFirstAvailable(searchParams, ['ztk_key', 'ZTK_KEY']);
      const sid = getFirstAvailable(searchParams, ['ztk_sid', 'ZTK_SID']);
      if (!appkey && !sid) return;
      const next: DynamicCredentials = { ...this.credentials };
      if (appkey) next.appkey = appkey;
      if (sid) next.sid = sid;
      this.updateCredentials(next);
    },
    updateRuntimeMode(mode: RuntimeMode) {
      this.runtimeMode = mode;
      persistRuntimeMode(mode);
    },
    resetCredentials() {
      this.credentials = { ...resolveEnvCredentials() };
      this.providerSettings.credentials[this.providerSettings.activeProvider] = { ...this.credentials };
      this.lastSyncedAt = Date.now();
      persistToStorage(this.credentials as ApiCredentials);
      persistProviderSettings(this.providerSettings);
    },
  },
});

function getFirstAvailable(searchParams: URLSearchParams, keys: string[]) {
  for (const key of keys) {
    const value = searchParams.get(key);
    if (value) return value;
  }
  return undefined;
}
