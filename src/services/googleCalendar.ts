import * as Calendar from 'expo-calendar';
import { AuthStorage } from './storage';
import { EventDB } from './database';
import { v4 as uuid } from 'uuid';
import type { CalendarEvent } from '../types';

async function getGoogleCalendarId(): Promise<string | null> {
  const tokens = AuthStorage.getTokens();
  const accessToken = tokens['google_access_token'];
  if (!accessToken) return null;

  try {
    const response = await fetch(
      'https://www.googleapis.com/calendar/v3/users/me/calendarList?minAccessRole=writer',
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      }
    );
    const data = await response.json();
    const primaryCalendar = data.items?.find((cal: { primary?: boolean }) => cal.primary);
    return primaryCalendar?.id || null;
  } catch {
    return null;
  }
}

export async function syncGoogleCalendar(): Promise<{ synced: number; error: string | null }> {
  const tokens = AuthStorage.getTokens();
  const accessToken = tokens['google_access_token'];
  if (!accessToken) return { synced: 0, error: 'Not authenticated' };

  try {
    const calendarId = await getGoogleCalendarId();
    if (!calendarId) return { synced: 0, error: 'No writable calendar found' };

    const now = Date.now();
    const thirtyDaysAgo = now - 30 * 24 * 60 * 60 * 1000;
    const sixtyDaysAhead = now + 60 * 24 * 60 * 60 * 1000;

    const response = await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events?` +
      `timeMin=${new Date(thirtyDaysAgo).toISOString()}&` +
      `timeMax=${new Date(sixtyDaysAhead).toISOString()}&` +
      `singleEvents=true&orderBy=startTime&maxResults=250`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      if (response.status === 401) {
        AuthStorage.removeToken('google_access_token');
        return { synced: 0, error: 'Token expired' };
      }
      return { synced: 0, error: `HTTP ${response.status}` };
    }

    const data = await response.json();
    let synced = 0;

    for (const googleEvent of data.items || []) {
      if (googleEvent.status === 'cancelled') continue;

      const startDate = googleEvent.start?.dateTime
        ? new Date(googleEvent.start.dateTime).getTime()
        : googleEvent.start?.date
          ? new Date(googleEvent.start.date).getTime()
          : Date.now();

      const endDate = googleEvent.end?.dateTime
        ? new Date(googleEvent.end.dateTime).getTime()
        : googleEvent.end?.date
          ? new Date(googleEvent.end.date).getTime()
          : startDate + 3600000;

      const existing = await EventDB.getById(googleEvent.id);

      const event: CalendarEvent = {
        id: googleEvent.id,
        title: googleEvent.summary || 'Untitled',
        description: googleEvent.description || '',
        location: googleEvent.location || '',
        startDate,
        endDate,
        isAllDay: !googleEvent.start?.dateTime,
        recurrenceRule: googleEvent.recurrence?.[0] || null,
        reminders: (googleEvent.reminders?.overrides || []).map(
          (r: { method: string; minutes: number }) => r.minutes
        ),
        calendar: 'google',
        googleEventId: googleEvent.id,
        color: googleEvent.colorId ? `#${googleEvent.colorId}` : '#4285F4',
        attachments: existing?.attachments || [],
        attendees: (googleEvent.attendees || []).map(
          (a: { email: string; displayName?: string; responseStatus?: string }) => ({
            id: uuid(),
            name: a.displayName || a.email,
            email: a.email,
            status: mapGoogleStatus(a.responseStatus || 'needsAction'),
          })
        ),
        createdAt: existing?.createdAt || Date.now(),
        updatedAt: Date.now(),
      };

      await EventDB.create(event);
      synced++;
    }

    return { synced, error: null };
  } catch (err) {
    return { synced: 0, error: (err as Error).message };
  }
}

export async function createGoogleEvent(event: CalendarEvent): Promise<string | null> {
  const tokens = AuthStorage.getTokens();
  const accessToken = tokens['google_access_token'];
  if (!accessToken) return null;

  try {
    const calendarId = await getGoogleCalendarId();
    if (!calendarId) return null;

    const response = await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          summary: event.title,
          description: event.description,
          location: event.location,
          start: event.isAllDay
            ? { date: new Date(event.startDate).toISOString().split('T')[0] }
            : { dateTime: new Date(event.startDate).toISOString() },
          end: event.isAllDay
            ? { date: new Date(event.endDate).toISOString().split('T')[0] }
            : { dateTime: new Date(event.endDate).toISOString() },
          attendees: event.attendees.map(a => ({ email: a.email, displayName: a.name })),
          reminders: {
            useDefault: false,
            overrides: event.reminders.map(m => ({ method: 'popup', minutes: m })),
          },
        }),
      }
    );

    const data = await response.json();
    return data.id || null;
  } catch {
    return null;
  }
}

function mapGoogleStatus(status: string): 'pending' | 'accepted' | 'declined' | 'tentative' {
  switch (status) {
    case 'accepted': return 'accepted';
    case 'declined': return 'declined';
    case 'tentative': return 'tentative';
    default: return 'pending';
  }
}