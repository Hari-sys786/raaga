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

const LANGUAGE_SLUGS = [
  'hindi', 'english', 'telugu', 'tamil', 'punjabi',
  'kannada', 'malayalam', 'bengali', 'marathi', 'gujarati',
];

const GENRE_LABELS: Record<string, string> = {
  bollywood: 'Bollywood', pop: 'Pop', hiphop: 'Hip-Hop',
  classical: 'Classical', lofi: 'Lo-fi', indie: 'Indie',
  edm: 'EDM', rock: 'Rock', devotional: 'Devotional',
  ghazal: 'Ghazal', sufi: 'Sufi', punjabi: 'Punjabi',
};

const GENRE_COLORS: Record<string, string> = {
  bollywood: '#FF6B6B', pop: '#4ECDC4', hiphop: '#FFE66D',
  classical: '#A8E6CF', lofi: '#DDA0DD', indie: '#98D8C8',
  edm: '#F7DC6F', rock: '#E74C3C', devotional: '#F39C12',
  ghazal: '#8E44AD', sufi: '#2ECC71', punjabi: '#E67E22',
  hindi: '#FF6B6B', english: '#4ECDC4', telugu: '#FFE66D',
  tamil: '#A8E6CF', kannada: '#DDA0DD', malayalam: '#98D8C8',
  bengali: '#F7DC6F', marathi: '#E74C3C', gujarati: '#F39C12',
};

export default function GenrePage() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [songs, setSongs] = useState<Song[]>([]);
  // Personalization: get favorites, recents, downloads
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { favorites, recentlyPlayed } = require('../../stores/libraryStore').useLibraryStore();
  const { downloads }: { downloads: Record<string, any> } = require('../../stores/downloadStore').useDownloadStore();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const play = usePlayerStore((s) => s.play);
  const setQueue = usePlayerStore((s) => s.setQueue);

  const genreName = slug || '';
  const isLanguage = LANGUAGE_SLUGS.includes(genreName);
  const displayName = GENRE_LABELS[genreName] || genreName.charAt(0).toUpperCase() + genreName.slice(1);
  const accentColor = GENRE_COLORS[genreName] || colors.defaultAccent;

  const fetchSongs = useCallback(async () => {
    try {
      setError(null);
      const data = isLanguage
        ? await api.trending(genreName)
        : await api.genre(genreName);
      const results = Array.isArray(data)
        ? data
        : data?.songs || data?.results || data?.data || [];

      // Personalization: blend in favorites, recents, downloads matching genre
      const lowerGenre = genreName.toLowerCase();
      const userSongs: Song[] = [];
      const seen = new Set<string>();
      // Helper to add unique songs (match by genre name in title or artist)
      const addUnique = (arr: Song[]) => {
        for (const s of arr) {
          if (!seen.has(s.id) && (
            (s.title && s.title.toLowerCase().includes(lowerGenre)) ||
            (s.artist && s.artist.toLowerCase().includes(lowerGenre))
          )) {
            seen.add(s.id);
            userSongs.push(s);
          }
        }
      };
      addUnique(favorites);
      addUnique(recentlyPlayed);
      addUnique(Object.values(downloads ?? {}).map((d: any) => d.song));
      // Merge userSongs at the top, then results (deduped)
      const final: Song[] = [...userSongs];
      for (const s of results) {
        if (!seen.has(s.id)) {
          seen.add(s.id);
          final.push(s);
        }
      }
      setSongs(final);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load songs');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [genreName, isLanguage]);

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
        colors={[accentColor + '25', 'transparent']}
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
          <View style={styles.headerTitles}>
            <Text style={styles.title} numberOfLines={1}>{displayName}</Text>
            {isLanguage && (
              <Text style={[styles.subtitle, { color: accentColor }]}>Trending</Text>
            )}
          </View>
        </View>
      </LinearGradient>

      {/* Content */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={accentColor} />
        </View>
      ) : error ? (
        <GlassCard style={styles.errorCard}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity onPress={handleRefresh} style={[styles.retryButton, { backgroundColor: accentColor }]}>
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
  headerTitles: {
    flex: 1,
  },
  title: {
    ...typography.h2,
    color: colors.textPrimary,
  },
  subtitle: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: -2,
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
