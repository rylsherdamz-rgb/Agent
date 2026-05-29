import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  useColorScheme,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../utils/colors';
import { PRIORITY_COLORS, PRIORITY_LABELS, STATUS_LABELS } from '../utils/constants';
import type { Task } from '../types';
import { formatRelativeDate } from '../utils/date';

interface TaskCardProps {
  task: Task;
  onPress: () => void;
  onToggleComplete: () => void;
  compact?: boolean;
}

export function TaskCard({ task, onPress, onToggleComplete, compact }: TaskCardProps) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const colors = Colors[isDark ? 'dark' : 'light'];
  const isCompleted = task.status === 'completed';

  const priorityColor = PRIORITY_COLORS[task.priority];

  if (compact) {
    const subtitle =
      task.subtasks.length > 0
        ? `${task.subtasks.filter((s) => s.completed).length}/${task.subtasks.length} subtasks`
        : undefined;

    return (
      <TouchableOpacity
        style={[styles.compactContainer, { backgroundColor: colors.surface, borderColor: colors.borderLight }]}
        onPress={onPress}
        activeOpacity={0.7}
      >
        <TouchableOpacity onPress={onToggleComplete} style={styles.checkbox}>
          <Ionicons
            name={isCompleted ? 'checkbox' : 'square-outline'}
            size={22}
            color={isCompleted ? colors.success : colors.border}
          />
        </TouchableOpacity>

        <View style={styles.content}>
          <Text
            style={[
              styles.title,
              { color: colors.text },
              isCompleted && styles.completedText,
            ]}
            numberOfLines={1}
          >
            {task.title}
          </Text>
          {subtitle && (
            <Text style={[styles.subtitle, { color: colors.textSecondary }]} numberOfLines={1}>
              {subtitle}
            </Text>
          )}
        </View>

        <View style={styles.rightSection}>
          {task.dueDate && (
            <Text
              style={[
                styles.dueDate,
                {
                  color: task.dueDate < Date.now() && !isCompleted
                    ? colors.error
                    : colors.textSecondary,
                },
              ]}
            >
              {formatRelativeDate(task.dueDate)}
            </Text>
          )}
          <View style={[styles.priorityDot, { backgroundColor: priorityColor }]} />
        </View>
      </TouchableOpacity>
    );
  }

  const subtitle =
    task.subtasks.length > 0
      ? `${task.subtasks.filter((s) => s.completed).length}/${task.subtasks.length} subtasks`
      : task.description
        ? task.description.substring(0, 100)
        : undefined;

  return (
    <TouchableOpacity
      style={[
        styles.container,
        {
          backgroundColor: colors.surface,
          borderColor: colors.borderLight,
          borderLeftColor: priorityColor,
        },
      ]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.header}>
        <TouchableOpacity onPress={onToggleComplete} style={styles.checkbox}>
          <Ionicons
            name={isCompleted ? 'checkbox' : 'square-outline'}
            size={24}
            color={isCompleted ? colors.success : colors.border}
          />
        </TouchableOpacity>

        <Text
          style={[
            styles.title,
            { color: colors.text },
            isCompleted && styles.completedText,
          ]}
          numberOfLines={2}
        >
          {task.title}
        </Text>

        <Text style={[styles.priorityLabel, { color: priorityColor }]}>
          {PRIORITY_LABELS[task.priority]}
        </Text>
      </View>

      {subtitle && (
        <Text
          style={[styles.subtitle, { color: colors.textSecondary }]}
          numberOfLines={2}
        >
          {subtitle}
        </Text>
      )}

      <View style={styles.footer}>
        <Text style={[styles.statusLabel, { color: colors.textTertiary }]}>
          {STATUS_LABELS[task.status]}
        </Text>

        {task.dueDate && (
          <Text
            style={[
              styles.dueDate,
              {
                color: task.dueDate < Date.now() && !isCompleted
                  ? colors.error
                  : colors.textSecondary,
              },
            ]}
          >
            {formatRelativeDate(task.dueDate)}
          </Text>
        )}

        {task.tags.length > 0 && (
          <View style={styles.tags}>
            {task.tags.slice(0, 3).map((tag) => (
              <View
                key={tag}
                style={[styles.tag, { backgroundColor: colors.surfaceVariant }]}
              >
                <Text style={[styles.tagText, { color: colors.textSecondary }]}>
                  {tag}
                </Text>
              </View>
            ))}
          </View>
        )}

        {task.attachments.length > 0 && (
          <Text style={[styles.attachBadge, { color: colors.info }]}>
            {task.attachments.length}
          </Text>
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 16,
    marginVertical: 6,
    borderWidth: 1,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  compactContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 10,
    padding: 12,
    marginHorizontal: 16,
    marginVertical: 3,
    borderWidth: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  checkbox: {
    padding: 2,
    paddingTop: 3,
  },
  content: {
    flex: 1,
  },
  title: {
    fontSize: 15,
    fontWeight: '600',
    flex: 1,
    lineHeight: 20,
  },
  subtitle: {
    fontSize: 13,
    marginTop: 4,
    lineHeight: 18,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
    gap: 12,
    flexWrap: 'wrap',
  },
  statusLabel: {
    fontSize: 12,
    fontWeight: '500',
  },
  dueDate: {
    fontSize: 12,
    fontWeight: '500',
  },
  priorityLabel: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  priorityDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  rightSection: {
    alignItems: 'flex-end',
    gap: 4,
  },
  completedText: {
    textDecorationLine: 'line-through',
    opacity: 0.6,
  },
  tags: {
    flexDirection: 'row',
    gap: 4,
  },
  tag: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  tagText: {
    fontSize: 11,
    fontWeight: '500',
  },
  attachBadge: {
    fontSize: 12,
    fontWeight: '500',
  },
});