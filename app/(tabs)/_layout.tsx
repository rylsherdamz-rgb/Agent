import { Tabs, router } from 'expo-router';
import { useColorScheme, Platform, Text, TouchableOpacity } from 'react-native';
import { Colors } from '../../src/utils/colors';
import { useInboxStore } from '../../src/stores/inboxStore';
import { useEffect } from 'react';

function TabIcon({ symbol, color }: { symbol: string; color: string }) {
  return <Text style={{ fontSize: 22, color }}>{symbol}</Text>;
}

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const colors = Colors[isDark ? 'dark' : 'light'];
  const { unreadCount, refreshUnreadCount } = useInboxStore();

  useEffect(() => {
    refreshUnreadCount();
    const interval = setInterval(refreshUnreadCount, 60000);
    return () => clearInterval(interval);
  }, []);

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textTertiary,
        tabBarStyle: {
          backgroundColor: colors.background,
          borderTopColor: colors.border,
          paddingBottom: Platform.OS === 'ios' ? 20 : 8,
          paddingTop: 8,
          height: Platform.OS === 'ios' ? 85 : 65,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
        },
        headerStyle: {
          backgroundColor: colors.background,
        },
        headerTintColor: colors.text,
        headerShadowVisible: false,
        headerRight: () => (
          <TouchableOpacity
            onPress={() => router.push('/settings')}
            style={{ paddingRight: 16 }}
          >
            <Text style={{ fontSize: 18, color: colors.textSecondary }}>{'{.}'}</Text>
          </TouchableOpacity>
        ),
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Tasks',
          headerTitle: 'Task Board',
          tabBarIcon: ({ color }) => <TabIcon symbol="[ ]" color={color} />,
        }}
      />
      <Tabs.Screen
        name="calendar"
        options={{
          title: 'Calendar',
          headerTitle: 'Calendar',
          tabBarIcon: ({ color }) => <TabIcon symbol="D" color={color} />,
        }}
      />
      <Tabs.Screen
        name="inbox"
        options={{
          title: 'Inbox',
          headerTitle: 'Inbox',
          tabBarBadge: unreadCount > 0 ? unreadCount : undefined,
          tabBarBadgeStyle: {
            backgroundColor: colors.error,
            fontSize: 12,
            minWidth: 20,
            height: 20,
            lineHeight: 20,
          },
          tabBarIcon: ({ color }) => <TabIcon symbol="i" color={color} />,
        }}
      />
      <Tabs.Screen
        name="agent"
        options={{
          title: 'Agent',
          headerTitle: 'AI Agent',
          tabBarIcon: ({ color }) => <TabIcon symbol="?" color={color} />,
        }}
      />
    </Tabs>
  );
}