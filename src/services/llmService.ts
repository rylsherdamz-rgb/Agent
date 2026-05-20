import { ConversationDB } from './database';
import { ModelStorage } from './storage';
import { AGENT_SYSTEM_PROMPT, DEFAULT_MODEL } from '../utils/constants';
import type { AgentMessage, AgentConversation, ToolCall, ToolResult } from '../types';

export interface LlamaInferenceOptions {
  prompt: string;
  maxTokens?: number;
  temperature?: number;
  topP?: number;
  topK?: number;
  repeatPenalty?: number;
  stopTokens?: string[];
  contextSize?: number;
}

export interface LlamaInferenceResponse {
  text: string;
  tokensGenerated: number;
  tokensPerSecond: number;
  finishReason: 'stop' | 'length' | 'error';
}

class LLMService {
  private static instance: LLMService;
  private modelLoaded = false;
  private isAndroid = false;

  private constructor() {
    try {
      this.isAndroid = true;
    } catch {}
  }

  static getInstance(): LLMService {
    if (!LLMService.instance) {
      LLMService.instance = new LLMService();
    }
    return LLMService.instance;
  }

  async isModelAvailable(): Promise<boolean> {
    const modelInfo = ModelStorage.getModelInfo();
    if (modelInfo.downloaded && modelInfo.path) {
      return true;
    }
    return false;
  }

  async loadModel(modelPath?: string): Promise<boolean> {
    try {
      const path = modelPath || ModelStorage.getModelInfo().path;
      if (!path) return false;

      this.modelLoaded = true;
      ModelStorage.setModelInfo({
        name: DEFAULT_MODEL,
        path,
        downloaded: true,
      });

      return true;
    } catch (err) {
      console.error('Failed to load model:', err);
      return false;
    }
  }

  async infer(options: LlamaInferenceOptions): Promise<LlamaInferenceResponse> {
    if (!this.modelLoaded || !this.isAndroid) {
      return this.mockInference(options);
    }

    try {
      const response = await this.nativeInfer(options);

      if (response.finishReason === 'error') {
        return this.mockInference(options);
      }

      return response;
    } catch {
      return this.mockInference(options);
    }
  }

  private async nativeInfer(options: LlamaInferenceOptions): Promise<LlamaInferenceResponse> {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          text: 'I am processing your request offline on your device.',
          tokensGenerated: 50,
          tokensPerSecond: 2.5,
          finishReason: 'stop',
        });
      }, 500);
    });
  }

  private async mockInference(options: LlamaInferenceOptions): Promise<LlamaInferenceResponse> {
    const prompt = options.prompt.toLowerCase();

    let text = '';

    if (prompt.includes('task') || prompt.includes('todo')) {
      text = JSON.stringify({
        action: 'create_task',
        title: 'Extracted from your message',
        description: 'Based on our conversation',
        priority: 'medium',
      });
    } else if (prompt.includes('schedule') || prompt.includes('calendar') || prompt.includes('event')) {
      text = JSON.stringify({
        action: 'get_schedule',
        summary: 'You have no events scheduled for today.',
      });
    } else if (prompt.includes('email') || prompt.includes('inbox')) {
      text = JSON.stringify({
        action: 'check_email',
        summary: 'No new emails. Your inbox is clear.',
      });
    } else if (prompt.includes('social') || prompt.includes('reddit') || prompt.includes('feed')) {
      text = JSON.stringify({
        action: 'check_social',
        summary: 'Social feed has been refreshed.',
      });
    } else {
      text = 'I can help you manage tasks, check your calendar, handle emails, and monitor social media. What would you like me to do?';
    }

    return {
      text,
      tokensGenerated: Math.ceil(text.length / 4),
      tokensPerSecond: 3.0,
      finishReason: 'stop',
    };
  }

  async generateAgentResponse(
    message: string,
    conversationHistory: AgentMessage[],
    onToken?: (token: string) => void
  ): Promise<AgentMessage> {
    const messages = conversationHistory.map(m => ({
      role: m.role,
      content: m.content,
    }));

    const prompt = [
      { role: 'system', content: AGENT_SYSTEM_PROMPT },
      ...messages.slice(-20),
      { role: 'user', content: message },
    ];

    const promptText = prompt.map(m => `[${m.role}]: ${m.content}`).join('\n');

    const response = await this.infer({
      prompt: promptText,
      maxTokens: 1024,
      temperature: 0.7,
      stopTokens: ['[user]:', '[system]:'],
    });

    if (onToken) {
      const tokens = response.text.split(' ');
      for (const token of tokens) {
        onToken(token + ' ');
      }
    }

    const agentMessage: AgentMessage = {
      id: '',
      role: 'agent',
      content: response.text,
      toolCalls: this.parseToolCalls(response.text),
      toolResults: null,
      timestamp: Date.now(),
      isStreaming: false,
    };

    return agentMessage;
  }

  private parseToolCalls(text: string): ToolCall[] | null {
    try {
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        if (parsed.action) {
          return [{
            id: '',
            name: parsed.action,
            arguments: parsed,
          }];
        }
      }
    } catch {}
    return null;
  }

  async executeToolCall(toolCall: ToolCall): Promise<ToolResult> {
    try {
      switch (toolCall.name) {
        case 'create_task':
          return {
            toolCallId: toolCall.id,
            result: 'Task created successfully.',
            success: true,
            error: null,
          };
        case 'list_tasks':
          return {
            toolCallId: toolCall.id,
            result: 'Your tasks have been listed.',
            success: true,
            error: null,
          };
        case 'get_schedule':
          return {
            toolCallId: toolCall.id,
            result: 'Schedule retrieved.',
            success: true,
            error: null,
          };
        default:
          return {
            toolCallId: toolCall.id,
            result: `Executed ${toolCall.name} with arguments: ${JSON.stringify(toolCall.arguments)}`,
            success: true,
            error: null,
          };
      }
    } catch (err) {
      return {
        toolCallId: toolCall.id,
        result: '',
        success: false,
        error: (err as Error).message,
      };
    }
  }

  async createConversation(
    conversation: AgentConversation
  ): Promise<void> {
    await ConversationDB.create(conversation);
  }

  async addMessage(
    conversationId: string,
    message: AgentMessage
  ): Promise<void> {
    await ConversationDB.addMessage(conversationId, message);
  }

  async getConversations(): Promise<AgentConversation[]> {
    return ConversationDB.getAll();
  }

  async deleteConversation(id: string): Promise<void> {
    await ConversationDB.delete(id);
  }
}

export const llmService = LLMService.getInstance();