import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  useColorScheme,
  RefreshControl,
} from 'react-native';
import { Colors } from '../../src/utils/colors';
import { useInboxStore } from '../../src/stores/inboxStore';
import { useTaskStore } from '../../src/stores/taskStore';
import { formatRelativeDate } from '../../src/utils/date';
import type { Email, SocialPost } from '../../src/types';

type UnifiedItem = (Email | SocialPost) & { itemType: 'email' | 'social' };
type TabType = 'all' | 'email' | 'social';

export default function InboxScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const colors = Colors[isDark ? 'dark' : 'light'];

  const {
    unifiedInbox,
    isLoading,
    unreadCount,
    loadUnifiedInbox,
    markEmailRead,
    markSocialRead,
    createTaskFromItem,
  } = useInboxStore();

  const { addTask } = useTaskStore();
  const [activeTab, setActiveTab] = useState<TabType>('all');

  const filtered =
    activeTab === 'all'
      ? unifiedInbox
      : unifiedInbox.filter((item) => item.itemType === activeTab);

  useEffect(() => {
    loadUnifiedInbox();
  }, []);

  const handleItemPress = (item: UnifiedItem) => {
    if (item.itemType === 'email') {
      markEmailRead(item.id);
    } else {
      markSocialRead(item.id);
    }
  };

  const handleCreateTask = (item: UnifiedItem) => {
    const result = createTaskFromItem(item);
    if (result) {
      try {
        const data = JSON.parse(result);
        addTask({
          title: data.title,
          description: data.description,
          source: data.source,
          sourceId: data.sourceId,
          priority: data.priority,
        });
      } catch {}
    }
  };

  const renderItem = ({ item }: { item: UnifiedItem }) => {
    if (item.itemType === 'email') {
      const email = item as Email;
      return (
        <TouchableOpacity
          style={[
            styles.itemContainer,
            {
              backgroundColor: colors.surface,
              borderColor: colors.borderLight,
            },
            !email.isRead && { borderLeftColor: colors.primary, borderLeftWidth: 3 },
          ]}
          onPress={() => handleItemPress(item)}
          activeOpacity={0.7}
        >
          <View style={styles.itemHeader}>
            <View style={styles.avatarPlaceholder}>
              <Text style={[styles.avatarText, { color: colors.textTertiary }]}>
                {email.fromName?.[0] || email.from[0] || '?'}
              </Text>
            </View>
            <View style={styles.itemContent}>
              <View style={styles.nameRow}>
                <Text
                  style={[
                    styles.fromName,
                    { color: colors.text },
                    !email.isRead && styles.bold,
                  ]}
                  numberOfLines={1}
                >
                  {email.fromName || email.from}
                </Text>
                <Text style={[styles.dateText, { color: colors.textTertiary }]}>
                  {formatRelativeDate(email.date)}
                </Text>
              </View>
              <Text
                style={[
                  styles.subjectText,
                  { color: !email.isRead ? colors.text : colors.textSecondary },
                  !email.isRead && styles.bold,
                ]}
                numberOfLines={1}
              >
                {email.subject || '(no subject)'}
              </Text>
              <Text
                style={[styles.previewText, { color: colors.textTertiary }]}
                numberOfLines={1}
              >
                {email.bodyText?.substring(0, 120) || ''}
              </Text>
            </View>
          </View>
          <TouchableOpacity
            style={[styles.actionBtn, { borderColor: colors.border }]}
            onPress={() => handleCreateTask(item)}
          >
            <Text style={[styles.actionBtnText, { color: colors.primary }]}>+ Task</Text>
          </TouchableOpacity>
        </TouchableOpacity>
      );
    }

    const post = item as SocialPost;
    return (
      <TouchableOpacity
        style={[
          styles.itemContainer,
          {
            backgroundColor: colors.surface,
            borderColor: colors.borderLight,
          },
          !post.isRead && { borderLeftColor: colors.info, borderLeftWidth: 3 },
        ]}
        onPress={() => handleItemPress(item)}
        activeOpacity={0.7}
      >
        <View style={styles.itemHeader}>
          <View style={[styles.platformBadge, { backgroundColor: colors.surfaceVariant }]}>
            <Text style={[styles.platformText, { color: colors.textSecondary }]}>
              {post.platform}
            </Text>
          </View>
          <View style={styles.itemContent}>
            <View style={styles.nameRow}>
              <Text
                style={[
                  styles.fromName,
                  { color: colors.text },
                  !post.isRead && styles.bold,
                ]}
                numberOfLines={1}
              >
                {post.author}
              </Text>
              <Text style={[styles.dateText, { color: colors.textTertiary }]}>
                {formatRelativeDate(post.date)}
              </Text>
            </View>
            <Text
              style={[styles.previewText, { color: colors.textSecondary }]}
              numberOfLines={2}
            >
              {post.content?.substring(0, 200) || ''}
            </Text>
          </View>
        </View>
        <TouchableOpacity
          style={[styles.actionBtn, { borderColor: colors.border }]}
          onPress={() => handleCreateTask(item)}
        >
          <Text style={[styles.actionBtnText, { color: colors.primary }]}>+ Task</Text>
        </TouchableOpacity>
      </TouchableOpacity>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.tabRow, { borderBottomColor: colors.border }]}>
        {(['all', 'email', 'social'] as TabType[]).map((tab) => (
          <TouchableOpacity
            key={tab}
            style={[
              styles.tab,
              activeTab === tab && {
                borderBottomColor: colors.primary,
                borderBottomWidth: 2,
              },
            ]}
            onPress={() => setActiveTab(tab)}
          >
            <Text
              style={[
                styles.tabText,
                {
                  color:
                    activeTab === tab ? colors.primary : colors.textSecondary,
                },
              ]}
            >
              {tab === 'all' ? `All (${unifiedInbox.length})` : tab.charAt(0).toUpperCase() + tab.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}

        {unreadCount > 0 && (
          <View style={[styles.unreadBadge, { backgroundColor: colors.error }]}>
            <Text style={styles.unreadBadgeText}>{unreadCount}</Text>
          </View>
        )}
      </View>

      {unifiedInbox.length === 0 && !isLoading ? (
        <View style={styles.emptyState}>
          <Text style={{ fontSize: 40, marginBottom: 16 }}>i</Text>
          <Text style={[styles.emptyTitle, { color: colors.text }]}>
            Inbox is empty
          </Text>
          <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
            Connect email accounts and social feeds to see updates here
          </Text>
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item, index) => `${item.itemType}-${item.id}-${index}`}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={isLoading} onRefresh={loadUnifiedInbox} />
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  tabRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    borderBottomWidth: 1,
  },
  tab: {
    paddingVertical: 12,
    marginRight: 20,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
  },
  unreadBadge: {
    marginLeft: 'auto',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    minWidth: 24,
    alignItems: 'center',
  },
  unreadBadgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
  },
  listContent: { paddingVertical: 8, paddingBottom: 40 },
  itemContainer: {
    marginHorizontal: 16,
    marginVertical: 4,
    borderRadius: 10,
    borderWidth: 1,
    overflow: 'hidden',
  },
  itemHeader: {
    flexDirection: 'row',
    padding: 12,
    gap: 12,
  },
  avatarPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#E0E0E0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 16,
    fontWeight: '700',
  },
  platformBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  platformText: {
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  itemContent: { flex: 1 },
  nameRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 3,
  },
  fromName: {
    fontSize: 14,
    flex: 1,
    marginRight: 8,
  },
  dateText: {
    fontSize: 11,
  },
  subjectText: {
    fontSize: 15,
    marginBottom: 3,
  },
  previewText: {
    fontSize: 13,
    lineHeight: 18,
  },
  bold: {
    fontWeight: '700',
  },
  actionBtn: {
    borderTopWidth: 1,
    paddingVertical: 8,
    alignItems: 'center',
  },
  actionBtnText: {
    fontSize: 13,
    fontWeight: '600',
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
});