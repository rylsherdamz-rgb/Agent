import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  useColorScheme,
  TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../utils/colors';
import { PRIORITY_COLORS, PRIORITY_LABELS } from '../utils/constants';
import type { Task, TaskFilter } from '../types';

interface FilterBarProps {
  filter: TaskFilter;
  onFilterChange: (partial: Partial<TaskFilter>) => void;
  totalTasks: number;
  completedTasks: number;
}

export function FilterBar({
  filter,
  onFilterChange,
  totalTasks,
  completedTasks,
}: FilterBarProps) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const colors = Colors[isDark ? 'dark' : 'light'];

  return (
    <View style={[styles.container, { backgroundColor: colors.background, borderBottomColor: colors.border }]}>
      <View style={[styles.searchRow, { backgroundColor: colors.surfaceVariant }]}>
        <Ionicons name="search-outline" size={18} color={colors.textTertiary} />
        <TextInput
          style={[styles.searchInput, { color: colors.text }]}
          value={filter.search}
          onChangeText={(text) => onFilterChange({ search: text })}
          placeholder="Search tasks..."
          placeholderTextColor={colors.textTertiary}
        />
        {filter.search ? (
          <TouchableOpacity onPress={() => onFilterChange({ search: '' })}>
            <Ionicons name="close-circle" size={18} color={colors.textTertiary} />
          </TouchableOpacity>
        ) : null}
      </View>

      <ScrollableRow>
        <FilterChip
          label={`All (${totalTasks})`}
          active={filter.status === 'all'}
          color={colors.primary}
          onPress={() => onFilterChange({ status: 'all' })}
        />
        <FilterChip
          label={`Pending`}
          active={filter.status === 'pending'}
          color={colors.primary}
          onPress={() => onFilterChange({ status: 'pending' })}
        />
        <FilterChip
          label={`In Progress`}
          active={filter.status === 'in_progress'}
          color={colors.primary}
          onPress={() => onFilterChange({ status: 'in_progress' })}
        />
        <FilterChip
          label={`Done (${completedTasks})`}
          active={filter.showCompleted}
          color={colors.success}
          onPress={() => onFilterChange({ showCompleted: !filter.showCompleted })}
        />
      </ScrollableRow>

      <ScrollableRow>
        <FilterChip
          label="High"
          active={filter.priority === 'high'}
          color={PRIORITY_COLORS.high}
          onPress={() =>
            onFilterChange({
              priority: filter.priority === 'high' ? 'all' : 'high',
            })
          }
        />
        <FilterChip
          label="Urgent"
          active={filter.priority === 'urgent'}
          color={PRIORITY_COLORS.urgent}
          onPress={() =>
            onFilterChange({
              priority: filter.priority === 'urgent' ? 'all' : 'urgent',
            })
          }
        />
        <FilterChip
          label={`Sort: ${filter.sortBy}`}
          active={false}
          color={colors.textSecondary}
          onPress={() => {
            const options: Array<TaskFilter['sortBy']> = [
              'dueDate',
              'priority',
              'createdAt',
              'title',
            ];
            const idx = options.indexOf(filter.sortBy);
            onFilterChange({ sortBy: options[(idx + 1) % options.length] });
          }}
        />
        <FilterChip
          label={filter.sortOrder === 'asc' ? 'Asc' : 'Desc'}
          active={false}
          color={colors.textSecondary}
          onPress={() =>
            onFilterChange({
              sortOrder: filter.sortOrder === 'asc' ? 'desc' : 'asc',
            })
          }
        />
      </ScrollableRow>
    </View>
  );
}

function FilterChip({
  label,
  active,
  color,
  onPress,
}: {
  label: string;
  active: boolean;
  color: string;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      style={[
        styles.chip,
        {
          backgroundColor: active ? color + '20' : 'transparent',
          borderColor: active ? color : 'transparent',
        },
      ]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <Text
        style={[
          styles.chipText,
          { color: active ? color : '#80868B' },
        ]}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );
}

function ScrollableRow({ children }: { children: React.ReactNode }) {
  return (
    <FlatList
      horizontal
      data={[children]}
      renderItem={() => <View style={styles.row}>{children}</View>}
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.rowContent}
    />
  );
}

const styles = StyleSheet.create({
  container: {
    paddingBottom: 8,
    borderBottomWidth: 1,
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginVertical: 8,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    padding: 0,
  },
  row: {
    flexDirection: 'row',
    gap: 8,
  },
  rowContent: {
    paddingHorizontal: 16,
    paddingVertical: 4,
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
  },
  chipText: {
    fontSize: 13,
    fontWeight: '600',
  },
});