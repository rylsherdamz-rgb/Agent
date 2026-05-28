import React, { useEffect, useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  useColorScheme,
} from 'react-native';
import { Colors } from '../../src/utils/colors';
import { useCalendarStore } from '../../src/stores/calendarStore';
import { CalendarAgendaView } from '../../src/components/CalendarAgendaView';
import { CalendarDayView } from '../../src/components/CalendarDayView';
import { CalendarWeekView } from '../../src/components/CalendarWeekView';
import { CalendarMonthView } from '../../src/components/CalendarMonthView';
import { EventDetailSheet } from '../../src/components/EventDetailSheet';
import { format, addMonths, subMonths, addWeeks, subWeeks, addDays, subDays } from '../../src/utils/date';
import type { CalendarViewMode, CalendarEvent } from '../../src/types';

export default function CalendarScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const colors = Colors[isDark ? 'dark' : 'light'];

  const {
    events,
    isLoading,
    viewMode,
    currentDate,
    loadEventsForView,
    addEvent,
    updateEvent,
    deleteEvent,
    setViewMode,
    setCurrentDate,
  } = useCalendarStore();

  const [sheetVisible, setSheetVisible] = useState(false);
  const [isNewEvent, setIsNewEvent] = useState(true);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);

  useEffect(() => {
    loadEventsForView();
  }, [viewMode, currentDate]);

  const navigateBack = useCallback(() => {
    switch (viewMode) {
      case 'day':
        setCurrentDate(subDays(currentDate, 1));
        break;
      case 'week':
        setCurrentDate(subWeeks(currentDate, 1));
        break;
      case 'month':
      case 'agenda':
        setCurrentDate(subMonths(currentDate, 1));
        break;
    }
  }, [viewMode, currentDate]);

  const navigateForward = useCallback(() => {
    switch (viewMode) {
      case 'day':
        setCurrentDate(addDays(currentDate, 1));
        break;
      case 'week':
        setCurrentDate(addWeeks(currentDate, 1));
        break;
      case 'month':
      case 'agenda':
        setCurrentDate(addMonths(currentDate, 1));
        break;
    }
  }, [viewMode, currentDate]);

  const goToToday = useCallback(() => {
    setCurrentDate(new Date());
  }, []);

  const handleAddEvent = useCallback(() => {
    setIsNewEvent(true);
    setSelectedEvent(null);
    setSheetVisible(true);
  }, []);

  const handleEventPress = useCallback((event: CalendarEvent) => {
    setIsNewEvent(false);
    setSelectedEvent(event);
    setSheetVisible(true);
  }, []);

  const handleCreateEvent = useCallback(async (partial: Partial<CalendarEvent>) => {
    await addEvent(partial);
    loadEventsForView();
  }, [addEvent, loadEventsForView]);

  const handleUpdateEvent = useCallback(async (id: string, changes: Partial<CalendarEvent>) => {
    await updateEvent(id, changes);
    loadEventsForView();
  }, [updateEvent, loadEventsForView]);

  const handleDeleteEvent = useCallback(async (id: string) => {
    await deleteEvent(id);
    loadEventsForView();
  }, [deleteEvent, loadEventsForView]);

  const views: { key: CalendarViewMode; label: string }[] = [
    { key: 'month', label: 'Month' },
    { key: 'week', label: 'Week' },
    { key: 'day', label: 'Day' },
    { key: 'agenda', label: 'Agenda' },
  ];

  const dateLabel =
    viewMode === 'day'
      ? format(currentDate, 'EEEE, MMMM d, yyyy')
      : viewMode === 'week'
        ? `Week of ${format(currentDate, 'MMM d')}`
        : format(currentDate, 'MMMM yyyy');

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <View style={styles.navRow}>
          <TouchableOpacity onPress={navigateBack} style={styles.navButton}>
            <Text style={[styles.navArrow, { color: colors.text }]}>{'<'}</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={goToToday}>
            <Text style={[styles.dateLabel, { color: colors.text }]}>
              {dateLabel}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={navigateForward} style={styles.navButton}>
            <Text style={[styles.navArrow, { color: colors.text }]}>{'>'}</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.viewRow}>
          {views.map((v) => (
            <TouchableOpacity
              key={v.key}
              style={[
                styles.viewChip,
                {
                  backgroundColor:
                    viewMode === v.key ? colors.primary : 'transparent',
                  borderColor: viewMode === v.key ? colors.primary : colors.border,
                },
              ]}
              onPress={() => setViewMode(v.key)}
            >
              <Text
                style={[
                  styles.viewChipText,
                  { color: viewMode === v.key ? '#fff' : colors.textSecondary },
                ]}
              >
                {v.label}
              </Text>
            </TouchableOpacity>
          ))}

          <TouchableOpacity
            style={[styles.addEventBtn, { backgroundColor: colors.primary }]}
            onPress={handleAddEvent}
          >
            <Text style={styles.addEventBtnText}>+</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.calendarContainer}>
        {viewMode === 'day' && (
          <CalendarDayView
            date={currentDate}
            events={events}
            onEventPress={handleEventPress}
          />
        )}
        {viewMode === 'week' && (
          <CalendarWeekView
            date={currentDate}
            events={events}
            onEventPress={handleEventPress}
          />
        )}
        {viewMode === 'month' && (
          <CalendarMonthView
            date={currentDate}
            events={events}
            onDatePress={(date) => {
              setCurrentDate(date);
              setViewMode('day');
            }}
            onEventPress={handleEventPress}
          />
        )}
        {viewMode === 'agenda' && (
          <CalendarAgendaView
            events={events}
            onEventPress={handleEventPress}
          />
        )}
      </View>

      <EventDetailSheet
        event={selectedEvent}
        visible={sheetVisible}
        isNew={isNewEvent}
        onClose={() => {
          setSheetVisible(false);
          setSelectedEvent(null);
        }}
        onCreate={handleCreateEvent}
        onUpdate={handleUpdateEvent}
        onDelete={handleDeleteEvent}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  navRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  navButton: {
    padding: 4,
  },
  navArrow: {
    fontSize: 20,
    fontWeight: '600',
  },
  dateLabel: {
    fontSize: 17,
    fontWeight: '700',
  },
  viewRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  viewChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
  },
  viewChipText: {
    fontSize: 13,
    fontWeight: '600',
  },
  addEventBtn: {
    marginLeft: 'auto',
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addEventBtnText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
    lineHeight: 20,
  },
  calendarContainer: { flex: 1 },
});