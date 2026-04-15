import React, { useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  GestureResponderEvent,
  LayoutChangeEvent,
  Pressable,
} from 'react-native';
import { colors } from '../../theme';
import { formatTime } from '../../utils/formatTime';

interface ProgressBarProps {
  progress: number;
  duration: number;
  onSeek: (seconds: number) => void;
  showLabels?: boolean;
  height?: number;
  thumbSize?: number;
}

export function ProgressBar({
  progress,
  duration,
  onSeek,
  showLabels = true,
  height = 5,
  thumbSize = 14,
}: ProgressBarProps) {
  const fraction = duration > 0 ? Math.min(progress / duration, 1) : 0;
  const [trackWidth, setTrackWidth] = React.useState(0);

  const handleLayout = useCallback((e: LayoutChangeEvent) => {
    setTrackWidth(e.nativeEvent.layout.width);
  }, []);

  const handlePress = useCallback(
    (e: GestureResponderEvent) => {
      if (duration <= 0 || trackWidth <= 0) return;
      const x = e.nativeEvent.locationX;
      const seekFraction = Math.max(0, Math.min(1, x / trackWidth));
      onSeek(seekFraction * duration);
    },
    [duration, trackWidth, onSeek]
  );

  return (
    <View style={styles.container}>
      <Pressable
        onPress={handlePress}
        onLayout={handleLayout}
        style={[styles.trackContainer, { paddingVertical: thumbSize / 2 }]}
      >
        {/* Track */}
        <View style={[styles.track, { height }]}>
          <View
            style={[
              styles.trackFilled,
              { width: `${fraction * 100}%`, height },
            ]}
          />
        </View>

        {/* Thumb with warm amber glow */}
        {duration > 0 && (
          <View
            style={[
              styles.thumb,
              {
                width: thumbSize,
                height: thumbSize,
                borderRadius: thumbSize / 2,
                left: `${fraction * 100}%`,
                marginLeft: -(thumbSize / 2),
                top: 0,
                bottom: 0,
                // Warm amber shadow glow
                shadowColor: colors.defaultAccent,
                shadowOffset: { width: 0, height: 0 },
                shadowOpacity: 0.65,
                shadowRadius: 7,
                elevation: 5,
              },
            ]}
          />
        )}
      </Pressable>

      {showLabels && (
        <View style={styles.labels}>
          <Text style={styles.label}>{formatTime(progress)}</Text>
          <Text style={styles.label}>{formatTime(duration)}</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  trackContainer: {
    width: '100%',
    justifyContent: 'center',
    position: 'relative',
  },
  track: {
    width: '100%',
    // Warm dark gray — not pure black
    backgroundColor: '#2A2728',
    borderRadius: 3,
    overflow: 'hidden',
  },
  trackFilled: {
    backgroundColor: colors.defaultAccent,
    borderRadius: 3,
  },
  thumb: {
    position: 'absolute',
    backgroundColor: colors.defaultAccent,
    alignSelf: 'center',
  },
  labels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  label: {
    fontSize: 12,
    fontWeight: '400',
    letterSpacing: 0.2,
    color: colors.textSecondary,
  },
});
