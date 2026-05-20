import { saveSummary } from './database.js';

export async function generateAISummary(
  question: string,
  context?: string
): Promise<{ answer: string; error: string | null }> {
  const openaiKey = process.env.OPENAI_API_KEY;
  const aiModel = process.env.AI_MODEL || 'gpt-3.5-turbo';

  if (openaiKey) {
    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${openaiKey}`,
        },
        body: JSON.stringify({
          model: aiModel,
          messages: [
            {
              role: 'system',
              content: `You are an AI assistant that summarizes emails, Telegram messages, and tasks. 
Be concise and action-oriented. Extract action items and highlight urgent matters.
Respond in plain text, no markdown.

${context ? `Context:\n${context}` : ''}`,
            },
            { role: 'user', content: question },
          ],
          max_tokens: 500,
          temperature: 0.5,
        }),
      });

      const data = await response.json();
      const answer = data.choices?.[0]?.message?.content || 'No response generated.';

      return { answer, error: null };
    } catch (err) {
      return { answer: `Error: ${(err as Error).message}`, error: (err as Error).message };
    }
  }

  return {
    answer: `AI summarization requires an OpenAI API key. Configure OPENAI_API_KEY in environment variables.\n\nFor offline use, the mobile app runs a local Qwen2-1.5B model.\n\nYour question: "${question}"`,
    error: null,
  };
}

export async function summarizeAllSources(): Promise<{
  title: string;
  content: string;
  actionItems: string[];
  error: string | null;
}> {
  const content = `Combined daily summary for ${new Date().toLocaleDateString()}.\n\n` +
    `This is a unified digest of all your connected services.\n` +
    `Use /api/v1/summaries to get per-source summaries.\n\n` +
    `To get AI-powered summarization:\n` +
    `1. Send a POST to /api/v1/ai/ask with your query\n` +
    `2. Or configure OPENAI_API_KEY for automatic summarization`;

  const summary = await saveSummary({
    type: 'combined',
    source: 'system',
    title: `Daily Digest - ${new Date().toLocaleDateString()}`,
    content,
    action_items: [],
    timestamp: Date.now(),
    is_read: false,
  });

  return {
    title: summary.title,
    content: summary.content,
    actionItems: summary.action_items,
    error: null,
  };
}