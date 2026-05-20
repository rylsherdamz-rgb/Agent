import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  useColorScheme,
} from 'react-native';
import { Colors } from '../utils/colors';
import type { CalendarEvent } from '../types';
import {
  getWeekDays,
  isSameDay,
  isToday,
  format,
  getHours,
  getMinutes,
} from '../utils/date';
import { EventCard } from './EventCard';

interface CalendarWeekViewProps {
  date: Date;
  events: CalendarEvent[];
  onEventPress: (event: CalendarEvent) => void;
  firstDayOfWeek?: 0 | 1;
}

const HOUR_HEIGHT = 48;
const HOURS = Array.from({ length: 24 }, (_, i) => i);
const DAY_WIDTH = 80;

export function CalendarWeekView({
  date,
  events,
  onEventPress,
  firstDayOfWeek = 0,
}: CalendarWeekViewProps) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const colors = Colors[isDark ? 'dark' : 'light'];
  const days = getWeekDays(date, firstDayOfWeek);
  const now = new Date();
  const currentMinutes = getHours(now) * 60 + getMinutes(now);

  return (
    <ScrollView style={styles.container}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View>
          <View style={[styles.header, { borderBottomColor: colors.border }]}>
            <View style={styles.timeGutter} />
            {days.map((day) => (
              <View
                key={day.toISOString()}
                style={[
                  styles.dayHeader,
                  isToday(day) && { backgroundColor: colors.primary + '15' },
                ]}
              >
                <Text style={[styles.dayName, { color: colors.textSecondary }]}>
                  {format(day, 'EEE')}
                </Text>
                <Text
                  style={[
                    styles.dayNumber,
                    { color: isToday(day) ? colors.primary : colors.text },
                  ]}
                >
                  {format(day, 'd')}
                </Text>
                {events
                  .filter((e) => isSameDay(new Date(e.startDate), day) && e.isAllDay)
                  .map((event) => (
                    <View
                      key={event.id}
                      style={[
                        styles.allDayEvent,
                        { backgroundColor: event.color + '30' },
                      ]}
                    >
                      <Text style={[styles.allDayText, { color: event.color }]} numberOfLines={1}>
                        {event.title}
                      </Text>
                    </View>
                  ))}
              </View>
            ))}
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            <View>
              {HOURS.map((hour) => (
                <View
                  key={hour}
                  style={[
                    styles.hourRow,
                    { borderTopColor: colors.borderLight },
                  ]}
                >
                  <View style={styles.timeGutter}>
                    <Text style={[styles.hourLabel, { color: colors.textTertiary }]}>
                      {hour === 0 ? '' : format(new Date().setHours(hour, 0), 'h a')}
                    </Text>
                  </View>
                  {days.map((day) => (
                    <View
                      key={day.toISOString()}
                      style={[
                        styles.dayCell,
                        { borderLeftColor: colors.borderLight },
                      ]}
                    >
                      {events
                        .filter(
                          (e) =>
                            isSameDay(new Date(e.startDate), day) &&
                            !e.isAllDay &&
                            getHours(new Date(e.startDate)) === hour
                        )
                        .map((event) => {
                          const height =
                            ((getHours(new Date(event.endDate)) - getHours(new Date(event.startDate))) * 60 +
                              (getMinutes(new Date(event.endDate)) - getMinutes(new Date(event.startDate)))) *
                            (HOUR_HEIGHT / 60);

                          return (
                            <View
                              key={event.id}
                              style={[
                                styles.eventBlock,
                                {
                                  backgroundColor: event.color + '40',
                                  borderLeftColor: event.color,
                                  height: Math.max(height, 20),
                                },
                              ]}
                            >
                              <Text
                                style={[styles.eventTitle, { color: colors.text }]}
                                numberOfLines={2}
                              >
                                {event.title}
                              </Text>
                            </View>
                          );
                        })}
                    </View>
                  ))}
                </View>
              ))}
            </View>
          </ScrollView>
        </View>
      </ScrollView>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    borderBottomWidth: 1,
  },
  timeGutter: {
    width: 56,
    paddingRight: 8,
    alignItems: 'flex-end',
    justifyContent: 'flex-start',
    paddingTop: 4,
  },
  dayHeader: {
    width: DAY_WIDTH,
    alignItems: 'center',
    paddingVertical: 8,
    borderRadius: 8,
    marginBottom: 4,
  },
  dayName: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  dayNumber: {
    fontSize: 22,
    fontWeight: '300',
    marginTop: 2,
  },
  allDayEvent: {
    marginTop: 2,
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 4,
    width: DAY_WIDTH - 8,
  },
  allDayText: {
    fontSize: 10,
    fontWeight: '500',
  },
  hourRow: {
    flexDirection: 'row',
    height: HOUR_HEIGHT,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  hourLabel: {
    fontSize: 11,
    fontWeight: '500',
    marginTop: -7,
  },
  dayCell: {
    width: DAY_WIDTH,
    height: HOUR_HEIGHT,
    borderLeftWidth: StyleSheet.hairlineWidth,
    position: 'relative',
  },
  eventBlock: {
    position: 'absolute',
    left: 1,
    right: 1,
    borderRadius: 4,
    padding: 2,
    borderLeftWidth: 3,
    zIndex: 2,
    overflow: 'hidden',
  },
  eventTitle: {
    fontSize: 10,
    fontWeight: '600',
  },
});