import React from 'react';
import { Text, StyleSheet, Pressable } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import { colors, typography, spacing } from '../../theme';

const MOOD_ICONS: Record<string, { name: string; family: 'ion' | 'mci' }> = {
  chill: { name: 'weather-night', family: 'mci' },
  workout: { name: 'dumbbell', family: 'mci' },
  romance: { name: 'heart-multiple', family: 'mci' },
  party: { name: 'party-popper', family: 'mci' },
  focus: { name: 'target', family: 'mci' },
  sad: { name: 'emoticon-sad', family: 'mci' },
  devotional: { name: 'flower', family: 'ion' },
  roadtrip: { name: 'car-convertible', family: 'mci' },
  rain: { name: 'weather-rainy', family: 'mci' },
  happy: { name: 'emoticon-happy', family: 'mci' },
};

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
  const iconConfig = MOOD_ICONS[mood.slug];
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
          colors={[mood.gradient[0] + '40', mood.gradient[1] + '15']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
        {iconConfig?.family === 'mci' ? (
          <MaterialCommunityIcons name={iconConfig.name as any} size={28} color={mood.gradient[0]} />
        ) : iconConfig ? (
          <Ionicons name={iconConfig.name as any} size={28} color={mood.gradient[0]} />
        ) : (
          <Ionicons name="musical-notes" size={28} color={mood.gradient[0]} />
        )}
        <Text style={styles.name}>{mood.name}</Text>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: 130,
    height: 100,
    borderRadius: spacing.cardRadius,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.cardGap,
    gap: spacing.sm,
    overflow: 'hidden',
  },
  name: {
    ...typography.bodySmall,
    color: colors.textPrimary,
    fontWeight: '700',
  },
});
