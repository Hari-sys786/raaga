import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { Image } from 'expo-image';
import { Song } from '../../types';
import { useDownloadStore } from '../../stores/downloadStore';
import { colors, typography, spacing } from '../../theme';

interface SongCardProps {
  song: Song;
  onPress?: () => void;
  onLongPress?: () => void;
  showDownloadIndicator?: boolean;
}

function formatDuration(seconds?: number): string {
  if (!seconds) return '';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

export function SongCard({ song, onPress, onLongPress, showDownloadIndicator = true }: SongCardProps) {
  const isDownloaded = useDownloadStore((s) => s.isDownloaded(song.id));

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={onPress}
      onLongPress={onLongPress}
      activeOpacity={0.7}
    >
      <View style={styles.artWrapper}>
        <Image
          source={{ uri: song.image }}
          style={styles.artwork}
          contentFit="cover"
          placeholder={{ blurhash: 'L6PZfSi_.AyE_3t7t7R**0o#DgR4' }}
          transition={200}
        />
        {showDownloadIndicator && isDownloaded && (
          <View style={styles.downloadBadge}>
            <Text style={styles.downloadBadgeText}>⬇</Text>
          </View>
        )}
      </View>
      <View style={styles.info}>
        <Text style={styles.title} numberOfLines={1}>
          {song.title}
        </Text>
        <Text style={styles.artist} numberOfLines={1}>
          {song.artist}
        </Text>
      </View>
      {song.duration ? (
        <Text style={styles.duration}>{formatDuration(song.duration)}</Text>
      ) : null}
      <View style={styles.playIcon}>
        <Text style={styles.playIconText}>▶</Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.screenPadding,
    gap: spacing.md,
  },
  artWrapper: {
    position: 'relative',
  },
  artwork: {
    width: 48,
    height: 48,
    borderRadius: 8,
    backgroundColor: colors.surface,
  },
  downloadBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: colors.defaultAccent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  downloadBadgeText: {
    fontSize: 8,
    color: '#fff',
  },
  info: {
    flex: 1,
    gap: 2,
  },
  title: {
    ...typography.body,
    color: colors.textPrimary,
  },
  artist: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  duration: {
    ...typography.caption,
    color: colors.textTertiary,
    marginRight: spacing.sm,
  },
  playIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  playIconText: {
    color: colors.textPrimary,
    fontSize: 12,
    marginLeft: 2,
  },
});
