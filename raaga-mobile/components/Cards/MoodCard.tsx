import React from 'react';
import { Text, StyleSheet, Pressable, View } from 'react-native';
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
  // Use first gradient color for icon tint
  const iconColor = mood.gradient[0];

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: withSpring(pressed.value ? 0.95 : 1, { damping: 15, stiffness: 200 }) }],
  }));

  return (
    <Animated.View style={animatedStyle}>
      {/* Outer wrapper provides the gradient border effect via background */}
      <View style={[styles.borderWrap, { backgroundColor: iconColor + '55' }]}>
        <Pressable
          style={styles.container}
          onPress={onPress}
          onPressIn={() => { pressed.value = true; }}
          onPressOut={() => { pressed.value = false; }}
        >
          {iconConfig?.family === 'mci' ? (
            <MaterialCommunityIcons name={iconConfig.name as any} size={16} color={iconColor} />
          ) : iconConfig ? (
            <Ionicons name={iconConfig.name as any} size={16} color={iconColor} />
          ) : (
            <Ionicons name="musical-notes" size={16} color={iconColor} />
          )}
          <Text style={styles.name}>{mood.name}</Text>
        </Pressable>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  borderWrap: {
    borderRadius: 22,
    padding: 1,
    marginRight: spacing.sm,
  },
  container: {
    height: 44,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    gap: spacing.sm,
    borderRadius: 21,
    backgroundColor: colors.surface,
  },
  name: {
    ...typography.bodySmall,
    color: colors.textPrimary,
    fontWeight: '600',
  },
});
