import React from 'react';
import { View, Text, StyleSheet, FlatList } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Screen } from '../../components/Common/Screen';
import { SongCard } from '../../components/Cards/SongCard';
import { useLibraryStore } from '../../stores/libraryStore';
import { usePlayerStore } from '../../stores/playerStore';
import { colors, typography, spacing } from '../../theme';
import { Song } from '../../types';

export default function LibraryScreen() {
  const favorites = useLibraryStore((s) => s.favorites);
  const recentlyPlayed = useLibraryStore((s) => s.recentlyPlayed);
  const play = usePlayerStore((s) => s.play);
  const setQueue = usePlayerStore((s) => s.setQueue);

  const handlePlaySong = (song: Song, list: Song[]) => {
    setQueue(list);
    play(song);
  };

  const isEmpty = favorites.length === 0 && recentlyPlayed.length === 0;

  return (
    <Screen scroll>
      <View style={styles.header}>
        <Text style={styles.title}>Library</Text>
      </View>

      {/* Favorites Section */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Ionicons name="heart" size={20} color="#FF6B6B" />
          <Text style={styles.sectionTitle}>Favorites</Text>
          <Text style={styles.sectionCount}>{favorites.length}</Text>
        </View>

        {favorites.length > 0 ? (
          favorites.map((song) => (
            <SongCard
              key={song.id}
              song={song}
              onPress={() => handlePlaySong(song, favorites)}
            />
          ))
        ) : (
          <View style={styles.sectionEmpty}>
            <Text style={styles.sectionEmptyText}>
              No favorites yet. Tap the heart on a song to add it here.
            </Text>
          </View>
        )}
      </View>

      {/* Recently Played Section */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Ionicons name="time" size={20} color={colors.textSecondary} />
          <Text style={styles.sectionTitle}>Recently Played</Text>
          <Text style={styles.sectionCount}>{recentlyPlayed.length}</Text>
        </View>

        {recentlyPlayed.length > 0 ? (
          recentlyPlayed.map((song) => (
            <SongCard
              key={song.id}
              song={song}
              onPress={() => handlePlaySong(song, recentlyPlayed)}
            />
          ))
        ) : (
          <View style={styles.sectionEmpty}>
            <Text style={styles.sectionEmptyText}>
              Start playing music to build your history.
            </Text>
          </View>
        )}
      </View>

      {isEmpty && (
        <View style={styles.emptyState}>
          <Ionicons name="musical-notes" size={48} color={colors.textTertiary} />
          <Text style={styles.emptyTitle}>Your library is empty</Text>
          <Text style={styles.emptySubtitle}>
            Start playing music to build your library
          </Text>
        </View>
      )}

      <View style={{ height: 100 }} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: spacing.screenPadding,
    paddingTop: spacing.xxl,
    paddingBottom: spacing.lg,
  },
  title: {
    ...typography.h1,
    color: colors.textPrimary,
  },
  section: {
    marginBottom: spacing.sectionGap,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.screenPadding,
    marginBottom: spacing.md,
    gap: spacing.sm,
  },
  sectionTitle: {
    ...typography.h4,
    color: colors.textPrimary,
    flex: 1,
  },
  sectionCount: {
    ...typography.caption,
    color: colors.textTertiary,
  },
  sectionEmpty: {
    paddingHorizontal: spacing.screenPadding,
    paddingVertical: spacing.xl,
  },
  sectionEmptyText: {
    ...typography.bodySmall,
    color: colors.textTertiary,
    textAlign: 'center',
  },
  emptyState: {
    alignItems: 'center',
    paddingTop: spacing.xxl,
    paddingHorizontal: spacing.screenPadding,
    gap: spacing.md,
  },
  emptyTitle: {
    ...typography.h4,
    color: colors.textSecondary,
  },
  emptySubtitle: {
    ...typography.bodySmall,
    color: colors.textTertiary,
    textAlign: 'center',
  },
});
