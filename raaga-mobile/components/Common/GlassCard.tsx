import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { spacing } from '../../theme';

interface GlassCardProps {
  children: React.ReactNode;
  style?: ViewStyle;
}

export function GlassCard({ children, style }: GlassCardProps) {
  // Note: True blur requires @react-native-community/blur which needs
  // native modules. For Expo Go compatibility, we use a semi-transparent
  // approximation. Switch to BlurView in production builds.
  return (
    <View style={[styles.card, style]}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: spacing.cardRadius,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    padding: spacing.cardPadding,
    overflow: 'hidden',
  },
});
