import React from 'react';
import { Text, StyleSheet, Pressable } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import { typography, spacing } from '../../theme';

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
  ghazal: { name: 'rose', family: 'mci' },
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
        <LinearGradient
          colors={[genre.color + '35', genre.color + '08']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
        {iconConfig?.family === 'mci' ? (
          <MaterialCommunityIcons name={iconConfig.name as any} size={28} color={genre.color} />
        ) : iconConfig ? (
          <Ionicons name={iconConfig.name as any} size={28} color={genre.color} />
        ) : (
          <Ionicons name="musical-notes" size={28} color={genre.color} />
        )}
        <Text style={[styles.name, { color: genre.color }]}>{genre.name}</Text>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: 130,
    height: 100,
    borderRadius: spacing.cardRadius,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.cardGap,
    gap: spacing.sm,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  name: {
    ...typography.bodySmall,
    fontWeight: '700',
  },
});
