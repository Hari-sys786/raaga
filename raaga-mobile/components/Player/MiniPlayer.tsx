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

  const handlePress = () => {
    router.push('/player');
  };

  return (
    <Animated.View
      entering={SlideInDown.duration(300)}
      exiting={SlideOutDown.duration(200)}
      style={styles.container}
    >
      <LinearGradient
        colors={['rgba(20,20,20,0.95)', 'rgba(10,10,10,0.98)']}
        style={StyleSheet.absoluteFill}
      />
      <TouchableOpacity
        style={styles.content}
        onPress={handlePress}
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
      <View style={styles.progressTrack}>
        <View style={[styles.progressFill, { width: `${fraction * 100}%` }]} />
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderTopWidth: 0.5,
    borderTopColor: 'rgba(255, 255, 255, 0.06)',
    overflow: 'hidden',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 58,
    paddingHorizontal: 12,
    gap: 10,
  },
  artwork: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: colors.surface,
  },
  info: {
    flex: 1,
    gap: 1,
  },
  title: {
    ...typography.bodySmall,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  artist: {
    fontSize: 12,
    color: '#A0A0A0',
  },
  progressTrack: {
    height: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  progressFill: {
    height: 2,
    backgroundColor: colors.defaultAccent,
  },
});
