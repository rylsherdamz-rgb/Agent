import { create } from 'zustand';
import { EventDB } from '../services/database';
import { scheduleEventReminder, cancelReminder } from '../services/notificationService';
import { v4 as uuid } from 'uuid';
import type { CalendarEvent, Attachment, Attendee, CalendarViewMode } from '../types';
import { startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from '../utils/date';

interface CalendarStore {
  events: CalendarEvent[];
  isLoading: boolean;
  viewMode: CalendarViewMode;
  currentDate: Date;
  selectedEvent: CalendarEvent | null;
  error: string | null;

  loadEvents: (start: number, end: number) => Promise<void>;
  loadEventsForView: () => Promise<void>;
  addEvent: (event: Partial<CalendarEvent>) => Promise<CalendarEvent>;
  updateEvent: (id: string, changes: Partial<CalendarEvent>) => Promise<void>;
  deleteEvent: (id: string) => Promise<void>;
  setViewMode: (mode: CalendarViewMode) => void;
  setCurrentDate: (date: Date) => void;
  selectEvent: (event: CalendarEvent | null) => void;
  getEventsForDate: (date: Date) => CalendarEvent[];
}

export const useCalendarStore = create<CalendarStore>((set, get) => ({
  events: [],
  isLoading: false,
  viewMode: 'month',
  currentDate: new Date(),
  selectedEvent: null,
  error: null,

  loadEvents: async (start, end) => {
    set({ isLoading: true, error: null });
    try {
      const events = await EventDB.getBetween(start, end);
      set({ events, isLoading: false });
    } catch (err) {
      set({ error: (err as Error).message, isLoading: false });
    }
  },

  loadEventsForView: async () => {
    const { currentDate, viewMode } = get();
    let start: number;
    let end: number;

    switch (viewMode) {
      case 'day':
        start = startOfDay(currentDate).getTime();
        end = endOfDay(currentDate).getTime();
        break;
      case 'week':
        start = startOfWeek(currentDate).getTime();
        end = endOfWeek(currentDate).getTime();
        break;
      case 'month':
        start = startOfMonth(currentDate).getTime();
        end = endOfMonth(currentDate).getTime();
        break;
      case 'agenda':
        start = startOfMonth(currentDate).getTime();
        end = endOfMonth(new Date(currentDate.getFullYear(), currentDate.getMonth() + 3, 0)).getTime();
        break;
    }

    await get().loadEvents(start, end);
  },

  addEvent: async (partial) => {
    const now = Date.now();
    const event: CalendarEvent = {
      id: uuid(),
      title: partial.title || 'New Event',
      description: partial.description || '',
      location: partial.location || '',
      startDate: partial.startDate || now,
      endDate: partial.endDate || now + 3600000,
      isAllDay: partial.isAllDay || false,
      recurrenceRule: partial.recurrenceRule || null,
      reminders: partial.reminders || [15],
      calendar: partial.calendar || 'personal',
      googleEventId: partial.googleEventId || null,
      color: partial.color || '#4285F4',
      attachments: partial.attachments || [],
      attendees: partial.attendees || [],
      createdAt: now,
      updatedAt: now,
    };

    await EventDB.create(event);
    await scheduleEventReminder(event);

    set((state) => ({ events: [...state.events, event] }));
    return event;
  },

  updateEvent: async (id, changes) => {
    const event = get().events.find((e) => e.id === id);
    if (!event) return;

    const updated = { ...event, ...changes, updatedAt: Date.now() };
    await EventDB.update(updated);

    set((state) => ({
      events: state.events.map((e) => (e.id === id ? updated : e)),
      selectedEvent: state.selectedEvent?.id === id ? updated : state.selectedEvent,
    }));
  },

  deleteEvent: async (id) => {
    await EventDB.delete(id);
    set((state) => ({
      events: state.events.filter((e) => e.id !== id),
      selectedEvent: state.selectedEvent?.id === id ? null : state.selectedEvent,
    }));
  },

  setViewMode: (mode) => set({ viewMode: mode }),
  setCurrentDate: (date) => set({ currentDate: date }),
  selectEvent: (event) => set({ selectedEvent: event }),

  getEventsForDate: (date) => {
    const dayStart = startOfDay(date).getTime();
    const dayEnd = endOfDay(date).getTime();

    return get().events.filter(
      (e) => e.startDate < dayEnd && e.endDate > dayStart
    );
  },
}));