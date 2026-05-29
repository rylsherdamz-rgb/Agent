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
import Animated, {
  FadeIn,
  FadeInDown,
  Layout,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../src/utils/colors';
import { useTaskStore } from '../../src/stores/taskStore';
import { FilterBar } from '../../src/components/FilterBar';
import { TaskCard } from '../../src/components/TaskCard';
import { TaskDetailSheet } from '../../src/components/TaskDetailSheet';
import { isToday, formatDate } from '../../src/utils/date';

const AnimatedTouchableOpacity = Animated.createAnimatedComponent(TouchableOpacity);

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
    <Animated.View entering={FadeInDown.duration(600)}>
      <FilterBar
        filter={filter}
        onFilterChange={setFilter}
        totalTasks={tasks.length}
        completedTasks={completedCount}
      />

      {/* Quick Stats Row */}
      <View style={[styles.statsRow, { borderBottomColor: colors.borderLight }]}>
        <View style={[styles.statItem, { backgroundColor: colors.surfaceVariant }]}>
          <Ionicons name="list-outline" size={20} color={colors.primary} />
          <Text style={[styles.statValue, { color: colors.text }]}>
            {filteredTasks.length}
          </Text>
          <Text style={[styles.statLabel, { color: colors.textTertiary }]}>Total</Text>
        </View>
        <View style={[styles.statItem, { backgroundColor: colors.surfaceVariant }]}>
          <Ionicons name="checkmark-circle-outline" size={20} color={colors.success} />
          <Text style={[styles.statValue, { color: colors.text }]}>
            {completedCount}
          </Text>
          <Text style={[styles.statLabel, { color: colors.textTertiary }]}>Done</Text>
        </View>
        <View style={[styles.statItem, { backgroundColor: colors.surfaceVariant }]}>
          <Ionicons name="time-outline" size={20} color={colors.error} />
          <Text style={[styles.statValue, { color: colors.text }]}>
            {overdue.length}
          </Text>
          <Text style={[styles.statLabel, { color: colors.textTertiary }]}>Overdue</Text>
        </View>
        <AnimatedTouchableOpacity
          style={[styles.addButton, { backgroundColor: colors.primary }]}
          onPress={() => addTask({ title: 'New Task' })}
          activeOpacity={0.8}
        >
          <Ionicons name="add" size={24} color="#fff" />
        </AnimatedTouchableOpacity>
      </View>

      {overdue.length > 0 && (
        <Animated.View
          entering={FadeIn.duration(400)}
          style={[styles.overdueBanner, { backgroundColor: colors.error + '12' }]}
        >
          <Ionicons name="alert-circle-outline" size={20} color={colors.error} />
          <Text style={[styles.overdueText, { color: colors.error }]}>
            {overdue.length} overdue task{overdue.length > 1 ? 's' : ''}
          </Text>
        </Animated.View>
      )}

      {dueToday.length > 0 && (
        <Animated.View entering={FadeIn.delay(200).duration(400)} style={styles.todaySection}>
          <View style={styles.sectionHeaderRow}>
            <Ionicons name="today-outline" size={18} color={colors.primary} />
            <Text style={[styles.sectionHeader, { color: colors.text }]}>
              Today
            </Text>
          </View>
          {dueToday.map((task, index) => (
            <Animated.View
              key={task.id}
              entering={FadeInDown.delay(index * 50).duration(300)}
            >
              <TaskCard
                task={task}
                compact
                onPress={() => handleTaskPress(task)}
                onToggleComplete={() => handleToggleComplete(task.id)}
              />
            </Animated.View>
          ))}
        </Animated.View>
      )}
    </Animated.View>
  );

  if (tasks.length === 0 && !isLoading) {
    return (
      <Animated.View
        style={[styles.container, { backgroundColor: colors.background }]}
        entering={FadeIn.duration(600)}
      >
        <View style={styles.emptyState}>
          <View style={[styles.emptyIconContainer, { backgroundColor: colors.primary + '15' }]}>
            <Ionicons name="checkbox-outline" size={64} color={colors.primary} />
          </View>
          <Text style={[styles.emptyTitle, { color: colors.text }]}>No tasks yet</Text>
          <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
            Add your first task or let the AI agent create one for you
          </Text>
          <AnimatedTouchableOpacity
            style={[styles.emptyButton, { backgroundColor: colors.primary }]}
            onPress={() => addTask({ title: 'My First Task' })}
            entering={FadeIn.delay(400).duration(400)}
            activeOpacity={0.8}
          >
            <Ionicons name="add" size={24} color="#fff" />
            <Text style={styles.emptyButtonText}>Create Task</Text>
          </AnimatedTouchableOpacity>
        </View>
      </Animated.View>
    );
  }

  return (
    <Animated.View style={[styles.container, { backgroundColor: colors.background }]}>
      <FlatList
        data={filteredTasks}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={renderHeader}
        renderItem={({ item, index }) => (
          <Animated.View
            entering={FadeInDown.delay(index * 50).duration(300)}
            layout={Layout.springify()}
          >
            <TaskCard
              task={item}
              onPress={() => handleTaskPress(item)}
              onToggleComplete={() => handleToggleComplete(item.id)}
            />
          </Animated.View>
        )}
        ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={isLoading}
            onRefresh={loadTasks}
            tintColor={colors.primary}
          />
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

      {/* Floating Action Button */}
      <AnimatedTouchableOpacity
        style={[styles.fab, { backgroundColor: colors.primary }]}
        onPress={() => addTask({ title: 'New Task' })}
        entering={FadeIn.delay(800).duration(400)}
        activeOpacity={0.8}
      >
        <Ionicons name="add" size={28} color="#fff" />
      </AnimatedTouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  listContent: { paddingBottom: 100 },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
    borderBottomWidth: 1,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 16,
    gap: 4,
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700',
  },
  statLabel: {
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  addButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  overdueBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginHorizontal: 16,
    marginVertical: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
  },
  overdueText: {
    fontSize: 14,
    fontWeight: '600',
    flex: 1,
  },
  todaySection: {
    marginTop: 8,
    paddingHorizontal: 16,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  sectionHeader: {
    fontSize: 16,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
  },
  emptyIconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 12,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 24,
    color: '#80868B',
  },
  emptyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 28,
    paddingVertical: 16,
    borderRadius: 32,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  emptyButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 100,
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
});