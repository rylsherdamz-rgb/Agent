import { Router } from 'express';
import { getAuthUrl, handleOAuthCallback, fetchAndSummarizeEmails, getGmailStatus } from '../services/gmailService.js';

export const gmailRouter = Router();

gmailRouter.get('/auth/start', (_req, res) => {
  try {
    const url = getAuthUrl();
    res.json({ url });
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

gmailRouter.get('/auth/oauth2callback', async (req, res) => {
  try {
    const code = req.query.code as string;
    if (!code) {
      res.status(400).send('Missing authorization code');
      return;
    }

    const email = await handleOAuthCallback(code);
    res.send(`
      <html><body style="font-family: sans-serif; text-align: center; padding: 40px;">
        <h1 style="color: #4CAF50;">Gmail Connected!</h1>
        <p>Connected as: ${email}</p>
        <p>You can close this window and return to the app.</p>
      </body></html>
    `);
  } catch (err) {
    res.status(500).send(`Auth failed: ${(err as Error).message}`);
  }
});

gmailRouter.post('/auth/complete', async (req, res) => {
  try {
    const { code } = req.body;
    if (!code) {
      res.status(400).json({ error: 'Missing auth code' });
      return;
    }

    const email = await handleOAuthCallback(code);
    res.json({ success: true, email });
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

gmailRouter.post('/fetch', async (_req, res) => {
  try {
    const result = await fetchAndSummarizeEmails();
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

gmailRouter.get('/status', async (_req, res) => {
  try {
    const result = await getGmailStatus();
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});