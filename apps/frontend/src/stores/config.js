import { defineStore } from 'pinia';
const STORAGE_KEY = 'cashback-hub:credentials';
function loadFromStorage() {
    try {
        const cached = localStorage.getItem(STORAGE_KEY);
        return cached ? JSON.parse(cached) : null;
    }
    catch (error) {
        console.warn('读取本地配置失败', error);
        return null;
    }
}
function persistToStorage(data) {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    }
    catch (error) {
        console.warn('本地持久化失败', error);
    }
}
export const useConfigStore = defineStore('config', {
    state: () => ({
        credentials: {
            appkey: '',
            sid: '',
            customerId: '',
        },
        runtimeMode: import.meta.env.VITE_RUNTIME_MODE || 'frontend',
        lastSyncedAt: undefined,
    }),
    getters: {
        isFrontendReady: (state) => {
            if (state.runtimeMode === 'backend')
                return true;
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
        updateCredentials(payload) {
            this.credentials = { ...payload };
            this.lastSyncedAt = Date.now();
            persistToStorage(this.credentials);
        },
        updateRuntimeMode(mode) {
            this.runtimeMode = mode;
        },
        resetCredentials() {
            this.credentials = { appkey: '', sid: '', customerId: '' };
            this.lastSyncedAt = Date.now();
            persistToStorage(this.credentials);
        },
    },
});
