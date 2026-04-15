import React from 'react';
import { Text, StyleSheet, Pressable, View } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import { colors, typography, spacing } from '../../theme';

const GENRE_ICONS: Record<string, { name: string; family: 'ion' | 'mci' }> = {
  bollywood: { name: 'film', family: 'ion' },
  pop: { name: 'mic', family: 'ion' },
  hiphop: { name: 'headset', family: 'ion' },
  classical: { name: 'musical-notes', family: 'ion' },
  lofi: { name: 'moon', family: 'ion' },
  indie: { name: 'guitar-acoustic', family: 'mci' },
  edm: { name: 'volume-high', family: 'ion' },
  rock: { name: 'flash', family: 'ion' },
  devotional: { name: 'flower', family: 'ion' },
  ghazal: { name: 'flower-tulip', family: 'mci' },
  sufi: { name: 'sparkles', family: 'ion' },
  punjabi: { name: 'musical-note', family: 'ion' },
};

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
  const iconConfig = GENRE_ICONS[genre.slug];
  const pressed = useSharedValue(false);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: withSpring(pressed.value ? 0.95 : 1, { damping: 15, stiffness: 200 }) }],
  }));

  return (
    <Animated.View style={animatedStyle}>
      <Pressable
        style={styles.container}
        onPress={onPress}
        onPressIn={() => { pressed.value = true; }}
        onPressOut={() => { pressed.value = false; }}
      >
        {/* Accent left border */}
        <View style={[styles.accentBorder, { backgroundColor: genre.color }]} />

        <View style={styles.inner}>
          {iconConfig?.family === 'mci' ? (
            <MaterialCommunityIcons name={iconConfig.name as any} size={18} color={genre.color} />
          ) : iconConfig ? (
            <Ionicons name={iconConfig.name as any} size={18} color={genre.color} />
          ) : (
            <Ionicons name="musical-notes" size={18} color={genre.color} />
          )}
          <Text style={styles.name} numberOfLines={1}>{genre.name}</Text>
        </View>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: 140,
    height: 56,
    borderRadius: spacing.cardRadius,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
    flexDirection: 'row',
    alignItems: 'center',
    overflow: 'hidden',
  },
  accentBorder: {
    width: 3,
    alignSelf: 'stretch',
  },
  inner: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    gap: spacing.sm,
  },
  name: {
    ...typography.bodySmall,
    color: colors.textPrimary,
    fontWeight: '600',
    flex: 1,
  },
});
