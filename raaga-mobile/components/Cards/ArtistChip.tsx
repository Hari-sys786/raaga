import React from 'react';
import { Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Image } from 'expo-image';
import { colors, typography, spacing } from '../../theme';

interface ArtistChipProps {
  artist: { id: string; name: string; image?: string };
  onPress: () => void;
}

export function ArtistChip({ artist, onPress }: ArtistChipProps) {
  return (
    <TouchableOpacity
      style={styles.container}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <Image
        source={{ uri: artist.image }}
        style={styles.image}
        contentFit="cover"
        placeholder={{ blurhash: 'L6PZfSi_.AyE_3t7t7R**0o#DgR4' }}
        transition={200}
      />
      <Text style={styles.name} numberOfLines={1}>
        {artist.name}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    marginRight: spacing.lg,
    width: 72,
    gap: spacing.sm,
  },
  image: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.surface,
  },
  name: {
    ...typography.caption,
    color: colors.textSecondary,
    textAlign: 'center',
  },
});
