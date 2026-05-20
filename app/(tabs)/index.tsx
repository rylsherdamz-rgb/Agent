import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  useColorScheme,
  RefreshControl,
} from 'react-native';
import { Link } from 'expo-router';
import { Colors } from '../../src/utils/colors';
import { useTaskStore } from '../../src/stores/taskStore';
import { FilterBar } from '../../src/components/FilterBar';
import { TaskCard } from '../../src/components/TaskCard';
import { TaskDetailSheet } from '../../src/components/TaskDetailSheet';
import { isToday, formatDate } from '../../src/utils/date';

export default function TaskBoardScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const colors = Colors[isDark ? 'dark' : 'light'];

  const {
    tasks,
    isLoading,
    filter,
    selectedTask,
    loadTasks,
    addTask,
    updateTask,
    deleteTask,
    toggleTaskComplete,
    addSubtask,
    toggleSubtask,
    removeSubtask,
    addAttachment,
    removeAttachment,
    setFilter,
    selectTask,
    getFilteredTasks,
  } = useTaskStore();

  const [detailVisible, setDetailVisible] = useState(false);

  useEffect(() => {
    loadTasks();
  }, []);

  const filteredTasks = getFilteredTasks();
  const completedCount = tasks.filter((t) => t.status === 'completed').length;

  const dueToday = tasks.filter(
    (t) => t.dueDate && isToday(new Date(t.dueDate)) && t.status !== 'completed'
  );

  const overdue = tasks.filter(
    (t) => t.dueDate && t.dueDate < Date.now() && t.status !== 'completed'
  );

  const handleTaskPress = useCallback((task: typeof tasks[0]) => {
    selectTask(task);
    setDetailVisible(true);
  }, []);

  const handleToggleComplete = useCallback((id: string) => {
    toggleTaskComplete(id);
  }, []);

  const summaryStats = `${filteredTasks.length} tasks · ${completedCount} done${overdue.length > 0 ? ` · ${overdue.length} overdue` : ''}`;

  const renderHeader = () => (
    <View>
      <FilterBar
        filter={filter}
        onFilterChange={setFilter}
        totalTasks={tasks.length}
        completedTasks={completedCount}
      />

      <View style={[styles.summaryRow, { borderBottomColor: colors.borderLight }]}>
        <Text style={[styles.summaryText, { color: colors.textSecondary }]}>
          {summaryStats}
        </Text>
        <TouchableOpacity
          style={[styles.addButton, { backgroundColor: colors.primary }]}
          onPress={() => addTask({ title: 'New Task' })}
        >
          <Text style={styles.addButtonText}>+ New</Text>
        </TouchableOpacity>
      </View>

      {overdue.length > 0 && (
        <View style={[styles.overdueBanner, { backgroundColor: colors.error + '12' }]}>
          <Text style={[styles.overdueText, { color: colors.error }]}>
            {overdue.length} overdue task{overdue.length > 1 ? 's' : ''}
          </Text>
        </View>
      )}

      {dueToday.length > 0 && (
        <View style={[styles.todaySection]}>
          <Text style={[styles.sectionHeader, { color: colors.text }]}>
            Today
          </Text>
          {dueToday.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              compact
              onPress={() => handleTaskPress(task)}
              onToggleComplete={() => handleToggleComplete(task.id)}
            />
          ))}
        </View>
      )}
    </View>
  );

  if (tasks.length === 0 && !isLoading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.emptyState}>
          <Text style={[styles.emptyIcon]}>[ ]</Text>
          <Text style={[styles.emptyTitle, { color: colors.text }]}>No tasks yet</Text>
          <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
            Add your first task or let the agent create one
          </Text>
          <TouchableOpacity
            style={[styles.emptyButton, { backgroundColor: colors.primary }]}
            onPress={() => addTask({ title: 'My First Task' })}
          >
            <Text style={styles.emptyButtonText}>Create Task</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <FlatList
        data={filteredTasks}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={renderHeader}
        renderItem={({ item }) => (
          <TaskCard
            task={item}
            onPress={() => handleTaskPress(item)}
            onToggleComplete={() => handleToggleComplete(item.id)}
          />
        )}
        ItemSeparatorComponent={() => <View style={{ height: 4 }} />}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={isLoading} onRefresh={loadTasks} />
        }
      />

      <TaskDetailSheet
        task={selectedTask}
        visible={detailVisible}
        onClose={() => {
          setDetailVisible(false);
          selectTask(null);
        }}
        onUpdate={updateTask}
        onDelete={(id) => {
          deleteTask(id);
          setDetailVisible(false);
          selectTask(null);
        }}
        onToggleComplete={toggleTaskComplete}
        onToggleSubtask={toggleSubtask}
        onAddSubtask={addSubtask}
        onRemoveSubtask={removeSubtask}
        onRemoveAttachment={removeAttachment}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  listContent: { paddingBottom: 40 },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  summaryText: {
    fontSize: 13,
    fontWeight: '500',
  },
  addButton: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 16,
  },
  addButtonText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '700',
  },
  overdueBanner: {
    marginHorizontal: 16,
    marginVertical: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  overdueText: {
    fontSize: 13,
    fontWeight: '600',
  },
  todaySection: {
    marginTop: 8,
  },
  sectionHeader: {
    fontSize: 14,
    fontWeight: '700',
    paddingHorizontal: 16,
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
  },
  emptyButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
  },
  emptyButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
});