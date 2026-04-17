import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, Switch, Modal, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Screen } from '../../components/Common/Screen';
import { GlassCard } from '../../components/Common/GlassCard';
import { useSettingsStore } from '../../stores/settingsStore';
import { getStorageUsed } from '../../services/downloads';
import { colors, typography, spacing } from '../../theme';
import { cacheDirectory, getInfoAsync, deleteAsync } from 'expo-file-system/legacy';

// ─── Types & Constants ───────────────────────────────────────────────────────

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
  { label: 'Off', value: 0 },
  { label: '15 minutes', value: 15 },
  { label: '30 minutes', value: 30 },
  { label: '45 minutes', value: 45 },
  { label: '1 hour', value: 60 },
  { label: '1.5 hours', value: 90 },
  { label: '2 hours', value: 120 },
];

const SPEED_OPTIONS = [
  { label: '0.5×', value: 0.5 },
  { label: '0.75×', value: 0.75 },
  { label: '1× (Normal)', value: 1.0 },
  { label: '1.25×', value: 1.25 },
  { label: '1.5×', value: 1.5 },
  { label: '2×', value: 2.0 },
];

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

// ─── BottomPicker ─────────────────────────────────────────────────────────────

interface PickerOption {
  label: string;
  value: string | number;
}

interface BottomPickerProps {
  visible: boolean;
  title: string;
  options: PickerOption[];
  selected: string | number;
  onSelect: (value: string | number) => void;
  onClose: () => void;
}

function BottomPicker({ visible, title, options, selected, onSelect, onClose }: BottomPickerProps) {
  const insets = useSafeAreaInsets();

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <Pressable style={styles.pickerOverlay} onPress={onClose}>
        <Pressable
          style={[styles.pickerSheet, { paddingBottom: insets.bottom + 12 }]}
          onPress={(e) => e.stopPropagation()}
        >
          {/* Handle */}
          <View style={styles.pickerHandle} />

          <Text style={styles.pickerTitle}>{title}</Text>

          <View style={styles.pickerDivider} />

          {options.map((opt, idx) => {
            const isActive = opt.value === selected;
            return (
              <TouchableOpacity
                key={String(opt.value)}
                style={[
                  styles.pickerOption,
                  idx < options.length - 1 && styles.pickerOptionBorder,
                ]}
                onPress={() => {
                  onSelect(opt.value);
                  onClose();
                }}
                activeOpacity={0.7}
              >
                <Text style={[styles.pickerOptionText, isActive && styles.pickerOptionActive]}>
                  {opt.label}
                </Text>
                {isActive && (
                  <Ionicons name="checkmark" size={18} color={colors.defaultAccent} />
                )}
              </TouchableOpacity>
            );
          })}

          <View style={styles.pickerDivider} />

          <TouchableOpacity style={styles.pickerCancel} onPress={onClose} activeOpacity={0.7}>
            <Text style={styles.pickerCancelText}>Cancel</Text>
          </TouchableOpacity>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

// ─── SettingRow ───────────────────────────────────────────────────────────────

interface SettingRowProps {
  label: string;
  value?: string;
  icon?: keyof typeof Ionicons.glyphMap;
  onPress?: () => void;
  destructive?: boolean;
  rightElement?: React.ReactNode;
}

function SettingRow({ label, value, icon, onPress, destructive, rightElement }: SettingRowProps) {
  return (
    <TouchableOpacity
      style={styles.settingRow}
      onPress={onPress}
      activeOpacity={onPress ? 0.7 : 1}
      disabled={!onPress && !rightElement}
    >
      <View style={styles.settingRowLeft}>
        {icon && (
          <Ionicons
            name={icon}
            size={18}
            color={destructive ? colors.error : colors.textSecondary}
            style={styles.settingRowIcon}
          />
        )}
        <Text style={[styles.settingRowLabel, destructive && { color: colors.error }]}>
          {label}
        </Text>
      </View>
      <View style={styles.settingRowRight}>
        {value !== undefined && (
          <Text style={styles.settingRowValue}>{value}</Text>
        )}
        {rightElement}
        {onPress && !rightElement && (
          <Ionicons name="chevron-forward" size={16} color={colors.textTertiary} />
        )}
      </View>
    </TouchableOpacity>
  );
}

// ─── SettingToggle ────────────────────────────────────────────────────────────

interface SettingToggleProps {
  label: string;
  icon?: keyof typeof Ionicons.glyphMap;
  value: boolean;
  onToggle: (val: boolean) => void;
}

function SettingToggle({ label, icon, value, onToggle }: SettingToggleProps) {
  return (
    <SettingRow
      label={label}
      icon={icon}
      rightElement={
        <Switch
          value={value}
          onValueChange={onToggle}
          trackColor={{ false: colors.surfaceLight, true: colors.defaultAccent }}
          thumbColor="#fff"
          ios_backgroundColor={colors.surfaceLight}
        />
      }
    />
  );
}

// ─── Section Label ────────────────────────────────────────────────────────────

function SectionLabel({ icon, label }: { icon: keyof typeof Ionicons.glyphMap; label: string }) {
  return (
    <View style={styles.sectionLabelRow}>
      <Ionicons name={icon} size={13} color={colors.textTertiary} />
      <Text style={styles.sectionLabel}>{label}</Text>
    </View>
  );
}

// ─── Settings Screen ──────────────────────────────────────────────────────────

export default function SettingsScreen() {
  const router = useRouter();
  const {
    streamingQuality,
    downloadQuality,
    crossfade,
    sleepTimer,
    playbackSpeed,
    setStreamingQuality,
    setDownloadQuality,
    toggleCrossfade,
    setSleepTimer,
    setPlaybackSpeed,
  } = useSettingsStore();

  const [storageUsed, setStorageUsed] = useState(0);
  const [cacheSize, setCacheSize] = useState(0);

  const [picker, setPicker] = useState<{
    visible: boolean;
    title: string;
    options: PickerOption[];
    selected: string | number;
    onSelect: (v: string | number) => void;
  }>({
    visible: false,
    title: '',
    options: [],
    selected: '',
    onSelect: () => {},
  });

  const closePicker = useCallback(() => {
    setPicker((p) => ({ ...p, visible: false }));
  }, []);

  const openPicker = useCallback(
    (
      title: string,
      options: PickerOption[],
      selected: string | number,
      onSelect: (v: string | number) => void,
    ) => {
      setPicker({ visible: true, title, options, selected, onSelect });
    },
    [],
  );

  useEffect(() => {
    (async () => {
      try {
        const used = await getStorageUsed();
        setStorageUsed(used);
      } catch {}

      try {
        if (cacheDirectory) {
          const info = await getInfoAsync(cacheDirectory);
          setCacheSize((info as any).size ?? 0);
        }
      } catch {}
    })();
  }, []);

  const handleClearCache = useCallback(() => {
    Alert.alert(
      'Clear Cache',
      'This will delete all cached images and temp files. Downloaded songs will not be affected.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear Cache',
          style: 'destructive',
          onPress: async () => {
            try {
              if (cacheDirectory) {
                await deleteAsync(cacheDirectory, { idempotent: true });
                setCacheSize(0);
              }
            } catch {
              Alert.alert('Error', 'Could not clear cache.');
            }
          },
        },
      ],
    );
  }, []);

  const qualityOptions: PickerOption[] = (
    ['96', '160', '320'] as AudioQuality[]
  ).map((q) => ({ label: QUALITY_LABELS[q], value: q }));

  const sleepOptions: PickerOption[] = SLEEP_OPTIONS.map((o) => ({
    label: o.label,
    value: o.value,
  }));

  const speedOptions: PickerOption[] = SPEED_OPTIONS.map((o) => ({
    label: o.label,
    value: o.value,
  }));

  const sleepLabel =
    sleepTimer == null || sleepTimer === 0
      ? 'Off'
      : SLEEP_OPTIONS.find((o) => o.value === sleepTimer)?.label ?? `${sleepTimer} min`;

  const speedLabel =
    SPEED_OPTIONS.find((o) => o.value === playbackSpeed)?.label ?? `${playbackSpeed}×`;

  return (
    <Screen scroll>

      {/* ── Audio ─────────────────────────────── */}
      <View style={styles.sectionBlock}>
        <SectionLabel icon="headset-outline" label="Audio" />
        <GlassCard style={styles.card}>
          <SettingRow
            label="Streaming Quality"
            icon="wifi-outline"
            value={QUALITY_SHORT[streamingQuality as AudioQuality] ?? streamingQuality}
            onPress={() =>
              openPicker('Streaming Quality', qualityOptions, streamingQuality, (v) =>
                setStreamingQuality(v as AudioQuality),
              )
            }
          />
          <View style={styles.cardDivider} />
          <SettingRow
            label="Download Quality"
            icon="cloud-download-outline"
            value={QUALITY_SHORT[downloadQuality as AudioQuality] ?? downloadQuality}
            onPress={() =>
              openPicker('Download Quality', qualityOptions, downloadQuality, (v) =>
                setDownloadQuality(v as AudioQuality),
              )
            }
          />
          <View style={styles.cardDivider} />
          <View style={styles.cardDivider} />
          <SettingRow
            label="Equalizer"
            icon="options-outline"
            onPress={() => router.push('/settings/equalizer' as any)}
          />
        </GlassCard>
      </View>

      {/* ── Playback ──────────────────────────── */}
      <View style={styles.sectionBlock}>
        <SectionLabel icon="play-circle-outline" label="Playback" />
        <GlassCard style={styles.card}>
          <SettingToggle
            label="Crossfade"
            icon="shuffle-outline"
            value={crossfade}
            onToggle={() => toggleCrossfade()}
          />
          <View style={styles.cardDivider} />
          <SettingRow
            label="Playback Speed"
            icon="speedometer-outline"
            value={speedLabel}
            onPress={() =>
              openPicker('Playback Speed', speedOptions, playbackSpeed, (v) =>
                setPlaybackSpeed(v as number),
              )
            }
          />
          <View style={styles.cardDivider} />
          <SettingRow
            label="Sleep Timer"
            icon="moon-outline"
            value={sleepLabel}
            onPress={() =>
              openPicker('Sleep Timer', sleepOptions, sleepTimer ?? 0, (v) =>
                setSleepTimer(v as number),
              )
            }
          />
        </GlassCard>
      </View>

      {/* ── Storage ───────────────────────────── */}
      <View style={styles.sectionBlock}>
        <SectionLabel icon="folder-outline" label="Storage" />
        <GlassCard style={styles.card}>
          <SettingRow
            label="Downloads Used"
            icon="download-outline"
            value={formatBytes(storageUsed)}
          />
          <View style={styles.cardDivider} />
          <SettingRow
            label="Cache Size"
            icon="layers-outline"
            value={formatBytes(cacheSize)}
          />
          <View style={styles.cardDivider} />
          {/* Clear Cache option removed as per requirements */}
        </GlassCard>
      </View>

      {/* ── About ─────────────────────────────── */}
      <View style={styles.sectionBlock}>
        <SectionLabel icon="information-circle-outline" label="About" />
        <GlassCard style={styles.card}>
          <SettingRow label="Version" icon="code-slash-outline" value="1.0.0" />
          <View style={styles.cardDivider} />
          <SettingRow
            label="Privacy Policy"
            icon="shield-checkmark-outline"
            onPress={() => router.push('/privacy' as any)}
          />
          <View style={styles.cardDivider} />
          <SettingRow
            label="Terms of Service"
            icon="document-text-outline"
            onPress={() => router.push('/terms' as any)}
          />
        </GlassCard>

        <Text style={styles.madeWith}>Made with ❤️ by Panda Dev</Text>
      </View>

      {/* ── Picker Modal ─────────────────── */}
      <BottomPicker
        visible={picker.visible}
        title={picker.title}
        options={picker.options}
        selected={picker.selected}
        onSelect={picker.onSelect}
        onClose={closePicker}
      />
    </Screen>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  // Section blocks
  sectionBlock: {
    marginBottom: 28,
  },
  sectionLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginHorizontal: spacing.screenPadding,
    marginBottom: 10,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '500',
    letterSpacing: 1,
    textTransform: 'uppercase',
    color: colors.textTertiary,
  },

  // Card
  card: {
    marginHorizontal: spacing.screenPadding,
    borderRadius: spacing.cardRadius,
    overflow: 'hidden',
  },
  cardDivider: {
    height: 1,
    backgroundColor: 'rgba(232,236,242,0.06)',
    marginHorizontal: 16,
  },

  // Setting rows
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 16,
    minHeight: 52,
  },
  settingRowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 10,
  },
  settingRowIcon: {
    width: 20,
    textAlign: 'center',
  },
  settingRowLabel: {
    ...typography.body,
    color: colors.textPrimary,
    fontWeight: '400',
  },
  settingRowRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  settingRowValue: {
    ...typography.body,
    color: colors.textSecondary,
  },

  // Made with
  madeWith: {
    ...typography.caption,
    color: colors.textTertiary,
    textAlign: 'center',
    marginTop: 20,
    marginBottom: 8,
  },

  // Picker
  pickerOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'flex-end',
  },
  pickerSheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 12,
  },
  pickerHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(232,236,242,0.2)',
    alignSelf: 'center',
    marginBottom: 16,
  },
  pickerTitle: {
    ...typography.h3,
    color: colors.textPrimary,
    textAlign: 'center',
    paddingHorizontal: 20,
    paddingBottom: 14,
    fontWeight: '600',
    fontSize: 15,
  },
  pickerDivider: {
    height: 1,
    backgroundColor: 'rgba(232,236,242,0.06)',
  },
  pickerOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 15,
    paddingHorizontal: 22,
  },
  pickerOptionBorder: {
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(232,236,242,0.06)',
  },
  pickerOptionText: {
    ...typography.body,
    color: colors.textPrimary,
  },
  pickerOptionActive: {
    color: colors.defaultAccent,
    fontWeight: '600',
  },
  pickerCancel: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  pickerCancelText: {
    ...typography.body,
    color: colors.textTertiary,
    fontWeight: '500',
  },
});
