import { Tabs, router } from 'expo-router';
import { useColorScheme, Platform, TouchableOpacity, View } from 'react-native';
import Animated from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../src/utils/colors';
import { useInboxStore } from '../../src/stores/inboxStore';
import { useEffect } from 'react';

const AnimatedTouchableOpacity = Animated.createAnimatedComponent(TouchableOpacity);

function TabIcon({ name, color, size, badge }: { name: string; color: string; size: number; badge?: number }) {
  return (
    <View style={{ alignItems: 'center', justifyContent: 'center' }}>
      <Ionicons name={name as any} size={size} color={color} />
      {badge !== undefined && badge > 0 && (
        <View
          style={{
            position: 'absolute',
            right: -8,
            top: -4,
            backgroundColor: '#F44336',
            minWidth: 18,
            height: 18,
            borderRadius: 9,
            alignItems: 'center',
            justifyContent: 'center',
            paddingHorizontal: 4,
          }}
        >
          <Text style={{ color: '#fff', fontSize: 10, fontWeight: '700' }}>
            {badge > 99 ? '99+' : badge}
          </Text>
        </View>
      )}
    </View>
  );
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
          borderTopWidth: 1,
          paddingBottom: Platform.OS === 'ios' ? 20 : 8,
          paddingTop: 12,
          height: Platform.OS === 'ios' ? 88 : 68,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -4 },
          shadowOpacity: 0.1,
          shadowRadius: 8,
          elevation: 8,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
          marginTop: 4,
        },
        tabBarItemStyle: {
          paddingVertical: 4,
        },
        headerStyle: {
          backgroundColor: colors.background,
          shadowColor: 'transparent',
          elevation: 0,
        },
        headerTintColor: colors.text,
        headerShadowVisible: false,
        headerRight: () => (
          <AnimatedTouchableOpacity
            onPress={() => router.push('/settings')}
            style={{
              paddingRight: 16,
              paddingVertical: 8,
              borderRadius: 20,
              backgroundColor: colors.surfaceVariant,
              marginRight: 12,
            }}
            activeOpacity={0.7}
          >
            <Ionicons name="settings-outline" size={20} color={colors.textSecondary} />
          </AnimatedTouchableOpacity>
        ),
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Tasks',
          headerTitle: () => (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Ionicons name="checkbox-outline" size={24} color={colors.primary} />
              <View style={{ flexDirection: 'column' }}>
                <View style={{ fontSize: 18, fontWeight: '700', color: colors.text }}>
                  Task Board
                </View>
                <View style={{ fontSize: 12, color: colors.textTertiary }}>
                  Stay organized
                </View>
              </View>
            </View>
          ),
          tabBarIcon: ({ color, size }) => (
            <TabIcon name="checkbox-outline" color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="calendar"
        options={{
          title: 'Calendar',
          headerTitle: () => (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Ionicons name="calendar-outline" size={24} color={colors.primary} />
              <View style={{ flexDirection: 'column' }}>
                <View style={{ fontSize: 18, fontWeight: '700', color: colors.text }}>
                  Calendar
                </View>
                <View style={{ fontSize: 12, color: colors.textTertiary }}>
                  Plan your time
                </View>
              </View>
            </View>
          ),
          tabBarIcon: ({ color, size }) => (
            <TabIcon name="calendar-outline" color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="inbox"
        options={{
          title: 'Inbox',
          headerTitle: () => (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Ionicons name="mail-outline" size={24} color={colors.primary} />
              <View style={{ flexDirection: 'column' }}>
                <View style={{ fontSize: 18, fontWeight: '700', color: colors.text }}>
                  Inbox
                </View>
                <View style={{ fontSize: 12, color: colors.textTertiary }}>
                  Email & Social
                </View>
              </View>
            </View>
          ),
          tabBarBadge: unreadCount > 0 ? unreadCount : undefined,
          tabBarBadgeStyle: {
            backgroundColor: '#F44336',
            fontSize: 11,
            fontWeight: '700',
            minWidth: 20,
            height: 20,
          },
          tabBarIcon: ({ color, size }) => (
            <TabIcon name="mail-outline" color={color} size={size} badge={unreadCount} />
          ),
        }}
      />
      <Tabs.Screen
        name="agent"
        options={{
          title: 'Agent',
          headerTitle: () => (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Ionicons name="sparkles" size={24} color={colors.primary} />
              <View style={{ flexDirection: 'column' }}>
                <View style={{ fontSize: 18, fontWeight: '700', color: colors.text }}>
                  AI Agent
                </View>
                <View style={{ fontSize: 12, color: colors.textTertiary }}>
                  Offline intelligence
                </View>
              </View>
            </View>
          ),
          tabBarIcon: ({ color, size }) => (
            <TabIcon name="sparkles" color={color} size={size} />
          ),
        }}
      />
    </Tabs>
  );
}