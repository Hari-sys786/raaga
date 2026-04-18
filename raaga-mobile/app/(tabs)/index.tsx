import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Dimensions,
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import Animated, { FadeInDown, FadeIn, FadeInRight } from 'react-native-reanimated';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { Screen } from '../../components/Common/Screen';
import { GlassCard } from '../../components/Common/GlassCard';
import { colors, typography, spacing } from '../../theme';
import { api } from '../../services/api';
import { usePlayerStore } from '../../stores/playerStore';
import { useLibraryStore } from '../../stores/libraryStore';
import { Song } from '../../types';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_GAP = 10;
const HERO_CARD_WIDTH = SCREEN_WIDTH * 0.72;
const SMALL_CARD_WIDTH = (SCREEN_WIDTH - spacing.screenPadding * 2 - CARD_GAP) / 2;
const GENRE_CARD_WIDTH = (SCREEN_WIDTH - spacing.screenPadding * 2 - CARD_GAP * 2) / 3;

// ─── Data ────────────────────────────────────────────────────────────────────

const genres = [
  { slug: 'bollywood', name: 'Bollywood', icon: 'film', color: '#FF6B6B', bg: 'rgba(255,107,107,0.08)' },
  { slug: 'pop', name: 'Pop', icon: 'mic', color: '#4ECDC4', bg: 'rgba(78,205,196,0.08)' },
  { slug: 'hiphop', name: 'Hip-Hop', icon: 'headset', color: '#FFE66D', bg: 'rgba(255,230,109,0.08)' },
  { slug: 'classical', name: 'Classical', icon: 'musical-notes', color: '#A8E6CF', bg: 'rgba(168,230,207,0.08)' },
  { slug: 'lofi', name: 'Lo-fi', icon: 'moon', color: '#DDA0DD', bg: 'rgba(221,160,221,0.08)' },
  { slug: 'indie', name: 'Indie', icon: 'color-palette', color: '#98D8C8', bg: 'rgba(152,216,200,0.08)' },
  { slug: 'edm', name: 'EDM', icon: 'volume-high', color: '#F7DC6F', bg: 'rgba(247,220,111,0.08)' },
  { slug: 'rock', name: 'Rock', icon: 'flash', color: '#E74C3C', bg: 'rgba(231,76,60,0.08)' },
  { slug: 'devotional', name: 'Devotional', icon: 'flower', color: '#F39C12', bg: 'rgba(243,156,18,0.08)' },
  { slug: 'ghazal', name: 'Ghazal', icon: 'rose', color: '#8E44AD', bg: 'rgba(142,68,173,0.08)' },
  { slug: 'sufi', name: 'Sufi', icon: 'sparkles', color: '#2ECC71', bg: 'rgba(46,204,113,0.08)' },
  { slug: 'punjabi', name: 'Punjabi', icon: 'musical-note', color: '#E67E22', bg: 'rgba(230,126,34,0.08)' },
];

const moods = [
  { slug: 'chill', name: 'Chill', gradient: ['#667eea', '#764ba2'] as [string, string], icon: 'moon-outline' },
  { slug: 'workout', name: 'Workout', gradient: ['#f093fb', '#f5576c'] as [string, string], icon: 'barbell-outline' },
  { slug: 'romance', name: 'Romance', gradient: ['#a18cd1', '#fbc2eb'] as [string, string], icon: 'heart-outline' },
  { slug: 'party', name: 'Party', gradient: ['#ffecd2', '#fcb69f'] as [string, string], icon: 'sparkles-outline' },
  { slug: 'focus', name: 'Focus', gradient: ['#a1c4fd', '#c2e9fb'] as [string, string], icon: 'eye-outline' },
  { slug: 'sad', name: 'Sad', gradient: ['#667eea', '#764ba2'] as [string, string], icon: 'rainy-outline' },
  { slug: 'devotional', name: 'Devotional', gradient: ['#f6d365', '#fda085'] as [string, string], icon: 'flower-outline' },
  { slug: 'roadtrip', name: 'Road Trip', gradient: ['#84fab0', '#8fd3f4'] as [string, string], icon: 'car-outline' },
  { slug: 'happy', name: 'Happy', gradient: ['#fbc2eb', '#a6c1ee'] as [string, string], icon: 'happy-outline' },
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
  if (hour < 5) return 'Late Night';
  if (hour < 12) return 'Good Morning';
  if (hour < 17) return 'Good Afternoon';
  if (hour < 21) return 'Good Evening';
  return 'Good Night';
}

// ─── Hero Trending Card ──────────────────────────────────────────────────────

function HeroCard({ song, onPress, index }: { song: Song; onPress: () => void; index: number }) {
  return (
    <Animated.View entering={FadeInRight.delay(index * 80).duration(400)}>
      <TouchableOpacity
        style={styles.heroCard}
        onPress={onPress}
        activeOpacity={0.85}
      >
        <Image
          source={{ uri: song.image }}
          style={styles.heroImage}
          contentFit="cover"
          transition={300}
        />
        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.85)']}
          style={styles.heroOverlay}
        />
        <View style={styles.heroContent}>
          <View style={styles.heroNowPlayingBadge}>
            <View style={styles.heroDot} />
            <Text style={styles.heroBadgeText}>#{index + 1} Trending</Text>
          </View>
          <Text style={styles.heroTitle} numberOfLines={2}>{song.title}</Text>
          <Text style={styles.heroArtist} numberOfLines={1}>{song.artist}</Text>
        </View>
        <View style={styles.heroPlayFab}>
          <Ionicons name="play" size={18} color="#fff" />
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}

// ─── Recently Played Row ─────────────────────────────────────────────────────

function RecentCard({ song, onPress }: { song: Song; onPress: () => void }) {
  return (
    <TouchableOpacity style={styles.recentCard} onPress={onPress} activeOpacity={0.8}>
      <Image source={{ uri: song.image }} style={styles.recentArt} contentFit="cover" transition={200} />
      <View style={styles.recentInfo}>
        <Text style={styles.recentTitle} numberOfLines={1}>{song.title}</Text>
        <Text style={styles.recentArtist} numberOfLines={1}>{song.artist}</Text>
      </View>
    </TouchableOpacity>
  );
}

// ─── Compact Genre Pill ──────────────────────────────────────────────────────

function GenrePill({ genre, onPress }: { genre: typeof genres[0]; onPress: () => void }) {
  return (
    <TouchableOpacity
      style={[styles.genrePill, { backgroundColor: genre.bg, borderColor: genre.color + '20' }]}
      onPress={onPress}
      activeOpacity={0.75}
    >
      <Ionicons name={genre.icon as any} size={16} color={genre.color} />
      <Text style={[styles.genrePillText, { color: genre.color }]}>{genre.name}</Text>
    </TouchableOpacity>
  );
}

// ─── Mood Card (new design) ──────────────────────────────────────────────────

function MoodTile({ mood, onPress }: { mood: typeof moods[0]; onPress: () => void }) {
  return (
    <TouchableOpacity style={styles.moodTile} onPress={onPress} activeOpacity={0.8}>
      <LinearGradient
        colors={[mood.gradient[0] + '30', mood.gradient[1] + '15']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      <Ionicons name={mood.icon as any} size={20} color={mood.gradient[0]} />
      <Text style={styles.moodTileText}>{mood.name}</Text>
    </TouchableOpacity>
  );
}

// ─── Language Chip (new) ─────────────────────────────────────────────────────

function LangChip({ lang, onPress }: { lang: typeof languages[0]; onPress: () => void }) {
  return (
    <TouchableOpacity style={styles.langChip} onPress={onPress} activeOpacity={0.75}>
      <Text style={styles.langScript}>{lang.script}</Text>
      <Text style={styles.langName}>{lang.name}</Text>
    </TouchableOpacity>
  );
}

// ─── Section Header ──────────────────────────────────────────────────────────

function SectionHead({ title, onSeeAll }: { title: string; onSeeAll?: () => void }) {
  return (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {onSeeAll && (
        <TouchableOpacity onPress={onSeeAll} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Text style={styles.seeAll}>See All →</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

// ─── Home Screen ─────────────────────────────────────────────────────────────

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
        setError(err instanceof Error ? err.message : 'Failed to load');
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchTrending(); }, [fetchTrending]);

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    fetchTrending();
  }, [fetchTrending]);

  const handleSongPress = useCallback((song: Song) => {
    setQueue(trending);
    play(song);
  }, [play, setQueue, trending]);

  const handleRecentPress = useCallback((song: Song) => {
    setQueue(recentlyPlayed);
    play(song);
  }, [play, setQueue, recentlyPlayed]);

  const heroSongs = trending.slice(0, 5);
  const recentSongs = recentlyPlayed.slice(0, 6);

  return (
    <Screen scroll refreshing={refreshing} onRefresh={handleRefresh}>

      {/* ─── Header ─── */}
      <Animated.View entering={FadeIn.duration(600)} style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.greeting}>{getGreeting()}</Text>
          <Text style={styles.brandName}>Raaga</Text>
        </View>
        <View style={styles.headerActions}>
          <TouchableOpacity
            style={styles.headerIconBtn}
            onPress={() => router.push('/search')}
            activeOpacity={0.7}
          >
            <Ionicons name="search" size={20} color={colors.textPrimary} />
          </TouchableOpacity>
        </View>
      </Animated.View>

      {/* ─── Recently Played (2-col grid) ─── */}
      {recentSongs.length > 0 && (
        <Animated.View entering={FadeInDown.delay(50).duration(400)} style={styles.section}>
          <SectionHead title="Jump Back In" />
          <View style={styles.recentGrid}>
            {recentSongs.map((song) => (
              <RecentCard key={song.id} song={song} onPress={() => handleRecentPress(song)} />
            ))}
          </View>
        </Animated.View>
      )}

      {/* ─── Trending Hero Carousel ─── */}
      <Animated.View entering={FadeInDown.delay(100).duration(500)} style={styles.section}>
        <SectionHead title="Trending" onSeeAll={() => router.push('/trending')} />
        {loading ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator size="large" color={colors.defaultAccent} />
          </View>
        ) : error ? (
          <GlassCard style={styles.errorCard}>
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity onPress={handleRefresh} style={styles.retryBtn}>
              <Text style={styles.retryText}>Retry</Text>
            </TouchableOpacity>
          </GlassCard>
        ) : (
          <FlatList
            data={heroSongs}
            keyExtractor={(item) => item.id}
            renderItem={({ item, index }) => (
              <HeroCard song={item} onPress={() => handleSongPress(item)} index={index} />
            )}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.heroList}
            snapToInterval={HERO_CARD_WIDTH + 14}
            decelerationRate="fast"
          />
        )}
      </Animated.View>

      {/* ─── Moods ─── */}
      <Animated.View entering={FadeInDown.delay(200).duration(500)} style={styles.section}>
        <SectionHead title="Moods" />
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.moodRow}
        >
          {moods.map((mood) => (
            <MoodTile key={mood.slug} mood={mood} onPress={() => router.push(`/mood/${mood.slug}`)} />
          ))}
        </ScrollView>
      </Animated.View>

      {/* ─── Genres (pill grid) ─── */}
      <Animated.View entering={FadeInDown.delay(300).duration(500)} style={styles.section}>
        <SectionHead title="Browse Genres" />
        <View style={styles.genreGrid}>
          {genres.map((genre) => (
            <GenrePill key={genre.slug} genre={genre} onPress={() => router.push(`/genre/${genre.slug}`)} />
          ))}
        </View>
      </Animated.View>

      {/* ─── Languages ─── */}
      <Animated.View entering={FadeInDown.delay(350).duration(500)} style={styles.section}>
        <SectionHead title="By Language" />
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.langRow}
        >
          {languages.map((lang) => (
            <LangChip key={lang.slug} lang={lang} onPress={() => router.push(`/genre/${lang.slug}`)} />
          ))}
        </ScrollView>
      </Animated.View>

      <View style={{ height: 120 }} />
    </Screen>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.screenPadding,
    paddingTop: 12,
    paddingBottom: 20,
  },
  headerLeft: {
    gap: 2,
  },
  greeting: {
    fontSize: 13,
    fontWeight: '500',
    color: colors.textTertiary,
    letterSpacing: 0.3,
  },
  brandName: {
    fontSize: 28,
    fontWeight: '800',
    color: colors.textPrimary,
    letterSpacing: -0.8,
  },
  headerActions: {
    flexDirection: 'row',
    gap: 8,
  },
  headerIconBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: colors.surfaceElevated,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },

  // Sections
  section: {
    marginBottom: 28,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.screenPadding,
    marginBottom: 14,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.textPrimary,
    letterSpacing: -0.3,
  },
  seeAll: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.defaultAccent,
  },

  // Hero carousel
  heroList: {
    paddingLeft: spacing.screenPadding,
    paddingRight: spacing.lg,
    gap: 14,
  },
  heroCard: {
    width: HERO_CARD_WIDTH,
    height: HERO_CARD_WIDTH * 0.62,
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: colors.surfaceElevated,
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },
  heroOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'flex-end',
  },
  heroContent: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
  },
  heroNowPlayingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginBottom: 6,
  },
  heroDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.defaultAccent,
  },
  heroBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.defaultAccent,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  heroTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#fff',
    letterSpacing: -0.3,
    lineHeight: 22,
  },
  heroArtist: {
    fontSize: 12,
    fontWeight: '500',
    color: 'rgba(255,255,255,0.7)',
    marginTop: 3,
  },
  heroPlayFab: {
    position: 'absolute',
    bottom: 14,
    right: 14,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.defaultAccent,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.defaultAccent,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 6,
  },

  // Recently played grid
  recentGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: spacing.screenPadding,
    gap: CARD_GAP,
  },
  recentCard: {
    width: SMALL_CARD_WIDTH,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 10,
    overflow: 'hidden',
    height: 56,
  },
  recentArt: {
    width: 56,
    height: 56,
    backgroundColor: colors.surfaceElevated,
  },
  recentInfo: {
    flex: 1,
    paddingHorizontal: 10,
    gap: 2,
  },
  recentTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  recentArtist: {
    fontSize: 10,
    color: colors.textTertiary,
  },

  // Genre pills
  genreGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: spacing.screenPadding,
    gap: 8,
  },
  genrePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
  },
  genrePillText: {
    fontSize: 13,
    fontWeight: '600',
  },

  // Mood tiles
  moodRow: {
    paddingLeft: spacing.screenPadding,
    paddingRight: spacing.lg,
    gap: 10,
  },
  moodTile: {
    width: 88,
    height: 80,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.04)',
    overflow: 'hidden',
  },
  moodTileText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.textSecondary,
  },

  // Language chips
  langRow: {
    paddingLeft: spacing.screenPadding,
    paddingRight: spacing.lg,
    gap: 8,
  },
  langChip: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    gap: 2,
  },
  langScript: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  langName: {
    fontSize: 9,
    fontWeight: '500',
    color: colors.textTertiary,
    letterSpacing: 0.3,
  },

  // States
  loadingBox: {
    height: 160,
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
  retryBtn: {
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
});
