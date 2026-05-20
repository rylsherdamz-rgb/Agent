import { create } from 'zustand';
import { EmailDB, EmailAccountDB, SocialDB } from '../services/database';
import { v4 as uuid } from 'uuid';
import type { Email, EmailAccount, SocialPost } from '../types';

type InboxItem = (Email | SocialPost) & { itemType: 'email' | 'social' };

interface InboxStore {
  emails: Email[];
  accounts: EmailAccount[];
  socialPosts: SocialPost[];
  unifiedInbox: InboxItem[];
  isLoading: boolean;
  unreadCount: number;
  error: string | null;

  loadEmails: (accountId?: string) => Promise<void>;
  loadAccounts: () => Promise<void>;
  loadSocialPosts: (platform?: string) => Promise<void>;
  loadUnifiedInbox: () => Promise<void>;
  markEmailRead: (id: string) => Promise<void>;
  markSocialRead: (id: string) => Promise<void>;
  addAccount: (account: Partial<EmailAccount>) => Promise<void>;
  removeAccount: (id: string) => Promise<void>;
  updateAccount: (id: string, changes: Partial<EmailAccount>) => Promise<void>;
  refreshUnreadCount: () => Promise<void>;
  createTaskFromItem: (item: Email | SocialPost) => string | null;
}

export const useInboxStore = create<InboxStore>((set, get) => ({
  emails: [],
  accounts: [],
  socialPosts: [],
  unifiedInbox: [],
  isLoading: false,
  unreadCount: 0,
  error: null,

  loadEmails: async (accountId) => {
    set({ isLoading: true, error: null });
    try {
      if (accountId) {
        const emails = await EmailDB.getByAccount(accountId);
        set((state) => ({
          emails: [
            ...state.emails.filter((e) => e.accountId !== accountId),
            ...emails,
          ],
          isLoading: false,
        }));
      } else {
        const accounts = await EmailAccountDB.getAll();
        let allEmails: Email[] = [];
        for (const acc of accounts) {
          const accEmails = await EmailDB.getByAccount(acc.id);
          allEmails = [...allEmails, ...accEmails];
        }
        set({ emails: allEmails, isLoading: false });
      }
    } catch (err) {
      set({ error: (err as Error).message, isLoading: false });
    }
  },

  loadAccounts: async () => {
    try {
      const accounts = await EmailAccountDB.getAll();
      set({ accounts });
    } catch (err) {
      set({ error: (err as Error).message });
    }
  },

  loadSocialPosts: async (platform) => {
    set({ isLoading: true, error: null });
    try {
      const posts = await SocialDB.getAll(platform);
      set({ socialPosts: posts, isLoading: false });
    } catch (err) {
      set({ error: (err as Error).message, isLoading: false });
    }
  },

  loadUnifiedInbox: async () => {
    set({ isLoading: true, error: null });
    try {
      const accounts = await EmailAccountDB.getAll();
      let emails: Email[] = [];
      for (const acc of accounts) {
        const accEmails = await EmailDB.getByAccount(acc.id, 20);
        emails = [...emails, ...accEmails];
      }
      const posts = await SocialDB.getAll(undefined, 20);

      const unified: InboxItem[] = [
        ...emails.map((e) => ({ ...e, itemType: 'email' as const })),
        ...posts.map((p) => ({ ...p, itemType: 'social' as const })),
      ].sort((a, b) => b.date - a.date);

      const unreadCount = unified.filter(
        (item) => item.itemType === 'email'
          ? !(item as Email).isRead
          : !(item as SocialPost).isRead
      ).length;

      set({ emails, socialPosts: posts, unifiedInbox: unified, unreadCount, isLoading: false });
    } catch (err) {
      set({ error: (err as Error).message, isLoading: false });
    }
  },

  markEmailRead: async (id) => {
    await EmailDB.markRead(id);
    set((state) => ({
      emails: state.emails.map((e) => (e.id === id ? { ...e, isRead: true } : e)),
      unifiedInbox: state.unifiedInbox.map((item) =>
        item.id === id && item.itemType === 'email'
          ? { ...item, isRead: true }
          : item
      ),
      unreadCount: Math.max(0, state.unreadCount - 1),
    }));
  },

  markSocialRead: async (id) => {
    await SocialDB.markRead(id);
    set((state) => ({
      socialPosts: state.socialPosts.map((p) => (p.id === id ? { ...p, isRead: true } : p)),
      unifiedInbox: state.unifiedInbox.map((item) =>
        item.id === id && item.itemType === 'social'
          ? { ...item, isRead: true }
          : item
      ),
      unreadCount: Math.max(0, state.unreadCount - 1),
    }));
  },

  addAccount: async (partial) => {
    const account: EmailAccount = {
      id: uuid(),
      email: partial.email || '',
      name: partial.name || '',
      provider: partial.provider || 'imap',
      imapHost: partial.imapHost || '',
      imapPort: partial.imapPort || 993,
      smtpHost: partial.smtpHost || '',
      smtpPort: partial.smtpPort || 587,
      useSSL: partial.useSSL ?? true,
      lastSyncAt: null,
      isEnabled: partial.isEnabled ?? true,
    };

    await EmailAccountDB.create(account);
    set((state) => ({ accounts: [...state.accounts, account] }));
  },

  removeAccount: async (id) => {
    await EmailAccountDB.delete(id);
    set((state) => ({
      accounts: state.accounts.filter((a) => a.id !== id),
      emails: state.emails.filter((e) => e.accountId !== id),
    }));
  },

  updateAccount: async (id, changes) => {
    const account = get().accounts.find((a) => a.id === id);
    if (!account) return;

    const updated = { ...account, ...changes };
    await EmailAccountDB.update(updated);

    set((state) => ({
      accounts: state.accounts.map((a) => (a.id === id ? updated : a)),
    }));
  },

  refreshUnreadCount: async () => {
    const [unreadEmails, unreadPosts] = await Promise.all([
      EmailDB.getUnread(),
      SocialDB.getUnread(),
    ]);
    set({ unreadCount: unreadEmails.length + unreadPosts.length });
  },

  createTaskFromItem: (item) => {
    if ('itemType' in item) return null;
    if ('from' in item) {
      return JSON.stringify({
        title: item.subject,
        description: `From: ${item.fromName} <${item.from}>\n\n${item.bodyText}`,
        source: 'email',
        sourceId: item.id,
        priority: 'medium',
      });
    }
    return JSON.stringify({
      title: item.content.substring(0, 100),
      description: item.content,
      source: 'social',
      sourceId: item.id,
      priority: 'low',
    });
  },
}));