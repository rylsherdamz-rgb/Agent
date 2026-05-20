export const APP_NAME = 'Agent';

export const MMKV_KEYS = {
  SETTINGS: 'app_settings',
  AUTH_TOKENS: 'auth_tokens',
  LAST_SYNC: 'last_sync',
  ONBOARDING_COMPLETE: 'onboarding_complete',
  MODEL_INFO: 'model_info',
} as const;

export const DB_NAME = 'agent.db';

export const DB_TABLES = {
  TASKS: 'tasks',
  SUBTASKS: 'subtasks',
  EVENTS: 'events',
  ATTENDEES: 'attendees',
  EMAILS: 'emails',
  EMAIL_ACCOUNTS: 'email_accounts',
  SOCIAL_POSTS: 'social_posts',
  ATTACHMENTS: 'attachments',
  CONVERSATIONS: 'conversations',
  MESSAGES: 'messages',
} as const;

export const PRIORITY_COLORS = {
  low: '#8BC34A',
  medium: '#FFC107',
  high: '#FF9800',
  urgent: '#F44336',
} as const;

export const PRIORITY_LABELS = {
  low: 'Low',
  medium: 'Medium',
  high: 'High',
  urgent: 'Urgent',
} as const;

export const STATUS_COLORS = {
  pending: '#9E9E9E',
  in_progress: '#2196F3',
  completed: '#4CAF50',
  cancelled: '#F44336',
} as const;

export const STATUS_LABELS = {
  pending: 'Pending',
  in_progress: 'In Progress',
  completed: 'Completed',
  cancelled: 'Cancelled',
} as const;

export const CALENDAR_COLORS = [
  '#4285F4', '#EA4335', '#FBBC04', '#34A853',
  '#8E24AA', '#00ACC1', '#FF7043', '#43A047',
  '#1E88E5', '#E53935', '#FDD835', '#7CB342',
];

export const DEFAULT_MODEL = 'qwen2-1.5b-instruct-q4_k_m.gguf';
export const MODEL_DOWNLOAD_URL = 'https://huggingface.co/bartowski/Qwen2.5-1.5B-Instruct-GGUF/resolve/main/Qwen2.5-1.5B-Instruct-Q4_K_M.gguf';

export const AGENT_SYSTEM_PROMPT = `You are an offline AI assistant that helps manage tasks, calendar, emails, and social media.

You have access to these tools:
- create_task: Create a new task with title, description, priority, due date
- update_task: Update an existing task
- delete_task: Delete a task
- list_tasks: List all tasks with optional filters
- get_task: Get details of a specific task
- create_event: Create a calendar event
- update_event: Update a calendar event
- delete_event: Delete a calendar event
- list_events: List events for a date range
- check_email: Check for new emails and summarize
- read_email: Read a specific email
- check_social: Check social media updates
- search_knowledge: Search local knowledge base
- create_reminder: Set a reminder
- get_schedule: Get today's schedule summary

Always be concise. When the user asks about tasks or schedule, use the appropriate tools.`;

export const SOCIAL_PLATFORMS = [
  { id: 'reddit', name: 'Reddit', icon: 'reddit', type: 'rss' },
  { id: 'mastodon', name: 'Mastodon', icon: 'mastodon', type: 'api' },
  { id: 'rss', name: 'RSS Feed', icon: 'rss', type: 'rss' },
] as const;

export const BACKGROUND_SYNC_INTERVALS = [
  { label: '15 minutes', value: 15 * 60 * 1000 },
  { label: '30 minutes', value: 30 * 60 * 1000 },
  { label: '1 hour', value: 60 * 60 * 1000 },
  { label: '3 hours', value: 3 * 60 * 60 * 1000 },
  { label: '6 hours', value: 6 * 60 * 60 * 1000 },
];