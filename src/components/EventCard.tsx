import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  useColorScheme,
} from 'react-native';
import { Colors } from '../utils/colors';
import type { CalendarEvent } from '../types';
import { formatTimeRange } from '../utils/date';

interface EventCardProps {
  event: CalendarEvent;
  onPress: () => void;
  compact?: boolean;
}

export function EventCard({ event, onPress, compact }: EventCardProps) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const colors = Colors[isDark ? 'dark' : 'light'];

  if (compact) {
    return (
      <TouchableOpacity
        style={[styles.compactContainer, { backgroundColor: event.color + '20', borderLeftColor: event.color }]}
        onPress={onPress}
        activeOpacity={0.7}
      >
        <Text
          style={[styles.compactTitle, { color: colors.text }]}
          numberOfLines={1}
        >
          {event.title}
        </Text>
        {!event.isAllDay && (
          <Text
            style={[styles.compactTime, { color: colors.textSecondary }]}
            numberOfLines={1}
          >
            {formatTimeRange(event.startDate, event.endDate)}
          </Text>
        )}
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity
      style={[
        styles.container,
        {
          backgroundColor: colors.surface,
          borderLeftColor: event.color,
          borderColor: colors.borderLight,
        },
      ]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]} numberOfLines={1}>
          {event.title}
        </Text>
        {event.isAllDay ? (
          <Text style={[styles.timeLabel, { color: colors.textSecondary }]}>
            All day
          </Text>
        ) : (
          <Text style={[styles.timeLabel, { color: colors.textSecondary }]}>
            {formatTimeRange(event.startDate, event.endDate)}
          </Text>
        )}
      </View>

      {event.location ? (
        <Text style={[styles.location, { color: colors.textTertiary }]} numberOfLines={1}>
          {event.location}
        </Text>
      ) : null}

      {event.attendees.length > 0 && (
        <Text style={[styles.attendeesText, { color: colors.textSecondary }]}>
          {event.attendees.length} attendee{event.attendees.length > 1 ? 's' : ''}
        </Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 10,
    padding: 12,
    marginVertical: 3,
    borderWidth: 1,
    borderLeftWidth: 4,
  },
  compactContainer: {
    borderRadius: 6,
    padding: 6,
    paddingLeft: 8,
    marginVertical: 1,
    borderLeftWidth: 3,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontSize: 14,
    fontWeight: '600',
    flex: 1,
    marginRight: 8,
  },
  compactTitle: {
    fontSize: 12,
    fontWeight: '600',
  },
  compactTime: {
    fontSize: 10,
    marginTop: 1,
  },
  timeLabel: {
    fontSize: 12,
    fontWeight: '500',
  },
  location: {
    fontSize: 12,
    marginTop: 4,
  },
  attendeesText: {
    fontSize: 12,
    marginTop: 2,
  },
});