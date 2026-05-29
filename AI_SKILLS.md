# AI Skills Documentation

## Overview

The Agent app includes a comprehensive suite of AI skills for natural language understanding and task execution. These skills enable the offline AI agent to understand user commands and execute actions across tasks, calendar, email, and social media.

## Architecture

```
User Input (Natural Language)
    ↓
NLP Skills (Parse Command)
    ↓
Intent Classification + Entity Extraction
    ↓
Agent Skills (Execute Tool)
    ↓
Store Actions (Zustand)
    ↓
Response Generation
```

## Available AI Skills

### 1. **Natural Language Processing (NLP) Skills**
Location: `src/services/nlpSkills.ts`

**Capabilities:**
- Intent classification (task, calendar, email, social, general)
- Entity extraction (dates, times, priorities, keywords)
- Command parsing
- Action suggestion generation

**Example Usage:**
```typescript
import { nlpSkills } from './services/nlpSkills';

const parsed = await nlpSkills.parseCommand(
  'Create a high priority task to review the report tomorrow'
);

// Returns:
{
  action: 'create_task',
  entities: {
    title: 'review the report',
    priority: 'high',
    dueDate: <timestamp for tomorrow>,
    tags: ['report', 'review']
  },
  confidence: 0.85
}
```

### 2. **AI/ML Skills**
Location: `src/services/aiSkills.ts`

**Capabilities:**
- Sentiment analysis (using DistilBERT)
- Keyword extraction
- Text summarization
- Intent classification
- Entity extraction (dates, times, priorities)

**Model:** Xenova's Transformers.js with DistilBERT-base-uncased

**Example Usage:**
```typescript
import { aiSkills } from './services/aiSkills';

// Sentiment Analysis
const sentiment = await aiSkills.analyzeSentiment(
  'I love this feature, it works perfectly!'
);
// { label: 'POSITIVE', score: 0.98 }

// Keyword Extraction
const keywords = await aiSkills.extractKeywords(
  'Meeting with the team to discuss project timeline and deliverables',
  5
);
// ['meeting', 'team', 'project', 'timeline', 'deliverables']

// Text Summarization
const summary = await aiSkills.summarizeText(longText, 100);
```

### 3. **Agent Skills (Tool Execution)**
Location: `src/services/agentSkills.ts`

**Available Tools:**

| Tool Name | Description | Parameters |
|-----------|-------------|------------|
| `create_task` | Create a new task | title, description, priority, dueDate, tags |
| `update_task` | Update existing task | id, changes |
| `delete_task` | Delete a task | id |
| `list_tasks` | List tasks with filters | filter |
| `create_event` | Create calendar event | title, description, location, startDate, endDate, isAllDay |
| `get_schedule` | Get events for date | date |
| `analyze_sentiment` | Analyze text sentiment | text |
| `extract_keywords` | Extract keywords | text, maxKeywords |
| `summarize` | Summarize text | text, maxLength |

**Example Usage:**
```typescript
import { agentSkills } from './services/agentSkills';

const result = await agentSkills.executeTool('create_task', {
  title: 'Review Q4 reports',
  priority: 'high',
  dueDate: Date.now() + 86400000,
  tags: ['work', 'urgent']
});

// Returns:
{
  success: true,
  message: 'Task "Review Q4 reports" created successfully',
  data: { /* task object */ }
}
```

## Integration with LLM Service

The AI skills are integrated into the LLM service for tool execution:

```typescript
// src/services/llmService.ts

async executeToolCall(toolCall: ToolCall): Promise<ToolResult> {
  const result = await agentSkills.executeTool(
    toolCall.name,
    toolCall.arguments as Record<string, any>
  );
  
  return {
    toolCallId: toolCall.id,
    result: result.message,
    success: result.success,
    error: result.success ? null : result.message,
  };
}
```

## Natural Language Examples

### Task Creation
```
User: "Remind me to call John tomorrow at 3pm"
Parsed: {
  action: 'create_task',
  entities: {
    title: 'call John',
    dueDate: <tomorrow 3pm timestamp>,
    priority: 'medium'
  }
}
```

### Event Scheduling
```
User: "Schedule a team meeting for next Monday"
Parsed: {
  action: 'create_event',
  entities: {
    title: 'team meeting',
    startDate: <next Monday 9am timestamp>,
    endDate: <next Monday 10am timestamp>
  }
}
```

### Priority Detection
```
User: "Urgent: Submit the budget report ASAP"
Parsed: {
  action: 'create_task',
  entities: {
    title: 'Submit the budget report',
    priority: 'urgent'
  }
}
```

## Smart Suggestions

The agent provides real-time suggestions as the user types:

```typescript
// In agent.tsx
useEffect(() => {
  if (inputText.trim().length > 3) {
    const suggs = await nlpSkills.suggestActions(inputText);
    setSuggestions(suggs);
  }
}, [inputText]);
```

**Example Suggestions:**
- User types: "Create a task to..."
- Suggestions appear:
  - "Create Task"
  - "Set Reminder"
  - "Add to Calendar"

## Offline Capabilities

All AI skills run **100% offline** on the device:

1. **Transformers.js** - Runs ML models in JavaScript
2. **llama-cpp** - Native C++ bindings for LLM inference
3. **Local State** - Zustand stores persist to SQLite/MMKV
4. **No API Calls** - Everything processes locally

## Performance Considerations

### Model Loading
- Models load on-demand (lazy initialization)
- Cached after first load
- Memory-efficient quantized models (Q4_K_M)

### Response Times
- NLP parsing: < 100ms
- Sentiment analysis: < 500ms
- Keyword extraction: < 200ms
- LLM inference: 2-5 tokens/sec (device dependent)

## Extending AI Skills

### Adding a New Tool

1. **Add to AgentSkills:**
```typescript
async myNewTool(args: Record<string, any>): Promise<ToolExecutionResult> {
  // Implementation
  return {
    success: true,
    message: 'Tool executed',
    data: { /* result */ }
  };
}
```

2. **Register in executeTool switch:**
```typescript
case 'my_new_tool':
  return await this.myNewTool(args);
```

3. **Add to getAvailableTools:**
```typescript
{
  name: 'my_new_tool',
  description: 'What it does',
  parameters: ['param1', 'param2']
}
```

## Testing

### Unit Tests
```typescript
describe('NLP Skills', () => {
  it('should parse task creation command', async () => {
    const result = await nlpSkills.parseCommand(
      'Create urgent task: Review report by Friday'
    );
    expect(result.action).toBe('create_task');
    expect(result.entities.priority).toBe('urgent');
  });
});
```

### Integration Tests
```typescript
describe('Agent Skills', () => {
  it('should create task via tool execution', async () => {
    const result = await agentSkills.executeTool('create_task', {
      title: 'Test Task',
      priority: 'high'
    });
    expect(result.success).toBe(true);
  });
});
```

## Troubleshooting

### Model Loading Issues
```typescript
// Check if model is loaded
const isInitialized = aiSkills.isInitialized;

// Reinitialize if needed
await aiSkills.initialize();
```

### NLP Parsing Errors
```typescript
// Add error handling
try {
  const parsed = await nlpSkills.parseCommand(text);
} catch (err) {
  console.error('NLP parsing failed:', err);
  // Fallback to keyword matching
}
```

## Resources

- [Transformers.js Documentation](https://huggingface.co/docs/transformers.js)
- [Xenova Models](https://huggingface.co/Xenova)
- [llama-cpp-python](https://github.com/abetlen/llama-cpp-python)
- [Expo ML Libraries](https://docs.expo.dev/guides/machine-learning/)