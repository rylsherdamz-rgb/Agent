import { aiSkills } from './aiSkills';
import { nlpSkills } from './nlpSkills';
import { useTaskStore } from '../stores/taskStore';
import { useCalendarStore } from '../stores/calendarStore';
import type { Task, CalendarEvent } from '../types';

export interface ToolExecutionResult {
  success: boolean;
  message: string;
  data?: any;
}

export class AgentSkills {
  private static instance: AgentSkills;

  private constructor() {}

  static getInstance(): AgentSkills {
    if (!AgentSkills.instance) {
      AgentSkills.instance = new AgentSkills();
    }
    return AgentSkills.instance;
  }

  async executeTool(toolName: string, args: Record<string, any>): Promise<ToolExecutionResult> {
    try {
      switch (toolName) {
        case 'create_task':
          return await this.createTask(args);
        case 'update_task':
          return await this.updateTask(args);
        case 'delete_task':
          return await this.deleteTask(args);
        case 'list_tasks':
          return this.listTasks(args);
        case 'create_event':
          return await this.createEvent(args);
        case 'get_schedule':
          return this.getSchedule(args);
        case 'analyze_sentiment':
          return await this.analyzeSentiment(args);
        case 'extract_keywords':
          return await this.extractKeywords(args);
        case 'summarize':
          return await this.summarize(args);
        default:
          return {
            success: false,
            message: `Unknown tool: ${toolName}`,
          };
      }
    } catch (err) {
      return {
        success: false,
        message: `Tool execution failed: ${(err as Error).message}`,
      };
    }
  }

  private async createTask(args: Record<string, any>): Promise<ToolExecutionResult> {
    const { addTask } = useTaskStore.getState();
    
    const task = await addTask({
      title: args.title || 'New Task',
      description: args.description || '',
      priority: args.priority || 'medium',
      dueDate: args.dueDate || null,
      tags: args.tags || [],
      source: 'agent',
    });

    return {
      success: true,
      message: `Task "${task.title}" created successfully`,
      data: task,
    };
  }

  private async updateTask(args: Record<string, any>): Promise<ToolExecutionResult> {
    const { updateTask, tasks } = useTaskStore.getState();
    
    if (!args.id) {
      return {
        success: false,
        message: 'Task ID is required',
      };
    }

    const task = tasks.find(t => t.id === args.id);
    if (!task) {
      return {
        success: false,
        message: 'Task not found',
      };
    }

    await updateTask(args.id, args.changes);

    return {
      success: true,
      message: `Task "${task.title}" updated`,
      data: { id: args.id, changes: args.changes },
    };
  }

  private async deleteTask(args: Record<string, any>): Promise<ToolExecutionResult> {
    const { deleteTask, tasks } = useTaskStore.getState();
    
    if (!args.id) {
      return {
        success: false,
        message: 'Task ID is required',
      };
    }

    const task = tasks.find(t => t.id === args.id);
    await deleteTask(args.id);

    return {
      success: true,
      message: `Task "${task?.title || 'Unknown'}" deleted`,
      data: { id: args.id },
    };
  }

  private listTasks(args: Record<string, any>): ToolExecutionResult {
    const { tasks, getFilteredTasks } = useTaskStore.getState();
    
    const filter = args.filter || {};
    const filtered = getFilteredTasks();
    
    const summary = filtered.map(t => ({
      id: t.id,
      title: t.title,
      status: t.status,
      priority: t.priority,
      dueDate: t.dueDate,
    }));

    return {
      success: true,
      message: `Found ${filtered.length} tasks`,
      data: summary,
    };
  }

  private async createEvent(args: Record<string, any>): Promise<ToolExecutionResult> {
    const { addEvent } = useCalendarStore.getState();
    
    const event = await addEvent({
      title: args.title || 'New Event',
      description: args.description || '',
      location: args.location || '',
      startDate: args.startDate || Date.now(),
      endDate: args.endDate || Date.now() + 3600000,
      isAllDay: args.isAllDay || false,
      calendar: 'personal',
    });

    return {
      success: true,
      message: `Event "${event.title}" created`,
      data: event,
    };
  }

  private getSchedule(args: Record<string, any>): ToolExecutionResult {
    const { events, getEventsForDate } = useCalendarStore.getState();
    
    const date = args.date ? new Date(args.date) : new Date();
    const dayEvents = getEventsForDate(date);
    
    const summary = dayEvents.map(e => ({
      id: e.id,
      title: e.title,
      startTime: new Date(e.startDate).toLocaleTimeString(),
      endTime: new Date(e.endDate).toLocaleTimeString(),
      location: e.location,
    }));

    return {
      success: true,
      message: `You have ${dayEvents.length} events scheduled`,
      data: summary,
    };
  }

  private async analyzeSentiment(args: Record<string, any>): Promise<ToolExecutionResult> {
    if (!args.text) {
      return {
        success: false,
        message: 'Text is required for sentiment analysis',
      };
    }

    const result = await aiSkills.analyzeSentiment(args.text);
    
    return {
      success: true,
      message: `Sentiment: ${result.label} (${(result.score * 100).toFixed(0)}% confidence)`,
      data: result,
    };
  }

  private async extractKeywords(args: Record<string, any>): Promise<ToolExecutionResult> {
    if (!args.text) {
      return {
        success: false,
        message: 'Text is required for keyword extraction',
      };
    }

    const keywords = await aiSkills.extractKeywords(args.text, args.maxKeywords || 5);
    
    return {
      success: true,
      message: `Extracted ${keywords.length} keywords`,
      data: { keywords },
    };
  }

  private async summarize(args: Record<string, any>): Promise<ToolExecutionResult> {
    if (!args.text) {
      return {
        success: false,
        message: 'Text is required for summarization',
      };
    }

    const summary = await aiSkills.summarizeText(args.text, args.maxLength || 100);
    
    return {
      success: true,
      message: 'Text summarized successfully',
      data: { summary },
    };
  }

  async processNaturalLanguage(text: string): Promise<{
    action: string;
    result: ToolExecutionResult;
    response: string;
  }> {
    const parsed = await nlpSkills.parseCommand(text);
    const response = nlpSkills.generateResponse(parsed);
    
    const action = parsed.action.replace('_', '_');
    const result = await this.executeTool(action, parsed.entities);

    return {
      action,
      result,
      response,
    };
  }

  getAvailableTools(): Array<{ name: string; description: string; parameters: string[] }> {
    return [
      {
        name: 'create_task',
        description: 'Create a new task with title, description, priority, and due date',
        parameters: ['title', 'description', 'priority', 'dueDate', 'tags'],
      },
      {
        name: 'update_task',
        description: 'Update an existing task',
        parameters: ['id', 'changes'],
      },
      {
        name: 'delete_task',
        description: 'Delete a task',
        parameters: ['id'],
      },
      {
        name: 'list_tasks',
        description: 'List all tasks with optional filters',
        parameters: ['filter'],
      },
      {
        name: 'create_event',
        description: 'Create a calendar event',
        parameters: ['title', 'description', 'location', 'startDate', 'endDate', 'isAllDay'],
      },
      {
        name: 'get_schedule',
        description: 'Get events for a specific date',
        parameters: ['date'],
      },
      {
        name: 'analyze_sentiment',
        description: 'Analyze sentiment of text',
        parameters: ['text'],
      },
      {
        name: 'extract_keywords',
        description: 'Extract keywords from text',
        parameters: ['text', 'maxKeywords'],
      },
      {
        name: 'summarize',
        description: 'Summarize text',
        parameters: ['text', 'maxLength'],
      },
    ];
  }
}

export const agentSkills = AgentSkills.getInstance();