import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import Animated, { SlideInDown, SlideOutDown } from 'react-native-reanimated';
import { usePlayerStore } from '../../stores/playerStore';
import { PlayerControls } from './PlayerControls';
import { colors, typography } from '../../theme';

export function MiniPlayer() {
  const currentSong = usePlayerStore((s) => s.currentSong);
  const progress = usePlayerStore((s) => s.progress);
  const duration = usePlayerStore((s) => s.duration);
  const router = useRouter();

  if (!currentSong) return null;

  const fraction = duration > 0 ? Math.min(progress / duration, 1) : 0;

  return (
    <Animated.View
      entering={SlideInDown.duration(400).springify()}
      exiting={SlideOutDown.duration(200)}
      style={styles.container}
    >
      {/* Progress bar at the very top */}
      <View style={styles.progressTrack}>
        <View style={[styles.progressFill, { width: `${fraction * 100}%` }]} />
      </View>
      <LinearGradient
        colors={['rgba(17,17,17,0.97)', 'rgba(8,8,8,0.99)']}
        style={StyleSheet.absoluteFill}
      />
      <TouchableOpacity
        style={styles.content}
        onPress={() => router.push('/player')}
        activeOpacity={0.9}
      >
        <Image
          source={{ uri: currentSong.image }}
          style={styles.artwork}
          contentFit="cover"
          placeholder={{ blurhash: 'L6PZfSi_.AyE_3t7t7R**0o#DgR4' }}
          transition={200}
        />
        <View style={styles.info}>
          <Text style={styles.title} numberOfLines={1}>
            {currentSong.title}
          </Text>
          <Text style={styles.artist} numberOfLines={1}>
            {currentSong.artist}
          </Text>
        </View>
        <PlayerControls size="mini" />
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderTopWidth: 0.5,
    borderTopColor: 'rgba(255, 255, 255, 0.04)',
    overflow: 'hidden',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 62,
    paddingHorizontal: 14,
    gap: 12,
  },
  artwork: {
    width: 48,
    height: 48,
    borderRadius: 10,
    backgroundColor: colors.surface,
  },
  info: {
    flex: 1,
    gap: 2,
  },
  title: {
    ...typography.bodySmall,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  artist: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  progressTrack: {
    height: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    zIndex: 1,
  },
  progressFill: {
    height: 2,
    backgroundColor: colors.defaultAccent,
  },
});
