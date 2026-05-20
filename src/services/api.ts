import { MMKV } from 'react-native-mmkv';

export const apiStorage = new MMKV({ id: 'agent-api' });

const BASE_TIMEOUT = 15000;

async function request<T>(
  endpoint: string,
  options: {
    method?: string;
    body?: unknown;
    token?: string;
    timeout?: number;
  } = {}
): Promise<{ data: T | null; error: string | null }> {
  const { method = 'GET', body, token, timeout = BASE_TIMEOUT } = options;

  const baseUrl = apiStorage.getString('backend_url');
  if (!baseUrl) return { data: null, error: 'No backend configured' };

  const storedToken = token || apiStorage.getString('backend_token') || '';

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeout);

  try {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (storedToken) {
      headers['Authorization'] = `Bearer ${storedToken}`;
    }

    const response = await fetch(`${baseUrl}/api${endpoint}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
      signal: controller.signal,
    });

    clearTimeout(timer);

    if (!response.ok) {
      const text = await response.text();
      return { data: null, error: `HTTP ${response.status}: ${text}` };
    }

    const json = await response.json();
    return { data: json as T, error: null };
  } catch (err) {
    clearTimeout(timer);
    if ((err as Error).name === 'AbortError') {
      return { data: null, error: 'Request timed out' };
    }
    return { data: null, error: (err as Error).message };
  }
}

export interface BackendSummary {
  id: string;
  type: 'gmail' | 'telegram' | 'combined';
  source: string;
  title: string;
  content: string;
  actionItems: string[];
  timestamp: number;
  isRead: boolean;
}

export interface GmailStatus {
  connected: boolean;
  email: string;
  lastFetch: number | null;
  unreadCount: number;
}

export interface TelegramStatus {
  connected: boolean;
  botName: string;
  chatId: string;
  lastFetch: number | null;
  messageCount: number;
}

export interface BackendHealth {
  status: 'ok' | 'degraded' | 'down';
  version: string;
  uptime: number;
  modelLoaded: boolean;
  services: {
    gmail: boolean;
    telegram: boolean;
    ai: boolean;
  };
}

export const BackendAPI = {
  health: () => request<BackendHealth>('/v1/health'),

  setupBackend: (url: string, token: string) => {
    apiStorage.setString('backend_url', url);
    apiStorage.setString('backend_token', token);
  },

  disconnect: () => {
    apiStorage.delete('backend_url');
    apiStorage.delete('backend_token');
  },

  getSummary: async (type?: 'gmail' | 'telegram'): Promise<{ data: BackendSummary[] | null; error: string | null }> => {
    const qs = type ? `?type=${type}` : '';
    return request<BackendSummary[]>(`/v1/summaries${qs}`);
  },

  fetchGmail: () => request<GmailStatus>('/v1/gmail/fetch', { method: 'POST' }),

  gmailStatus: () => request<GmailStatus>('/v1/gmail/status'),

  startGmailAuth: () => request<{ url: string }>('/v1/gmail/auth/start'),

  completeGmailAuth: (code: string) =>
    request<{ success: boolean; email: string }>('/v1/gmail/auth/complete', {
      method: 'POST',
      body: { code },
    }),

  telegramStatus: () => request<TelegramStatus>('/v1/telegram/status'),

  fetchTelegram: () => request<TelegramStatus>('/v1/telegram/fetch', { method: 'POST' }),

  setupTelegram: (botToken: string, chatId: string) =>
    request<{ success: boolean }>('/v1/telegram/setup', {
      method: 'POST',
      body: { botToken, chatId },
    }),

  markSummaryRead: (id: string) =>
    request<{ success: boolean }>(`/v1/summaries/${id}/read`, { method: 'POST' }),

  askAI: (question: string) =>
    request<{ answer: string }>('/v1/ai/ask', {
      method: 'POST',
      body: { question },
      timeout: 30000,
    }),

  summarizeAll: () =>
    request<BackendSummary[]>('/v1/summarize', {
      method: 'POST',
      timeout: 30000,
    }),
};