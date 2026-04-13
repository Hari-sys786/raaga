import React from 'react';
import { Text, StyleSheet, Pressable, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';
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
          colors={['rgba(139,92,246,0.15)', 'rgba(139,92,246,0.05)']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
        <Text style={styles.script}>{language.script}</Text>
        <View style={styles.divider} />
        <Text style={styles.name}>{language.name}</Text>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderRadius: spacing.buttonRadiusLarge,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: 'rgba(139,92,246,0.2)',
    marginRight: spacing.md,
    gap: spacing.sm,
    overflow: 'hidden',
  },
  script: {
    fontSize: 16,
    color: colors.defaultAccent,
    fontWeight: '700',
  },
  divider: {
    width: 1,
    height: 18,
    backgroundColor: colors.textTertiary,
    opacity: 0.3,
  },
  name: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    fontWeight: '500',
  },
});
