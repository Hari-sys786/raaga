import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { usePlayerStore } from '../../stores/playerStore';
import { colors } from '../../theme';

interface PlayerControlsProps {
  size?: 'mini' | 'full';
}

export function PlayerControls({ size = 'full' }: PlayerControlsProps) {
  const isPlaying = usePlayerStore((s) => s.isPlaying);
  const shuffle = usePlayerStore((s) => s.shuffle);
  const repeat = usePlayerStore((s) => s.repeat);
  const pause = usePlayerStore((s) => s.pause);
  const resume = usePlayerStore((s) => s.resume);
  const next = usePlayerStore((s) => s.next);
  const previous = usePlayerStore((s) => s.previous);
  const toggleShuffle = usePlayerStore((s) => s.toggleShuffle);
  const cycleRepeat = usePlayerStore((s) => s.cycleRepeat);

  const repeatIcon = repeat === 'one' ? '🔂' : '🔁';
  const repeatActive = repeat !== 'off';

  if (size === 'mini') {
    return (
      <View style={styles.miniContainer}>
        <TouchableOpacity
          onPress={isPlaying ? pause : resume}
          style={styles.miniButton}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Text style={styles.miniIcon}>{isPlaying ? '❚❚' : '▶'}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={next}
          style={styles.miniButton}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Text style={styles.miniIcon}>▶▶</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Shuffle */}
      <TouchableOpacity onPress={toggleShuffle} style={styles.sideButton}>
        <Text style={[styles.sideIcon, shuffle && styles.activeIcon]}>🔀</Text>
      </TouchableOpacity>

      {/* Previous */}
      <TouchableOpacity onPress={previous} style={styles.controlButton}>
        <Text style={styles.controlIcon}>◀◀</Text>
      </TouchableOpacity>

      {/* Play/Pause - Large central button */}
      <TouchableOpacity
        onPress={isPlaying ? pause : resume}
        style={styles.playPauseButton}
        activeOpacity={0.8}
      >
        <Text style={styles.playPauseIcon}>{isPlaying ? '❚❚' : '▶'}</Text>
      </TouchableOpacity>

      {/* Next */}
      <TouchableOpacity onPress={next} style={styles.controlButton}>
        <Text style={styles.controlIcon}>▶▶</Text>
      </TouchableOpacity>

      {/* Repeat */}
      <TouchableOpacity onPress={cycleRepeat} style={styles.sideButton}>
        <Text style={[styles.sideIcon, repeatActive && styles.activeIcon]}>
          {repeatIcon}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 24,
    paddingVertical: 8,
  },
  miniContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  miniButton: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  miniIcon: {
    color: colors.textPrimary,
    fontSize: 14,
  },
  sideButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sideIcon: {
    fontSize: 20,
    opacity: 0.4,
  },
  activeIcon: {
    opacity: 1,
  },
  controlButton: {
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  controlIcon: {
    color: colors.textPrimary,
    fontSize: 18,
  },
  playPauseButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.defaultAccent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  playPauseIcon: {
    color: '#FFFFFF',
    fontSize: 22,
    marginLeft: 2,
  },
});
