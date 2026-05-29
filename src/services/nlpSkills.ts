import { aiSkills } from './aiSkills';
import type { Task } from '../types';

export interface ParsedCommand {
  action: 'create_task' | 'update_task' | 'list_tasks' | 'create_event' | 'check_email' | 'check_social' | 'get_schedule' | 'unknown';
  entities: {
    title?: string;
    description?: string;
    priority?: Task['priority'];
    dueDate?: number;
    tags?: string[];
  };
  confidence: number;
}

export class NLPSkills {
  private static instance: NLPSkills;

  private constructor() {}

  static getInstance(): NLPSkills {
    if (!NLPSkills.instance) {
      NLPSkills.instance = new NLPSkills();
    }
    return NLPSkills.instance;
  }

  async parseCommand(text: string): Promise<ParsedCommand> {
    const lowerText = text.toLowerCase();
    const entities = await aiSkills.extractEntities(text);
    const intent = await aiSkills.classifyIntent(text);
    const keywords = await aiSkills.extractKeywords(text, 10);

    let action: ParsedCommand['action'] = 'unknown';
    
    if (intent.category === 'task') {
      if (lowerText.includes('create') || lowerText.includes('add') || lowerText.includes('new')) {
        action = 'create_task';
      } else if (lowerText.includes('update') || lowerText.includes('edit') || lowerText.includes('change')) {
        action = 'update_task';
      } else if (lowerText.includes('list') || lowerText.includes('show') || lowerText.includes('my tasks')) {
        action = 'list_tasks';
      } else {
        action = 'create_task';
      }
    } else if (intent.category === 'calendar') {
      action = 'create_event';
    } else if (intent.category === 'email') {
      action = 'check_email';
    } else if (intent.category === 'social') {
      action = 'check_social';
    }

    const parsed: ParsedCommand = {
      action,
      entities: {
        priority: this.extractPriority(entities.priorities, keywords),
        dueDate: this.extractDueDate(entities.dates, entities.times),
        tags: keywords.slice(0, 3),
      },
      confidence: intent.confidence,
    };

    if (action === 'create_task' || action === 'update_task') {
      parsed.entities.title = this.extractTitle(text, keywords);
      parsed.entities.description = text.length > 100 ? text.substring(0, 100) + '...' : text;
    }

    return parsed;
  }

  private extractTitle(text: string, keywords: string[]): string {
    const match = text.match(/(?:create|add|new)\s+(?:task\s+)?["']?(.+?)["']?(?:\s|$)/i);
    if (match && match[1]) {
      return match[1].trim();
    }

    if (keywords.length > 0) {
      return keywords.slice(0, 3).join(' ');
    }

    return 'New Task';
  }

  private extractPriority(priorities: string[], keywords: string[]): Task['priority'] {
    if (priorities.includes('urgent')) return 'urgent';
    if (priorities.includes('high') || keywords.includes('important')) return 'high';
    if (priorities.includes('low')) return 'low';
    return 'medium';
  }

  private extractDueDate(dates: string[], times: string[]): number | null {
    const now = new Date();
    
    if (dates.includes('today')) {
      return new Date(now.setHours(23, 59, 0, 0)).getTime();
    }
    
    if (dates.includes('tomorrow')) {
      const tomorrow = new Date(now);
      tomorrow.setDate(tomorrow.getDate() + 1);
      return new Date(tomorrow.setHours(9, 0, 0, 0)).getTime();
    }

    if (dates.includes('yesterday')) {
      return new Date(now.setHours(23, 59, 0, 0)).getTime() - 86400000;
    }

    const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    for (const day of dates) {
      const dayIndex = dayNames.indexOf(day.toLowerCase());
      if (dayIndex !== -1) {
        const targetDate = new Date(now);
        const currentDay = now.getDay();
        const daysUntil = (dayIndex + 7 - currentDay) % 7 || 7;
        targetDate.setDate(targetDate.getDate() + daysUntil);
        return new Date(targetDate.setHours(9, 0, 0, 0)).getTime();
      }
    }

    return null;
  }

  generateResponse(command: ParsedCommand): string {
    switch (command.action) {
      case 'create_task':
        return `I'll create a task${command.entities.title ? ` "${command.entities.title}"` : ''}${command.entities.dueDate ? ` due on ${new Date(command.entities.dueDate).toLocaleDateString()}` : ''}.`;
      case 'list_tasks':
        return 'Here are your tasks. Let me know if you need help prioritizing.';
      case 'create_event':
        return 'I can help you schedule that event. What time works best?';
      case 'check_email':
        return 'Checking your inbox...';
      case 'check_social':
        return 'Fetching your social feeds...';
      default:
        return 'I can help you manage tasks, calendar, emails, and social media. What would you like to do?';
    }
  }

  async suggestActions(text: string): Promise<Array<{ label: string; action: string }>> {
    const parsed = await this.parseCommand(text);
    const suggestions: Array<{ label: string; action: string }> = [];

    if (parsed.action === 'create_task') {
      suggestions.push({
        label: 'Create Task',
        action: JSON.stringify({ type: 'create_task', ...parsed.entities }),
      });
      if (parsed.entities.dueDate) {
        suggestions.push({
          label: 'Set Reminder',
          action: JSON.stringify({ type: 'set_reminder', date: parsed.entities.dueDate }),
        });
      }
    }

    if (parsed.action === 'create_event') {
      suggestions.push({
        label: 'Create Event',
        action: JSON.stringify({ type: 'create_event', ...parsed.entities }),
      });
    }

    return suggestions.slice(0, 3);
  }
}

export const nlpSkills = NLPSkills.getInstance();