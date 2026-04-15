import React from 'react';
import { View, ViewStyle, StyleSheet } from 'react-native';
import { colors, spacing } from '../../theme';

interface GlassCardProps {
  children: React.ReactNode;
  style?: ViewStyle;
}

export function GlassCard({ children, style }: GlassCardProps) {
  return (
    <View style={[styles.container, style]}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: spacing.cardRadius,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(6, 182, 212, 0.12)',
    backgroundColor: colors.surfaceElevated,
    padding: spacing.cardPadding,
  },
});
