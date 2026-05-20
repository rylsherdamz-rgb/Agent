import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { v4 as uuid } from 'uuid';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_DIR = process.env.DATABASE_PATH
  ? dirname(process.env.DATABASE_PATH)
  : join(__dirname, '..', '..', 'data');
const DB_FILE = join(DATA_DIR, 'agent-store.json');

interface Store {
  gmailTokens: GmailToken[];
  summaries: Summary[];
  telegramState: TelegramState | null;
  syncLogs: SyncLogEntry[];
}

interface GmailToken {
  id: string;
  email: string;
  access_token: string;
  refresh_token: string | null;
  expiry_date: number | null;
  created_at: number;
  updated_at: number;
}

interface Summary {
  id: string;
  type: 'gmail' | 'telegram' | 'combined';
  source: string;
  title: string;
  content: string;
  action_items: string[];
  timestamp: number;
  is_read: boolean;
  created_at: number;
}

interface TelegramState {
  id: string;
  bot_token: string;
  chat_id: string;
  last_message_id: number;
  last_fetch: number | null;
  is_active: boolean;
  created_at: number;
}

interface SyncLogEntry {
  id: string;
  service: string;
  status: string;
  items_synced: number;
  error: string | null;
  timestamp: number;
}

let store: Store = {
  gmailTokens: [],
  summaries: [],
  telegramState: null,
  syncLogs: [],
};

function ensureDataDir(): void {
  if (!existsSync(DATA_DIR)) {
    mkdirSync(DATA_DIR, { recursive: true });
  }
}

function loadStore(): void {
  try {
    if (existsSync(DB_FILE)) {
      const raw = readFileSync(DB_FILE, 'utf-8');
      store = JSON.parse(raw);
    }
  } catch {}
}

function saveStore(): void {
  ensureDataDir();
  writeFileSync(DB_FILE, JSON.stringify(store, null, 2));
}

export function initDatabase(): void {
  ensureDataDir();
  loadStore();
}

export function saveGmailToken(
  email: string,
  accessToken: string,
  refreshToken?: string,
  expiry?: number
): GmailToken {
  const now = Date.now();
  const existing = store.gmailTokens.find((t) => t.email === email);

  if (existing) {
    existing.access_token = accessToken;
    existing.refresh_token = refreshToken || existing.refresh_token;
    existing.expiry_date = expiry || existing.expiry_date;
    existing.updated_at = now;
    saveStore();
    return existing;
  }

  const token: GmailToken = {
    id: uuid(),
    email,
    access_token: accessToken,
    refresh_token: refreshToken || null,
    expiry_date: expiry || null,
    created_at: now,
    updated_at: now,
  };

  store.gmailTokens.push(token);
  saveStore();
  return token;
}

export function getGmailToken(email?: string): GmailToken | null {
  if (store.gmailTokens.length === 0) return null;
  if (email) {
    return store.gmailTokens.find((t) => t.email === email) || null;
  }
  return store.gmailTokens.sort((a, b) => b.updated_at - a.updated_at)[0] || null;
}

export function saveSummary(
  summary: Omit<Summary, 'id' | 'created_at'>
): Summary {
  const now = Date.now();
  const full: Summary = {
    ...summary,
    id: uuid(),
    created_at: now,
  };

  store.summaries.push(full);
  saveStore();
  return full;
}

export function getSummaries(
  type?: string,
  limit = 50,
  offset = 0
): Summary[] {
  let filtered = store.summaries;
  if (type) {
    filtered = filtered.filter((s) => s.type === type);
  }
  return filtered
    .sort((a, b) => b.timestamp - a.timestamp)
    .slice(offset, offset + limit);
}

export function markSummaryRead(id: string): boolean {
  const summary = store.summaries.find((s) => s.id === id);
  if (!summary) return false;
  summary.is_read = true;
  saveStore();
  return true;
}

export function saveTelegramState(
  state: Omit<TelegramState, 'id' | 'created_at'> & { id?: string }
): TelegramState {
  const now = Date.now();

  if (store.telegramState) {
    store.telegramState.bot_token = state.bot_token;
    store.telegramState.chat_id = state.chat_id;
    store.telegramState.last_message_id = state.last_message_id;
    store.telegramState.last_fetch = state.last_fetch ?? null;
    store.telegramState.is_active = state.is_active;
    saveStore();
    return store.telegramState;
  }

  const newState: TelegramState = {
    id: state.id || uuid(),
    bot_token: state.bot_token,
    chat_id: state.chat_id,
    last_message_id: state.last_message_id,
    last_fetch: state.last_fetch ?? null,
    is_active: state.is_active,
    created_at: now,
  };

  store.telegramState = newState;
  saveStore();
  return newState;
}

export function getTelegramState(): TelegramState | null {
  return store.telegramState;
}

export function logSync(
  service: string,
  status: string,
  itemsSynced: number,
  error?: string
): void {
  store.syncLogs.push({
    id: uuid(),
    service,
    status,
    items_synced: itemsSynced,
    error: error || null,
    timestamp: Date.now(),
  });
  saveStore();
}

export type { GmailToken, Summary, TelegramState };