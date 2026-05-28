import { create } from 'zustand';
import { llmService } from '../services/llmService';
import { BackendAPI } from '../services/api';
import { SettingsStorage } from '../services/storage';
import { v4 as uuid } from 'uuid';
import type { AgentMessage, AgentConversation } from '../types';

interface AgentStore {
  conversations: AgentConversation[];
  activeConversationIndex: number;
  isGenerating: boolean;
  isModelLoaded: boolean;
  streamingMessage: string;
  error: string | null;

  loadConversations: () => Promise<void>;
  createConversation: (title?: string) => Promise<string>;
  deleteConversation: (id: string) => Promise<void>;
  selectConversation: (index: number) => void;
  setActiveConversation: (conversation: AgentConversation | null) => void;
  sendMessage: (content: string) => Promise<void>;
  clearStreaming: () => void;
  loadModel: () => Promise<boolean>;
  getActiveConversation: () => AgentConversation | null;
}

export const useAgentStore = create<AgentStore>((set, get) => ({
  conversations: [],
  activeConversationIndex: -1,
  isGenerating: false,
  isModelLoaded: false,
  streamingMessage: '',
  error: null,

  loadConversations: async () => {
    try {
      const conversations = await llmService.getConversations();
      set({
        conversations,
        activeConversationIndex: conversations.length > 0 ? 0 : -1,
      });
    } catch (err) {
      set({ error: (err as Error).message });
    }
  },

  createConversation: async (title) => {
    const id = uuid();
    const now = Date.now();
    const conversation: AgentConversation = {
      id,
      title: title || 'New Chat',
      messages: [],
      modelName: 'qwen2-1.5b',
      createdAt: now,
      updatedAt: now,
    };

    await llmService.createConversation(conversation);
    set((state) => ({
      conversations: [conversation, ...state.conversations],
      activeConversationIndex: 0,
    }));
    return id;
  },

  deleteConversation: async (id) => {
    await llmService.deleteConversation(id);
    set((state) => ({
      conversations: state.conversations.filter((c) => c.id !== id),
      activeConversationIndex:
        state.conversations.length <= 1
          ? -1
          : Math.min(state.activeConversationIndex, state.conversations.length - 2),
    }));
  },

  selectConversation: (index) => set({ activeConversationIndex: index }),

  setActiveConversation: () => {},

  sendMessage: async (content) => {
    const { activeConversationIndex, conversations } = get();
    if (activeConversationIndex < 0) return;

    set({ isGenerating: true, error: null });
    const conversation = { ...conversations[activeConversationIndex] };

    const userMessage: AgentMessage = {
      id: uuid(),
      role: 'user',
      content,
      toolCalls: null,
      toolResults: null,
      timestamp: Date.now(),
      isStreaming: false,
    };

    conversation.messages.push(userMessage);

    try {
      const settings = SettingsStorage.get();
      let agentMessage: AgentMessage;

      if (settings?.backendUrl && settings?.backendToken) {
        const { data, error } = await BackendAPI.askAI(content);
        if (data && !error) {
          agentMessage = {
            id: uuid(),
            role: 'agent',
            content: data.answer,
            toolCalls: null,
            toolResults: null,
            timestamp: Date.now(),
            isStreaming: false,
          };
        } else {
          agentMessage = await llmService.generateAgentResponse(
            content,
            conversation.messages.slice(0, -1),
            (token) => {
              set((state) => ({
                streamingMessage: state.streamingMessage + token,
              }));
            }
          );
        }
      } else {
        agentMessage = await llmService.generateAgentResponse(
          content,
          conversation.messages.slice(0, -1),
          (token) => {
            set((state) => ({
              streamingMessage: state.streamingMessage + token,
            }));
          }
        );
      }

      agentMessage.id = uuid();
      conversation.messages.push(agentMessage);
      conversation.updatedAt = Date.now();

      if (agentMessage.toolCalls) {
        for (const toolCall of agentMessage.toolCalls) {
          toolCall.id = uuid();
          const result = await llmService.executeToolCall(toolCall);

          conversation.messages.push({
            id: uuid(),
            role: 'tool',
            content: result.result,
            toolCalls: null,
            toolResults: [result],
            timestamp: Date.now(),
            isStreaming: false,
          });
        }
      }

      await llmService.addMessage(conversation.id, userMessage);
      await llmService.addMessage(conversation.id, agentMessage);

      const updatedConversations = [...conversations];
      updatedConversations[activeConversationIndex] = conversation;

      set({
        conversations: updatedConversations,
        isGenerating: false,
        streamingMessage: '',
      });
    } catch (err) {
      set({
        isGenerating: false,
        error: (err as Error).message,
        streamingMessage: '',
      });
    }
  },

  clearStreaming: () => set({ streamingMessage: '' }),

  loadModel: async () => {
    set({ isModelLoaded: false });
    const loaded = await llmService.loadModel();
    set({ isModelLoaded: loaded });
    return loaded;
  },

  getActiveConversation: () => {
    const { conversations, activeConversationIndex } = get();
    if (activeConversationIndex < 0) return null;
    return conversations[activeConversationIndex] ?? null;
  },
}));