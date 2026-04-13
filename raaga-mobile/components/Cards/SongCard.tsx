import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
} from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';
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
  const pressed = useSharedValue(false);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: withSpring(pressed.value ? 0.97 : 1, { damping: 15, stiffness: 200 }) }],
  }));

  return (
    <Animated.View style={animatedStyle}>
      <Pressable
        style={styles.container}
        onPress={onPress}
        onLongPress={onLongPress}
        onPressIn={() => { pressed.value = true; }}
        onPressOut={() => { pressed.value = false; }}
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
              <Ionicons name="cloud-download" size={9} color="#fff" />
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
        <View style={styles.menuIcon}>
          <Ionicons name="ellipsis-vertical" size={16} color={colors.textTertiary} />
        </View>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: spacing.screenPadding,
    gap: spacing.md,
  },
  artWrapper: {
    position: 'relative',
  },
  artwork: {
    width: 56,
    height: 56,
    borderRadius: 12,
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
  info: {
    flex: 1,
    gap: 3,
  },
  title: {
    ...typography.body,
    color: colors.textPrimary,
    fontWeight: '500',
  },
  artist: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  duration: {
    ...typography.caption,
    color: colors.textTertiary,
  },
  menuIcon: {
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
