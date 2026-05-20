import * as SQLite from 'expo-sqlite';
import { DB_NAME, DB_TABLES } from '../utils/constants';
import type {
  Task,
  SubTask,
  CalendarEvent,
  Attendee,
  Email,
  EmailAccount,
  SocialPost,
  Attachment,
  AgentConversation,
  AgentMessage,
} from '../types';

let db: SQLite.SQLiteDatabase | null = null;

export async function getDatabase(): Promise<SQLite.SQLiteDatabase> {
  if (db) return db;
  db = await SQLite.openDatabaseAsync(DB_NAME);
  await migrate(db);
  return db;
}

async function migrate(database: SQLite.SQLiteDatabase): Promise<void> {
  await database.execAsync(`
    PRAGMA journal_mode = WAL;
    PRAGMA foreign_keys = ON;

    CREATE TABLE IF NOT EXISTS ${DB_TABLES.TASKS} (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      description TEXT DEFAULT '',
      status TEXT DEFAULT 'pending',
      priority TEXT DEFAULT 'medium',
      due_date INTEGER,
      start_date INTEGER,
      tags TEXT DEFAULT '[]',
      source TEXT DEFAULT 'manual',
      source_id TEXT,
      is_recurring INTEGER DEFAULT 0,
      recurrence_rule TEXT,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL,
      completed_at INTEGER,
      sort_order INTEGER DEFAULT 0
    );

    CREATE INDEX IF NOT EXISTS idx_tasks_status ON ${DB_TABLES.TASKS}(status);
    CREATE INDEX IF NOT EXISTS idx_tasks_due_date ON ${DB_TABLES.TASKS}(due_date);
    CREATE INDEX IF NOT EXISTS idx_tasks_priority ON ${DB_TABLES.TASKS}(priority);

    CREATE TABLE IF NOT EXISTS ${DB_TABLES.SUBTASKS} (
      id TEXT PRIMARY KEY,
      task_id TEXT NOT NULL,
      title TEXT NOT NULL,
      completed INTEGER DEFAULT 0,
      created_at INTEGER NOT NULL,
      FOREIGN KEY (task_id) REFERENCES ${DB_TABLES.TASKS}(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS ${DB_TABLES.EVENTS} (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      description TEXT DEFAULT '',
      location TEXT DEFAULT '',
      start_date INTEGER NOT NULL,
      end_date INTEGER NOT NULL,
      is_all_day INTEGER DEFAULT 0,
      recurrence_rule TEXT,
      reminders TEXT DEFAULT '[]',
      calendar TEXT DEFAULT 'personal',
      google_event_id TEXT,
      color TEXT DEFAULT '#4285F4',
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_events_start ON ${DB_TABLES.EVENTS}(start_date);
    CREATE INDEX IF NOT EXISTS idx_events_end ON ${DB_TABLES.EVENTS}(end_date);

    CREATE TABLE IF NOT EXISTS ${DB_TABLES.ATTENDEES} (
      id TEXT PRIMARY KEY,
      event_id TEXT NOT NULL,
      name TEXT NOT NULL,
      email TEXT NOT NULL,
      status TEXT DEFAULT 'pending',
      FOREIGN KEY (event_id) REFERENCES ${DB_TABLES.EVENTS}(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS ${DB_TABLES.EMAILS} (
      id TEXT PRIMARY KEY,
      account_id TEXT NOT NULL,
      message_id TEXT NOT NULL,
      from_addr TEXT NOT NULL,
      from_name TEXT DEFAULT '',
      to_addr TEXT DEFAULT '[]',
      cc_addr TEXT DEFAULT '[]',
      subject TEXT DEFAULT '',
      body TEXT DEFAULT '',
      body_text TEXT DEFAULT '',
      date INTEGER NOT NULL,
      is_read INTEGER DEFAULT 0,
      is_starred INTEGER DEFAULT 0,
      labels TEXT DEFAULT '[]',
      source_task_id TEXT
    );

    CREATE INDEX IF NOT EXISTS idx_emails_date ON ${DB_TABLES.EMAILS}(date);
    CREATE INDEX IF NOT EXISTS idx_emails_account ON ${DB_TABLES.EMAILS}(account_id);

    CREATE TABLE IF NOT EXISTS ${DB_TABLES.EMAIL_ACCOUNTS} (
      id TEXT PRIMARY KEY,
      email TEXT NOT NULL,
      name TEXT DEFAULT '',
      provider TEXT DEFAULT 'imap',
      imap_host TEXT NOT NULL,
      imap_port INTEGER NOT NULL,
      smtp_host TEXT NOT NULL,
      smtp_port INTEGER NOT NULL,
      use_ssl INTEGER DEFAULT 1,
      last_sync_at INTEGER,
      is_enabled INTEGER DEFAULT 1
    );

    CREATE TABLE IF NOT EXISTS ${DB_TABLES.SOCIAL_POSTS} (
      id TEXT PRIMARY KEY,
      platform TEXT NOT NULL,
      author TEXT DEFAULT '',
      author_avatar TEXT DEFAULT '',
      content TEXT DEFAULT '',
      url TEXT DEFAULT '',
      date INTEGER NOT NULL,
      is_read INTEGER DEFAULT 0,
      is_saved INTEGER DEFAULT 0,
      media_urls TEXT DEFAULT '[]',
      source_task_id TEXT
    );

    CREATE INDEX IF NOT EXISTS idx_social_date ON ${DB_TABLES.SOCIAL_POSTS}(date);
    CREATE INDEX IF NOT EXISTS idx_social_platform ON ${DB_TABLES.SOCIAL_POSTS}(platform);

    CREATE TABLE IF NOT EXISTS ${DB_TABLES.ATTACHMENTS} (
      id TEXT PRIMARY KEY,
      parent_type TEXT NOT NULL,
      parent_id TEXT NOT NULL,
      name TEXT NOT NULL,
      uri TEXT NOT NULL,
      mime_type TEXT DEFAULT 'application/octet-stream',
      size INTEGER DEFAULT 0,
      type TEXT DEFAULT 'other',
      thumbnail_uri TEXT
    );

    CREATE INDEX IF NOT EXISTS idx_attachments_parent ON ${DB_TABLES.ATTACHMENTS}(parent_type, parent_id);

    CREATE TABLE IF NOT EXISTS ${DB_TABLES.CONVERSATIONS} (
      id TEXT PRIMARY KEY,
      title TEXT DEFAULT 'New Conversation',
      model_name TEXT DEFAULT '',
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS ${DB_TABLES.MESSAGES} (
      id TEXT PRIMARY KEY,
      conversation_id TEXT NOT NULL,
      role TEXT NOT NULL,
      content TEXT DEFAULT '',
      tool_calls TEXT,
      tool_results TEXT,
      timestamp INTEGER NOT NULL,
      is_streaming INTEGER DEFAULT 0,
      FOREIGN KEY (conversation_id) REFERENCES ${DB_TABLES.CONVERSATIONS}(id) ON DELETE CASCADE
    );
  `);
}

function taskToRow(task: Task) {
  return {
    id: task.id,
    title: task.title,
    description: task.description,
    status: task.status,
    priority: task.priority,
    due_date: task.dueDate,
    start_date: task.startDate,
    tags: JSON.stringify(task.tags),
    source: task.source,
    source_id: task.sourceId,
    is_recurring: task.isRecurring ? 1 : 0,
    recurrence_rule: task.recurrenceRule,
    created_at: task.createdAt,
    updated_at: task.updatedAt,
    completed_at: task.completedAt,
    sort_order: task.sortOrder,
  };
}

function rowToTask(row: Record<string, unknown>): Task {
  return {
    id: row.id as string,
    title: row.title as string,
    description: row.description as string,
    status: row.status as Task['status'],
    priority: row.priority as Task['priority'],
    dueDate: row.due_date as number | null,
    startDate: row.start_date as number | null,
    tags: JSON.parse((row.tags as string) || '[]'),
    subtasks: [],
    attachments: [],
    source: (row.source as Task['source']) || 'manual',
    sourceId: (row.source_id as string) || null,
    isRecurring: (row.is_recurring as number) === 1,
    recurrenceRule: (row.recurrence_rule as string) || null,
    createdAt: row.created_at as number,
    updatedAt: row.updated_at as number,
    completedAt: (row.completed_at as number) || null,
    sortOrder: (row.sort_order as number) || 0,
  };
}

function eventToRow(event: CalendarEvent) {
  return {
    id: event.id,
    title: event.title,
    description: event.description,
    location: event.location,
    start_date: event.startDate,
    end_date: event.endDate,
    is_all_day: event.isAllDay ? 1 : 0,
    recurrence_rule: event.recurrenceRule,
    reminders: JSON.stringify(event.reminders),
    calendar: event.calendar,
    google_event_id: event.googleEventId,
    color: event.color,
    created_at: event.createdAt,
    updated_at: event.updatedAt,
  };
}

function rowToEvent(row: Record<string, unknown>): CalendarEvent {
  return {
    id: row.id as string,
    title: row.title as string,
    description: row.description as string,
    location: row.location as string,
    startDate: row.start_date as number,
    endDate: row.end_date as number,
    isAllDay: (row.is_all_day as number) === 1,
    recurrenceRule: (row.recurrence_rule as string) || null,
    reminders: JSON.parse((row.reminders as string) || '[]'),
    calendar: (row.calendar as CalendarEvent['calendar']) || 'personal',
    googleEventId: (row.google_event_id as string) || null,
    color: row.color as string,
    attachments: [],
    attendees: [],
    createdAt: row.created_at as number,
    updatedAt: row.updated_at as number,
  };
}

function emailToRow(email: Email) {
  return {
    id: email.id,
    account_id: email.accountId,
    message_id: email.messageId,
    from_addr: email.from,
    from_name: email.fromName,
    to_addr: JSON.stringify(email.to),
    cc_addr: JSON.stringify(email.cc),
    subject: email.subject,
    body: email.body,
    body_text: email.bodyText,
    date: email.date,
    is_read: email.isRead ? 1 : 0,
    is_starred: email.isStarred ? 1 : 0,
    labels: JSON.stringify(email.labels),
    source_task_id: email.sourceTaskId,
  };
}

function rowToEmail(row: Record<string, unknown>): Email {
  return {
    id: row.id as string,
    accountId: row.account_id as string,
    messageId: row.message_id as string,
    from: row.from_addr as string,
    fromName: row.from_name as string,
    to: JSON.parse((row.to_addr as string) || '[]'),
    cc: JSON.parse((row.cc_addr as string) || '[]'),
    subject: row.subject as string,
    body: row.body as string,
    bodyText: row.body_text as string,
    date: row.date as number,
    isRead: (row.is_read as number) === 1,
    isStarred: (row.is_starred as number) === 1,
    labels: JSON.parse((row.labels as string) || '[]'),
    attachments: [],
    sourceTaskId: (row.source_task_id as string) || null,
  };
}

function socialToRow(post: SocialPost) {
  return {
    id: post.id,
    platform: post.platform,
    author: post.author,
    author_avatar: post.authorAvatar,
    content: post.content,
    url: post.url,
    date: post.date,
    is_read: post.isRead ? 1 : 0,
    is_saved: post.isSaved ? 1 : 0,
    media_urls: JSON.stringify(post.mediaUrls),
    source_task_id: post.sourceTaskId,
  };
}

function rowToSocial(row: Record<string, unknown>): SocialPost {
  return {
    id: row.id as string,
    platform: row.platform as SocialPost['platform'],
    author: row.author as string,
    authorAvatar: row.author_avatar as string,
    content: row.content as string,
    url: row.url as string,
    date: row.date as number,
    isRead: (row.is_read as number) === 1,
    isSaved: (row.is_saved as number) === 1,
    mediaUrls: JSON.parse((row.media_urls as string) || '[]'),
    sourceTaskId: (row.source_task_id as string) || null,
  };
}

function accountToRow(account: EmailAccount) {
  return {
    id: account.id,
    email: account.email,
    name: account.name,
    provider: account.provider,
    imap_host: account.imapHost,
    imap_port: account.imapPort,
    smtp_host: account.smtpHost,
    smtp_port: account.smtpPort,
    use_ssl: account.useSSL ? 1 : 0,
    last_sync_at: account.lastSyncAt,
    is_enabled: account.isEnabled ? 1 : 0,
  };
}

function rowToAccount(row: Record<string, unknown>): EmailAccount {
  return {
    id: row.id as string,
    email: row.email as string,
    name: row.name as string,
    provider: row.provider as EmailAccount['provider'],
    imapHost: row.imap_host as string,
    imapPort: row.imap_port as number,
    smtpHost: row.smtp_host as string,
    smtpPort: row.smtp_port as number,
    useSSL: (row.use_ssl as number) === 1,
    lastSyncAt: (row.last_sync_at as number) || null,
    isEnabled: (row.is_enabled as number) === 1,
  };
}

function attachmentToRow(attachment: Attachment, parentType: string, parentId: string) {
  return {
    id: attachment.id,
    parent_type: parentType,
    parent_id: parentId,
    name: attachment.name,
    uri: attachment.uri,
    mime_type: attachment.mimeType,
    size: attachment.size,
    type: attachment.type,
    thumbnail_uri: attachment.thumbnailUri,
  };
}

function rowToAttachment(row: Record<string, unknown>): Attachment {
  return {
    id: row.id as string,
    name: row.name as string,
    uri: row.uri as string,
    mimeType: row.mime_type as string,
    size: row.size as number,
    type: (row.type as Attachment['type']) || 'other',
    thumbnailUri: (row.thumbnail_uri as string) || null,
  };
}

export const TaskDB = {
  async getAll(filter?: Partial<Record<string, unknown>>): Promise<Task[]> {
    const database = await getDatabase();
    let query = `SELECT * FROM ${DB_TABLES.TASKS}`;
    const params: unknown[] = [];
    const conditions: string[] = [];

    if (filter?.status && filter.status !== 'all') {
      conditions.push(`status = ?`);
      params.push(filter.status);
    }
    if (filter?.priority && filter.priority !== 'all') {
      conditions.push(`priority = ?`);
      params.push(filter.priority);
    }

    if (conditions.length > 0) {
      query += ` WHERE ` + conditions.join(' AND ');
    }
    query += ` ORDER BY sort_order ASC, due_date ASC NULLS LAST, priority DESC`;

    const rows = await database.getAllAsync(query, params);
    const tasks = rows.map(rowToTask);

    for (const task of tasks) {
      task.subtasks = await SubtaskDB.getByTaskId(task.id);
      task.attachments = await AttachmentDB.getByParent('task', task.id);
    }

    return tasks;
  },

  async getById(id: string): Promise<Task | null> {
    const database = await getDatabase();
    const row = await database.getFirstAsync(
      `SELECT * FROM ${DB_TABLES.TASKS} WHERE id = ?`,
      [id]
    );
    if (!row) return null;
    const task = rowToTask(row);
    task.subtasks = await SubtaskDB.getByTaskId(task.id);
    task.attachments = await AttachmentDB.getByParent('task', task.id);
    return task;
  },

  async create(task: Task): Promise<void> {
    const database = await getDatabase();
    const row = taskToRow(task);
    const keys = Object.keys(row);
    const placeholders = keys.map(() => '?').join(', ');
    const values = keys.map(k => (row as Record<string, unknown>)[k]);
    await database.runAsync(
      `INSERT OR REPLACE INTO ${DB_TABLES.TASKS} (${keys.join(', ')}) VALUES (${placeholders})`,
      values
    );
    for (const sub of task.subtasks) {
      await SubtaskDB.create(sub);
    }
    for (const att of task.attachments) {
      await AttachmentDB.create(att, 'task', task.id);
    }
  },

  async update(task: Task): Promise<void> {
    await TaskDB.create(task);
  },

  async delete(id: string): Promise<void> {
    const database = await getDatabase();
    await database.runAsync(`DELETE FROM ${DB_TABLES.TASKS} WHERE id = ?`, [id]);
  },

  async search(query: string): Promise<Task[]> {
    const database = await getDatabase();
    const rows = await database.getAllAsync(
      `SELECT * FROM ${DB_TABLES.TASKS} WHERE title LIKE ? OR description LIKE ? ORDER BY updated_at DESC LIMIT 50`,
      [`%${query}%`, `%${query}%`]
    );
    return rows.map(rowToTask);
  },
};

export const SubtaskDB = {
  async getByTaskId(taskId: string): Promise<SubTask[]> {
    const database = await getDatabase();
    const rows = await database.getAllAsync(
      `SELECT * FROM ${DB_TABLES.SUBTASKS} WHERE task_id = ? ORDER BY created_at ASC`,
      [taskId]
    );
    return rows.map((row: Record<string, unknown>) => ({
      id: row.id as string,
      taskId: row.task_id as string,
      title: row.title as string,
      completed: (row.completed as number) === 1,
      createdAt: row.created_at as number,
    }));
  },

  async create(subtask: SubTask): Promise<void> {
    const database = await getDatabase();
    await database.runAsync(
      `INSERT OR REPLACE INTO ${DB_TABLES.SUBTASKS} (id, task_id, title, completed, created_at) VALUES (?, ?, ?, ?, ?)`,
      [subtask.id, subtask.taskId, subtask.title, subtask.completed ? 1 : 0, subtask.createdAt]
    );
  },

  async toggle(id: string): Promise<void> {
    const database = await getDatabase();
    await database.runAsync(
      `UPDATE ${DB_TABLES.SUBTASKS} SET completed = CASE WHEN completed = 0 THEN 1 ELSE 0 END WHERE id = ?`,
      [id]
    );
  },

  async delete(id: string): Promise<void> {
    const database = await getDatabase();
    await database.runAsync(`DELETE FROM ${DB_TABLES.SUBTASKS} WHERE id = ?`, [id]);
  },
};

export const EventDB = {
  async getBetween(start: number, end: number): Promise<CalendarEvent[]> {
    const database = await getDatabase();
    const rows = await database.getAllAsync(
      `SELECT * FROM ${DB_TABLES.EVENTS} WHERE start_date < ? AND end_date > ? ORDER BY start_date ASC`,
      [end, start]
    );
    const events = rows.map(rowToEvent);
    for (const event of events) {
      event.attendees = await AttendeeDB.getByEventId(event.id);
      event.attachments = await AttachmentDB.getByParent('event', event.id);
    }
    return events;
  },

  async getById(id: string): Promise<CalendarEvent | null> {
    const database = await getDatabase();
    const row = await database.getFirstAsync(
      `SELECT * FROM ${DB_TABLES.EVENTS} WHERE id = ?`,
      [id]
    );
    if (!row) return null;
    const event = rowToEvent(row);
    event.attendees = await AttendeeDB.getByEventId(event.id);
    event.attachments = await AttachmentDB.getByParent('event', event.id);
    return event;
  },

  async create(event: CalendarEvent): Promise<void> {
    const database = await getDatabase();
    const row = eventToRow(event);
    const keys = Object.keys(row);
    const placeholders = keys.map(() => '?').join(', ');
    const values = keys.map(k => (row as Record<string, unknown>)[k]);
    await database.runAsync(
      `INSERT OR REPLACE INTO ${DB_TABLES.EVENTS} (${keys.join(', ')}) VALUES (${placeholders})`,
      values
    );
    for (const att of event.attendees) {
      await AttendeeDB.create(att);
    }
    for (const att of event.attachments) {
      await AttachmentDB.create(att, 'event', event.id);
    }
  },

  async update(event: CalendarEvent): Promise<void> {
    await EventDB.create(event);
  },

  async delete(id: string): Promise<void> {
    const database = await getDatabase();
    await database.runAsync(`DELETE FROM ${DB_TABLES.EVENTS} WHERE id = ?`, [id]);
  },
};

export const AttendeeDB = {
  async getByEventId(eventId: string): Promise<Attendee[]> {
    const database = await getDatabase();
    const rows = await database.getAllAsync(
      `SELECT * FROM ${DB_TABLES.ATTENDEES} WHERE event_id = ?`,
      [eventId]
    );
    return rows.map((row: Record<string, unknown>) => ({
      id: row.id as string,
      name: row.name as string,
      email: row.email as string,
      status: (row.status as Attendee['status']) || 'pending',
    }));
  },

  async create(attendee: Attendee): Promise<void> {
    const database = await getDatabase();
    await database.runAsync(
      `INSERT OR REPLACE INTO ${DB_TABLES.ATTENDEES} (id, event_id, name, email, status) VALUES (?, ?, ?, ?, ?)`,
      [attendee.id, '', attendee.name, attendee.email, attendee.status]
    );
  },
};

export const EmailDB = {
  async getByAccount(accountId: string, limit = 50, offset = 0): Promise<Email[]> {
    const database = await getDatabase();
    const rows = await database.getAllAsync(
      `SELECT * FROM ${DB_TABLES.EMAILS} WHERE account_id = ? ORDER BY date DESC LIMIT ? OFFSET ?`,
      [accountId, limit, offset]
    );
    return Promise.all(
      rows.map(async (row) => {
        const email = rowToEmail(row);
        email.attachments = await AttachmentDB.getByParent('email', email.id);
        return email;
      })
    );
  },

  async getUnread(): Promise<Email[]> {
    const database = await getDatabase();
    const rows = await database.getAllAsync(
      `SELECT * FROM ${DB_TABLES.EMAILS} WHERE is_read = 0 ORDER BY date DESC`
    );
    return rows.map(rowToEmail);
  },

  async create(email: Email): Promise<void> {
    const database = await getDatabase();
    const row = emailToRow(email);
    const keys = Object.keys(row);
    const placeholders = keys.map(() => '?').join(', ');
    const values = keys.map(k => (row as Record<string, unknown>)[k]);
    await database.runAsync(
      `INSERT OR REPLACE INTO ${DB_TABLES.EMAILS} (${keys.join(', ')}) VALUES (${placeholders})`,
      values
    );
    for (const att of email.attachments) {
      await AttachmentDB.create(att, 'email', email.id);
    }
  },

  async markRead(id: string): Promise<void> {
    const database = await getDatabase();
    await database.runAsync(
      `UPDATE ${DB_TABLES.EMAILS} SET is_read = 1 WHERE id = ?`,
      [id]
    );
  },
};

export const EmailAccountDB = {
  async getAll(): Promise<EmailAccount[]> {
    const database = await getDatabase();
    const rows = await database.getAllAsync(
      `SELECT * FROM ${DB_TABLES.EMAIL_ACCOUNTS}`
    );
    return rows.map(rowToAccount);
  },

  async create(account: EmailAccount): Promise<void> {
    const database = await getDatabase();
    const row = accountToRow(account);
    const keys = Object.keys(row);
    const placeholders = keys.map(() => '?').join(', ');
    const values = keys.map(k => (row as Record<string, unknown>)[k]);
    await database.runAsync(
      `INSERT OR REPLACE INTO ${DB_TABLES.EMAIL_ACCOUNTS} (${keys.join(', ')}) VALUES (${placeholders})`,
      values
    );
  },

  async update(account: EmailAccount): Promise<void> {
    await EmailAccountDB.create(account);
  },

  async delete(id: string): Promise<void> {
    const database = await getDatabase();
    await database.runAsync(`DELETE FROM ${DB_TABLES.EMAIL_ACCOUNTS} WHERE id = ?`, [id]);
  },
};

export const SocialDB = {
  async getAll(platform?: string, limit = 50, offset = 0): Promise<SocialPost[]> {
    const database = await getDatabase();
    if (platform) {
      const rows = await database.getAllAsync(
        `SELECT * FROM ${DB_TABLES.SOCIAL_POSTS} WHERE platform = ? ORDER BY date DESC LIMIT ? OFFSET ?`,
        [platform, limit, offset]
      );
      return rows.map(rowToSocial);
    }
    const rows = await database.getAllAsync(
      `SELECT * FROM ${DB_TABLES.SOCIAL_POSTS} ORDER BY date DESC LIMIT ? OFFSET ?`,
      [limit, offset]
    );
    return rows.map(rowToSocial);
  },

  async getUnread(): Promise<SocialPost[]> {
    const database = await getDatabase();
    const rows = await database.getAllAsync(
      `SELECT * FROM ${DB_TABLES.SOCIAL_POSTS} WHERE is_read = 0 ORDER BY date DESC`
    );
    return rows.map(rowToSocial);
  },

  async create(post: SocialPost): Promise<void> {
    const database = await getDatabase();
    const row = socialToRow(post);
    const keys = Object.keys(row);
    const placeholders = keys.map(() => '?').join(', ');
    const values = keys.map(k => (row as Record<string, unknown>)[k]);
    await database.runAsync(
      `INSERT OR REPLACE INTO ${DB_TABLES.SOCIAL_POSTS} (${keys.join(', ')}) VALUES (${placeholders})`,
      values
    );
  },

  async markRead(id: string): Promise<void> {
    const database = await getDatabase();
    await database.runAsync(
      `UPDATE ${DB_TABLES.SOCIAL_POSTS} SET is_read = 1 WHERE id = ?`,
      [id]
    );
  },
};

export const AttachmentDB = {
  async getByParent(parentType: string, parentId: string): Promise<Attachment[]> {
    const database = await getDatabase();
    const rows = await database.getAllAsync(
      `SELECT * FROM ${DB_TABLES.ATTACHMENTS} WHERE parent_type = ? AND parent_id = ?`,
      [parentType, parentId]
    );
    return rows.map(rowToAttachment);
  },

  async create(attachment: Attachment, parentType: string, parentId: string): Promise<void> {
    const database = await getDatabase();
    const row = attachmentToRow(attachment, parentType, parentId);
    await database.runAsync(
      `INSERT OR REPLACE INTO ${DB_TABLES.ATTACHMENTS} (id, parent_type, parent_id, name, uri, mime_type, size, type, thumbnail_uri) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [row.id, row.parent_type, row.parent_id, row.name, row.uri, row.mime_type, row.size, row.type, row.thumbnail_uri]
    );
  },

  async delete(id: string): Promise<void> {
    const database = await getDatabase();
    await database.runAsync(`DELETE FROM ${DB_TABLES.ATTACHMENTS} WHERE id = ?`, [id]);
  },
};

export const ConversationDB = {
  async getAll(): Promise<AgentConversation[]> {
    const database = await getDatabase();
    const rows = await database.getAllAsync(
      `SELECT * FROM ${DB_TABLES.CONVERSATIONS} ORDER BY updated_at DESC`
    );
    return Promise.all(
      rows.map(async (row: Record<string, unknown>) => {
        const messages = await database.getAllAsync(
          `SELECT * FROM ${DB_TABLES.MESSAGES} WHERE conversation_id = ? ORDER BY timestamp ASC`,
          [row.id]
        );
        return {
          id: row.id as string,
          title: row.title as string,
          messages: messages.map((m: Record<string, unknown>) => ({
            id: m.id as string,
            role: m.role as AgentMessage['role'],
            content: m.content as string,
            toolCalls: JSON.parse((m.tool_calls as string) || 'null'),
            toolResults: JSON.parse((m.tool_results as string) || 'null'),
            timestamp: m.timestamp as number,
            isStreaming: (m.is_streaming as number) === 1,
          })),
          modelName: row.model_name as string,
          createdAt: row.created_at as number,
          updatedAt: row.updated_at as number,
        };
      })
    );
  },

  async create(conversation: AgentConversation): Promise<void> {
    const database = await getDatabase();
    await database.runAsync(
      `INSERT OR REPLACE INTO ${DB_TABLES.CONVERSATIONS} (id, title, model_name, created_at, updated_at) VALUES (?, ?, ?, ?, ?)`,
      [conversation.id, conversation.title, conversation.modelName, conversation.createdAt, conversation.updatedAt]
    );
    for (const msg of conversation.messages) {
      await ConversationDB.addMessage(conversation.id, msg);
    }
  },

  async addMessage(conversationId: string, message: AgentMessage): Promise<void> {
    const database = await getDatabase();
    await database.runAsync(
      `INSERT OR REPLACE INTO ${DB_TABLES.MESSAGES} (id, conversation_id, role, content, tool_calls, tool_results, timestamp, is_streaming) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        message.id,
        conversationId,
        message.role,
        message.content,
        JSON.stringify(message.toolCalls),
        JSON.stringify(message.toolResults),
        message.timestamp,
        message.isStreaming ? 1 : 0,
      ]
    );
  },

  async delete(id: string): Promise<void> {
    const database = await getDatabase();
    await database.runAsync(`DELETE FROM ${DB_TABLES.CONVERSATIONS} WHERE id = ?`, [id]);
  },
};