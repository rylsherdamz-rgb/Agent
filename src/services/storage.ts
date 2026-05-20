import { MMKV } from 'react-native-mmkv';
import { MMKV_KEYS } from '../utils/constants';
import type { AppSettings } from '../types';

export const storage = new MMKV({ id: 'agent-storage' });

export const SettingsStorage = {
  get(): AppSettings | null {
    const raw = storage.getString(MMKV_KEYS.SETTINGS);
    if (!raw) return null;
    try {
      return JSON.parse(raw);
    } catch {
      return null;
    }
  },

  set(settings: AppSettings): void {
    storage.set(MMKV_KEYS.SETTINGS, JSON.stringify(settings));
  },

  update(partial: Partial<AppSettings>): AppSettings | null {
    const current = SettingsStorage.get();
    if (!current) return null;
    const updated = { ...current, ...partial };
    SettingsStorage.set(updated);
    return updated;
  },
};

export const AuthStorage = {
  getTokens(): Record<string, string> {
    const raw = storage.getString(MMKV_KEYS.AUTH_TOKENS);
    if (!raw) return {};
    try {
      return JSON.parse(raw);
    } catch {
      return {};
    }
  },

  setToken(key: string, token: string): void {
    const tokens = AuthStorage.getTokens();
    tokens[key] = token;
    storage.set(MMKV_KEYS.AUTH_TOKENS, JSON.stringify(tokens));
  },

  removeToken(key: string): void {
    const tokens = AuthStorage.getTokens();
    delete tokens[key];
    storage.set(MMKV_KEYS.AUTH_TOKENS, JSON.stringify(tokens));
  },

  clear(): void {
    storage.delete(MMKV_KEYS.AUTH_TOKENS);
  },
};

export const OnboardingStorage = {
  isComplete(): boolean {
    return storage.getBoolean(MMKV_KEYS.ONBOARDING_COMPLETE) ?? false;
  },

  complete(): void {
    storage.set(MMKV_KEYS.ONBOARDING_COMPLETE, true);
  },

  reset(): void {
    storage.set(MMKV_KEYS.ONBOARDING_COMPLETE, false);
  },
};

export const SyncStorage = {
  getLastSync(): number | null {
    const val = storage.getNumber(MMKV_KEYS.LAST_SYNC);
    return val ?? null;
  },

  setLastSync(timestamp: number): void {
    storage.set(MMKV_KEYS.LAST_SYNC, timestamp);
  },
};

export const ModelStorage = {
  getModelInfo(): { name: string | null; path: string | null; downloaded: boolean } {
    const raw = storage.getString(MMKV_KEYS.MODEL_INFO);
    if (!raw) return { name: null, path: null, downloaded: false };
    try {
      return JSON.parse(raw);
    } catch {
      return { name: null, path: null, downloaded: false };
    }
  },

  setModelInfo(info: { name: string; path: string; downloaded: boolean }): void {
    storage.set(MMKV_KEYS.MODEL_INFO, JSON.stringify(info));
  },
};