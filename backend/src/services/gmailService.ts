import { google } from 'googleapis';
import { saveGmailToken, getGmailToken, saveSummary, logSync } from './database.js';

const SCOPES = [
  'https://www.googleapis.com/auth/gmail.readonly',
  'https://www.googleapis.com/auth/gmail.modify',
];

function getOAuth2Client() {
  const clientId = process.env.GMAIL_CLIENT_ID;
  const clientSecret = process.env.GMAIL_CLIENT_SECRET;
  const redirectUri = process.env.GMAIL_REDIRECT_URI || 'http://localhost:3000/api/v1/gmail/auth/oauth2callback';

  if (!clientId || !clientSecret) {
    throw new Error('GMAIL_CLIENT_ID and GMAIL_CLIENT_SECRET are required');
  }

  return new google.auth.OAuth2(clientId, clientSecret, redirectUri);
}

export function getAuthUrl(): string {
  const oauth2Client = getOAuth2Client();
  return oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES,
    prompt: 'consent',
  });
}

export async function handleOAuthCallback(code: string): Promise<string> {
  const oauth2Client = getOAuth2Client();

  const { tokens } = await oauth2Client.getToken(code);
  oauth2Client.setCredentials(tokens);

  const gmail = google.gmail({ version: 'v1', auth: oauth2Client });
  const profile = await gmail.users.getProfile({ userId: 'me' });

  const email = profile.data.emailAddress || 'unknown';

  saveGmailToken(
    email,
    tokens.access_token!,
    tokens.refresh_token || undefined,
    tokens.expiry_date || undefined
  );

  return email;
}

async function getAuthorizedClient(): Promise<{ auth: ReturnType<typeof getOAuth2Client>; email: string }> {
  const token = getGmailToken();
  if (!token) throw new Error('No Gmail account connected');

  const oauth2Client = getOAuth2Client();
  oauth2Client.setCredentials({
    access_token: token.access_token,
    refresh_token: token.refresh_token,
    expiry_date: token.expiry_date,
  });

  return { auth: oauth2Client, email: token.email };
}

export async function fetchAndSummarizeEmails(): Promise<{
  count: number;
  summary: string;
  actionItems: string[];
  error: string | null;
}> {
  try {
    const { auth, email } = await getAuthorizedClient();
    const gmail = google.gmail({ version: 'v1', auth });

    const response = await gmail.users.messages.list({
      userId: 'me',
      maxResults: 10,
      q: 'is:unread',
    });

    const messages = response.data.messages || [];
    if (messages.length === 0) {
      await logSync('gmail', 'success', 0);
      return { count: 0, summary: 'No new unread emails.', actionItems: [], error: null };
    }

    const emailSummaries: string[] = [];
    const actionItems: string[] = [];

    for (const msg of messages) {
      try {
        const detail = await gmail.users.messages.get({
          userId: 'me',
          id: msg.id!,
          format: 'metadata',
          metadataHeaders: ['From', 'Subject', 'Date'],
        });

        const headers = detail.data.payload?.headers || [];
        const from = headers.find((h) => h.name === 'From')?.value || 'Unknown';
        const subject = headers.find((h) => h.name === 'Subject')?.value || '(no subject)';

        emailSummaries.push(`From: ${from}\nSubject: ${subject}`);

        const snippet = detail.data.snippet || '';
        if (snippet.toLowerCase().includes('urgent') ||
            snippet.toLowerCase().includes('asap') ||
            snippet.toLowerCase().includes('deadline') ||
            snippet.toLowerCase().includes('action required') ||
            snippet.toLowerCase().includes('please review')) {
          actionItems.push(`${subject} (from ${from})`);
        }

        await gmail.users.messages.modify({
          userId: 'me',
          id: msg.id!,
          requestBody: { removeLabelIds: ['UNREAD'] },
        });
      } catch {}
    }

    const summary = summarizeEmailBatch(emailSummaries);

    await saveSummary({
      type: 'gmail',
      source: email,
      title: `Gmail Summary - ${new Date().toLocaleDateString()}`,
      content: summary,
      action_items: actionItems,
      timestamp: Date.now(),
      is_read: false,
    });

    await logSync('gmail', 'success', messages.length);

    return { count: messages.length, summary, actionItems, error: null };
  } catch (err) {
    const errorMsg = (err as Error).message;
    await logSync('gmail', 'error', 0, errorMsg);
    return { count: 0, summary: '', actionItems: [], error: errorMsg };
  }
}

function summarizeEmailBatch(emails: string[]): string {
  if (emails.length === 0) return 'No emails to summarize.';

  const count = emails.length;
  let summary = `You have ${count} unread email${count > 1 ? 's' : ''}.\n\n`;

  for (const email of emails) {
    summary += `${email}\n---\n`;
  }

  summary += '\nAll emails have been marked as read.';

  return summary;
}

export async function getGmailStatus(): Promise<{
  connected: boolean;
  email: string;
  lastFetch: number | null;
  unreadCount: number;
}> {
  const token = getGmailToken();
  if (!token) return { connected: false, email: '', lastFetch: null, unreadCount: 0 };

  try {
    const { auth } = await getAuthorizedClient();
    const gmail = google.gmail({ version: 'v1', auth });
    const profile = await gmail.users.getProfile({ userId: 'me' });

    return {
      connected: true,
      email: token.email,
      lastFetch: token.updated_at,
      unreadCount: profile.data.messagesTotal || 0,
    };
  } catch {
    return {
      connected: true,
      email: token.email,
      lastFetch: token.updated_at,
      unreadCount: 0,
    };
  }
}