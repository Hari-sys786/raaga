import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Screen } from '../../components/Common/Screen';
import { SongCard } from '../../components/Cards/SongCard';
import { GlassCard } from '../../components/Common/GlassCard';
import { colors, typography, spacing } from '../../theme';
import { api } from '../../services/api';
import { usePlayerStore } from '../../stores/playerStore';
import { Song } from '../../types';

const MOOD_CONFIG: Record<string, { label: string; searchTerms: string; gradient: [string, string] }> = {
  chill: { label: 'Chill', searchTerms: 'chill vibes relaxing', gradient: ['#667eea', '#764ba2'] },
  workout: { label: 'Workout', searchTerms: 'workout energy pump', gradient: ['#f093fb', '#f5576c'] },
  romance: { label: 'Romance', searchTerms: 'romantic love songs', gradient: ['#a18cd1', '#fbc2eb'] },
  party: { label: 'Party', searchTerms: 'party dance songs', gradient: ['#ffecd2', '#fcb69f'] },
  focus: { label: 'Focus', searchTerms: 'focus concentration instrumental', gradient: ['#a1c4fd', '#c2e9fb'] },
  sad: { label: 'Sad', searchTerms: 'sad emotional heartbreak', gradient: ['#667eea', '#764ba2'] },
  devotional: { label: 'Devotional', searchTerms: 'devotional bhajan prayer', gradient: ['#f6d365', '#fda085'] },
  roadtrip: { label: 'Road Trip', searchTerms: 'road trip travel driving', gradient: ['#84fab0', '#8fd3f4'] },
  rain: { label: 'Rainy Day', searchTerms: 'rain monsoon barish', gradient: ['#a6c0fe', '#f68084'] },
  happy: { label: 'Happy', searchTerms: 'happy upbeat feel good', gradient: ['#fbc2eb', '#a6c1ee'] },
};

export default function MoodPage() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [songs, setSongs] = useState<Song[]>([]);
  // Personalization: get favorites, recents, downloads
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { favorites, recentlyPlayed } = require('../../stores/libraryStore').useLibraryStore();
  const { downloads } = require('../../stores/downloadStore').useDownloadStore();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const play = usePlayerStore((s) => s.play);
  const setQueue = usePlayerStore((s) => s.setQueue);

  const moodSlug = slug || '';
  const config = MOOD_CONFIG[moodSlug];
  const displayName = config?.label || moodSlug.charAt(0).toUpperCase() + moodSlug.slice(1);
  const gradient = config?.gradient || ['#8B5CF6', '#6D28D9'];

  const fetchSongs = useCallback(async () => {
    try {
      setError(null);
      let data = await api.genre(moodSlug);
      let results = Array.isArray(data)
        ? data
        : data?.songs || data?.results || data?.data || [];

      if (results.length < 5 && config?.searchTerms) {
        const searchData = await api.search(config.searchTerms);
        const searchResults = searchData?.results || searchData?.data || searchData?.songs || [];
        if (Array.isArray(searchResults) && searchResults.length > results.length) {
          results = searchResults;
        }
      }

      // Personalization: detect user's preferred languages from listening history
      // and prioritize results matching those languages
      const userLangs = new Set<string>();
      [...favorites, ...recentlyPlayed].forEach((s) => {
        if (s.language) userLangs.add(s.language.toLowerCase());
      });

      const seen = new Set<string>();
      const final: Song[] = [];

      // If user has language preferences, put matching-language results first
      if (userLangs.size > 0) {
        const matching = results.filter(
          (s: Song) => s.language && userLangs.has(s.language.toLowerCase())
        );
        const rest = results.filter(
          (s: Song) => !s.language || !userLangs.has(s.language.toLowerCase())
        );
        for (const s of [...matching, ...rest]) {
          if (!seen.has(s.id)) {
            seen.add(s.id);
            final.push(s);
          }
        }
      } else {
        for (const s of results) {
          if (!seen.has(s.id)) {
            seen.add(s.id);
            final.push(s);
          }
        }
      }
      setSongs(final);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load songs');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [moodSlug, config]);

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
      {/* Header — inline: back + title on same row */}
      <LinearGradient
        colors={[gradient[0] + '30', 'transparent']}
        style={[styles.headerGradient, { paddingTop: insets.top + 8 }]}
      >
        <View style={styles.headerRow}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.title} numberOfLines={1}>{displayName}</Text>
        </View>
      </LinearGradient>

      {/* Content */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={gradient[0]} />
        </View>
      ) : error ? (
        <GlassCard style={styles.errorCard}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity onPress={handleRefresh} style={[styles.retryButton, { backgroundColor: gradient[0] }]}>
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </GlassCard>
      ) : songs.length === 0 ? (
        <GlassCard style={styles.emptyCard}>
          <Ionicons name="musical-notes" size={40} color={colors.textTertiary} />
          <Text style={styles.emptyText}>No songs found for {displayName}</Text>
        </GlassCard>
      ) : (
        songs.map((song, index) => (
          <Animated.View key={song.id} entering={FadeInDown.delay(index * 40).springify()}>
            <SongCard song={song} onPress={() => handleSongPress(song)} />
          </Animated.View>
        ))
      )}

      <View style={{ height: 100 }} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  headerGradient: {
    paddingHorizontal: spacing.screenPadding,
    paddingBottom: spacing.lg,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    height: 48,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    ...typography.h2,
    color: colors.textPrimary,
    flex: 1,
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
  },
  retryText: {
    ...typography.bodySmall,
    color: colors.textPrimary,
    fontWeight: '600',
  },
  emptyCard: {
    marginHorizontal: spacing.screenPadding,
    alignItems: 'center',
    gap: spacing.md,
  },
  emptyText: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
  },
});
