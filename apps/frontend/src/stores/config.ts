import { defineStore } from 'pinia';

export type RuntimeMode = 'frontend' | 'backend';

export interface ApiCredentials {
  appkey: string;
  sid: string;
  customerId?: string;
}

interface ConfigState {
  credentials: ApiCredentials;
  runtimeMode: RuntimeMode;
  lastSyncedAt?: number;
}

const STORAGE_KEY = 'cashback-hub:credentials';
const RUNTIME_MODE_KEY = 'cashback-hub:runtime-mode';

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
  state: (): ConfigState => ({
    credentials: { ...envCredentials },
    runtimeMode: loadRuntimeMode(),
    lastSyncedAt: undefined,
  }),
  getters: {
    isFrontendReady: (state) => {
      if (state.runtimeMode === 'backend') return true;
      return Boolean(state.credentials.appkey && state.credentials.sid);
    },
  },
  actions: {
    bootstrapFromStorage() {
      const credentials = loadFromStorage();
      if (credentials) {
        this.credentials = credentials;
        this.lastSyncedAt = Date.now();
        return;
      }
      if (this.runtimeMode === 'frontend' && hasEnvDefaults) {
        this.credentials = { ...envCredentials };
      }
    },
    updateCredentials(payload: ApiCredentials) {
      this.credentials = { ...payload };
      this.lastSyncedAt = Date.now();
      persistToStorage(this.credentials);
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
      this.lastSyncedAt = Date.now();
      persistToStorage(this.credentials);
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
