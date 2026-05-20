import { Router } from 'express';
import {
  setupTelegramBot,
  fetchAndSummarizeTelegram,
  getTelegramStatus,
} from '../services/telegramService.js';

export const telegramRouter = Router();

telegramRouter.post('/setup', (req, res) => {
  try {
    const { botToken, chatId } = req.body;
    if (!botToken || !chatId) {
      res.status(400).json({ error: 'botToken and chatId are required' });
      return;
    }

    const result = setupTelegramBot(botToken, chatId);
    if (!result.success) {
      res.status(500).json(result);
      return;
    }

    res.json(result);
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

telegramRouter.post('/fetch', async (_req, res) => {
  try {
    const result = await fetchAndSummarizeTelegram();
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

telegramRouter.get('/status', async (_req, res) => {
  try {
    const result = await getTelegramStatus();
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});