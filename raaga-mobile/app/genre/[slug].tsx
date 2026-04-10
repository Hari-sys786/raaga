import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Screen } from '../../components/Common/Screen';
import { SongCard } from '../../components/Cards/SongCard';
import { GlassCard } from '../../components/Common/GlassCard';
import { colors, typography, spacing } from '../../theme';
import { api } from '../../services/api';
import { usePlayerStore } from '../../stores/playerStore';
import { Song } from '../../types';

const GENRE_LABELS: Record<string, string> = {
  bollywood: 'Bollywood 🎬',
  pop: 'Pop 🎤',
  hiphop: 'Hip-Hop 🎧',
  classical: 'Classical 🎻',
  lofi: 'Lo-fi 🌙',
  indie: 'Indie 🎸',
  edm: 'EDM 🔊',
  rock: 'Rock 🤘',
  devotional: 'Devotional 🙏',
  ghazal: 'Ghazal 🌹',
  sufi: 'Sufi 💫',
  punjabi: 'Punjabi 🥁',
};

export default function GenrePage() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const router = useRouter();
  const [songs, setSongs] = useState<Song[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const play = usePlayerStore((s) => s.play);
  const setQueue = usePlayerStore((s) => s.setQueue);

  const genreName = slug || '';
  const displayName = GENRE_LABELS[genreName] || genreName.charAt(0).toUpperCase() + genreName.slice(1);

  const fetchSongs = useCallback(async () => {
    try {
      setError(null);
      const data = await api.search(genreName);
      const results = Array.isArray(data)
        ? data
        : data?.songs || data?.results || data?.data || [];
      setSongs(results);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load songs');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [genreName]);

  useEffect(() => {
    fetchSongs();
  }, [fetchSongs]);

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    fetchSongs();
  }, [fetchSongs]);

  const handleSongPress = useCallback(
    (song: Song) => {
      setQueue(songs);
      play(song);
    },
    [songs, play, setQueue]
  );

  return (
    <Screen scroll refreshing={refreshing} onRefresh={handleRefresh}>
      {/* Back Button */}
      <TouchableOpacity
        style={styles.backButton}
        onPress={() => router.back()}
      >
        <Text style={styles.backText}>← Back</Text>
      </TouchableOpacity>

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>{displayName}</Text>
      </View>

      {/* Content */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.defaultAccent} />
        </View>
      ) : error ? (
        <GlassCard style={styles.errorCard}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity onPress={handleRefresh} style={styles.retryButton}>
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </GlassCard>
      ) : songs.length === 0 ? (
        <GlassCard style={styles.emptyCard}>
          <Text style={styles.emptyText}>No songs found for {displayName}</Text>
        </GlassCard>
      ) : (
        songs.map((song) => (
          <SongCard
            key={song.id}
            song={song}
            onPress={() => handleSongPress(song)}
          />
        ))
      )}

      {/* Bottom spacer */}
      <View style={{ height: 100 }} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  backButton: {
    paddingHorizontal: spacing.screenPadding,
    paddingTop: spacing.lg,
    paddingBottom: spacing.sm,
  },
  backText: {
    ...typography.body,
    color: colors.defaultAccent,
  },
  header: {
    paddingHorizontal: spacing.screenPadding,
    paddingVertical: spacing.xl,
  },
  title: {
    ...typography.h1,
    color: colors.textPrimary,
  },
  loadingContainer: {
    height: 200,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorCard: {
    marginHorizontal: spacing.screenPadding,
    alignItems: 'center',
    gap: spacing.md,
  },
  errorText: {
    ...typography.bodySmall,
    color: colors.error,
    textAlign: 'center',
  },
  retryButton: {
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.sm,
    borderRadius: spacing.buttonRadiusLarge,
    backgroundColor: colors.defaultAccent,
  },
  retryText: {
    ...typography.bodySmall,
    color: colors.textPrimary,
    fontWeight: '600',
  },
  emptyCard: {
    marginHorizontal: spacing.screenPadding,
    alignItems: 'center',
  },
  emptyText: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
  },
});
