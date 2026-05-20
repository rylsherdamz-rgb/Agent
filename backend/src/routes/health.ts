import { Router } from 'express';

export const healthRouter = Router();

healthRouter.get('/', (_req, res) => {
  res.json({
    status: 'ok',
    version: '1.0.0',
    uptime: process.uptime(),
    modelLoaded: false,
    services: {
      gmail: !!process.env.GMAIL_CLIENT_ID,
      telegram: !!process.env.TELEGRAM_BOT_TOKEN,
      ai: !!process.env.OPENAI_API_KEY,
    },
    timestamp: Date.now(),
  });
});