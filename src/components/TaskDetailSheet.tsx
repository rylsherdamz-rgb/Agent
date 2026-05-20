import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Modal,
  useColorScheme,
  Switch,
  Platform,
} from 'react-native';
import { Colors } from '../utils/colors';
import { PRIORITY_COLORS, PRIORITY_LABELS, STATUS_LABELS } from '../utils/constants';
import type { Task, TaskFilter } from '../types';
import { formatDate } from '../utils/date';

interface TaskDetailSheetProps {
  task: Task | null;
  visible: boolean;
  onClose: () => void;
  onUpdate: (id: string, changes: Partial<Task>) => void;
  onDelete: (id: string) => void;
  onToggleComplete: (id: string) => void;
  onToggleSubtask: (taskId: string, subtaskId: string) => void;
  onAddSubtask: (taskId: string, title: string) => void;
  onRemoveSubtask: (taskId: string, subtaskId: string) => void;
  onRemoveAttachment: (taskId: string, attachmentId: string) => void;
}

export function TaskDetailSheet({
  task,
  visible,
  onClose,
  onUpdate,
  onDelete,
  onToggleComplete,
  onToggleSubtask,
  onAddSubtask,
  onRemoveSubtask,
  onRemoveAttachment,
}: TaskDetailSheetProps) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const colors = Colors[isDark ? 'dark' : 'light'];
  const [newSubtask, setNewSubtask] = useState('');
  const [editingField, setEditingField] = useState<string | null>(null);

  if (!task) return null;

  const isCompleted = task.status === 'completed';
  const priorityColor = PRIORITY_COLORS[task.priority];

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <TouchableOpacity onPress={onClose}>
            <Text style={[styles.closeButton, { color: colors.primary }]}>Close</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => onDelete(task.id)}>
            <Text style={[styles.deleteButton, { color: colors.error }]}>Delete</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content} contentContainerStyle={styles.contentInner}>
          <TouchableOpacity
            onPress={() => onToggleComplete(task.id)}
            style={styles.statusRow}
          >
            <View
              style={[
                styles.checkCircle,
                {
                  borderColor: isCompleted ? colors.success : colors.border,
                  backgroundColor: isCompleted ? colors.success : 'transparent',
                },
              ]}
            />
            <Text style={[styles.statusLabel, { color: colors.text }]}>
              {isCompleted ? 'Completed' : 'Mark as done'}
            </Text>
          </TouchableOpacity>

          <TextInput
            style={[styles.titleInput, { color: colors.text, borderColor: colors.border }]}
            value={task.title}
            onChangeText={(text) => onUpdate(task.id, { title: text })}
            placeholder="Task title"
            placeholderTextColor={colors.textTertiary}
            multiline
          />

          <TextInput
            style={[styles.descInput, { color: colors.text, borderColor: colors.border }]}
            value={task.description}
            onChangeText={(text) => onUpdate(task.id, { description: text })}
            placeholder="Add description..."
            placeholderTextColor={colors.textTertiary}
            multiline
          />

          <View style={styles.priorityRow}>
            <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>Priority</Text>
            <View style={styles.priorityOptions}>
              {(Object.keys(PRIORITY_LABELS) as Array<keyof typeof PRIORITY_LABELS>).map((p) => (
                <TouchableOpacity
                  key={p}
                  style={[
                    styles.priorityChip,
                    {
                      backgroundColor: task.priority === p ? PRIORITY_COLORS[p] : colors.surfaceVariant,
                      borderColor: PRIORITY_COLORS[p],
                    },
                  ]}
                  onPress={() => onUpdate(task.id, { priority: p })}
                >
                  <Text
                    style={{
                      color: task.priority === p ? '#fff' : PRIORITY_COLORS[p],
                      fontSize: 13,
                      fontWeight: '600',
                    }}
                  >
                    {PRIORITY_LABELS[p]}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.dateRow}>
            <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>Due Date</Text>
            <View style={styles.dateRow}>
              {task.dueDate ? (
                <View style={styles.datePill}>
                  <Text style={[styles.dateText, { color: task.dueDate < Date.now() && !isCompleted ? colors.error : colors.text }]}>
                    {formatDate(task.dueDate, 'MMM d, yyyy h:mm a')}
                  </Text>
                  <TouchableOpacity onPress={() => onUpdate(task.id, { dueDate: null })}>
                    <Text style={{ color: colors.error, fontSize: 14 }}> Clear</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <TouchableOpacity
                  style={[styles.datePill, { backgroundColor: colors.surfaceVariant }]}
                  onPress={() => {
                    const tomorrow = new Date();
                    tomorrow.setDate(tomorrow.getDate() + 1);
                    tomorrow.setHours(9, 0, 0, 0);
                    onUpdate(task.id, { dueDate: tomorrow.getTime() });
                  }}
                >
                  <Text style={{ color: colors.primary, fontSize: 14 }}>+ Set due date</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>

          <View style={styles.subtasksSection}>
            <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>
              Subtasks ({task.subtasks.filter((s) => s.completed).length}/{task.subtasks.length})
            </Text>

            {task.subtasks.map((sub) => (
              <View key={sub.id} style={styles.subtaskRow}>
                <TouchableOpacity
                  onPress={() => onToggleSubtask(task.id, sub.id)}
                  style={styles.subtaskCheck}
                >
                  <View
                    style={[
                      styles.subtaskCheckInner,
                      {
                        borderColor: sub.completed ? colors.success : colors.border,
                        backgroundColor: sub.completed ? colors.success : 'transparent',
                      },
                    ]}
                  />
                </TouchableOpacity>
                <Text
                  style={[
                    styles.subtaskText,
                    { color: colors.text },
                    sub.completed && styles.completedText,
                  ]}
                >
                  {sub.title}
                </Text>
                <TouchableOpacity onPress={() => onRemoveSubtask(task.id, sub.id)}>
                  <Text style={{ color: colors.textTertiary, fontSize: 14 }}>X</Text>
                </TouchableOpacity>
              </View>
            ))}

            <View style={[styles.subtaskInputRow, { borderColor: colors.border }]}>
              <TextInput
                style={[styles.subtaskInput, { color: colors.text }]}
                value={newSubtask}
                onChangeText={setNewSubtask}
                placeholder="Add subtask..."
                placeholderTextColor={colors.textTertiary}
                onSubmitEditing={() => {
                  if (newSubtask.trim()) {
                    onAddSubtask(task.id, newSubtask.trim());
                    setNewSubtask('');
                  }
                }}
              />
              <TouchableOpacity
                onPress={() => {
                  if (newSubtask.trim()) {
                    onAddSubtask(task.id, newSubtask.trim());
                    setNewSubtask('');
                  }
                }}
              >
                <Text style={[styles.addBtn, { color: colors.primary }]}>Add</Text>
              </TouchableOpacity>
            </View>
          </View>

          {task.attachments.length > 0 && (
            <View style={styles.attachmentsSection}>
              <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>
                Attachments ({task.attachments.length})
              </Text>
              {task.attachments.map((att) => (
                <View key={att.id} style={[styles.attachRow, { backgroundColor: colors.surfaceVariant }]}>
                  <Text style={[styles.attachName, { color: colors.text }]} numberOfLines={1}>
                    {att.name}
                  </Text>
                  <TouchableOpacity onPress={() => onRemoveAttachment(task.id, att.id)}>
                    <Text style={{ color: colors.textTertiary, fontSize: 14 }}>X</Text>
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}

          {task.source !== 'manual' && (
            <View style={[styles.metaRow, { borderTopColor: colors.border }]}>
              <Text style={[styles.metaText, { color: colors.textTertiary }]}>
                Source: {task.source}
              </Text>
              <Text style={[styles.metaText, { color: colors.textTertiary }]}>
                Created: {formatDate(task.createdAt, 'MMM d, h:mm a')}
              </Text>
            </View>
          )}
        </ScrollView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingBottom: 12,
    borderBottomWidth: 1,
  },
  closeButton: { fontSize: 16, fontWeight: '500' },
  deleteButton: { fontSize: 16, fontWeight: '500' },
  content: { flex: 1 },
  contentInner: { padding: 16, paddingBottom: 40 },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 20,
  },
  checkCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
  },
  statusLabel: { fontSize: 16, fontWeight: '500' },
  titleInput: {
    fontSize: 20,
    fontWeight: '700',
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
    marginBottom: 12,
  },
  descInput: {
    fontSize: 15,
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
    marginBottom: 20,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  priorityRow: { marginBottom: 20 },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    textTransform: 'uppercase',
    marginBottom: 8,
    letterSpacing: 0.5,
  },
  priorityOptions: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  priorityChip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
  },
  dateRow: { marginBottom: 20 },
  datePill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
  },
  dateText: { fontSize: 14, fontWeight: '500' },
  subtasksSection: { marginBottom: 20 },
  subtaskRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 8,
  },
  subtaskCheck: { padding: 2 },
  subtaskCheckInner: {
    width: 20,
    height: 20,
    borderRadius: 6,
    borderWidth: 2,
  },
  subtaskText: { fontSize: 14, flex: 1 },
  subtaskInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    marginTop: 8,
  },
  subtaskInput: { flex: 1, fontSize: 14, paddingVertical: 10 },
  addBtn: { fontSize: 14, fontWeight: '600', paddingLeft: 8 },
  attachmentsSection: { marginBottom: 20 },
  attachRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 8,
    marginBottom: 6,
  },
  attachName: { fontSize: 13, flex: 1, marginRight: 8 },
  metaRow: {
    paddingTop: 16,
    borderTopWidth: 1,
    gap: 4,
  },
  metaText: { fontSize: 12 },
  completedText: {
    textDecorationLine: 'line-through',
    opacity: 0.5,
  },
});