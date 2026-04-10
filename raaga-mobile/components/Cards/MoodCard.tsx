import React from 'react';
import { Text, StyleSheet, TouchableOpacity } from 'react-native';
import { colors, typography, spacing } from '../../theme';

interface MoodItem {
  slug: string;
  name: string;
  emoji: string;
  gradient: [string, string];
}

interface MoodCardProps {
  mood: MoodItem;
  onPress: () => void;
}

export function MoodCard({ mood, onPress }: MoodCardProps) {
  return (
    <TouchableOpacity
      style={[styles.container, { borderColor: mood.gradient[0] }]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <Text style={styles.emoji}>{mood.emoji}</Text>
      <Text style={styles.name}>{mood.name}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    width: 120,
    height: 80,
    borderRadius: spacing.cardRadius,
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.cardGap,
    gap: spacing.xs,
  },
  emoji: {
    fontSize: 24,
  },
  name: {
    ...typography.caption,
    color: colors.textPrimary,
    fontWeight: '600',
  },
});
