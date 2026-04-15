import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import Animated, { SlideInDown, SlideOutDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { usePlayerStore } from '../../stores/playerStore';
import { PlayerControls } from './PlayerControls';
import { colors, typography } from '../../theme';

export function MiniPlayer() {
  const currentSong = usePlayerStore((s) => s.currentSong);
  const progress = usePlayerStore((s) => s.progress);
  const duration = usePlayerStore((s) => s.duration);
  const router = useRouter();
  const insets = useSafeAreaInsets();

  if (!currentSong) return null;

  const fraction = duration > 0 ? Math.min(progress / duration, 1) : 0;

  return (
    <Animated.View
      entering={SlideInDown.duration(400).springify()}
      exiting={SlideOutDown.duration(200)}
      style={[styles.container, { paddingBottom: Math.max(insets.bottom, 0) }]}
    >
      {/* Amber progress bar — thin, at the very top */}
      <View style={styles.progressTrack}>
        <View style={[styles.progressFill, { width: `${fraction * 100}%` }]} />
      </View>

      {/* Warm charcoal gradient background */}
      <LinearGradient
        colors={['rgba(15,21,32,0.97)', 'rgba(8,11,18,0.99)']}
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
    width: 44,
    height: 44,
    borderRadius: 10,
    backgroundColor: colors.surface,
  },
  info: {
    flex: 1,
    gap: 2,
  },
  title: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary,
    letterSpacing: 0.1,
  },
  artist: {
    fontSize: 12,
    fontWeight: '400',
    color: colors.textSecondary,
    letterSpacing: 0.1,
  },
  progressTrack: {
    height: 2,
    backgroundColor: 'rgba(6, 182, 212, 0.12)',
    zIndex: 1,
  },
  progressFill: {
    height: 2,
    backgroundColor: colors.defaultAccent,
    borderRadius: 1,
  },
});
