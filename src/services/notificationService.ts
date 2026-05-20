import * as Notifications from 'expo-notifications';
import * as TaskManager from 'expo-task-manager';
import * as BackgroundFetch from 'expo-background-fetch';
import { SettingsStorage } from './storage';
import type { Task, CalendarEvent } from '../types';

const BACKGROUND_SYNC_TASK = 'AGENT_BACKGROUND_SYNC';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export async function requestPermissions(): Promise<boolean> {
  const { status } = await Notifications.requestPermissionsAsync();
  return status === 'granted';
}

export async function scheduleTaskReminder(task: Task): Promise<string | null> {
  if (!task.dueDate) return null;

  const settings = SettingsStorage.get();
  if (!settings?.notificationsEnabled) return null;

  const triggerDate = new Date(task.dueDate);
  triggerDate.setHours(triggerDate.getHours() - 1);

  if (triggerDate.getTime() <= Date.now()) return null;

  try {
    const id = await Notifications.scheduleNotificationAsync({
      content: {
        title: `Task Due: ${task.title}`,
        body: task.description || 'Your task is due in 1 hour',
        data: { taskId: task.id, type: 'task_reminder' },
        sound: true,
        priority: Notifications.AndroidNotificationPriority.HIGH,
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: triggerDate,
      },
    });

    return id;
  } catch {
    return null;
  }
}

export async function scheduleEventReminder(event: CalendarEvent): Promise<string | null> {
  const settings = SettingsStorage.get();
  if (!settings?.notificationsEnabled) return null;

  const reminderMinutes = event.reminders[0] || 15;
  const triggerDate = new Date(event.startDate - reminderMinutes * 60 * 1000);

  if (triggerDate.getTime() <= Date.now()) return null;

  try {
    const id = await Notifications.scheduleNotificationAsync({
      content: {
        title: `Upcoming: ${event.title}`,
        body: event.location
          ? `At ${event.location} in ${reminderMinutes} minutes`
          : `Starting in ${reminderMinutes} minutes`,
        data: { eventId: event.id, type: 'event_reminder' },
        sound: true,
        priority: Notifications.AndroidNotificationPriority.HIGH,
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: triggerDate,
      },
    });

    return id;
  } catch {
    return null;
  }
}

export async function cancelReminder(id: string): Promise<void> {
  await Notifications.cancelScheduledNotificationAsync(id);
}

export async function showInstantNotification(
  title: string,
  body: string,
  data?: Record<string, unknown>
): Promise<void> {
  await Notifications.scheduleNotificationAsync({
    content: {
      title,
      body,
      data: data ? JSON.parse(JSON.stringify(data)) : undefined,
      sound: true,
      priority: Notifications.AndroidNotificationPriority.DEFAULT,
    },
    trigger: null,
  });
}

export async function registerBackgroundSync(): Promise<void> {
  const settings = SettingsStorage.get();
  if (!settings?.backgroundSyncEnabled) return;

  try {
    await BackgroundFetch.registerTaskAsync(BACKGROUND_SYNC_TASK, {
      minimumInterval: settings.backgroundSyncInterval / 1000 / 60 || 15,
      stopOnTerminate: false,
      startOnBoot: true,
    });
  } catch (err) {
    console.warn('Background sync registration failed:', err);
  }
}

TaskManager.defineTask(BACKGROUND_SYNC_TASK, async () => {
  try {
    const settings = SettingsStorage.get();
    if (!settings?.backgroundSyncEnabled) {
      return BackgroundFetch.BackgroundFetchResult.NoData;
    }

    return BackgroundFetch.BackgroundFetchResult.NewData;
  } catch {
    return BackgroundFetch.BackgroundFetchResult.Failed;
  }
});

export async function unregisterBackgroundSync(): Promise<void> {
  try {
    await BackgroundFetch.unregisterTaskAsync(BACKGROUND_SYNC_TASK);
  } catch {}
}