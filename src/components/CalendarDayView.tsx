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
import { getHours, getMinutes, format, isSameDay, isToday } from '../utils/date';

interface CalendarDayViewProps {
  date: Date;
  events: CalendarEvent[];
  onEventPress: (event: CalendarEvent) => void;
}

const HOUR_HEIGHT = 60;
const HOURS = Array.from({ length: 24 }, (_, i) => i);

export function CalendarDayView({ date, events, onEventPress }: CalendarDayViewProps) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const colors = Colors[isDark ? 'dark' : 'light'];

  const now = new Date();
  const currentMinutes = getHours(now) * 60 + getMinutes(now);
  const showNowLine = isSameDay(date, now);

  const dayEvents = events.filter((e) =>
    isSameDay(new Date(e.startDate), date) && !e.isAllDay
  );

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scroll}
        showsVerticalScrollIndicator={false}
        contentOffset={{ x: 0, y: currentMinutes * (HOUR_HEIGHT / 60) - 100 }}
      >
        <View style={styles.timeline}>
          {HOURS.map((hour) => (
            <View
              key={hour}
              style={[styles.hourRow, { borderTopColor: colors.borderLight }]}
            >
              <View style={styles.hourLabel}>
                <Text style={[styles.hourText, { color: colors.textTertiary }]}>
                  {hour === 0 ? '' : format(new Date().setHours(hour, 0, 0), 'h a')}
                </Text>
              </View>
              <View style={styles.hourContent}>
                {dayEvents
                  .filter((e) => {
                    const startH = getHours(new Date(e.startDate));
                    const endH = getHours(new Date(e.endDate));
                    return hour >= startH && hour <= endH;
                  })
                  .map((event) => {
                    const startH = getHours(new Date(event.startDate));
                    const startM = getMinutes(new Date(event.startDate));
                    const endH = getHours(new Date(event.endDate));
                    const endM = getMinutes(new Date(event.endDate));

                    const top = startH === hour ? (startM / 60) * HOUR_HEIGHT : 0;
                    const height =
                      startH === hour
                        ? ((endH - startH) * 60 + (endM - startM)) * (HOUR_HEIGHT / 60)
                        : HOUR_HEIGHT;

                    return (
                      <View
                        key={event.id}
                        style={[
                          styles.eventBlock,
                          {
                            backgroundColor: event.color + '30',
                            borderLeftColor: event.color,
                            top,
                            height: Math.max(height, 24),
                          },
                        ]}
                      >
                        <Text
                          style={[styles.eventTitle, { color: colors.text }]}
                          numberOfLines={2}
                        >
                          {event.title}
                        </Text>
                        <Text style={[styles.eventTime, { color: colors.textSecondary }]}>
                          {format(new Date(event.startDate), 'h:mm a')} -{' '}
                          {format(new Date(event.endDate), 'h:mm a')}
                        </Text>
                      </View>
                    );
                  })}
              </View>
            </View>
          ))}
        </View>

        {showNowLine && (
          <View
            style={[
              styles.nowLine,
              {
                top: (currentMinutes / 60) * HOUR_HEIGHT,
                borderTopColor: colors.error,
              },
            ]}
          >
            <View style={[styles.nowDot, { backgroundColor: colors.error }]} />
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { flex: 1 },
  timeline: { position: 'relative' },
  hourRow: {
    flexDirection: 'row',
    height: HOUR_HEIGHT,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  hourLabel: {
    width: 56,
    alignItems: 'flex-end',
    paddingRight: 8,
    paddingTop: 2,
  },
  hourText: {
    fontSize: 11,
    fontWeight: '500',
  },
  hourContent: {
    flex: 1,
    position: 'relative',
  },
  eventBlock: {
    position: 'absolute',
    left: 4,
    right: 4,
    borderRadius: 6,
    padding: 4,
    borderLeftWidth: 3,
    overflow: 'hidden',
  },
  eventTitle: {
    fontSize: 12,
    fontWeight: '600',
  },
  eventTime: {
    fontSize: 10,
    marginTop: 1,
  },
  nowLine: {
    position: 'absolute',
    left: 56,
    right: 0,
    borderTopWidth: 2,
    zIndex: 10,
  },
  nowDot: {
    position: 'absolute',
    left: -4,
    top: -5,
    width: 10,
    height: 10,
    borderRadius: 5,
  },
});