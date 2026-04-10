import React from 'react';
import { Text, StyleSheet, TouchableOpacity } from 'react-native';
import { typography, spacing } from '../../theme';

interface GenreItem {
  slug: string;
  name: string;
  emoji: string;
  color: string;
}

interface GenreCardProps {
  genre: GenreItem;
  onPress: () => void;
}

export function GenreCard({ genre, onPress }: GenreCardProps) {
  return (
    <TouchableOpacity
      style={[styles.container, { backgroundColor: genre.color + '25' }]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <Text style={styles.emoji}>{genre.emoji}</Text>
      <Text style={[styles.name, { color: genre.color }]}>{genre.name}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    width: 100,
    height: 80,
    borderRadius: spacing.cardRadius,
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
    fontWeight: '600',
  },
});
