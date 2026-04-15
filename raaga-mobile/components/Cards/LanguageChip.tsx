import React from 'react';
import { Text, StyleSheet, Pressable } from 'react-native';
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
        <Text style={styles.script}>{language.script}</Text>
        <Text style={styles.name}>{language.name}</Text>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: spacing.cardRadius,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: 'rgba(6, 182, 212, 0.25)',
    marginRight: spacing.md,
    minWidth: 64,
    gap: 2,
  },
  script: {
    fontSize: 17,
    color: colors.defaultAccent,
    fontWeight: '700',
    lineHeight: 22,
  },
  name: {
    ...typography.caption,
    color: colors.textSecondary,
    fontWeight: '500',
  },
});
