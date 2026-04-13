import React from 'react';
import { Text, StyleSheet, TouchableOpacity, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, typography, spacing } from '../../theme';

interface LanguageItem {
  slug: string;
  name: string;
  script: string;
}

interface LanguageChipProps {
  language: LanguageItem;
  onPress: () => void;
}

export function LanguageChip({ language, onPress }: LanguageChipProps) {
  return (
    <TouchableOpacity
      style={styles.container}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <LinearGradient
        colors={['rgba(139,92,246,0.12)', 'rgba(139,92,246,0.04)']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      <Text style={styles.script}>{language.script}</Text>
      <View style={styles.divider} />
      <Text style={styles.name}>{language.name}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: spacing.buttonRadiusLarge,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: 'rgba(139,92,246,0.15)',
    marginRight: spacing.md,
    gap: spacing.sm,
    overflow: 'hidden',
  },
  script: {
    fontSize: 14,
    color: colors.defaultAccent,
    fontWeight: '600',
  },
  divider: {
    width: 1,
    height: 16,
    backgroundColor: colors.textTertiary,
    opacity: 0.4,
  },
  name: {
    ...typography.caption,
    color: colors.textSecondary,
    fontWeight: '500',
  },
});
