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
import {
  getMonthGrid,
  isSameDay,
  isToday,
  isSameMonth,
  format,
} from '../utils/date';

interface CalendarMonthViewProps {
  date: Date;
  events: CalendarEvent[];
  onDatePress: (date: Date) => void;
  onEventPress: (event: CalendarEvent) => void;
  firstDayOfWeek?: 0 | 1;
}

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export function CalendarMonthView({
  date,
  events,
  onDatePress,
  onEventPress,
  firstDayOfWeek = 0,
}: CalendarMonthViewProps) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const colors = Colors[isDark ? 'dark' : 'light'];
  const weeks = getMonthGrid(date, firstDayOfWeek);

  const dayNames = firstDayOfWeek === 1
    ? [...DAY_NAMES.slice(1), DAY_NAMES[0]]
    : DAY_NAMES;

  return (
    <View style={styles.container}>
      <View style={[styles.dayHeaderRow, { borderBottomColor: colors.border }]}>
        {dayNames.map((name) => (
          <View key={name} style={styles.dayHeaderCell}>
            <Text style={[styles.dayHeaderText, { color: colors.textTertiary }]}>
              {name}
            </Text>
          </View>
        ))}
      </View>

      {weeks.map((week, wi) => (
        <View key={wi} style={styles.weekRow}>
          {week.map((day, di) => {
            if (!day) {
              return <View key={`empty-${di}`} style={styles.dayCell} />;
            }

            const dayEvents = events.filter((e) =>
              isSameDay(new Date(e.startDate), day)
            );
            const isCurrentMonth = isSameMonth(day, date);
            const isTodayDate = isToday(day);

            return (
              <TouchableOpacity
                key={day.toISOString()}
                style={[
                  styles.dayCell,
                  isTodayDate && { backgroundColor: colors.primary + '12' },
                ]}
                onPress={() => onDatePress(day)}
                activeOpacity={0.6}
              >
                <Text
                  style={[
                    styles.dayNumber,
                    {
                      color: isTodayDate
                        ? colors.primary
                        : isCurrentMonth
                          ? colors.text
                          : colors.textTertiary,
                    },
                    isTodayDate && styles.todayNumber,
                  ]}
                >
                  {format(day, 'd')}
                </Text>

                {dayEvents.slice(0, 3).map((event) => (
                  <TouchableOpacity
                    key={event.id}
                    style={[
                      styles.dotEvent,
                      { backgroundColor: event.color + '25', borderLeftColor: event.color },
                    ]}
                    onPress={() => onEventPress(event)}
                  >
                    <Text
                      style={[styles.dotEventText, { color: colors.text }]}
                      numberOfLines={1}
                    >
                      {event.isAllDay ? '' : format(new Date(event.startDate), 'h:mm ')}
                      {event.title}
                    </Text>
                  </TouchableOpacity>
                ))}

                {dayEvents.length > 3 && (
                  <Text style={[styles.moreText, { color: colors.textTertiary }]}>
                    +{dayEvents.length - 3} more
                  </Text>
                )}
              </TouchableOpacity>
            );
          })}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  dayHeaderRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    paddingBottom: 8,
    marginBottom: 4,
  },
  dayHeaderCell: {
    flex: 1,
    alignItems: 'center',
  },
  dayHeaderText: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  weekRow: {
    flexDirection: 'row',
    minHeight: 80,
  },
  dayCell: {
    flex: 1,
    padding: 3,
    minHeight: 80,
  },
  dayNumber: {
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
    marginBottom: 2,
  },
  todayNumber: {
    fontWeight: '700',
  },
  dotEvent: {
    borderRadius: 4,
    paddingHorizontal: 4,
    paddingVertical: 2,
    marginVertical: 1,
    borderLeftWidth: 3,
  },
  dotEventText: {
    fontSize: 10,
    fontWeight: '500',
  },
  moreText: {
    fontSize: 10,
    fontWeight: '500',
    paddingLeft: 4,
    marginTop: 2,
  },
});