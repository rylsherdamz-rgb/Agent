import { create } from 'zustand';
import { SettingsStorage, ModelStorage } from '../services/storage';
import { DEFAULT_MODEL, BACKGROUND_SYNC_INTERVALS } from '../utils/constants';
import type { AppSettings } from '../types';

const DEFAULT_SETTINGS: AppSettings = {
  theme: 'system',
  defaultCalendarView: 'month',
  googleCalendarEnabled: false,
  googleCalendarEmail: null,
  emailAccounts: [],
  socialEnabled: false,
  socialPlatforms: [],
  modelDownloaded: false,
  modelPath: null,
  modelName: null,
  agentEnabled: true,
  backgroundSyncEnabled: false,
  backgroundSyncInterval: BACKGROUND_SYNC_INTERVALS[1].value,
  notificationsEnabled: true,
  firstDayOfWeek: 0,
  timeFormat: '12h',
  language: 'en',
  backendUrl: null,
  backendToken: null,
  telegramEnabled: false,
  telegramBotToken: null,
  telegramChatId: null,
};

interface SettingsStore {
  settings: AppSettings;
  isLoaded: boolean;

  loadSettings: () => void;
  updateSettings: (partial: Partial<AppSettings>) => void;
  resetSettings: () => void;
  setModelDownloaded: (path: string) => void;
}

export const useSettingsStore = create<SettingsStore>((set) => ({
  settings: DEFAULT_SETTINGS,
  isLoaded: false,

  loadSettings: () => {
    const saved = SettingsStorage.get();
    if (saved) {
      set({
        settings: { ...DEFAULT_SETTINGS, ...saved },
        isLoaded: true,
      });
    } else {
      SettingsStorage.set(DEFAULT_SETTINGS);
      set({ settings: DEFAULT_SETTINGS, isLoaded: true });
    }

    const modelInfo = ModelStorage.getModelInfo();
    if (modelInfo.name) {
      set((state) => ({
        settings: {
          ...state.settings,
          modelName: modelInfo.name,
          modelPath: modelInfo.path,
          modelDownloaded: modelInfo.downloaded,
        },
      }));
    }
  },

  updateSettings: (partial) => {
    set((state) => {
      const updated = { ...state.settings, ...partial };
      SettingsStorage.set(updated);
      return { settings: updated };
    });
  },

  resetSettings: () => {
    SettingsStorage.set(DEFAULT_SETTINGS);
    set({ settings: DEFAULT_SETTINGS });
  },

  setModelDownloaded: (path) => {
    ModelStorage.setModelInfo({
      name: DEFAULT_MODEL,
      path,
      downloaded: true,
    });

    set((state) => ({
      settings: {
        ...state.settings,
        modelDownloaded: true,
        modelPath: path,
        modelName: DEFAULT_MODEL,
      },
    }));
  },
}));