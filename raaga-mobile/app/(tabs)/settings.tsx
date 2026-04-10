import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Switch,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Screen } from '../../components/Common/Screen';
import { GlassCard } from '../../components/Common/GlassCard';
import { useSettingsStore } from '../../stores/settingsStore';
import { getStorageUsed } from '../../services/downloads';
import { colors, typography, spacing } from '../../theme';
import { cacheDirectory, getInfoAsync, deleteAsync } from 'expo-file-system/build/legacy';

type AudioQuality = '96' | '160' | '320';

const QUALITY_LABELS: Record<AudioQuality, string> = {
  '96': 'Low (96 kbps)',
  '160': 'Medium (160 kbps)',
  '320': 'High (320 kbps)',
};

const QUALITY_SHORT: Record<AudioQuality, string> = {
  '96': 'Low',
  '160': 'Medium',
  '320': 'High',
};

const SLEEP_OPTIONS = [
  { label: 'Off', value: 'off' },
  { label: '15 min', value: '15' },
  { label: '30 min', value: '30' },
  { label: '45 min', value: '45' },
  { label: '60 min', value: '60' },
];

const SPEED_OPTIONS = ['0.5', '0.75', '1.0', '1.25', '1.5', '2.0'];

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 MB';
  const mb = bytes / (1024 * 1024);
  return mb < 0.1 ? `${(bytes / 1024).toFixed(0)} KB` : `${mb.toFixed(1)} MB`;
}

function SettingRow({
  label,
  value,
  onPress,
}: {
  label: string;
  value: string;
  onPress?: () => void;
}) {
  return (
    <TouchableOpacity
      style={styles.settingRow}
      onPress={onPress}
      disabled={!onPress}
      activeOpacity={0.7}
    >
      <Text style={styles.settingLabel}>{label}</Text>
      <Text style={styles.settingValue}>{value}{onPress ? ' ▾' : ''}</Text>
    </TouchableOpacity>
  );
}

function SettingToggle({
  label,
  value,
  onToggle,
}: {
  label: string;
  value: boolean;
  onToggle: () => void;
}) {
  return (
    <View style={styles.settingRow}>
      <Text style={styles.settingLabel}>{label}</Text>
      <Switch
        value={value}
        onValueChange={onToggle}
        trackColor={{ false: '#333', true: colors.defaultAccent }}
        thumbColor="#fff"
      />
    </View>
  );
}

function showPicker(
  title: string,
  options: { label: string; value: string }[],
  onSelect: (value: string) => void
) {
  Alert.alert(
    title,
    undefined,
    [
      ...options.map((opt) => ({
        text: opt.label,
        onPress: () => onSelect(opt.value),
      })),
      { text: 'Cancel', style: 'cancel' as const },
    ]
  );
}

export default function SettingsScreen() {
  const router = useRouter();
  const streamingQuality = useSettingsStore((s) => s.streamingQuality);
  const downloadQuality = useSettingsStore((s) => s.downloadQuality);
  const sleepTimer = useSettingsStore((s) => s.sleepTimer);
  const crossfade = useSettingsStore((s) => s.crossfade);
  const playbackSpeed = useSettingsStore((s) => s.playbackSpeed);
  const setStreamingQuality = useSettingsStore((s) => s.setStreamingQuality);
  const setDownloadQuality = useSettingsStore((s) => s.setDownloadQuality);
  const setSleepTimer = useSettingsStore((s) => s.setSleepTimer);
  const toggleCrossfade = useSettingsStore((s) => s.toggleCrossfade);
  const setPlaybackSpeed = useSettingsStore((s) => s.setPlaybackSpeed);

  const [downloadSize, setDownloadSize] = useState(0);
  const [cacheSize, setCacheSize] = useState(0);

  const refreshStorage = useCallback(async () => {
    const used = await getStorageUsed();
    setDownloadSize(used);
    // Estimate cache from expo cache dir
    try {
      if (cacheDirectory) {
        const info = await getInfoAsync(cacheDirectory);
        if (info.exists && 'size' in info) {
          setCacheSize((info as any).size ?? 0);
        }
      }
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    refreshStorage();
  }, [refreshStorage]);

  const handleClearCache = () => {
    Alert.alert('Clear Cache', 'This will clear cached images and data.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Clear',
        style: 'destructive',
        onPress: async () => {
          try {
            if (cacheDirectory) {
              await deleteAsync(cacheDirectory, { idempotent: true });
            }
            setCacheSize(0);
          } catch {
            // ignore
          }
        },
      },
    ]);
  };

  const sleepLabel = sleepTimer ? `${sleepTimer} min` : 'Off';
  const speedLabel = playbackSpeed === 1.0 ? '1.0x' : `${playbackSpeed}x`;

  return (
    <Screen scroll>
      <View style={styles.header}>
        <Text style={styles.title}>Settings</Text>
      </View>

      {/* Audio Section */}
      <View style={styles.section}>
        <Text style={styles.sectionLabel}>AUDIO</Text>
        <GlassCard style={styles.sectionCard}>
          <SettingRow
            label="Streaming Quality"
            value={QUALITY_SHORT[streamingQuality]}
            onPress={() =>
              showPicker(
                'Streaming Quality',
                (['96', '160', '320'] as AudioQuality[]).map((q) => ({
                  label: QUALITY_LABELS[q],
                  value: q,
                })),
                (v: string) => setStreamingQuality(v as AudioQuality)
              )
            }
          />
          <View style={styles.divider} />
          <SettingRow
            label="Download Quality"
            value={QUALITY_SHORT[downloadQuality]}
            onPress={() =>
              showPicker(
                'Download Quality',
                (['96', '160', '320'] as AudioQuality[]).map((q) => ({
                  label: QUALITY_LABELS[q],
                  value: q,
                })),
                (v: string) => setDownloadQuality(v as AudioQuality)
              )
            }
          />
          <View style={styles.divider} />
          <TouchableOpacity
            style={styles.settingRow}
            onPress={() => router.push('/settings/equalizer')}
            activeOpacity={0.7}
          >
            <Text style={styles.settingLabel}>Equalizer</Text>
            <Text style={styles.settingValue}>→</Text>
          </TouchableOpacity>
        </GlassCard>
      </View>

      {/* Playback Section */}
      <View style={styles.section}>
        <Text style={styles.sectionLabel}>PLAYBACK</Text>
        <GlassCard style={styles.sectionCard}>
          <SettingRow
            label="Sleep Timer"
            value={sleepLabel}
            onPress={() =>
              showPicker(
                'Sleep Timer',
                SLEEP_OPTIONS.map((o) => ({
                  label: o.label,
                  value: o.value,
                })),
                (v: string) => setSleepTimer(v === 'off' ? null : Number(v))
              )
            }
          />
          <View style={styles.divider} />
          <SettingToggle
            label="Crossfade"
            value={crossfade}
            onToggle={toggleCrossfade}
          />
          <View style={styles.divider} />
          <SettingRow
            label="Playback Speed"
            value={speedLabel}
            onPress={() =>
              showPicker(
                'Playback Speed',
                SPEED_OPTIONS.map((s) => ({
                  label: `${s}x`,
                  value: s,
                })),
                (v: string) => setPlaybackSpeed(Number(v))
              )
            }
          />
        </GlassCard>
      </View>

      {/* Storage Section */}
      <View style={styles.section}>
        <Text style={styles.sectionLabel}>STORAGE</Text>
        <GlassCard style={styles.sectionCard}>
          <SettingRow label="Downloads" value={formatBytes(downloadSize)} />
          <View style={styles.divider} />
          <SettingRow label="Cache" value={formatBytes(cacheSize)} />
          <View style={styles.divider} />
          <TouchableOpacity
            style={styles.settingRow}
            onPress={handleClearCache}
            activeOpacity={0.7}
          >
            <Text style={styles.settingLabel}>Clear Cache</Text>
            <Text style={[styles.settingValue, { color: colors.error }]}>
              Clear
            </Text>
          </TouchableOpacity>
        </GlassCard>
      </View>

      {/* About Section */}
      <View style={styles.section}>
        <Text style={styles.sectionLabel}>ABOUT</Text>
        <GlassCard style={styles.sectionCard}>
          <SettingRow label="Version" value="1.0.0" />
          <View style={styles.divider} />
          <View style={styles.settingRow}>
            <Text style={styles.settingLabel}>Made with ❤️ by Panda Dev</Text>
          </View>
        </GlassCard>
      </View>

      <View style={{ height: 100 }} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: spacing.screenPadding,
    paddingTop: spacing.xxl,
    paddingBottom: spacing.lg,
  },
  title: {
    ...typography.h1,
    color: colors.textPrimary,
  },
  section: {
    paddingHorizontal: spacing.screenPadding,
    marginBottom: spacing.xl,
  },
  sectionLabel: {
    ...typography.caption,
    color: colors.textTertiary,
    letterSpacing: 1,
    marginBottom: spacing.sm,
  },
  sectionCard: {
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.lg,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.lg,
    minHeight: 48,
  },
  settingLabel: {
    ...typography.body,
    color: colors.textPrimary,
    flex: 1,
  },
  settingValue: {
    ...typography.body,
    color: colors.textSecondary,
  },
  divider: {
    height: 0.5,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
  },
});
