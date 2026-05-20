import { Router } from 'express';
import { generateAISummary } from '../services/aiService.js';

export const aiRouter = Router();

aiRouter.post('/ask', async (req, res) => {
  try {
    const { question, context } = req.body;
    if (!question) {
      res.status(400).json({ error: 'question is required' });
      return;
    }

    const result = await generateAISummary(question, context);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});