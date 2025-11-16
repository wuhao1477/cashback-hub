import { defineStore } from 'pinia';

export type RuntimeMode = 'frontend' | 'backend';

export interface ApiCredentials {
  appkey: string;
  sid: string;
  customerId: string;
}

interface ConfigState {
  credentials: ApiCredentials;
  runtimeMode: RuntimeMode;
  lastSyncedAt?: number;
}

const STORAGE_KEY = 'cashback-hub:credentials';

function loadFromStorage(): ApiCredentials | null {
  try {
    const cached = localStorage.getItem(STORAGE_KEY);
    return cached ? (JSON.parse(cached) as ApiCredentials) : null;
  } catch (error) {
    console.warn('读取本地配置失败', error);
    return null;
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
    credentials: {
      appkey: '',
      sid: '',
      customerId: '',
    },
    runtimeMode: (import.meta.env.VITE_RUNTIME_MODE as RuntimeMode) || 'frontend',
    lastSyncedAt: undefined,
  }),
  getters: {
    isFrontendReady: (state) => {
      if (state.runtimeMode === 'backend') return true;
      return Boolean(state.credentials.appkey && state.credentials.sid && state.credentials.customerId);
    },
  },
  actions: {
    bootstrapFromStorage() {
      const credentials = loadFromStorage();
      if (credentials) {
        this.credentials = credentials;
        this.lastSyncedAt = Date.now();
      }
    },
    updateCredentials(payload: ApiCredentials) {
      this.credentials = { ...payload };
      this.lastSyncedAt = Date.now();
      persistToStorage(this.credentials);
    },
    updateRuntimeMode(mode: RuntimeMode) {
      this.runtimeMode = mode;
    },
    resetCredentials() {
      this.credentials = { appkey: '', sid: '', customerId: '' };
      this.lastSyncedAt = Date.now();
      persistToStorage(this.credentials);
    },
  },
});
