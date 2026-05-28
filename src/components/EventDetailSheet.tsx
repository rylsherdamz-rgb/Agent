import React, { useState, useEffect } from 'react';
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
import type { CalendarEvent } from '../types';
import { formatDate } from '../utils/date';

interface EventDetailSheetProps {
  event: CalendarEvent | null;
  visible: boolean;
  isNew: boolean;
  onClose: () => void;
  onCreate: (event: Partial<CalendarEvent>) => void;
  onUpdate: (id: string, changes: Partial<CalendarEvent>) => void;
  onDelete: (id: string) => void;
}

export function EventDetailSheet({
  event,
  visible,
  isNew,
  onClose,
  onCreate,
  onUpdate,
  onDelete,
}: EventDetailSheetProps) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const colors = Colors[isDark ? 'dark' : 'light'];

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [isAllDay, setIsAllDay] = useState(false);

  useEffect(() => {
    if (visible && event && !isNew) {
      setTitle(event.title);
      setDescription(event.description);
      setLocation(event.location);
      setStartDate(formatDate(event.startDate, 'yyyy-MM-dd\'T\'HH:mm'));
      setEndDate(formatDate(event.endDate, 'yyyy-MM-dd\'T\'HH:mm'));
      setIsAllDay(event.isAllDay);
    } else if (visible && isNew) {
      const now = new Date();
      const oneHour = new Date(now.getTime() + 3600000);
      setTitle('');
      setDescription('');
      setLocation('');
      setStartDate(formatDate(now, 'yyyy-MM-dd\'T\'HH:mm'));
      setEndDate(formatDate(oneHour, 'yyyy-MM-dd\'T\'HH:mm'));
      setIsAllDay(false);
    }
  }, [visible, event, isNew]);

  const handleSave = () => {
    if (!title.trim()) return;

    const startMs = startDate ? new Date(startDate).getTime() : Date.now();
    const endMs = endDate ? new Date(endDate).getTime() : startMs + 3600000;

    if (isNew) {
      onCreate({
        title: title.trim(),
        description: description.trim(),
        location: location.trim(),
        startDate: startMs,
        endDate: endMs,
        isAllDay,
        calendar: 'personal',
      });
    } else if (event) {
      onUpdate(event.id, {
        title: title.trim(),
        description: description.trim(),
        location: location.trim(),
        startDate: startMs,
        endDate: endMs,
        isAllDay,
      });
    }
    onClose();
  };

  const handleSetTodayDate = (hours: number) => {
    const d = new Date();
    d.setHours(hours, 0, 0, 0);
    const dStr = formatDate(d, 'yyyy-MM-dd\'T\'HH:mm');
    if (isNew) {
      setStartDate(dStr);
      const end = new Date(d.getTime() + 3600000);
      setEndDate(formatDate(end, 'yyyy-MM-dd\'T\'HH:mm'));
    }
  };

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
            <Text style={[styles.headerBtn, { color: colors.textSecondary }]}>Cancel</Text>
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.text }]}>
            {isNew ? 'New Event' : 'Edit Event'}
          </Text>
          <View style={styles.headerRight}>
            {!isNew && event && (
              <TouchableOpacity onPress={() => { onDelete(event.id); onClose(); }}>
                <Text style={[styles.headerBtn, { color: colors.error }]}>Delete</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity onPress={handleSave} style={{ marginLeft: 12 }}>
              <Text style={[styles.headerBtn, { color: colors.primary, fontWeight: '700' }]}>Save</Text>
            </TouchableOpacity>
          </View>
        </View>

        <ScrollView style={styles.content} contentContainerStyle={styles.contentInner}>
          <TextInput
            style={[styles.titleInput, { color: colors.text, borderColor: colors.border }]}
            value={title}
            onChangeText={setTitle}
            placeholder="Event title"
            placeholderTextColor={colors.textTertiary}
            multiline
          />

          <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>Details</Text>

          <TextInput
            style={[styles.fieldInput, { color: colors.text, borderColor: colors.border }]}
            value={description}
            onChangeText={setDescription}
            placeholder="Add description..."
            placeholderTextColor={colors.textTertiary}
            multiline
          />

          <TextInput
            style={[styles.fieldInput, { color: colors.text, borderColor: colors.border }]}
            value={location}
            onChangeText={setLocation}
            placeholder="Location"
            placeholderTextColor={colors.textTertiary}
          />

          <View style={styles.toggleRow}>
            <Text style={[styles.toggleLabel, { color: colors.text }]}>All-day</Text>
            <Switch
              value={isAllDay}
              onValueChange={setIsAllDay}
              trackColor={{ false: colors.surfaceVariant, true: colors.primary + '60' }}
              thumbColor={isAllDay ? colors.primary : colors.textTertiary}
            />
          </View>

          <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>Time</Text>

          <View style={styles.dateRow}>
            <Text style={[styles.dateLabel, { color: colors.textSecondary }]}>Starts</Text>
            <TextInput
              style={[styles.dateInput, { color: colors.text, borderColor: colors.border }]}
              value={startDate}
              onChangeText={setStartDate}
              placeholder="yyyy-MM-ddTHH:mm"
              placeholderTextColor={colors.textTertiary}
            />
          </View>

          <View style={styles.dateRow}>
            <Text style={[styles.dateLabel, { color: colors.textSecondary }]}>Ends</Text>
            <TextInput
              style={[styles.dateInput, { color: colors.text, borderColor: colors.border }]}
              value={endDate}
              onChangeText={setEndDate}
              placeholder="yyyy-MM-ddTHH:mm"
              placeholderTextColor={colors.textTertiary}
            />
          </View>

          <View style={styles.quickDates}>
            <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>Quick Set</Text>
            {[
              { label: '9:00 AM Today', hours: 9 },
              { label: '12:00 PM Today', hours: 12 },
              { label: '3:00 PM Today', hours: 15 },
              { label: '6:00 PM Today', hours: 18 },
            ].map((opt) => (
              <TouchableOpacity
                key={opt.label}
                style={[styles.quickDateChip, { backgroundColor: colors.surfaceVariant }]}
                onPress={() => handleSetTodayDate(opt.hours)}
              >
                <Text style={[styles.quickDateText, { color: colors.textSecondary }]}>
                  {opt.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
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
  headerBtn: { fontSize: 16, fontWeight: '500' },
  headerTitle: { fontSize: 17, fontWeight: '700' },
  headerRight: { flexDirection: 'row', alignItems: 'center' },
  content: { flex: 1 },
  contentInner: { padding: 16, paddingBottom: 40 },
  titleInput: {
    fontSize: 20,
    fontWeight: '700',
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    textTransform: 'uppercase',
    marginBottom: 8,
    marginTop: 4,
    letterSpacing: 0.5,
  },
  fieldInput: {
    fontSize: 15,
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
    marginBottom: 12,
  },
  toggleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    marginBottom: 12,
  },
  toggleLabel: { fontSize: 15, fontWeight: '500' },
  dateRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  dateLabel: { fontSize: 14, fontWeight: '500', width: 60 },
  dateInput: {
    flex: 1,
    fontSize: 14,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    marginLeft: 8,
  },
  quickDates: {
    marginTop: 8,
  },
  quickDateChip: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
    marginBottom: 6,
  },
  quickDateText: { fontSize: 14, fontWeight: '500' },
});