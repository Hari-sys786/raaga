import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Screen } from '../../components/Common/Screen';
import { GlassCard } from '../../components/Common/GlassCard';
import { GenreCard } from '../../components/Cards/GenreCard';
import { MoodCard } from '../../components/Cards/MoodCard';
import { LanguageChip } from '../../components/Cards/LanguageChip';
import { colors, typography, spacing } from '../../theme';
import { api } from '../../services/api';
import { usePlayerStore } from '../../stores/playerStore';
import { useLibraryStore } from '../../stores/libraryStore';
import { Song } from '../../types';

const genres = [
  { slug: 'bollywood', name: 'Bollywood', emoji: '', color: '#FF6B6B' },
  { slug: 'pop', name: 'Pop', emoji: '', color: '#4ECDC4' },
  { slug: 'hiphop', name: 'Hip-Hop', emoji: '', color: '#FFE66D' },
  { slug: 'classical', name: 'Classical', emoji: '', color: '#A8E6CF' },
  { slug: 'lofi', name: 'Lo-fi', emoji: '', color: '#DDA0DD' },
  { slug: 'indie', name: 'Indie', emoji: '', color: '#98D8C8' },
  { slug: 'edm', name: 'EDM', emoji: '', color: '#F7DC6F' },
  { slug: 'rock', name: 'Rock', emoji: '', color: '#E74C3C' },
  { slug: 'devotional', name: 'Devotional', emoji: '', color: '#F39C12' },
  { slug: 'ghazal', name: 'Ghazal', emoji: '', color: '#8E44AD' },
  { slug: 'sufi', name: 'Sufi', emoji: '', color: '#2ECC71' },
  { slug: 'punjabi', name: 'Punjabi', emoji: '', color: '#E67E22' },
];

const moods = [
  { slug: 'chill', name: 'Chill', emoji: '', gradient: ['#667eea', '#764ba2'] as [string, string] },
  { slug: 'workout', name: 'Workout', emoji: '', gradient: ['#f093fb', '#f5576c'] as [string, string] },
  { slug: 'romance', name: 'Romance', emoji: '', gradient: ['#a18cd1', '#fbc2eb'] as [string, string] },
  { slug: 'party', name: 'Party', emoji: '', gradient: ['#ffecd2', '#fcb69f'] as [string, string] },
  { slug: 'focus', name: 'Focus', emoji: '', gradient: ['#a1c4fd', '#c2e9fb'] as [string, string] },
  { slug: 'sad', name: 'Sad', emoji: '', gradient: ['#667eea', '#764ba2'] as [string, string] },
  { slug: 'devotional', name: 'Devotional', emoji: '', gradient: ['#f6d365', '#fda085'] as [string, string] },
  { slug: 'roadtrip', name: 'Road Trip', emoji: '', gradient: ['#84fab0', '#8fd3f4'] as [string, string] },
  { slug: 'rain', name: 'Rainy Day', emoji: '', gradient: ['#a6c0fe', '#f68084'] as [string, string] },
  { slug: 'happy', name: 'Happy', emoji: '', gradient: ['#fbc2eb', '#a6c1ee'] as [string, string] },
];

const languages = [
  { slug: 'hindi', name: 'Hindi', script: 'हिंदी' },
  { slug: 'english', name: 'English', script: 'EN' },
  { slug: 'telugu', name: 'Telugu', script: 'తెలుగు' },
  { slug: 'tamil', name: 'Tamil', script: 'தமிழ்' },
  { slug: 'punjabi', name: 'Punjabi', script: 'ਪੰਜਾਬੀ' },
  { slug: 'kannada', name: 'Kannada', script: 'ಕನ್ನಡ' },
  { slug: 'malayalam', name: 'Malayalam', script: 'മലയാളം' },
  { slug: 'bengali', name: 'Bengali', script: 'বাংলা' },
  { slug: 'marathi', name: 'Marathi', script: 'मराठी' },
  { slug: 'gujarati', name: 'Gujarati', script: 'ગુજરાતી' },
];

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good Morning';
  if (hour < 17) return 'Good Afternoon';
  return 'Good Evening';
}

// ── QuickPlayCard ────────────────────────────────────────────────────────────
// First card is large (160×160), rest are small (120×120)
function QuickPlayCard({
  song,
  onPress,
  large = false,
}: {
  song: Song;
  onPress: () => void;
  large?: boolean;
}) {
  const size = large ? 160 : 120;
  return (
    <TouchableOpacity
      style={[quickStyles.card, { width: size, marginRight: large ? 16 : 10 }]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <Image
        source={{ uri: song.image }}
        style={[quickStyles.art, { width: size, height: size }]}
        contentFit="cover"
        transition={200}
      />
      <Text style={quickStyles.title} numberOfLines={1}>{song.title}</Text>
      <Text style={quickStyles.artist} numberOfLines={1}>{song.artist}</Text>
    </TouchableOpacity>
  );
}

const quickStyles = StyleSheet.create({
  card: {
    flexShrink: 0,
  },
  art: {
    borderRadius: 12,
    backgroundColor: colors.surfaceElevated,
    marginBottom: 8,
  },
  title: {
    ...typography.bodySmall,
    color: colors.textPrimary,
    fontWeight: '600',
  },
  artist: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: 2,
  },
});

// ── GenreGrid ────────────────────────────────────────────────────────────────
// 2-column wrap grid instead of horizontal scroll
function GenreGrid({ onPress }: { onPress: (slug: string) => void }) {
  return (
    <View style={gridStyles.grid}>
      {genres.map((genre) => (
        <View key={genre.slug} style={gridStyles.cell}>
          <GenreCard genre={genre} onPress={() => onPress(genre.slug)} />
        </View>
      ))}
    </View>
  );
}

const gridStyles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: spacing.screenPadding,
    gap: spacing.sm,
  },
  cell: {
    // Each cell is half the available width minus half the gap
    // (screenPadding×2 = 44 total, gap = 8)
    width: '47.5%',
  },
});

// ── HomeScreen ───────────────────────────────────────────────────────────────
export default function HomeScreen() {
  const router = useRouter();
  const [trending, setTrending] = useState<Song[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const play = usePlayerStore((s) => s.play);
  const setQueue = usePlayerStore((s) => s.setQueue);
  const favorites = useLibraryStore((s) => s.favorites);
  const recentlyPlayed = useLibraryStore((s) => s.recentlyPlayed);

  const fetchTrending = useCallback(async () => {
    try {
      setError(null);
      const data = await api.viral();
      const songs = Array.isArray(data) ? data : data?.data || data?.results || [];
      setTrending(songs);
    } catch (err: unknown) {
      try {
        const data = await api.trending('hindi');
        const songs = Array.isArray(data) ? data : data?.results || data?.data || [];
        setTrending(songs);
      } catch {
        setError(err instanceof Error ? err.message : 'Failed to load trending');
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchTrending();
  }, [fetchTrending]);

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    fetchTrending();
  }, [fetchTrending]);

  const handleSongPress = useCallback(
    (song: Song) => {
      play(song);
      setQueue(trending);
    },
    [play, setQueue, trending]
  );

  const handlePlayMyMix = useCallback(() => {
    // Build a mix: favorites first, then recent, then trending — deduplicated & shuffled
    const seen = new Set<string>();
    const mix: Song[] = [];
    const addUnique = (songs: Song[]) => {
      for (const s of songs) {
        if (!seen.has(s.id)) {
          seen.add(s.id);
          mix.push(s);
        }
      }
    };
    addUnique(favorites);
    addUnique(recentlyPlayed);

    // Detect user's preferred languages from listening history
    const userLangs = new Set<string>();
    [...favorites, ...recentlyPlayed].forEach((s) => {
      if (s.language) userLangs.add(s.language.toLowerCase());
    });

    // Filter trending to include songs matching user's languages (if any detected)
    if (userLangs.size > 0) {
      const langTrending = trending.filter(
        (s) => s.language && userLangs.has(s.language.toLowerCase())
      );
      addUnique(langTrending.length > 5 ? langTrending.slice(0, 30) : trending.slice(0, 20));
    } else {
      addUnique(trending.slice(0, 20));
    }

    // Fisher-Yates shuffle
    for (let i = mix.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [mix[i], mix[j]] = [mix[j], mix[i]];
    }
    if (mix.length > 0) {
      setQueue(mix);
      play(mix[0]);
    }
  }, [favorites, recentlyPlayed, trending, play, setQueue]);

  const hasMixContent = favorites.length > 0 || recentlyPlayed.length > 0;
  const trendingSongs = trending.slice(0, 10);

  return (
    <Screen scroll refreshing={refreshing} onRefresh={handleRefresh}>

      {/* ── Hero Header ── */}
      <Animated.View entering={FadeInDown.duration(500)} style={styles.header}>
        <Text style={styles.greeting}>{getGreeting()}</Text>
        <View style={styles.logoBlock}>
          <Text style={styles.logo}>राग</Text>
          <Text style={styles.logoSub}>Raaga</Text>
        </View>
      </Animated.View>

      {/* ── Trending Now ── */}
      <Animated.View entering={FadeInDown.delay(100).duration(500)} style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>TRENDING NOW</Text>
          <TouchableOpacity onPress={() => router.push('/trending')}>
            <Text style={styles.seeAll}>See All</Text>
          </TouchableOpacity>
        </View>

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
        ) : trendingSongs.length === 0 ? (
          <GlassCard style={{ marginHorizontal: spacing.screenPadding }}>
            <Text style={styles.emptyText}>No trending songs found</Text>
          </GlassCard>
        ) : (
          <FlatList
            data={trendingSongs}
            keyExtractor={(item) => item.id}
            renderItem={({ item, index }) => (
              <QuickPlayCard
                song={item}
                onPress={() => handleSongPress(item)}
                large={index === 0}
              />
            )}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.horizontalList}
          />
        )}
      </Animated.View>

      {/* ── Browse by Genre — 2-col grid ── */}
      <Animated.View entering={FadeInDown.delay(200).duration(500)} style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>GENRES</Text>
        </View>
        <GenreGrid onPress={(slug) => router.push(`/genre/${slug}`)} />
      </Animated.View>

      {/* ── Browse by Mood ── */}
      <Animated.View entering={FadeInDown.delay(300).duration(500)} style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>MOODS</Text>
        </View>
        <FlatList
          data={moods}
          keyExtractor={(item) => item.slug}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.horizontalList}
          renderItem={({ item }) => (
            <MoodCard mood={item} onPress={() => router.push(`/mood/${item.slug}`)} />
          )}
        />
      </Animated.View>

      {/* ── Browse by Language ── */}
      <Animated.View entering={FadeInDown.delay(400).duration(500)} style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>LANGUAGES</Text>
        </View>
        <FlatList
          data={languages}
          keyExtractor={(item) => item.slug}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.horizontalList}
          renderItem={({ item }) => (
            <LanguageChip language={item} onPress={() => router.push(`/genre/${item.slug}`)} />
          )}
        />
      </Animated.View>

      <View style={{ height: 100 }} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  // ── Header ──
  header: {
    paddingHorizontal: spacing.screenPadding,
    paddingTop: spacing.xxl + 8,
    paddingBottom: spacing.xl,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  headerSearchButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  greeting: {
    ...typography.bodySmall,
    color: colors.textTertiary,
    letterSpacing: 0.5,
    marginBottom: 6,
    textTransform: 'uppercase',
    fontSize: 11,
    fontWeight: '600',
  },
  logoBlock: {
    marginTop: 2,
  },
  logo: {
    fontSize: 44,
    fontWeight: '800',
    color: colors.defaultAccent,
    letterSpacing: -1.5,
    lineHeight: 50,
    textShadowColor: 'rgba(6, 182, 212, 0.35)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 12,
  },
  logoSub: {
    fontSize: 15,
    fontWeight: '300',
    color: colors.textTertiary,
    letterSpacing: 3,
    textTransform: 'uppercase',
    marginTop: 2,
  },

  // ── Section ──
  section: {
    marginBottom: spacing.sectionGap,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.screenPadding,
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.textSecondary,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
  seeAll: {
    ...typography.bodySmall,
    color: colors.defaultAccent,
    fontWeight: '600',
  },

  // ── States ──
  loadingContainer: {
    height: 120,
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
    color: colors.background,
    fontWeight: '700',
  },
  emptyText: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  horizontalList: {
    paddingLeft: spacing.screenPadding,
    paddingRight: spacing.lg,
  },

  // ── Mix Card ──
  mixCard: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: spacing.screenPadding,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(6,182,212,0.15)',
    overflow: 'hidden',
    paddingVertical: 16,
    paddingHorizontal: 16,
    gap: 14,
  },
  mixIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(6,182,212,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  mixTextBlock: {
    flex: 1,
    gap: 2,
  },
  mixTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  mixSub: {
    fontSize: 12,
    color: colors.textTertiary,
  },
  mixPlayBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.defaultAccent,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
