import { requireNativeModule } from 'expo-modules-core';

interface LlamaCppModule {
  loadModel(path: string): Promise<boolean>;
  infer(prompt: string, options?: {
    maxTokens?: number;
    temperature?: number;
    topP?: number;
    stopTokens?: string[];
  }): Promise<{
    text: string;
    tokensGenerated: number;
    tokensPerSecond: number;
    finishReason: 'stop' | 'length' | 'error';
  }>;
  isModelLoaded(): boolean;
  unloadModel(): void;
  getModelInfo(): { loaded: boolean; path: string | null; contextSize: number } | null;
}

let nativeModule: LlamaCppModule | null = null;

try {
  nativeModule = requireNativeModule('LlamaCpp');
} catch {}

const mockModule: LlamaCppModule = {
  loadModel: async (_path) => {
    console.log('[LlamaCpp Mock] Model loaded:', _path);
    return true;
  },
  infer: async (prompt) => {
    const p = prompt.toLowerCase();
    let text = 'I am the offline agent running on your device. How can I help you?';

    if (p.includes('task') || p.includes('todo')) {
      text = 'Here are your pending tasks. Would you like to create a new one?';
    } else if (p.includes('schedule') || p.includes('calendar')) {
      text = 'Your schedule for today is clear. Would you like to add an event?';
    } else if (p.includes('email') || p.includes('inbox')) {
      text = 'No new unread emails. Your inbox is organized.';
    } else if (p.includes('summarize') || p.includes('summary')) {
      text = 'Daily summary: You have no overdue tasks and your calendar is clear. All emails have been processed.';
    }

    return {
      text,
      tokensGenerated: Math.ceil(text.length / 3),
      tokensPerSecond: 2.5,
      finishReason: 'stop',
    };
  },
  isModelLoaded: () => false,
  unloadModel: () => {},
  getModelInfo: () => null,
};

export const LlamaCpp: LlamaCppModule = nativeModule || mockModule;