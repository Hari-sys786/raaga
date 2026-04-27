import React, { useEffect, useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Dimensions,
  ScrollView,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import Animated, { FadeInDown, FadeIn, FadeInRight } from 'react-native-reanimated';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Screen } from '../../components/Common/Screen';
import { GlassCard } from '../../components/Common/GlassCard';
import { colors, typography, spacing } from '../../theme';
import { api } from '../../services/api';
import { usePlayerStore } from '../../stores/playerStore';
import { useLibraryStore } from '../../stores/libraryStore';
import { useSettingsStore } from '../../stores/settingsStore';
import { Song } from '../../types';

const { width: W } = Dimensions.get('window');
const HERO_W = W * 0.78;
const HERO_H = HERO_W * 0.58;
const RECENT_W = (W - spacing.screenPadding * 2 - 10) / 2;

// ─── Data ────────────────────────────────────────────────────────────────────

const GENRES = [
  { slug: 'bollywood', name: 'Bollywood', icon: 'film-outline', accent: '#FF6B6B' },
  { slug: 'pop', name: 'Pop', icon: 'mic-outline', accent: '#4ECDC4' },
  { slug: 'hiphop', name: 'Hip-Hop', icon: 'headset-outline', accent: '#FFE66D' },
  { slug: 'classical', name: 'Classical', icon: 'musical-notes-outline', accent: '#A8E6CF' },
  { slug: 'lofi', name: 'Lo-fi', icon: 'moon-outline', accent: '#C4B5FD' },
  { slug: 'indie', name: 'Indie', icon: 'color-palette-outline', accent: '#98D8C8' },
  { slug: 'edm', name: 'EDM', icon: 'volume-high-outline', accent: '#FBBF24' },
  { slug: 'rock', name: 'Rock', icon: 'flash-outline', accent: '#F87171' },
  { slug: 'devotional', name: 'Devotional', icon: 'flower-outline', accent: '#FB923C' },
  { slug: 'ghazal', name: 'Ghazal', icon: 'rose-outline', accent: '#A78BFA' },
  { slug: 'sufi', name: 'Sufi', icon: 'sparkles-outline', accent: '#34D399' },
  { slug: 'punjabi', name: 'Punjabi', icon: 'musical-note-outline', accent: '#F97316' },
];

const MOODS = [
  { slug: 'chill', name: 'Chill', icon: 'moon-outline', g: ['#667eea', '#764ba2'] as const },
  { slug: 'workout', name: 'Workout', icon: 'barbell-outline', g: ['#f093fb', '#f5576c'] as const },
  { slug: 'romance', name: 'Romance', icon: 'heart-outline', g: ['#E879F9', '#fbc2eb'] as const },
  { slug: 'party', name: 'Party', icon: 'sparkles-outline', g: ['#FBBF24', '#F97316'] as const },
  { slug: 'focus', name: 'Focus', icon: 'eye-outline', g: ['#60A5FA', '#818CF8'] as const },
  { slug: 'sad', name: 'Sad', icon: 'rainy-outline', g: ['#94A3B8', '#475569'] as const },
  { slug: 'devotional', name: 'Devotional', icon: 'flower-outline', g: ['#F59E0B', '#EF4444'] as const },
  { slug: 'roadtrip', name: 'Road Trip', icon: 'car-outline', g: ['#34D399', '#06B6D4'] as const },
  { slug: 'happy', name: 'Happy', icon: 'happy-outline', g: ['#F472B6', '#A78BFA'] as const },
];

const LANGS = [
  { slug: 'hindi', script: 'हि', name: 'Hindi' },
  { slug: 'english', script: 'En', name: 'English' },
  { slug: 'telugu', script: 'తె', name: 'Telugu' },
  { slug: 'tamil', script: 'த', name: 'Tamil' },
  { slug: 'punjabi', script: 'ਪੰ', name: 'Punjabi' },
  { slug: 'kannada', script: 'ಕ', name: 'Kannada' },
  { slug: 'malayalam', script: 'മല', name: 'Malayalam' },
  { slug: 'bengali', script: 'বা', name: 'Bengali' },
  { slug: 'marathi', script: 'म', name: 'Marathi' },
  { slug: 'gujarati', script: 'ગુ', name: 'Gujarati' },
];

function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 5) return 'Still up?';
  if (h < 12) return 'Good Morning';
  if (h < 17) return 'Good Afternoon';
  if (h < 21) return 'Good Evening';
  return 'Good Night';
}

// ─── Components ──────────────────────────────────────────────────────────────

function SectionHead({ title, action, onAction }: { title: string; action?: string; onAction?: () => void }) {
  return (
    <View style={s.secHead}>
      <Text style={s.secTitle}>{title}</Text>
      {action && onAction && (
        <TouchableOpacity onPress={onAction} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Text style={s.secAction}>{action}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

/** Large cinematic trending card with rank overlay */
function HeroCard({ song, rank, onPress }: { song: Song; rank: number; onPress: () => void }) {
  return (
    <TouchableOpacity style={s.hero} onPress={onPress} activeOpacity={0.88}>
      <Image source={{ uri: song.image }} style={s.heroImg} contentFit="cover" transition={400} />
      {/* Cinematic gradient */}
      <LinearGradient
        colors={['transparent', 'rgba(0,0,0,0.3)', 'rgba(8,11,18,0.92)']}
        locations={[0, 0.5, 1]}
        style={StyleSheet.absoluteFill}
      />
      {/* Rank watermark */}
      <Text style={s.heroRank}>{rank}</Text>
      {/* Info */}
      <View style={s.heroInfo}>
        <Text style={s.heroTitle} numberOfLines={2}>{song.title}</Text>
        <Text style={s.heroArtist} numberOfLines={1}>{song.artist}</Text>
      </View>
      {/* Play */}
      <View style={s.heroPlay}>
        <Ionicons name="play" size={16} color="#fff" />
      </View>
    </TouchableOpacity>
  );
}

/** Compact recently-played tile — album art flush left */
function RecentTile({ song, onPress }: { song: Song; onPress: () => void }) {
  return (
    <TouchableOpacity style={s.recent} onPress={onPress} activeOpacity={0.8}>
      <Image source={{ uri: song.image }} style={s.recentArt} contentFit="cover" transition={200} />
      <View style={s.recentText}>
        <Text style={s.recentTitle} numberOfLines={1}>{song.title}</Text>
        <Text style={s.recentSub} numberOfLines={1}>{song.artist}</Text>
      </View>
    </TouchableOpacity>
  );
}

// ─── Home Screen ─────────────────────────────────────────────────────────────

export default function HomeScreen() {
  const router = useRouter();
  const [trending, setTrending] = useState<Song[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const play = usePlayerStore((st) => st.play);
  const setQueue = usePlayerStore((st) => st.setQueue);
  const favorites = useLibraryStore((st) => st.favorites);
  const recentlyPlayed = useLibraryStore((st) => st.recentlyPlayed);
  const preferredLanguages = useSettingsStore((st) => st.preferredLanguages);
  const toggleLanguage = useSettingsStore((st) => st.toggleLanguage);

  const fetchTrending = useCallback(async () => {
    try {
      setError(null);
      const d = await api.viral();
      setTrending(Array.isArray(d) ? d : d?.data || d?.results || []);
    } catch (e: any) {
      try {
        const d = await api.trending('hindi');
        setTrending(Array.isArray(d) ? d : d?.results || d?.data || []);
      } catch { setError(e?.message || 'Failed'); }
    } finally { setLoading(false); setRefreshing(false); }
  }, []);

  useEffect(() => { fetchTrending(); }, [fetchTrending]);
  const onRefresh = useCallback(() => { setRefreshing(true); fetchTrending(); }, [fetchTrending]);

  const playSong = useCallback((song: Song, list: Song[]) => { setQueue(list); play(song); }, [play, setQueue]);

  const heroSongs = trending.slice(0, 6);
  const recents = recentlyPlayed.slice(0, 6);

  return (
    <Screen scroll refreshing={refreshing} onRefresh={onRefresh}>

      {/* ── Header ── */}
      <Animated.View entering={FadeIn.duration(500)} style={s.header}>
        <View>
          <Text style={s.greeting}>{getGreeting()}</Text>
          <Text style={s.brand}>Raaga</Text>
        </View>
        <TouchableOpacity style={s.searchBtn} onPress={() => router.push('/search')} activeOpacity={0.7}>
          <Ionicons name="search" size={20} color={colors.textPrimary} />
        </TouchableOpacity>
      </Animated.View>

      {/* ── Jump Back In ── */}
      {recents.length > 0 && (
        <Animated.View entering={FadeInDown.delay(60).duration(400)} style={s.sec}>
          <SectionHead title="Jump Back In" />
          <View style={s.recentGrid}>
            {recents.map((song) => (
              <RecentTile key={song.id} song={song} onPress={() => playSong(song, recentlyPlayed)} />
            ))}
          </View>
        </Animated.View>
      )}

      {/* ── Trending ── */}
      <Animated.View entering={FadeInDown.delay(120).duration(500)} style={s.sec}>
        <SectionHead title="Trending" action="See All" onAction={() => router.push('/trending')} />
        {loading ? (
          <View style={s.loadBox}><ActivityIndicator size="large" color={colors.defaultAccent} /></View>
        ) : error ? (
          <GlassCard style={s.errCard}>
            <Text style={s.errText}>{error}</Text>
            <TouchableOpacity onPress={onRefresh} style={s.retryBtn}><Text style={s.retryText}>Retry</Text></TouchableOpacity>
          </GlassCard>
        ) : (
          <FlatList
            data={heroSongs}
            keyExtractor={(i) => i.id}
            renderItem={({ item, index }) => (
              <HeroCard song={item} rank={index + 1} onPress={() => playSong(item, trending)} />
            )}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingLeft: spacing.screenPadding, paddingRight: 16, gap: 14 }}
            snapToInterval={HERO_W + 14}
            decelerationRate="fast"
          />
        )}
      </Animated.View>

      {/* ── Moods ── */}
      <Animated.View entering={FadeInDown.delay(200).duration(500)} style={s.sec}>
        <SectionHead title="Moods" />
        <ScrollView horizontal showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingLeft: spacing.screenPadding, paddingRight: 16, gap: 10 }}>
          {MOODS.map((m) => (
            <TouchableOpacity key={m.slug} style={s.moodCard} onPress={() => router.push(`/mood/${m.slug}`)} activeOpacity={0.8}>
              <LinearGradient colors={[m.g[0] + '28', m.g[1] + '10']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFill} />
              <View style={[s.moodIcon, { backgroundColor: m.g[0] + '20' }]}>
                <Ionicons name={m.icon as any} size={18} color={m.g[0]} />
              </View>
              <Text style={s.moodName}>{m.name}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </Animated.View>

      {/* ── Genres ── */}
      <Animated.View entering={FadeInDown.delay(280).duration(500)} style={s.sec}>
        <SectionHead title="Genres" />
        <View style={s.genreWrap}>
          {GENRES.map((g) => (
            <TouchableOpacity
              key={g.slug}
              style={[s.genreChip, { borderColor: g.accent + '25', backgroundColor: g.accent + '08' }]}
              onPress={() => router.push(`/genre/${g.slug}`)}
              activeOpacity={0.75}
            >
              <Ionicons name={g.icon as any} size={14} color={g.accent} />
              <Text style={[s.genreText, { color: g.accent }]}>{g.name}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </Animated.View>

      {/* ── Languages ── */}
      <Animated.View entering={FadeInDown.delay(340).duration(500)} style={s.sec}>
        <SectionHead title="Languages" action="Reset" onAction={() => useSettingsStore.getState().resetLanguages()} />
        <ScrollView horizontal showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingLeft: spacing.screenPadding, paddingRight: 16, gap: 10 }}>
          {LANGS.map((l) => {
            const isSelected = preferredLanguages.some((pl) => pl.slug === l.slug);
            return (
              <TouchableOpacity
                key={l.slug}
                style={[
                  s.langCircle,
                  isSelected && { borderColor: colors.defaultAccent, borderWidth: 2, backgroundColor: colors.defaultAccent + '15' },
                ]}
                onPress={() => {
                  toggleLanguage(l);
                  router.push(`/genre/${l.slug}`);
                }}
                onLongPress={() => toggleLanguage(l)}
                activeOpacity={0.75}
              >
                <Text style={[s.langScript, isSelected && { color: colors.defaultAccent }]}>{l.script}</Text>
                <Text style={[s.langLabel, isSelected && { color: colors.defaultAccent }]}>{l.name}</Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </Animated.View>

      <View style={{ height: 130 }} />
    </Screen>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.screenPadding,
    paddingTop: 14,
    paddingBottom: 22,
  },
  greeting: {
    fontSize: 13,
    fontWeight: '400',
    color: colors.textTertiary,
    letterSpacing: 0.2,
    marginBottom: 2,
  },
  brand: {
    fontSize: 30,
    fontWeight: '900',
    color: colors.textPrimary,
    letterSpacing: -1.2,
  },
  searchBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.surfaceElevated,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },

  // Section
  sec: { marginBottom: 30 },
  secHead: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    paddingHorizontal: spacing.screenPadding,
    marginBottom: 14,
  },
  secTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.textPrimary,
    letterSpacing: -0.5,
  },
  secAction: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.defaultAccent,
    letterSpacing: 0.1,
  },

  // Hero
  hero: {
    width: HERO_W,
    height: HERO_H,
    borderRadius: 18,
    overflow: 'hidden',
    backgroundColor: colors.surface,
  },
  heroImg: { width: '100%', height: '100%' },
  heroRank: {
    position: 'absolute',
    top: 10,
    left: 14,
    fontSize: 56,
    fontWeight: '900',
    color: 'rgba(255,255,255,0.08)',
    letterSpacing: -3,
    lineHeight: 56,
  },
  heroInfo: {
    position: 'absolute',
    bottom: 14,
    left: 14,
    right: 54,
  },
  heroTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#fff',
    letterSpacing: -0.3,
    lineHeight: 20,
  },
  heroArtist: {
    fontSize: 11,
    fontWeight: '500',
    color: 'rgba(255,255,255,0.6)',
    marginTop: 3,
  },
  heroPlay: {
    position: 'absolute',
    bottom: 12,
    right: 12,
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: colors.defaultAccent,
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      ios: { shadowColor: colors.defaultAccent, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.5, shadowRadius: 10 },
      android: { elevation: 8 },
    }),
  },

  // Recent grid
  recentGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: spacing.screenPadding,
    gap: 10,
  },
  recent: {
    width: RECENT_W,
    height: 54,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 8,
    overflow: 'hidden',
  },
  recentArt: {
    width: 54,
    height: 54,
    backgroundColor: colors.surfaceElevated,
  },
  recentText: {
    flex: 1,
    paddingHorizontal: 10,
    gap: 1,
  },
  recentTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  recentSub: {
    fontSize: 10,
    fontWeight: '400',
    color: colors.textTertiary,
  },

  // Mood
  moodCard: {
    width: 92,
    height: 88,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.03)',
    overflow: 'hidden',
  },
  moodIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  moodName: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.textSecondary,
    letterSpacing: 0.1,
  },

  // Genres
  genreWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: spacing.screenPadding,
    gap: 8,
  },
  genreChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 10,
    borderWidth: 1,
  },
  genreText: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.1,
  },

  // Languages
  langCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 1,
  },
  langScript: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  langLabel: {
    fontSize: 8,
    fontWeight: '600',
    color: colors.textTertiary,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },

  // States
  loadBox: { height: 160, justifyContent: 'center', alignItems: 'center' },
  errCard: { marginHorizontal: spacing.screenPadding, alignItems: 'center', gap: 12 },
  errText: { fontSize: 13, color: colors.error, textAlign: 'center' },
  retryBtn: { paddingHorizontal: 20, paddingVertical: 8, borderRadius: 20, backgroundColor: colors.defaultAccent },
  retryText: { fontSize: 13, fontWeight: '700', color: colors.background },
});
