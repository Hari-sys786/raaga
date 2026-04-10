import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { Image } from 'expo-image';
import { usePlayerStore } from '../../stores/playerStore';
import { colors, typography, spacing } from '../../theme';
import { Song } from '../../types';

interface QueueProps {
  onClose?: () => void;
}

export function Queue({ onClose }: QueueProps) {
  const queue = usePlayerStore((s) => s.queue);
  const currentSong = usePlayerStore((s) => s.currentSong);
  const playFromQueue = usePlayerStore((s) => s.playFromQueue);
  const clearQueue = usePlayerStore((s) => s.clearQueue);

  const currentIndex = queue.findIndex((s) => s.id === currentSong?.id);

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Now Playing</Text>
        <TouchableOpacity onPress={clearQueue}>
          <Text style={styles.clearButton}>Clear</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.list}
      >
        {queue.map((song, index) => {
          const isCurrent = index === currentIndex;
          return (
            <TouchableOpacity
              key={`${song.id}-${index}`}
              style={[styles.item, isCurrent && styles.itemActive]}
              onPress={() => playFromQueue(index)}
              activeOpacity={0.7}
            >
              <Text style={[styles.index, isCurrent && styles.indexActive]}>
                {isCurrent ? '♪' : `${index + 1}`}
              </Text>
              <Image
                source={{ uri: song.image }}
                style={styles.artwork}
                contentFit="cover"
              />
              <View style={styles.info}>
                <Text
                  style={[styles.title, isCurrent && styles.titleActive]}
                  numberOfLines={1}
                >
                  {song.title}
                </Text>
                <Text style={styles.artist} numberOfLines={1}>
                  {song.artist}
                </Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.screenPadding,
    paddingVertical: spacing.lg,
    borderBottomWidth: 0.5,
    borderBottomColor: 'rgba(255, 255, 255, 0.06)',
  },
  headerTitle: {
    ...typography.h3,
    color: colors.textPrimary,
  },
  clearButton: {
    ...typography.bodySmall,
    color: colors.defaultAccent,
    fontWeight: '600',
  },
  list: {
    paddingBottom: 40,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: spacing.screenPadding,
    gap: 12,
  },
  itemActive: {
    backgroundColor: 'rgba(139, 92, 246, 0.08)',
  },
  index: {
    width: 24,
    textAlign: 'center',
    ...typography.caption,
    color: colors.textTertiary,
  },
  indexActive: {
    color: colors.defaultAccent,
    fontSize: 16,
  },
  artwork: {
    width: 40,
    height: 40,
    borderRadius: 6,
    backgroundColor: colors.surface,
  },
  info: {
    flex: 1,
    gap: 2,
  },
  title: {
    ...typography.bodySmall,
    color: colors.textPrimary,
  },
  titleActive: {
    color: colors.defaultAccent,
    fontWeight: '700',
  },
  artist: {
    ...typography.caption,
    color: colors.textSecondary,
  },
});
