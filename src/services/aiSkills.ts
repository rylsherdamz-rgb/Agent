export class AISkills {
  private static instance: AISkills;
  private isInitialized = false;

  private constructor() {}

  static getInstance(): AISkills {
    if (!AISkills.instance) {
      AISkills.instance = new AISkills();
    }
    return AISkills.instance;
  }

  async initialize(): Promise<void> {
    if (this.isInitialized) return;
    this.isInitialized = true;
    console.log('[AI Skills] Initialized successfully');
  }

  async analyzeSentiment(text: string): Promise<{ label: string; score: number }> {
    const positiveWords = ['good', 'great', 'happy', 'love', 'excellent', 'amazing', 'wonderful', 'best', 'awesome', 'fantastic'];
    const negativeWords = ['bad', 'terrible', 'hate', 'awful', 'worst', 'horrible', 'angry', 'sad', 'disappointed', 'poor'];
    const lowerText = text.toLowerCase();
    const posCount = positiveWords.filter(w => lowerText.includes(w)).length;
    const negCount = negativeWords.filter(w => lowerText.includes(w)).length;
    if (posCount > negCount) return { label: 'POSITIVE', score: 0.7 + posCount * 0.05 };
    if (negCount > posCount) return { label: 'NEGATIVE', score: 0.7 + negCount * 0.05 };
    return { label: 'NEUTRAL', score: 0.5 };
  }

  async extractKeywords(text: string, maxKeywords = 5): Promise<string[]> {
    const stopWords = new Set([
      'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
      'of', 'with', 'by', 'from', 'is', 'are', 'was', 'were', 'be', 'been',
      'being', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would',
      'could', 'should', 'may', 'might', 'must', 'shall', 'can', 'need',
      'dare', 'ought', 'used', 'it', 'its', 'this', 'that', 'these', 'those',
      'i', 'you', 'he', 'she', 'we', 'they', 'what', 'which', 'who', 'whom',
      'whose', 'where', 'when', 'why', 'how', 'all', 'each', 'every', 'both',
      'few', 'more', 'most', 'other', 'some', 'such', 'no', 'nor', 'not',
      'only', 'own', 'same', 'so', 'than', 'too', 'very', 'just', 'also'
    ]);

    const words = text.toLowerCase().match(/\b[a-z]+\b/g) || [];
    const wordFreq = new Map<string, number>();

    for (const word of words) {
      if (!stopWords.has(word) && word.length > 2) {
        wordFreq.set(word, (wordFreq.get(word) || 0) + 1);
      }
    }

    const sorted = Array.from(wordFreq.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, maxKeywords);

    return sorted.map(([word]) => word);
  }

  async summarizeText(text: string, maxLength = 100): Promise<string> {
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
    
    if (sentences.length <= 2) {
      return text;
    }

    const firstSentence = sentences[0];
    const lastSentence = sentences[sentences.length - 1];
    
    let summary = firstSentence;
    if (firstSentence.length < maxLength) {
      summary += '. ' + lastSentence;
    }

    return summary.trim() + (summary.length < text.length ? '...' : '');
  }

  async classifyIntent(text: string): Promise<{
    category: 'task' | 'calendar' | 'email' | 'social' | 'general';
    confidence: number;
  }> {
    const lowerText = text.toLowerCase();
    
    const patterns = {
      task: ['create task', 'add task', 'todo', 'to do', 'remind me', 'remember to'],
      calendar: ['schedule', 'calendar', 'event', 'meeting', 'appointment', 'when is'],
      email: ['email', 'mail', 'inbox', 'message', 'send email'],
      social: ['social', 'reddit', 'twitter', 'feed', 'post', 'tweet'],
    };

    let bestMatch: { category: string; score: number } = { category: 'general', score: 0 };

    for (const [category, keywords] of Object.entries(patterns)) {
      const score = keywords.filter(kw => lowerText.includes(kw)).length;
      if (score > bestMatch.score) {
        bestMatch = { category, score };
      }
    }

    return {
      category: bestMatch.category as any,
      confidence: bestMatch.score / Math.max(3, Object.keys(patterns).length),
    };
  }

  async extractEntities(text: string): Promise<{
    dates: string[];
    times: string[];
    priorities: string[];
  }> {
    const lowerText = text.toLowerCase();
    
    const dates: string[] = [];
    const datePatterns = [
      /\b(today|tomorrow|yesterday)\b/gi,
      /\b(monday|tuesday|wednesday|thursday|friday|saturday|sunday)\b/gi,
      /\b(january|february|march|april|may|june|july|august|september|october|november|december)\b/gi,
      /\b(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})\b/g,
    ];

    for (const pattern of datePatterns) {
      const matches = lowerText.match(pattern);
      if (matches) dates.push(...matches);
    }

    const times: string[] = [];
    const timePatterns = [
      /\b(\d{1,2}:\d{2}\s*(am|pm)?)\b/gi,
      /\b(\d{1,2}\s*(am|pm))\b/gi,
      /\b(at\s+\d{1,2}\s*(am|pm)?)\b/gi,
    ];

    for (const pattern of timePatterns) {
      const matches = lowerText.match(pattern);
      if (matches) times.push(...matches);
    }

    const priorities: string[] = [];
    if (/\b(urgent|asap|immediately|priority)\b/i.test(lowerText)) {
      priorities.push('urgent');
    }
    if (/\b(high|important)\b/i.test(lowerText)) {
      priorities.push('high');
    }
    if (/\b(medium|normal)\b/i.test(lowerText)) {
      priorities.push('medium');
    }
    if (/\b(low|whenever)\b/i.test(lowerText)) {
      priorities.push('low');
    }

    return { dates, times, priorities };
  }
}

export const aiSkills = AISkills.getInstance();