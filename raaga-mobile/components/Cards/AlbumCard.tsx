import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Image } from 'expo-image';
import { Album } from '../../types';
import { colors, typography, spacing } from '../../theme';

interface AlbumCardProps {
  album: Album;
  onPress?: () => void;
}

export function AlbumCard({ album, onPress }: AlbumCardProps) {
  return (
    <TouchableOpacity
      style={styles.container}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <Image
        source={{ uri: album.image }}
        style={styles.artwork}
        contentFit="cover"
        placeholder={{ blurhash: 'L6PZfSi_.AyE_3t7t7R**0o#DgR4' }}
        transition={200}
      />
      <Text style={styles.title} numberOfLines={1}>
        {album.title}
      </Text>
      <Text style={styles.artist} numberOfLines={1}>
        {album.artist}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    width: 160,
    marginRight: spacing.cardGap,
  },
  artwork: {
    width: 160,
    height: 160,
    borderRadius: spacing.cardRadius,
    backgroundColor: colors.surface,
    marginBottom: spacing.sm,
  },
  title: {
    ...typography.bodySmall,
    color: colors.textPrimary,
    fontWeight: '600',
  },
  artist: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: 2,
  },
});
