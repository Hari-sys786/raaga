import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Screen } from '../../components/Common/Screen';
import { GlassCard } from '../../components/Common/GlassCard';
import { useSettingsStore, EQ_PRESETS } from '../../stores/settingsStore';
import { colors, typography, spacing } from '../../theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const BAND_WIDTH = (SCREEN_WIDTH - spacing.screenPadding * 2 - 80) / 5;
const SLIDER_HEIGHT = 180;

const FREQ_LABELS = ['60', '230', '910', '3.6k', '14k'];
const BAND_KEYS = ['hz60', 'hz230', 'hz910', 'khz3_6', 'khz14'] as const;
const PRESET_NAMES = Object.keys(EQ_PRESETS);

// dB range: -8 to +8
const DB_MIN = -8;
const DB_MAX = 8;
const DB_RANGE = DB_MAX - DB_MIN;

function EQSlider({
  value,
  freqLabel,
  onChange,
}: {
  value: number;
  freqLabel: string;
  onChange: (val: number) => void;
}) {
  // Map dB value to fill height (0 = center)
  const normalizedValue = (value - DB_MIN) / DB_RANGE; // 0-1
  const fillHeight = normalizedValue * SLIDER_HEIGHT;
  const centerY = SLIDER_HEIGHT / 2;

  // For positive values: fill from center up
  // For negative values: fill from center down
  const isPositive = value >= 0;
  const barHeight = Math.abs(value / DB_MAX) * centerY;

  return (
    <View style={styles.sliderCol}>
      <Text style={styles.dbLabel}>
        {value > 0 ? '+' : ''}
        {value}
      </Text>
      <View style={styles.sliderTrack}>
        {/* Center line */}
        <View style={[styles.centerLine, { top: centerY }]} />
        {/* Fill bar */}
        {isPositive ? (
          <View
            style={[
              styles.fillBar,
              styles.fillPositive,
              {
                bottom: centerY,
                height: barHeight,
              },
            ]}
          />
        ) : (
          <View
            style={[
              styles.fillBar,
              styles.fillNegative,
              {
                top: centerY,
                height: barHeight,
              },
            ]}
          />
        )}
        {/* Thumb */}
        <View
          style={[
            styles.thumb,
            { bottom: fillHeight - 8 },
          ]}
        />
      </View>
      <Text style={styles.freqLabel}>{freqLabel}</Text>
      {/* Increment/decrement buttons */}
      <View style={styles.stepButtons}>
        <TouchableOpacity
          onPress={() => onChange(Math.min(DB_MAX, value + 1))}
          style={styles.stepButton}
        >
          <Text style={styles.stepText}>+</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => onChange(Math.max(DB_MIN, value - 1))}
          style={styles.stepButton}
        >
          <Text style={styles.stepText}>−</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

export default function EqualizerScreen() {
  const router = useRouter();
  const equalizerPreset = useSettingsStore((s) => s.equalizerPreset);
  const equalizerBands = useSettingsStore((s) => s.equalizerBands);
  const setEqualizerPreset = useSettingsStore((s) => s.setEqualizerPreset);
  const setEqualizerBands = useSettingsStore((s) => s.setEqualizerBands);

  const handleBandChange = (bandKey: typeof BAND_KEYS[number], value: number) => {
    setEqualizerBands({ ...equalizerBands, [bandKey]: value });
  };

  return (
    <Screen scroll>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Equalizer</Text>
        <View style={styles.backButton} />
      </View>

      {/* Presets */}
      <View style={styles.presetsContainer}>
        <View style={styles.presetsGrid}>
          {PRESET_NAMES.map((name) => (
            <TouchableOpacity
              key={name}
              style={[
                styles.presetChip,
                equalizerPreset === name && styles.presetChipActive,
              ]}
              onPress={() => setEqualizerPreset(name)}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.presetText,
                  equalizerPreset === name && styles.presetTextActive,
                ]}
              >
                {name}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* EQ Sliders */}
      <GlassCard style={styles.eqCard}>
        <View style={styles.slidersRow}>
          {BAND_KEYS.map((key, i) => (
            <EQSlider
              key={key}
              value={equalizerBands[key]}
              freqLabel={FREQ_LABELS[i]}
              onChange={(val) => handleBandChange(key, val)}
            />
          ))}
        </View>
      </GlassCard>

      {/* Note */}
      <View style={styles.noteContainer}>
        <GlassCard style={styles.noteCard}>
          <Text style={styles.noteText}>
            ⓘ Visual only for now. expo-av doesn't support equalizer natively.
            Full EQ support requires a native build with react-native-track-player.
          </Text>
        </GlassCard>
      </View>

      <View style={{ height: 100 }} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.screenPadding,
    paddingTop: spacing.xxl + 20,
    paddingBottom: spacing.lg,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backText: {
    color: colors.textPrimary,
    fontSize: 24,
    fontWeight: '300',
  },
  headerTitle: {
    ...typography.h3,
    color: colors.textPrimary,
  },
  presetsContainer: {
    paddingHorizontal: spacing.screenPadding,
    marginBottom: spacing.xl,
  },
  presetsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  presetChip: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: spacing.buttonRadiusLarge,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  presetChipActive: {
    backgroundColor: colors.defaultAccent,
    borderColor: colors.defaultAccent,
  },
  presetText: {
    ...typography.bodySmall,
    color: colors.textSecondary,
  },
  presetTextActive: {
    color: '#fff',
    fontWeight: '600',
  },
  eqCard: {
    marginHorizontal: spacing.screenPadding,
    paddingVertical: spacing.xl,
  },
  slidersRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'flex-start',
  },
  sliderCol: {
    alignItems: 'center',
    width: BAND_WIDTH,
  },
  dbLabel: {
    ...typography.caption,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
    minWidth: 30,
    textAlign: 'center',
  },
  sliderTrack: {
    width: 8,
    height: SLIDER_HEIGHT,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 4,
    position: 'relative',
    overflow: 'visible',
  },
  centerLine: {
    position: 'absolute',
    left: -6,
    right: -6,
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
  },
  fillBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    borderRadius: 4,
  },
  fillPositive: {
    backgroundColor: colors.defaultAccent,
  },
  fillNegative: {
    backgroundColor: colors.error,
    opacity: 0.6,
  },
  thumb: {
    position: 'absolute',
    left: -4,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  freqLabel: {
    ...typography.caption,
    color: colors.textTertiary,
    marginTop: spacing.sm,
  },
  stepButtons: {
    flexDirection: 'row',
    gap: spacing.xs,
    marginTop: spacing.sm,
  },
  stepButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepText: {
    color: colors.textPrimary,
    fontSize: 16,
    fontWeight: '600',
  },
  noteContainer: {
    paddingHorizontal: spacing.screenPadding,
    marginTop: spacing.xl,
  },
  noteCard: {
    backgroundColor: 'rgba(139, 92, 246, 0.08)',
    borderColor: 'rgba(139, 92, 246, 0.2)',
  },
  noteText: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    lineHeight: 20,
  },
});
