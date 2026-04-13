import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
} from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withRepeat,
  withTiming,
  withSequence,
  withDelay,
} from 'react-native-reanimated';
import { Song } from '../../types';
import { useDownloadStore } from '../../stores/downloadStore';
import { usePlayerStore } from '../../stores/playerStore';
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

function EqualizerBar({ delay: barDelay }: { delay: number }) {
  const height = useSharedValue(4);

  useEffect(() => {
    height.value = withDelay(
      barDelay,
      withRepeat(
        withSequence(
          withTiming(16, { duration: 300 + Math.random() * 200 }),
          withTiming(4, { duration: 300 + Math.random() * 200 })
        ),
        -1,
        true
      )
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    height: height.value,
  }));

  return (
    <Animated.View
      style={[
        {
          width: 3,
          borderRadius: 1.5,
          backgroundColor: colors.defaultAccent,
        },
        animatedStyle,
      ]}
    />
  );
}

export function SongCard({ song, onPress, onLongPress, showDownloadIndicator = true }: SongCardProps) {
  const isDownloaded = useDownloadStore((s) => s.isDownloaded(song.id));
  const currentSong = usePlayerStore((s) => s.currentSong);
  const isPlaying = usePlayerStore((s) => s.isPlaying);
  const isCurrentSong = currentSong?.id === song.id;
  const pressed = useSharedValue(false);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: withSpring(pressed.value ? 0.97 : 1, { damping: 15, stiffness: 200 }) }],
  }));

  return (
    <Animated.View style={animatedStyle}>
      <Pressable
        style={[
          styles.container,
          isCurrentSong && styles.activeContainer,
        ]}
        onPress={onPress}
        onLongPress={onLongPress}
        onPressIn={() => { pressed.value = true; }}
        onPressOut={() => { pressed.value = false; }}
      >
        <View style={styles.artWrapper}>
          <Image
            source={{ uri: song.image }}
            style={[
              styles.artwork,
              isCurrentSong && { borderColor: colors.defaultAccent, borderWidth: 2 },
            ]}
            contentFit="cover"
            placeholder={{ blurhash: 'L6PZfSi_.AyE_3t7t7R**0o#DgR4' }}
            transition={200}
          />
          {isCurrentSong && isPlaying && (
            <View style={styles.equalizerOverlay}>
              <EqualizerBar delay={0} />
              <EqualizerBar delay={150} />
              <EqualizerBar delay={300} />
            </View>
          )}
          {showDownloadIndicator && isDownloaded && (
            <View style={styles.downloadBadge}>
              <Ionicons name="cloud-download" size={9} color="#fff" />
            </View>
          )}
        </View>
        <View style={styles.info}>
          <Text
            style={[styles.title, isCurrentSong && { color: colors.defaultAccent }]}
            numberOfLines={1}
          >
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
  activeContainer: {
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 12,
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
  equalizerOverlay: {
    position: 'absolute',
    bottom: 4,
    right: 4,
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 2,
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: 4,
    padding: 2,
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
