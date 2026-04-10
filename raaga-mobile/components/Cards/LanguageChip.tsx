import React from 'react';
import { Text, StyleSheet, TouchableOpacity, View } from 'react-native';
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
    marginRight: spacing.md,
    gap: spacing.sm,
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
