import express from 'express';
import cors from 'cors';
import { config } from 'dotenv';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { mkdirSync } from 'fs';
import { initDatabase } from './services/database.js';
import { gmailRouter } from './routes/gmail.js';
import { telegramRouter } from './routes/telegram.js';
import { summaryRouter } from './routes/summaries.js';
import { aiRouter } from './routes/ai.js';
import { healthRouter } from './routes/health.js';
import { authMiddleware } from './middleware/auth.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
config({ path: join(__dirname, '..', '.env') });

const PORT = parseInt(process.env.PORT || '3000', 10);
const API_TOKEN = process.env.API_TOKEN || 'dev-token-change-me';

mkdirSync(join(__dirname, '..', 'data'), { recursive: true });

initDatabase();

const app = express();

app.use(cors());
app.use(express.json({ limit: '10mb' }));

app.use('/api/v1/health', healthRouter);

app.use('/api/v1/gmail', authMiddleware(API_TOKEN), gmailRouter);
app.use('/api/v1/telegram', authMiddleware(API_TOKEN), telegramRouter);
app.use('/api/v1/summaries', authMiddleware(API_TOKEN), summaryRouter);
app.use('/api/v1/summarize', authMiddleware(API_TOKEN), summaryRouter);
app.use('/api/v1/ai', authMiddleware(API_TOKEN), aiRouter);

app.use((_req, res) => {
  res.status(404).json({ error: 'Not found' });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Agent backend running on port ${PORT}`);
  console.log(`API Token: ${API_TOKEN ? 'configured' : 'NOT SET'}`);
  console.log(`Gmail: ${process.env.GMAIL_CLIENT_ID ? 'configured' : 'not configured'}`);
  console.log(`Telegram: ${process.env.TELEGRAM_BOT_TOKEN ? 'configured' : 'not configured'}`);
});

export default app;