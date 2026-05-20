import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { useColorScheme } from 'react-native';
import { useSettingsStore } from '../src/stores/settingsStore';
import { getDatabase } from '../src/services/database';
import { initFileService } from '../src/services/fileService';

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const { settings, loadSettings, isLoaded } = useSettingsStore();

  useEffect(() => {
    loadSettings();
    getDatabase().catch(console.error);
    initFileService().catch(console.error);
  }, []);

  const theme = settings.theme === 'system' ? (colorScheme ?? 'light') : settings.theme;

  return (
    <>
      <StatusBar style={theme === 'dark' ? 'light' : 'dark'} />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen
          name="settings"
          options={{
            presentation: 'modal',
            headerShown: true,
            headerTitle: 'Settings',
          }}
        />
        <Stack.Screen
          name="task/[id]"
          options={{
            presentation: 'modal',
            headerShown: true,
            headerTitle: 'Task',
          }}
        />
      </Stack>
    </>
  );
}