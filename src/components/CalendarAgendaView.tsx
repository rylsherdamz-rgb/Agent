import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  useColorScheme,
} from 'react-native';
import { Colors } from '../utils/colors';
import type { CalendarEvent } from '../types';
import { isSameDay, formatDate } from '../utils/date';
import { EventCard } from './EventCard';

interface CalendarAgendaViewProps {
  events: CalendarEvent[];
  onEventPress: (event: CalendarEvent) => void;
}

export function CalendarAgendaView({ events, onEventPress }: CalendarAgendaViewProps) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const colors = Colors[isDark ? 'dark' : 'light'];

  const grouped = events.reduce<Record<string, CalendarEvent[]>>((acc, event) => {
    const dateKey = new Date(event.startDate).toDateString();
    if (!acc[dateKey]) acc[dateKey] = [];
    acc[dateKey].push(event);
    return acc;
  }, {});

  const sorted = Object.entries(grouped).sort(
    ([a], [b]) => new Date(a).getTime() - new Date(b).getTime()
  );

  if (events.length === 0) {
    return (
      <View style={styles.empty}>
        <Text style={[styles.emptyText, { color: colors.textTertiary }]}>No events</Text>
      </View>
    );
  }

  return (
    <FlatList
      data={sorted}
      keyExtractor={([date]) => date}
      renderItem={({ item: [dateStr, dayEvents] }) => (
        <View style={styles.dayGroup}>
          <Text style={[styles.dateHeader, { color: colors.text }]}>
            {formatDate(new Date(dateStr), 'EEEE, MMMM d')}
          </Text>
          {dayEvents.map((event) => (
            <EventCard
              key={event.id}
              event={event}
              onPress={() => onEventPress(event)}
            />
          ))}
        </View>
      )}
      contentContainerStyle={styles.list}
    />
  );
}

const styles = StyleSheet.create({
  list: { paddingBottom: 40 },
  dayGroup: { marginBottom: 16 },
  dateHeader: {
    fontSize: 16,
    fontWeight: '700',
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyText: { fontSize: 16 },
});