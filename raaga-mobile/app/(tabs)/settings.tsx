import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Switch,
  Modal,
  Pressable,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Screen } from '../../components/Common/Screen';
import { GlassCard } from '../../components/Common/GlassCard';
import { useSettingsStore } from '../../stores/settingsStore';
import { getStorageUsed } from '../../services/downloads';
import { colors, typography, spacing } from '../../theme';
import { cacheDirectory, getInfoAsync, deleteAsync } from 'expo-file-system/legacy';

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

// Dark bottom sheet picker
function BottomPicker({
  visible,
  title,
  options,
  selected,
  onSelect,
  onClose,
}: {
  visible: boolean;
  title: string;
  options: { label: string; value: string }[];
  selected?: string;
  onSelect: (value: string) => void;
  onClose: () => void;
}) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={pickerStyles.overlay} onPress={onClose}>
        <View style={pickerStyles.sheet}>
          {/* Handle */}
          <View style={pickerStyles.handle} />
          <Text style={pickerStyles.title}>{title}</Text>
          <View style={pickerStyles.divider} />
          {options.map((opt) => {
            const isActive = opt.value === selected;
            return (
              <TouchableOpacity
                key={opt.value}
                style={pickerStyles.option}
                onPress={() => {
                  onSelect(opt.value);
                  onClose();
                }}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    pickerStyles.optionText,
                    isActive && pickerStyles.optionTextActive,
                  ]}
                >
                  {opt.label}
                </Text>
                {isActive && (
                  <Ionicons name="checkmark" size={20} color={colors.defaultAccent} />
                )}
              </TouchableOpacity>
            );
          })}
          <TouchableOpacity style={pickerStyles.cancelButton} onPress={onClose}>
            <Text style={pickerStyles.cancelText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </Pressable>
    </Modal>
  );
}

const pickerStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 34,
    paddingTop: 8,
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignSelf: 'center',
    marginBottom: 16,
  },
  title: {
    ...typography.h3,
    color: colors.textPrimary,
    paddingHorizontal: 24,
    paddingBottom: 12,
  },
  divider: {
    height: 0.5,
    backgroundColor: 'rgba(255,255,255,0.08)',
    marginHorizontal: 24,
    marginBottom: 4,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingVertical: 16,
  },
  optionText: {
    ...typography.body,
    color: colors.textSecondary,
    fontSize: 16,
  },
  optionTextActive: {
    color: colors.defaultAccent,
    fontWeight: '600',
  },
  cancelButton: {
    marginTop: 8,
    borderTopWidth: 0.5,
    borderTopColor: 'rgba(255,255,255,0.08)',
    paddingTop: 16,
    alignItems: 'center',
  },
  cancelText: {
    ...typography.body,
    color: colors.textTertiary,
  },
});

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
      <View style={styles.settingRight}>
        <Text style={styles.settingValue}>{value}</Text>
        {onPress && <Ionicons name="chevron-forward" size={16} color={colors.textTertiary} />}
      </View>
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

export default function SettingsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
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

  // Picker state
  const [pickerConfig, setPickerConfig] = useState<{
    visible: boolean;
    title: string;
    options: { label: string; value: string }[];
    selected?: string;
    onSelect: (value: string) => void;
  }>({
    visible: false,
    title: '',
    options: [],
    onSelect: () => {},
  });

  const openPicker = (
    title: string,
    options: { label: string; value: string }[],
    selected: string,
    onSelect: (value: string) => void
  ) => {
    setPickerConfig({ visible: true, title, options, selected, onSelect });
  };

  const closePicker = () => {
    setPickerConfig((prev) => ({ ...prev, visible: false }));
  };

  const refreshStorage = useCallback(async () => {
    const used = await getStorageUsed();
    setDownloadSize(used);
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
  const speedLabel = playbackSpeed === 1.0 ? '1.0×' : `${playbackSpeed}×`;

  return (
    <Screen scroll>
      <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
        <Text style={styles.title}>Settings</Text>
      </View>

      {/* Audio Section */}
      <View style={styles.section}>
        <View style={styles.sectionLabelRow}>
          <Ionicons name="volume-medium" size={14} color={colors.textTertiary} />
          <Text style={styles.sectionLabel}>AUDIO</Text>
        </View>
        <GlassCard style={styles.sectionCard}>
          <SettingRow
            label="Streaming Quality"
            value={QUALITY_SHORT[streamingQuality]}
            onPress={() =>
              openPicker(
                'Streaming Quality',
                (['96', '160', '320'] as AudioQuality[]).map((q) => ({
                  label: QUALITY_LABELS[q],
                  value: q,
                })),
                streamingQuality,
                (v) => setStreamingQuality(v as AudioQuality)
              )
            }
          />
          <View style={styles.divider} />
          <SettingRow
            label="Download Quality"
            value={QUALITY_SHORT[downloadQuality]}
            onPress={() =>
              openPicker(
                'Download Quality',
                (['96', '160', '320'] as AudioQuality[]).map((q) => ({
                  label: QUALITY_LABELS[q],
                  value: q,
                })),
                downloadQuality,
                (v) => setDownloadQuality(v as AudioQuality)
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
            <Ionicons name="chevron-forward" size={18} color={colors.textTertiary} />
          </TouchableOpacity>
        </GlassCard>
      </View>

      {/* Playback Section */}
      <View style={styles.section}>
        <View style={styles.sectionLabelRow}>
          <Ionicons name="play-circle" size={14} color={colors.textTertiary} />
          <Text style={styles.sectionLabel}>PLAYBACK</Text>
        </View>
        <GlassCard style={styles.sectionCard}>
          <SettingRow
            label="Sleep Timer"
            value={sleepLabel}
            onPress={() =>
              openPicker(
                'Sleep Timer',
                SLEEP_OPTIONS,
                sleepTimer ? String(sleepTimer) : 'off',
                (v) => setSleepTimer(v === 'off' ? null : Number(v))
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
              openPicker(
                'Playback Speed',
                SPEED_OPTIONS.map((s) => ({ label: `${s}×`, value: s })),
                String(playbackSpeed),
                (v) => setPlaybackSpeed(Number(v))
              )
            }
          />
        </GlassCard>
      </View>

      {/* Storage Section */}
      <View style={styles.section}>
        <View style={styles.sectionLabelRow}>
          <Ionicons name="folder" size={14} color={colors.textTertiary} />
          <Text style={styles.sectionLabel}>STORAGE</Text>
        </View>
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
        <View style={styles.sectionLabelRow}>
          <Ionicons name="information-circle" size={14} color={colors.textTertiary} />
          <Text style={styles.sectionLabel}>ABOUT</Text>
        </View>
        <GlassCard style={styles.sectionCard}>
          <SettingRow label="Version" value="1.0.0" />
          <View style={styles.divider} />
          <View style={styles.settingRow}>
            <Text style={styles.settingLabel}>Made with ❤️ by Panda Dev</Text>
          </View>
        </GlassCard>
      </View>

      <View style={{ height: 100 }} />

      {/* Picker Modal */}
      <BottomPicker
        visible={pickerConfig.visible}
        title={pickerConfig.title}
        options={pickerConfig.options}
        selected={pickerConfig.selected}
        onSelect={pickerConfig.onSelect}
        onClose={closePicker}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: spacing.screenPadding,
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
  },
  sectionLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
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
  settingRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
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
