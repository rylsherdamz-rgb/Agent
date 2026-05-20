import { v4 as uuid } from 'uuid';
import { EmailDB, EmailAccountDB } from './database';
import { AuthStorage } from './storage';
import type { Email, EmailAccount } from '../types';

interface ImapConfig {
  host: string;
  port: number;
  user: string;
  password: string;
  useSSL: boolean;
}

function base64Encode(str: string): string {
  return btoa(unescape(encodeURIComponent(str)));
}

async function fetchIMAP(
  config: ImapConfig,
  command: string
): Promise<string> {
  const url = `${config.useSSL ? 'https' : 'http'}://${config.host}:${config.port}/`;
  const auth = base64Encode(`${config.user}:${config.password}`);

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${auth}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: command,
  });

  return response.text();
}

interface ParsedEmail {
  messageId: string;
  from: string;
  fromName: string;
  to: string[];
  cc: string[];
  subject: string;
  body: string;
  bodyText: string;
  date: number;
}

function parseEmail(raw: string): ParsedEmail | null {
  try {
    const headerEnd = raw.indexOf('\r\n\r\n');
    const headers = raw.substring(0, headerEnd);
    const body = raw.substring(headerEnd + 4);

    const getHeader = (name: string): string => {
      const regex = new RegExp(`^${name}:\\s*(.+)$`, 'im');
      const match = headers.match(regex);
      return match ? match[1].trim() : '';
    };

    const fromHeader = getHeader('From');
    const fromMatch = fromHeader.match(/^(.+?)\s*<(.+@.+)>/);
    const fromName = fromMatch ? fromMatch[1].trim() : fromHeader;
    const from = fromMatch ? fromMatch[2] : fromHeader;

    const toHeader = getHeader('To');
    const to = toHeader.split(',').map((s: string) => {
      const m = s.trim().match(/<(.+@.+)>/);
      return m ? m[1] : s.trim();
    }).filter(Boolean);

    const dateStr = getHeader('Date');
    const date = dateStr ? new Date(dateStr).getTime() : Date.now();

    let bodyText = '';
    let bodyHtml = '';

    const parts = body.split(/--.*boundary/);
    for (const part of parts) {
      if (part.includes('Content-Type: text/plain')) {
        const contentStart = part.indexOf('\r\n\r\n');
        bodyText = part.substring(contentStart + 4).trim();
      }
      if (part.includes('Content-Type: text/html')) {
        const contentStart = part.indexOf('\r\n\r\n');
        bodyHtml = part.substring(contentStart + 4).trim();
      }
    }

    if (!bodyText && !bodyHtml) {
      bodyText = body.trim();
    }

    return {
      messageId: getHeader('Message-ID') || uuid(),
      from,
      fromName,
      to,
      cc: [],
      subject: getHeader('Subject'),
      body: bodyHtml || bodyText,
      bodyText: bodyText || bodyHtml,
      date,
    };
  } catch {
    return null;
  }
}

export async function syncEmails(accountId: string): Promise<{ synced: number; error: string | null }> {
  try {
    const accounts = await EmailAccountDB.getAll();
    const account = accounts.find(a => a.id === accountId);
    if (!account) return { synced: 0, error: 'Account not found' };

    const tokens = AuthStorage.getTokens();
    const password = tokens[`email_${accountId}`];
    if (!password) return { synced: 0, error: 'No password stored' };

    const config: ImapConfig = {
      host: account.imapHost,
      port: account.imapPort,
      user: account.email,
      password,
      useSSL: account.useSSL,
    };

    let synced = 0;

    try {
      const listResponse = await fetchIMAP(config, `UID SEARCH ALL`);
      const uidMatch = listResponse.match(/\* SEARCH (.+)/i);
      if (!uidMatch || !uidMatch[1]) return { synced: 0, error: 'No emails found' };

      const uids = uidMatch[1].trim().split(/\s+/).slice(-20);

      for (const uid of uids) {
        const rawResponse = await fetchIMAP(config, `UID FETCH ${uid} (BODY[])`);
        const parsed = parseEmail(rawResponse);
        if (!parsed) continue;

        const existing = await EmailDB.getByAccount(accountId, 1);
        const exists = existing.some((e: Email) => e.messageId === parsed.messageId);
        if (exists) continue;

        const email: Email = {
          id: uuid(),
          accountId,
          messageId: parsed.messageId,
          from: parsed.from,
          fromName: parsed.fromName,
          to: parsed.to,
          cc: parsed.cc,
          subject: parsed.subject,
          body: parsed.body,
          bodyText: parsed.bodyText,
          date: parsed.date,
          isRead: false,
          isStarred: false,
          labels: [],
          attachments: [],
          sourceTaskId: null,
        };

        await EmailDB.create(email);
        synced++;
      }
    } catch (fetchErr) {
      return { synced, error: `IMAP fetch failed: ${(fetchErr as Error).message}` };
    }

    if (account.lastSyncAt || !account.lastSyncAt) {
      await EmailAccountDB.update({ ...account, lastSyncAt: Date.now() });
    }

    return { synced, error: null };
  } catch (err) {
    return { synced: 0, error: (err as Error).message };
  }
}

export function getDefaultIMAPSettings(provider: EmailAccount['provider']): {
  imapHost: string;
  imapPort: number;
  smtpHost: string;
  smtpPort: number;
} {
  switch (provider) {
    case 'gmail':
      return {
        imapHost: 'imap.gmail.com',
        imapPort: 993,
        smtpHost: 'smtp.gmail.com',
        smtpPort: 465,
      };
    case 'outlook':
      return {
        imapHost: 'outlook.office365.com',
        imapPort: 993,
        smtpHost: 'smtp.office365.com',
        smtpPort: 587,
      };
    default:
      return {
        imapHost: '',
        imapPort: 993,
        smtpHost: '',
        smtpPort: 587,
      };
  }
}