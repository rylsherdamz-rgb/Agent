import { SyncStorage } from './storage';
import { syncGoogleCalendar } from './googleCalendar';
import { syncEmails } from './emailService';
import { syncSocialFeed } from './socialService';
import { EmailAccountDB } from './database';
import type { AppSettings } from '../types';

export interface SyncResult {
  googleCalendar: { synced: number; error: string | null };
  emails: Record<string, { synced: number; error: string | null }>;
  social: Record<string, { synced: number; error: string | null }>;
}

export async function syncAll(settings: AppSettings): Promise<SyncResult> {
  const result: SyncResult = {
    googleCalendar: { synced: 0, error: null },
    emails: {},
    social: {},
  };

  if (settings.googleCalendarEnabled) {
    result.googleCalendar = await syncGoogleCalendar();
  }

  const accounts = await EmailAccountDB.getAll();
  for (const account of accounts) {
    if (account.isEnabled) {
      result.emails[account.id] = await syncEmails(account.id);
    }
  }

  if (settings.socialEnabled) {
    for (const platform of settings.socialPlatforms) {
      result.social[platform] = await syncSocialFeed(platform);
    }
  }

  SyncStorage.setLastSync(Date.now());

  return result;
}

export async function syncSingleService(
  service: 'googleCalendar' | 'email' | 'social',
  accountOrPlatform?: string
): Promise<{ synced: number; error: string | null }> {
  switch (service) {
    case 'googleCalendar':
      return syncGoogleCalendar();
    case 'email':
      if (!accountOrPlatform) return { synced: 0, error: 'No account specified' };
      return syncEmails(accountOrPlatform);
    case 'social':
      if (!accountOrPlatform) return { synced: 0, error: 'No platform specified' };
      return syncSocialFeed(accountOrPlatform);
  }
}