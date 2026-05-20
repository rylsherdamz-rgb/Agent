export interface Task {
  id: string;
  title: string;
  description: string;
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  dueDate: number | null;
  startDate: number | null;
  tags: string[];
  subtasks: SubTask[];
  attachments: Attachment[];
  source: 'manual' | 'email' | 'agent' | 'social' | 'calendar';
  sourceId: string | null;
  isRecurring: boolean;
  recurrenceRule: string | null;
  createdAt: number;
  updatedAt: number;
  completedAt: number | null;
  sortOrder: number;
}

export interface SubTask {
  id: string;
  taskId: string;
  title: string;
  completed: boolean;
  createdAt: number;
}

export interface CalendarEvent {
  id: string;
  title: string;
  description: string;
  location: string;
  startDate: number;
  endDate: number;
  isAllDay: boolean;
  recurrenceRule: string | null;
  reminders: number[];
  calendar: 'personal' | 'google' | 'imported';
  googleEventId: string | null;
  color: string;
  attachments: Attachment[];
  attendees: Attendee[];
  createdAt: number;
  updatedAt: number;
}

export interface Attendee {
  name: string;
  email: string;
  status: 'pending' | 'accepted' | 'declined' | 'tentative';
}

export interface Email {
  id: string;
  accountId: string;
  messageId: string;
  from: string;
  fromName: string;
  to: string[];
  cc: string[];
  subject: string;
  body: string;
  bodyText: string;
  date: number;
  isRead: boolean;
  isStarred: boolean;
  labels: string[];
  attachments: Attachment[];
  sourceTaskId: string | null;
}

export interface EmailAccount {
  id: string;
  email: string;
  name: string;
  provider: 'gmail' | 'outlook' | 'imap';
  imapHost: string;
  imapPort: number;
  smtpHost: string;
  smtpPort: number;
  useSSL: boolean;
  lastSyncAt: number | null;
  isEnabled: boolean;
}

export interface SocialPost {
  id: string;
  platform: 'twitter' | 'reddit' | 'mastodon' | 'rss';
  author: string;
  authorAvatar: string;
  content: string;
  url: string;
  date: number;
  isRead: boolean;
  isSaved: boolean;
  mediaUrls: string[];
  sourceTaskId: string | null;
}

export interface Attachment {
  id: string;
  name: string;
  uri: string;
  mimeType: string;
  size: number;
  type: 'image' | 'document' | 'audio' | 'video' | 'other';
  thumbnailUri: string | null;
}

export interface AgentMessage {
  id: string;
  role: 'user' | 'agent' | 'system' | 'tool';
  content: string;
  toolCalls: ToolCall[] | null;
  toolResults: ToolResult[] | null;
  timestamp: number;
  isStreaming: boolean;
}

export interface ToolCall {
  id: string;
  name: string;
  arguments: Record<string, unknown>;
}

export interface ToolResult {
  toolCallId: string;
  result: string;
  success: boolean;
  error: string | null;
}

export interface AgentConversation {
  id: string;
  title: string;
  messages: AgentMessage[];
  modelName: string;
  createdAt: number;
  updatedAt: number;
}

export interface AppSettings {
  theme: 'light' | 'dark' | 'system';
  defaultCalendarView: 'day' | 'week' | 'month' | 'agenda';
  googleCalendarEnabled: boolean;
  googleCalendarEmail: string | null;
  emailAccounts: EmailAccount[];
  socialEnabled: boolean;
  socialPlatforms: string[];
  modelDownloaded: boolean;
  modelPath: string | null;
  modelName: string | null;
  agentEnabled: boolean;
  backgroundSyncEnabled: boolean;
  backgroundSyncInterval: number;
  notificationsEnabled: boolean;
  firstDayOfWeek: 0 | 1;
  timeFormat: '12h' | '24h';
  language: string;
  backendUrl: string | null;
  backendToken: string | null;
  telegramEnabled: boolean;
  telegramBotToken: string | null;
  telegramChatId: string | null;
}

export type TaskFilter = {
  status: Task['status'] | 'all';
  priority: Task['priority'] | 'all';
  tag: string | null;
  search: string;
  sortBy: 'dueDate' | 'priority' | 'createdAt' | 'title';
  sortOrder: 'asc' | 'desc';
  showCompleted: boolean;
};

export type CalendarViewMode = 'day' | 'week' | 'month' | 'agenda';

export interface SyncStatus {
  isSyncing: boolean;
  lastSyncAt: number | null;
  pendingChanges: number;
  error: string | null;
}