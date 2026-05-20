import React, { useEffect, useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  useColorScheme,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Colors } from '../../src/utils/colors';
import { useAgentStore } from '../../src/stores/agentStore';
import { useSettingsStore } from '../../src/stores/settingsStore';
import { formatRelativeDate } from '../../src/utils/date';
import type { AgentMessage } from '../../src/types';

export default function AgentScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const colors = Colors[isDark ? 'dark' : 'light'];

  const {
    conversations,
    activeConversationIndex,
    isGenerating,
    isModelLoaded,
    streamingMessage,
    error,
    loadConversations,
    createConversation,
    deleteConversation,
    selectConversation,
    sendMessage,
    loadModel,
    getActiveConversation,
    clearStreaming,
  } = useAgentStore();

  const { settings } = useSettingsStore();

  const [inputText, setInputText] = useState('');
  const [modelStatus, setModelStatus] = useState<'unloaded' | 'loading' | 'loaded'>(
    settings.modelDownloaded ? 'unloaded' : 'unloaded'
  );

  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    loadConversations();
  }, []);

  const activeConversation = getActiveConversation();
  const messages = activeConversation?.messages || [];

  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages.length, streamingMessage]);

  const handleLoadModel = async () => {
    setModelStatus('loading');
    const success = await loadModel();
    setModelStatus(success ? 'loaded' : 'unloaded');
  };

  const handleSend = useCallback(async () => {
    const text = inputText.trim();
    if (!text || isGenerating) return;

    setInputText('');

    if (activeConversationIndex < 0) {
      await createConversation();
    }

    await sendMessage(text);

    setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated: true });
    }, 200);
  }, [inputText, isGenerating, activeConversationIndex]);

  const handleNewChat = async () => {
    await createConversation();
  };

  const renderMessage = ({ item }: { item: AgentMessage }) => {
    const isUser = item.role === 'user';
    const isTool = item.role === 'tool';

    if (isTool) {
      return (
        <View style={[styles.toolBubble, { backgroundColor: colors.surfaceVariant }]}>
          <Text style={[styles.toolLabel, { color: colors.textTertiary }]}>
            TOOL: {item.content.substring(0, 80)}
          </Text>
        </View>
      );
    }

    return (
      <View
        style={[
          styles.messageRow,
          isUser ? styles.userRow : styles.agentRow,
        ]}
      >
        <View
          style={[
            styles.bubble,
            isUser
              ? [styles.userBubble, { backgroundColor: colors.primary }]
              : [styles.agentBubble, { backgroundColor: colors.surfaceVariant }],
          ]}
        >
          <Text
            style={[
              styles.bubbleText,
              { color: isUser ? '#fff' : colors.text },
            ]}
          >
            {item.content}
          </Text>
          <Text
            style={[
              styles.bubbleTime,
              { color: isUser ? 'rgba(255,255,255,0.7)' : colors.textTertiary },
            ]}
          >
            {formatRelativeDate(item.timestamp)}
          </Text>
        </View>
      </View>
    );
  };

  const renderHeader = () => (
    <View>
      {!isModelLoaded && modelStatus !== 'loading' && settings.modelDownloaded && (
        <TouchableOpacity
          style={[styles.loadBanner, { backgroundColor: colors.primary + '15' }]}
          onPress={handleLoadModel}
        >
          <Text style={[styles.loadBannerText, { color: colors.primary }]}>
            Model downloaded. Tap to load offline AI agent
          </Text>
        </TouchableOpacity>
      )}

      {modelStatus === 'loading' && (
        <View style={[styles.loadBanner, { backgroundColor: colors.warning + '15' }]}>
          <Text style={[styles.loadBannerText, { color: colors.warning }]}>
            Loading Qwen2-1.5B model...
          </Text>
        </View>
      )}

      {!settings.modelDownloaded && (
        <View style={[styles.loadBanner, { backgroundColor: colors.surfaceVariant }]}>
          <Text style={[styles.loadBannerText, { color: colors.textSecondary }]}>
            No model found. The agent uses offline inference when available.
            {modelStatus === 'unloaded' && '\nUsing fallback response mode.'}
          </Text>
        </View>
      )}

      {isModelLoaded && (
        <View style={[styles.loadBanner, { backgroundColor: colors.success + '15' }]}>
          <Text style={[styles.loadBannerText, { color: colors.success }]}>
            Model loaded - running offline on device
          </Text>
        </View>
      )}
    </View>
  );

  const renderEmpty = () => (
    <View style={styles.emptyState}>
      <Text style={[styles.emptyIcon]}>?</Text>
      <Text style={[styles.emptyTitle, { color: colors.text }]}>
        Offline AI Agent
      </Text>
      <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
        Ask me to create tasks, check your schedule, summarize emails, or review social media.
      </Text>
      <View style={styles.suggestions}>
        {[
          'Show my overdue tasks',
          'What\'s on my schedule today?',
          'Summarize my inbox',
          'Create a task for tomorrow',
          'What social updates do I have?',
        ].map((suggestion) => (
          <TouchableOpacity
            key={suggestion}
            style={[styles.suggestionChip, { backgroundColor: colors.surfaceVariant, borderColor: colors.border }]}
            onPress={() => {
              setInputText(suggestion);
            }}
          >
            <Text style={[styles.suggestionText, { color: colors.textSecondary }]}>
              {suggestion}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  if (activeConversationIndex < 0 && conversations.length === 0) {
    return (
      <KeyboardAvoidingView
        style={[styles.container, { backgroundColor: colors.background }]}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={90}
      >
        {renderHeader()}
        <View style={styles.emptyContainer}>
          <View style={styles.emptyState}>
            <Text style={[styles.emptyIcon]}>A</Text>
            <Text style={[styles.emptyTitle, { color: colors.text }]}>
              Offline AI Agent
            </Text>
            <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
              I can help manage your tasks, calendar, emails, and social media.{'\n\n'}
              Ask me anything — I run entirely on your device.
            </Text>
            <TouchableOpacity
              style={[styles.startButton, { backgroundColor: colors.primary }]}
              onPress={handleNewChat}
            >
              <Text style={styles.startButtonText}>Start Conversation</Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    );
  }

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={90}
    >
      {conversations.length > 1 && (
        <View style={[styles.chatSelector, { borderBottomColor: colors.border }]}>
          <FlatList
            horizontal
            data={conversations}
            keyExtractor={(item) => item.id}
            renderItem={({ item, index }) => (
              <TouchableOpacity
                style={[
                  styles.chatChip,
                  index === activeConversationIndex && {
                    backgroundColor: colors.primary + '20',
                  },
                ]}
                onPress={() => selectConversation(index)}
              >
                <Text
                  style={[
                    styles.chatChipText,
                    {
                      color:
                        index === activeConversationIndex
                          ? colors.primary
                          : colors.textSecondary,
                    },
                  ]}
                  numberOfLines={1}
                >
                  {item.title || 'Chat'}
                </Text>
              </TouchableOpacity>
            )}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.chatChipList}
          />
          <TouchableOpacity onPress={handleNewChat}>
            <Text style={[styles.newChatBtn, { color: colors.primary }]}>+</Text>
          </TouchableOpacity>
        </View>
      )}

      <FlatList
        ref={flatListRef}
        data={messages}
        renderItem={renderMessage}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={renderEmpty}
        contentContainerStyle={
          messages.length === 0 ? styles.emptyListContent : styles.listContent
        }
        showsVerticalScrollIndicator={false}
      />

      {isGenerating && streamingMessage ? (
        <View style={[styles.streamingBar, { backgroundColor: colors.surface }]}>
          <Text style={[styles.streamingText, { color: colors.textSecondary }]}>
            {streamingMessage.substring(streamingMessage.length - 60)}
          </Text>
        </View>
      ) : null}

      {error && (
        <View style={[styles.errorBar, { backgroundColor: colors.error + '15' }]}>
          <Text style={[styles.errorText, { color: colors.error }]}>{error}</Text>
        </View>
      )}

      <View style={[styles.inputBar, { backgroundColor: colors.surface, borderTopColor: colors.border }]}>
        <TextInput
          style={[
            styles.input,
            {
              backgroundColor: colors.surfaceVariant,
              color: colors.text,
            },
          ]}
          value={inputText}
          onChangeText={setInputText}
          placeholder={isModelLoaded ? 'Message the agent...' : 'Type a message...'}
          placeholderTextColor={colors.textTertiary}
          multiline
          maxLength={2000}
          editable={!isGenerating}
          onSubmitEditing={handleSend}
        />
        <TouchableOpacity
          style={[
            styles.sendButton,
            {
              backgroundColor:
                inputText.trim() && !isGenerating
                  ? colors.primary
                  : colors.surfaceVariant,
            },
          ]}
          onPress={handleSend}
          disabled={!inputText.trim() || isGenerating}
        >
          <Text
            style={{
              color: inputText.trim() && !isGenerating ? '#fff' : colors.textTertiary,
              fontSize: 16,
              fontWeight: '700',
            }}
          >
            {isGenerating ? '...' : '>'}
          </Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  emptyContainer: { flex: 1 },
  emptyListContent: { flexGrow: 1 },
  listContent: { paddingBottom: 16 },
  loadBanner: {
    marginHorizontal: 16,
    marginVertical: 8,
    padding: 12,
    borderRadius: 10,
  },
  loadBannerText: {
    fontSize: 13,
    fontWeight: '500',
    lineHeight: 18,
  },
  chatSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingRight: 16,
    borderBottomWidth: 1,
  },
  chatChipList: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 8,
  },
  chatChip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 14,
  },
  chatChipText: {
    fontSize: 13,
    fontWeight: '600',
    maxWidth: 120,
  },
  newChatBtn: {
    fontSize: 22,
    fontWeight: '700',
    paddingHorizontal: 4,
  },
  messageRow: {
    paddingHorizontal: 16,
    marginVertical: 3,
  },
  userRow: {
    alignItems: 'flex-end',
  },
  agentRow: {
    alignItems: 'flex-start',
  },
  bubble: {
    maxWidth: '80%',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 16,
  },
  userBubble: {
    borderBottomRightRadius: 4,
  },
  agentBubble: {
    borderBottomLeftRadius: 4,
  },
  bubbleText: {
    fontSize: 15,
    lineHeight: 21,
  },
  bubbleTime: {
    fontSize: 10,
    marginTop: 4,
    textAlign: 'right',
  },
  toolBubble: {
    alignSelf: 'center',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 8,
    marginVertical: 4,
  },
  toolLabel: {
    fontSize: 11,
    fontWeight: '500',
  },
  streamingBar: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  streamingText: {
    fontSize: 13,
    fontStyle: 'italic',
  },
  errorBar: {
    paddingHorizontal: 16,
    paddingVertical: 6,
  },
  errorText: {
    fontSize: 12,
    fontWeight: '500',
  },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderTopWidth: 1,
    gap: 8,
  },
  input: {
    flex: 1,
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 10,
    fontSize: 15,
    maxHeight: 120,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    paddingBottom: 60,
  },
  emptyIcon: {
    fontSize: 56,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 12,
  },
  emptySubtitle: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  suggestions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 8,
  },
  suggestionChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 16,
    borderWidth: 1,
  },
  suggestionText: {
    fontSize: 13,
    fontWeight: '500',
  },
  startButton: {
    paddingHorizontal: 28,
    paddingVertical: 14,
    borderRadius: 24,
  },
  startButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
});