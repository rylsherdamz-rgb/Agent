import TelegramBot from 'node-telegram-bot-api';
import { saveSummary, saveTelegramState, getTelegramState, logSync } from './database.js';

let bot: TelegramBot | null = null;

function getBot(): TelegramBot {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) throw new Error('TELEGRAM_BOT_TOKEN not configured');

  if (!bot) {
    const state = getTelegramState();
    const effectiveToken = state?.bot_token || token;
    bot = new TelegramBot(effectiveToken, { polling: false });
  }

  return bot;
}

export function getBotInfo(): { connected: boolean; botName: string; chatId: string } & Record<string, unknown> {
  const state = getTelegramState();
  return {
    connected: !!state && state.is_active,
    botName: 'Agent Bot',
    chatId: state?.chat_id || '',
  };
}

export async function fetchAndSummarizeTelegram(): Promise<{
  count: number;
  summary: string;
  actionItems: string[];
  error: string | null;
}> {
  try {
    const state = getTelegramState();
    if (!state || !state.is_active) {
      return { count: 0, summary: '', actionItems: [], error: 'Telegram not configured' };
    }

    const botInstance = getBot();
    const chatId = parseInt(state.chat_id, 10);

    if (isNaN(chatId)) {
      return { count: 0, summary: '', actionItems: [], error: 'Invalid chat ID' };
    }

    const updates = await botInstance.getUpdates({
      offset: state.last_message_id ? state.last_message_id + 1 : undefined,
      limit: 20,
      timeout: 10,
    });

    const newMessages = updates.filter(
      (u: TelegramBot.Update) => u.update_id > (state.last_message_id || 0)
    );

    if (newMessages.length === 0) {
      return { count: 0, summary: 'No new Telegram messages.', actionItems: [], error: null };
    }

    const messageSummaries: string[] = [];
    const actionItems: string[] = [];
    let maxUpdateId = state.last_message_id;

    for (const update of newMessages) {
      if (update.update_id > maxUpdateId) {
        maxUpdateId = update.update_id;
      }

      const msg = update.message || update.channel_post;
      if (!msg || !msg.text) continue;

      const from = msg.from
        ? `${msg.from.first_name || ''} ${msg.from.last_name || ''}`.trim() || msg.from.username || 'Unknown'
        : 'Channel';

      const text = msg.text.length > 200 ? msg.text.substring(0, 200) + '...' : msg.text;
      messageSummaries.push(`${from}: ${text}`);

      const lower = msg.text.toLowerCase();
      if (lower.includes('urgent') || lower.includes('asap') || lower.includes('todo') ||
          lower.includes('task') || lower.includes('reminder')) {
        actionItems.push(`${from}: ${text}`);
      }
    }

    saveTelegramState({
      ...state,
      last_message_id: maxUpdateId,
      last_fetch: Date.now(),
    });

    const summary = `Telegram Update - ${new Date().toLocaleDateString()}\n\n${messageSummaries.join('\n---\n')}`;

    await saveSummary({
      type: 'telegram',
      source: `Telegram Chat`,
      title: `Telegram Summary - ${new Date().toLocaleDateString()}`,
      content: summary,
      action_items: actionItems,
      timestamp: Date.now(),
      is_read: false,
    });

    await logSync('telegram', 'success', newMessages.length);

    return { count: newMessages.length, summary, actionItems, error: null };
  } catch (err) {
    const errorMsg = (err as Error).message;
    await logSync('telegram', 'error', 0, errorMsg);
    return { count: 0, summary: '', actionItems: [], error: errorMsg };
  }
}

export function setupTelegramBot(botToken: string, chatId: string): { success: boolean; error?: string } {
  try {
    const existingBot = bot;
    if (existingBot) {
      try { existingBot.stopPolling(); } catch {}
    }

    bot = new TelegramBot(botToken, { polling: false });

    saveTelegramState({
      bot_token: botToken,
      chat_id: chatId,
      last_message_id: 0,
      last_fetch: null,
      is_active: true,
    });

    bot.sendMessage(chatId, 'Agent bot connected! I will summarize your messages here.').catch(() => {});

    return { success: true };
  } catch (err) {
    return { success: false, error: (err as Error).message };
  }
}

export async function getTelegramStatus(): Promise<{
  connected: boolean;
  botName: string;
  chatId: string;
  lastFetch: number | null;
  messageCount: number;
}> {
  const state = getTelegramState();
  if (!state || !state.is_active) {
    return {
      connected: false,
      botName: '',
      chatId: '',
      lastFetch: null,
      messageCount: 0,
    };
  }

  return {
    connected: true,
    botName: 'Agent Bot',
    chatId: state.chat_id,
    lastFetch: state.last_fetch,
    messageCount: 0,
  };
}