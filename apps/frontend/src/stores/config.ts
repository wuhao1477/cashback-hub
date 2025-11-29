import { defineStore } from 'pinia';
import type { ProviderCode } from '@cashback/core';

export type RuntimeMode = 'frontend' | 'backend';

export interface ApiCredentials {
  appkey: string;
  sid: string;
  customerId?: string;
}

/** 供应商配置 */
export interface ProviderSettings {
  /** 当前选中的供应商 */
  activeProvider: ProviderCode;
  /** 各供应商的凭证 */
  credentials: Record<ProviderCode, ApiCredentials>;
}

interface ConfigState {
  credentials: ApiCredentials;
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
      zhetaoke: { appkey: '', sid: '', customerId: '' },
      jutuike: { appkey: '', sid: '', customerId: '' },
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
      return Boolean(creds?.appkey && creds?.sid);
    },
    /** 当前活动的供应商 */
    activeProvider: (state): ProviderCode => state.providerSettings.activeProvider,
    /** 当前供应商的凭证 */
    activeCredentials: (state): ApiCredentials => {
      return state.providerSettings.credentials[state.providerSettings.activeProvider] || { appkey: '', sid: '' };
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
    updateCredentials(payload: ApiCredentials) {
      this.credentials = { ...payload };
      this.providerSettings.credentials[this.providerSettings.activeProvider] = { ...payload };
      this.lastSyncedAt = Date.now();
      persistToStorage(this.credentials);
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
    updateProviderCredentials(provider: ProviderCode, payload: ApiCredentials) {
      this.providerSettings.credentials[provider] = { ...payload };
      // 如果是当前供应商，同步到 credentials
      if (provider === this.providerSettings.activeProvider) {
        this.credentials = { ...payload };
        persistToStorage(this.credentials);
      }
      this.lastSyncedAt = Date.now();
      persistProviderSettings(this.providerSettings);
    },
    applyCredentialsFromQuery(searchParams: URLSearchParams) {
      if (this.runtimeMode !== 'frontend') return;
      const appkey = getFirstAvailable(searchParams, ['ztk_key', 'ZTK_KEY']);
      const sid = getFirstAvailable(searchParams, ['ztk_sid', 'ZTK_SID']);
      if (!appkey && !sid) return;
      const next: ApiCredentials = { ...this.credentials };
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
      persistToStorage(this.credentials);
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
