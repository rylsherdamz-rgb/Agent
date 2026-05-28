import { EmailAccountDB } from './database';
import { BackendAPI } from './api';
import type { EmailAccount } from '../types';

export async function syncEmails(accountId: string): Promise<{ synced: number; error: string | null }> {
  try {
    const accounts = await EmailAccountDB.getAll();
    const account = accounts.find(a => a.id === accountId);
    if (!account) return { synced: 0, error: 'Account not found' };

    const { data, error } = await BackendAPI.fetchGmail();
    if (error) {
      return { synced: 0, error: `Backend fetch failed: ${error}` };
    }

    if (data) {
      await EmailAccountDB.update({ ...account, lastSyncAt: Date.now() });
      return { synced: data.unreadCount, error: null };
    }

    return { synced: 0, error: 'No data returned from backend' };
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