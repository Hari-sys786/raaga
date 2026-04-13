import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
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

  const repeatActive = repeat !== 'off';

  if (size === 'mini') {
    return (
      <View style={styles.miniContainer}>
        <TouchableOpacity
          onPress={isPlaying ? pause : resume}
          style={styles.miniButton}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name={isPlaying ? 'pause' : 'play'} size={20} color={colors.textPrimary} />
        </TouchableOpacity>
        <TouchableOpacity
          onPress={next}
          style={styles.miniButton}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="play-skip-forward" size={18} color={colors.textPrimary} />
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Shuffle */}
      <TouchableOpacity onPress={toggleShuffle} style={styles.sideButton}>
        <Ionicons
          name="shuffle"
          size={22}
          color={shuffle ? colors.defaultAccent : colors.textSecondary}
          style={{ opacity: shuffle ? 1 : 0.5 }}
        />
      </TouchableOpacity>

      {/* Previous */}
      <TouchableOpacity onPress={previous} style={styles.controlButton}>
        <Ionicons name="play-skip-back" size={28} color={colors.textPrimary} />
      </TouchableOpacity>

      {/* Play/Pause - Large central button */}
      <TouchableOpacity
        onPress={isPlaying ? pause : resume}
        style={styles.playPauseButton}
        activeOpacity={0.8}
      >
        <Ionicons
          name={isPlaying ? 'pause' : 'play'}
          size={30}
          color="#FFFFFF"
          style={!isPlaying ? { marginLeft: 3 } : undefined}
        />
      </TouchableOpacity>

      {/* Next */}
      <TouchableOpacity onPress={next} style={styles.controlButton}>
        <Ionicons name="play-skip-forward" size={28} color={colors.textPrimary} />
      </TouchableOpacity>

      {/* Repeat */}
      <TouchableOpacity onPress={cycleRepeat} style={styles.sideButton}>
        <Ionicons
          name={repeat === 'one' ? 'repeat' : 'repeat-outline'}
          size={22}
          color={repeatActive ? colors.defaultAccent : colors.textSecondary}
          style={{ opacity: repeatActive ? 1 : 0.5 }}
        />
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
  sideButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  controlButton: {
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  playPauseButton: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: colors.defaultAccent,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.defaultAccent,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
});
