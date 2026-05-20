import { Router } from 'express';
import { getSummaries, markSummaryRead } from '../services/database.js';

export const summaryRouter = Router();

summaryRouter.get('/', (req, res) => {
  try {
    const type = req.query.type as string | undefined;
    const limit = parseInt(req.query.limit as string) || 50;
    const offset = parseInt(req.query.offset as string) || 0;

    const summaries = getSummaries(type, limit, offset);
    res.json(summaries);
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

summaryRouter.get('/latest', (req, res) => {
  try {
    const type = req.query.type as string | undefined;
    const summaries = getSummaries(type, 1, 0);
    res.json(summaries[0] || null);
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

summaryRouter.post('/:id/read', (req, res) => {
  try {
    const { id } = req.params;
    const success = markSummaryRead(id);
    res.json({ success });
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

summaryRouter.post('/', async (_req, res) => {
  try {
    const { summarizeAllSources } = await import('../services/aiService.js');
    const result = await summarizeAllSources();
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});