import React from 'react';
import { View, ActivityIndicator, StyleSheet, Text, useColorScheme } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../utils/colors';

interface LoadingProps {
  message?: string;
  size?: 'small' | 'large';
}

export function Loading({ message, size = 'large' }: LoadingProps) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const colors = Colors[isDark ? 'dark' : 'light'];

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Ionicons name="sparkles-outline" size={40} color={colors.primary} />
        <ActivityIndicator size={size} color={colors.primary} style={styles.spinner} />
        {message && (
          <Text style={[styles.message, { color: colors.textSecondary }]}>
            {message}
          </Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    alignItems: 'center',
    gap: 16,
  },
  spinner: {
    marginVertical: 8,
  },
  message: {
    fontSize: 14,
    fontWeight: '500',
  },
});