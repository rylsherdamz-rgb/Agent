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
  ActivityIndicator,
} from 'react-native';
import Animated, {
  FadeIn,
  FadeInDown,
  ZoomIn,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../src/utils/colors';
import { useAgentStore } from '../../src/stores/agentStore';
import { useSettingsStore } from '../../src/stores/settingsStore';
import { formatRelativeDate } from '../../src/utils/date';
import { nlpSkills } from '../../src/services/nlpSkills';
import type { AgentMessage } from '../../src/types';

const AnimatedTouchableOpacity = Animated.createAnimatedComponent(TouchableOpacity);

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
  const [suggestions, setSuggestions] = useState<Array<{ label: string; action: string }>>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    loadConversations();
  }, []);

  useEffect(() => {
    if (inputText.trim().length > 3) {
      setIsAnalyzing(true);
      const timeout = setTimeout(async () => {
        const suggs = await nlpSkills.suggestActions(inputText);
        setSuggestions(suggs);
        setIsAnalyzing(false);
      }, 300);
      return () => clearTimeout(timeout);
    } else {
      setSuggestions([]);
    }
  }, [inputText]);

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

  const renderMessage = ({ item, index }: { item: AgentMessage; index: number }) => {
    const isUser = item.role === 'user';
    const isTool = item.role === 'tool';

    if (isTool) {
      return (
        <Animated.View
          entering={FadeInDown.duration(300).delay(index * 50)}
          style={[styles.toolBubble, { backgroundColor: colors.surfaceVariant }]}
        >
          <View style={styles.toolRow}>
            <Ionicons name="code-slash-outline" size={16} color={colors.textTertiary} />
            <Text style={[styles.toolLabel, { color: colors.textTertiary }]}>
              TOOL: {item.content.substring(0, 80)}
            </Text>
          </View>
        </Animated.View>
      );
    }

    return (
      <Animated.View
        key={item.id}
        entering={FadeInDown.duration(300).delay(index * 50)}
        style={[
          styles.messageRow,
          isUser ? styles.userRow : styles.agentRow,
        ]}
      >
        {!isUser && (
          <View style={[styles.avatar, { backgroundColor: colors.primary + '20' }]}>
            <Ionicons name="sparkles" size={16} color={colors.primary} />
          </View>
        )}
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
          <View style={styles.bubbleTimeRow}>
            <Text
              style={[
                styles.bubbleTime,
                { color: isUser ? 'rgba(255,255,255,0.7)' : colors.textTertiary },
              ]}
            >
              {formatRelativeDate(item.timestamp)}
            </Text>
            {isUser && (
              <Ionicons name="checkmark-done" size={14} color="rgba(255,255,255,0.7)" />
            )}
          </View>
        </View>
        {isUser && (
          <View style={[styles.avatar, { backgroundColor: colors.success + '20' }]}>
            <Ionicons name="person" size={16} color={colors.success} />
          </View>
        )}
      </Animated.View>
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
      <Animated.View entering={ZoomIn.duration(800)} style={[styles.emptyIconContainer, { backgroundColor: colors.primary + '15' }]}>
        <Ionicons name="sparkles" size={64} color={colors.primary} />
      </Animated.View>
      <Text style={[styles.emptyTitle, { color: colors.text }]}>
        Offline AI Agent
      </Text>
      <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
        I can help manage your tasks, calendar, emails, and social media.{'\n\n'}
        Ask me anything — I run entirely on your device.
      </Text>
      <View style={styles.suggestions}>
        {[
          'Show my overdue tasks',
          'What\'s on my schedule today?',
          'Summarize my inbox',
          'Create a task for tomorrow',
          'What social updates do I have?',
        ].map((suggestion, index) => (
          <AnimatedTouchableOpacity
            key={suggestion}
            entering={FadeInDown.delay(index * 100).duration(400)}
            style={[styles.suggestionChip, { backgroundColor: colors.surfaceVariant, borderColor: colors.border }]}
            onPress={() => {
              setInputText(suggestion);
            }}
            activeOpacity={0.7}
          >
            <Ionicons name="bulb-outline" size={16} color={colors.primary} />
            <Text style={[styles.suggestionText, { color: colors.textSecondary }]}>
              {suggestion}
            </Text>
          </AnimatedTouchableOpacity>
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
            <Ionicons name="sparkles" size={56} color={colors.primary} />
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
        {suggestions.length > 0 && (
          <View style={styles.suggestionsContainer}>
            {suggestions.map((suggestion, index) => (
              <TouchableOpacity
                key={index}
                style={[styles.suggestionItem, { backgroundColor: colors.surfaceVariant, borderColor: colors.border }]}
                onPress={() => {
                  try {
                    const action = JSON.parse(suggestion.action);
                    if (action.type === 'create_task') {
                      setInputText(`Create task: ${action.title}`);
                    }
                  } catch {
                    setInputText(suggestion.label);
                  }
                  setSuggestions([]);
                }}
              >
                <Ionicons name="bulb-outline" size={18} color={colors.primary} />
                <Text style={[styles.suggestionText, { color: colors.text }]}>{suggestion.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
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
          <View style={styles.streamingRow}>
            <Ionicons name="sparkles" size={16} color={colors.primary} />
            <Text style={[styles.streamingText, { color: colors.textSecondary }]}>
              {streamingMessage.substring(streamingMessage.length - 60)}
            </Text>
          </View>
        </View>
      ) : null}

      {error && (
        <View style={[styles.errorBar, { backgroundColor: colors.error + '15' }]}>
          <Text style={[styles.errorText, { color: colors.error }]}>{error}</Text>
        </View>
      )}

      <View style={[styles.inputBar, { backgroundColor: colors.surface, borderTopColor: colors.border }]}>
        <View style={[styles.inputContainer, { backgroundColor: colors.surfaceVariant, borderColor: colors.border }]}>
          <TextInput
            style={[
              styles.input,
              {
                backgroundColor: 'transparent',
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
          <AnimatedTouchableOpacity
            style={[
              styles.sendButton,
              {
                backgroundColor:
                  inputText.trim() && !isGenerating
                    ? colors.primary
                    : colors.textTertiary + '40',
              },
            ]}
            onPress={handleSend}
            disabled={!inputText.trim() || isGenerating}
            activeOpacity={0.8}
          >
            <Ionicons
              name={isGenerating ? 'hourglass' : 'send'}
              size={20}
              color={inputText.trim() && !isGenerating ? '#fff' : colors.textTertiary}
            />
          </AnimatedTouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  emptyContainer: { flex: 1 },
  emptyListContent: { flexGrow: 1 },
  listContent: { paddingBottom: 16, paddingHorizontal: 16 },
  loadBanner: {
    marginHorizontal: 16,
    marginVertical: 8,
    padding: 14,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  loadBannerText: {
    fontSize: 14,
    fontWeight: '600',
    lineHeight: 20,
    flex: 1,
  },
  chatSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingRight: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  chatChipList: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 8,
  },
  chatChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F5F5F5',
  },
  chatChipText: {
    fontSize: 14,
    fontWeight: '600',
    maxWidth: 120,
  },
  newChatBtn: {
    fontSize: 24,
    fontWeight: '700',
    paddingHorizontal: 8,
    color: '#1A73E8',
  },
  messageRow: {
    flexDirection: 'row',
    marginVertical: 6,
    gap: 10,
  },
  userRow: {
    justifyContent: 'flex-end',
  },
  agentRow: {
    justifyContent: 'flex-start',
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'flex-end',
  },
  bubble: {
    maxWidth: '75%',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  userBubble: {
    borderBottomRightRadius: 4,
  },
  agentBubble: {
    borderBottomLeftRadius: 4,
  },
  bubbleText: {
    fontSize: 15,
    lineHeight: 22,
  },
  bubbleTimeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 6,
  },
  bubbleTime: {
    fontSize: 11,
    fontWeight: '500',
  },
  toolBubble: {
    alignSelf: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
    marginVertical: 6,
    maxWidth: '90%',
  },
  toolRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  toolLabel: {
    fontSize: 12,
    fontWeight: '600',
    flex: 1,
  },
  streamingBar: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#F5F5F5',
    borderRadius: 14,
    marginHorizontal: 16,
    marginBottom: 8,
  },
  streamingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  streamingText: {
    fontSize: 14,
    fontStyle: 'italic',
    flex: 1,
  },
  errorBar: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginHorizontal: 16,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  errorText: {
    fontSize: 13,
    fontWeight: '600',
    flex: 1,
  },
  inputBar: {
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderTopWidth: 1,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    borderRadius: 24,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 12,
  },
  input: {
    flex: 1,
    fontSize: 15,
    maxHeight: 120,
    paddingVertical: 8,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
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
  emptyIconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  emptyIcon: {
    fontSize: 56,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 12,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
    color: '#80868B',
  },
  suggestions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 10,
    maxWidth: 500,
  },
  suggestionChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
  },
  suggestionText: {
    fontSize: 14,
    fontWeight: '500',
  },
  startButton: {
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 28,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  startButtonText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '700',
  },
});