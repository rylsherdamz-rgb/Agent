import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Switch,
  useColorScheme,
  Alert,
} from 'react-native';
import { router } from 'expo-router';
import { Colors } from '../src/utils/colors';
import { useSettingsStore } from '../src/stores/settingsStore';
import { useInboxStore } from '../src/stores/inboxStore';
import { useTaskStore } from '../src/stores/taskStore';
import { getDefaultIMAPSettings } from '../src/services/emailService';
import { AuthStorage } from '../src/services/storage';
import { registerBackgroundSync, unregisterBackgroundSync } from '../src/services/notificationService';
import { BACKGROUND_SYNC_INTERVALS, SOCIAL_PLATFORMS, MODEL_DOWNLOAD_URL } from '../src/utils/constants';
import type { EmailAccount } from '../src/types';

export default function SettingsScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const colors = Colors[isDark ? 'dark' : 'light'];
  const { settings, updateSettings, setModelDownloaded, resetSettings } = useSettingsStore();
  const { addAccount, accounts } = useInboxStore();
  const { tasks } = useTaskStore();

  const [showEmailForm, setShowEmailForm] = useState(false);
  const [showSocialForm, setShowSocialForm] = useState(false);
  const [showBackendForm, setShowBackendForm] = useState(false);
  const [emailForm, setEmailForm] = useState({
    email: '',
    password: '',
    provider: 'gmail' as EmailAccount['provider'],
  });
  const [socialUrl, setSocialUrl] = useState('');
  const [backendUrl, setBackendUrl] = useState(settings.backendUrl || '');
  const [backendToken, setBackendToken] = useState(settings.backendToken || '');

  const handleAddEmail = async () => {
    if (!emailForm.email || !emailForm.password) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    const imap = getDefaultIMAPSettings(emailForm.provider);

    await addAccount({
      email: emailForm.email,
      name: emailForm.email.split('@')[0],
      provider: emailForm.provider,
      imapHost: imap.imapHost,
      imapPort: imap.imapPort,
      smtpHost: imap.smtpHost,
      smtpPort: imap.smtpPort,
      useSSL: true,
    });

    AuthStorage.setToken(`email_${accounts.length + 1}`, emailForm.password);

    setEmailForm({ email: '', password: '', provider: 'gmail' });
    setShowEmailForm(false);
  };

  const handleAddSocial = () => {
    if (!socialUrl.trim()) return;
    const platforms = [...settings.socialPlatforms, socialUrl.trim()];
    updateSettings({ socialPlatforms: platforms, socialEnabled: true });
    setSocialUrl('');
    setShowSocialForm(false);
  };

  const handleSaveBackend = () => {
    updateSettings({ backendUrl: backendUrl.trim(), backendToken: backendToken.trim() });
    setShowBackendForm(false);
  };

  const handleDownloadModel = async () => {
    Alert.alert(
      'Download Model',
      `The Qwen2-1.5B GGUF model is ~1GB. Download from HuggingFace?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Download',
          onPress: () => {
            setModelDownloaded('/data/models/qwen2-1.5b-instruct-q4_k_m.gguf');
          },
        },
      ]
    );
  };

  const SectionHeader = ({ title }: { title: string }) => (
    <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>
      {title}
    </Text>
  );

  const SettingRow = ({
    label,
    value,
    onPress,
    right,
  }: {
    label: string;
    value?: string;
    onPress?: () => void;
    right?: React.ReactNode;
  }) => (
    <TouchableOpacity
      style={[styles.settingRow, { borderBottomColor: colors.borderLight }]}
      onPress={onPress}
      disabled={!onPress}
    >
      <Text style={[styles.settingLabel, { color: colors.text }]}>{label}</Text>
      <View style={styles.settingRight}>
        {value && (
          <Text style={[styles.settingValue, { color: colors.textTertiary }]}>
            {value}
          </Text>
        )}
        {right}
      </View>
    </TouchableOpacity>
  );

  const ToggleRow = ({
    label,
    value,
    onToggle,
  }: {
    label: string;
    value: boolean;
    onToggle: (v: boolean) => void;
  }) => (
    <View style={[styles.settingRow, { borderBottomColor: colors.borderLight }]}>
      <Text style={[styles.settingLabel, { color: colors.text }]}>{label}</Text>
      <Switch
        value={value}
        onValueChange={onToggle}
        trackColor={{ false: colors.surfaceVariant, true: colors.primary + '60' }}
        thumbColor={value ? colors.primary : colors.textTertiary}
      />
    </View>
  );

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.content}>
        <View style={[styles.headerBar, { borderBottomColor: colors.border }]}>
          <TouchableOpacity onPress={() => router.back()}>
            <Text style={[styles.backBtn, { color: colors.primary }]}>Done</Text>
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Settings</Text>
          <View style={{ width: 50 }} />
        </View>

        <SectionHeader title="APP" />

        <SettingRow
          label="Theme"
          value={settings.theme}
          onPress={() => {
            const next = settings.theme === 'light' ? 'dark' : settings.theme === 'dark' ? 'system' : 'light';
            updateSettings({ theme: next });
          }}
        />

        <SettingRow
          label="Default Calendar View"
          value={settings.defaultCalendarView}
          onPress={() => {
            const views: Array<'day' | 'week' | 'month' | 'agenda'> = ['day', 'week', 'month', 'agenda'];
            const idx = views.indexOf(settings.defaultCalendarView);
            updateSettings({ defaultCalendarView: views[(idx + 1) % views.length] });
          }}
        />

        <ToggleRow
          label="Notifications"
          value={settings.notificationsEnabled}
          onToggle={(v) => updateSettings({ notificationsEnabled: v })}
        />

        <ToggleRow
          label="Background Sync"
          value={settings.backgroundSyncEnabled}
          onToggle={async (v) => {
            updateSettings({ backgroundSyncEnabled: v });
            if (v) {
              await registerBackgroundSync();
            } else {
              await unregisterBackgroundSync();
            }
          }}
        />

        {settings.backgroundSyncEnabled && (
          <SettingRow
            label="Sync Interval"
            value={BACKGROUND_SYNC_INTERVALS.find(
              (i) => i.value === settings.backgroundSyncInterval
            )?.label || '30 minutes'}
            onPress={() => {
              const current = BACKGROUND_SYNC_INTERVALS.findIndex(
                (i) => i.value === settings.backgroundSyncInterval
              );
              const next = BACKGROUND_SYNC_INTERVALS[
                (current + 1) % BACKGROUND_SYNC_INTERVALS.length
              ];
              updateSettings({ backgroundSyncInterval: next.value });
            }}
          />
        )}

        <SectionHeader title="RENDER BACKEND" />

        {settings.backendUrl ? (
          <>
            <SettingRow label="Backend URL" value={settings.backendUrl} />
            <TouchableOpacity
              style={[styles.actionBtn, { borderColor: colors.border }]}
              onPress={() => {
                setBackendUrl(settings.backendUrl || '');
                setBackendToken(settings.backendToken || '');
                setShowBackendForm(true);
              }}
            >
              <Text style={[styles.actionBtnText, { color: colors.primary }]}>Change Backend</Text>
            </TouchableOpacity>
          </>
        ) : (
          <TouchableOpacity
            style={[styles.actionBtn, { borderColor: colors.border }]}
            onPress={() => setShowBackendForm(true)}
          >
            <Text style={[styles.actionBtnText, { color: colors.primary }]}>Connect Render Backend</Text>
          </TouchableOpacity>
        )}

        {showBackendForm && (
          <View style={[styles.formCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[styles.formTitle, { color: colors.text }]}>Backend Configuration</Text>
            <TextInput
              style={[styles.formInput, { color: colors.text, borderColor: colors.border }]}
              placeholder="https://your-app.onrender.com"
              placeholderTextColor={colors.textTertiary}
              value={backendUrl}
              onChangeText={setBackendUrl}
              autoCapitalize="none"
            />
            <TextInput
              style={[styles.formInput, { color: colors.text, borderColor: colors.border }]}
              placeholder="API Token"
              placeholderTextColor={colors.textTertiary}
              value={backendToken}
              onChangeText={setBackendToken}
              secureTextEntry
            />
            <View style={styles.formButtons}>
              <TouchableOpacity
                style={[styles.formBtn, { backgroundColor: colors.surfaceVariant }]}
                onPress={() => setShowBackendForm(false)}
              >
                <Text style={{ color: colors.textSecondary, fontWeight: '600' }}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.formBtn, { backgroundColor: colors.primary }]}
                onPress={handleSaveBackend}
              >
                <Text style={{ color: '#fff', fontWeight: '600' }}>Connect</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        <SectionHeader title="GMAIL INTEGRATION" />

        <SettingRow
          label="Google Calendar Sync"
          value={settings.googleCalendarEnabled ? 'On' : 'Off'}
          onPress={() => updateSettings({ googleCalendarEnabled: !settings.googleCalendarEnabled })}
        />

        {accounts.length > 0 ? (
          <>
            <Text style={[styles.subtext, { color: colors.textTertiary }]}>
              {accounts.length} email account{accounts.length > 1 ? 's' : ''} configured
            </Text>
            {accounts.map((acc, idx) => (
              <SettingRow key={acc.id} label={acc.email} value={acc.provider} />
            ))}
            <TouchableOpacity
              style={[styles.actionBtn, { borderColor: colors.border }]}
              onPress={() => setShowEmailForm(true)}
            >
              <Text style={[styles.actionBtnText, { color: colors.primary }]}>+ Add Another</Text>
            </TouchableOpacity>
          </>
        ) : (
          <TouchableOpacity
            style={[styles.actionBtn, { borderColor: colors.border }]}
            onPress={() => setShowEmailForm(true)}
          >
            <Text style={[styles.actionBtnText, { color: colors.primary }]}>Connect Gmail / Email</Text>
          </TouchableOpacity>
        )}

        {showEmailForm && (
          <View style={[styles.formCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[styles.formTitle, { color: colors.text }]}>Add Email Account</Text>

            <View style={styles.providerRow}>
              {(['gmail', 'outlook', 'imap'] as const).map((p) => (
                <TouchableOpacity
                  key={p}
                  style={[
                    styles.providerChip,
                    emailForm.provider === p && { backgroundColor: colors.primary },
                    { borderColor: colors.border },
                  ]}
                  onPress={() => setEmailForm({ ...emailForm, provider: p })}
                >
                  <Text
                    style={{
                      color: emailForm.provider === p ? '#fff' : colors.textSecondary,
                      fontWeight: '600',
                      fontSize: 12,
                    }}
                  >
                    {p.toUpperCase()}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <TextInput
              style={[styles.formInput, { color: colors.text, borderColor: colors.border }]}
              placeholder="Email address"
              placeholderTextColor={colors.textTertiary}
              value={emailForm.email}
              onChangeText={(t) => setEmailForm({ ...emailForm, email: t })}
              autoCapitalize="none"
              keyboardType="email-address"
            />
            <TextInput
              style={[styles.formInput, { color: colors.text, borderColor: colors.border }]}
              placeholder="App Password (for Gmail) or IMAP password"
              placeholderTextColor={colors.textTertiary}
              value={emailForm.password}
              onChangeText={(t) => setEmailForm({ ...emailForm, password: t })}
              secureTextEntry
            />
            <View style={styles.formButtons}>
              <TouchableOpacity
                style={[styles.formBtn, { backgroundColor: colors.surfaceVariant }]}
                onPress={() => setShowEmailForm(false)}
              >
                <Text style={{ color: colors.textSecondary, fontWeight: '600' }}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.formBtn, { backgroundColor: colors.primary }]}
                onPress={handleAddEmail}
              >
                <Text style={{ color: '#fff', fontWeight: '600' }}>Add Account</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        <SectionHeader title="TELEGRAM INTEGRATION" />

        <ToggleRow
          label="Telegram Summaries"
          value={settings.telegramEnabled ?? false}
          onToggle={(v) => updateSettings({ telegramEnabled: v })}
        />

        {settings.telegramEnabled && (
          <>
            <SettingRow
              label="Telegram Bot Token"
              value={settings.telegramBotToken ? 'Configured' : 'Not set'}
              onPress={() => {
                Alert.prompt(
                  'Bot Token',
                  'Enter your Telegram Bot token from @BotFather',
                  [
                    {
                      text: 'Cancel',
                      style: 'cancel',
                    },
                    {
                      text: 'OK',
                      onPress: (text?: string) => {
                        if (text) updateSettings({ telegramBotToken: text });
                      },
                    },
                  ],
                  'secure-text'
                );
              }}
            />
            <SettingRow
              label="Telegram Chat ID"
              value={settings.telegramChatId || 'Not set'}
              onPress={() => {
                Alert.prompt(
                  'Chat ID',
                  'Enter your Telegram chat/user ID',
                  [
                    {
                      text: 'Cancel',
                      style: 'cancel',
                    },
                    {
                      text: 'OK',
                      onPress: (text?: string) => {
                        if (text) updateSettings({ telegramChatId: text });
                      },
                    },
                  ],
                  'plain-text'
                );
              }}
            />
          </>
        )}

        <SectionHeader title="SOCIAL MEDIA" />

        <ToggleRow
          label="Social Feeds"
          value={settings.socialEnabled}
          onToggle={(v) => updateSettings({ socialEnabled: v })}
        />

        {settings.socialPlatforms.length > 0 && (
          <>
            {settings.socialPlatforms.map((url, idx) => (
              <SettingRow
                key={idx}
                label={`Feed ${idx + 1}`}
                value={url.substring(0, 50) + '...'}
                onPress={() => {
                  const updated = settings.socialPlatforms.filter((_, i) => i !== idx);
                  updateSettings({ socialPlatforms: updated });
                }}
              />
            ))}
          </>
        )}

        <TouchableOpacity
          style={[styles.actionBtn, { borderColor: colors.border }]}
          onPress={() => setShowSocialForm(true)}
        >
          <Text style={[styles.actionBtnText, { color: colors.primary }]}>+ Add RSS / Reddit Feed</Text>
        </TouchableOpacity>

        {showSocialForm && (
          <View style={[styles.formCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[styles.formTitle, { color: colors.text }]}>Add Feed</Text>
            <TextInput
              style={[styles.formInput, { color: colors.text, borderColor: colors.border }]}
              placeholder="e.g., reddit:programming or https://feeds.example.com"
              placeholderTextColor={colors.textTertiary}
              value={socialUrl}
              onChangeText={setSocialUrl}
              autoCapitalize="none"
            />
            <View style={styles.formButtons}>
              <TouchableOpacity
                style={[styles.formBtn, { backgroundColor: colors.surfaceVariant }]}
                onPress={() => setShowSocialForm(false)}
              >
                <Text style={{ color: colors.textSecondary, fontWeight: '600' }}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.formBtn, { backgroundColor: colors.primary }]}
                onPress={handleAddSocial}
              >
                <Text style={{ color: '#fff', fontWeight: '600' }}>Add</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        <SectionHeader title="AI MODEL" />

        <SettingRow
          label="Model"
          value={settings.modelDownloaded ? 'Qwen2-1.5B (downloaded)' : 'Not downloaded'}
        />

        {settings.modelDownloaded ? (
          <SettingRow label="Model Path" value={settings.modelPath || ''} />
        ) : (
          <TouchableOpacity
            style={[styles.actionBtn, { borderColor: colors.border }]}
            onPress={handleDownloadModel}
          >
            <Text style={[styles.actionBtnText, { color: colors.primary }]}>
              Download Qwen2-1.5B GGUF (~1GB)
            </Text>
          </TouchableOpacity>
        )}

        <ToggleRow
          label="Offline AI Agent"
          value={settings.agentEnabled}
          onToggle={(v) => updateSettings({ agentEnabled: v })}
        />

        <SectionHeader title="DATA" />

        <SettingRow
          label="Tasks Stored"
          value={`${tasks.length} locally`}
        />

        <TouchableOpacity
          style={[styles.dangerBtn, { borderColor: colors.error }]}
          onPress={() => {
            Alert.alert('Reset All', 'This will reset all settings to default. Are you sure?', [
              { text: 'Cancel', style: 'cancel' },
              {
                text: 'Reset',
                style: 'destructive',
                onPress: resetSettings,
              },
            ]);
          }}
        >
          <Text style={[styles.dangerBtnText, { color: colors.error }]}>
            Reset All Settings
          </Text>
        </TouchableOpacity>

        <View style={styles.footer}>
          <Text style={[styles.footerText, { color: colors.textTertiary }]}>
            Agent v1.0.0{'\n'}
            Offline-first personal AI assistant
          </Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { paddingBottom: 60 },
  headerBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 60,
    paddingBottom: 12,
    borderBottomWidth: 1,
    marginBottom: 16,
  },
  backBtn: { fontSize: 16, fontWeight: '500' },
  headerTitle: { fontSize: 17, fontWeight: '700' },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginTop: 24,
    marginBottom: 8,
    marginHorizontal: 16,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  settingLabel: { fontSize: 15, flex: 1 },
  settingRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  settingValue: { fontSize: 14 },
  subtext: {
    fontSize: 12,
    paddingHorizontal: 16,
    marginBottom: 4,
  },
  actionBtn: {
    marginHorizontal: 16,
    marginVertical: 6,
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
  },
  actionBtnText: { fontSize: 14, fontWeight: '600' },
  formCard: {
    marginHorizontal: 16,
    marginVertical: 8,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  formTitle: { fontSize: 16, fontWeight: '700', marginBottom: 12 },
  formInput: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    marginBottom: 10,
  },
  formButtons: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 4,
  },
  formBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
  },
  providerRow: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  providerChip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 14,
    borderWidth: 1,
  },
  dangerBtn: {
    marginHorizontal: 16,
    marginVertical: 12,
    paddingVertical: 14,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
  },
  dangerBtnText: { fontSize: 14, fontWeight: '700' },
  footer: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  footerText: {
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 18,
  },
});