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
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Image } from 'expo-image';
import { Screen } from '../../components/Common/Screen';
import { GlassCard } from '../../components/Common/GlassCard';
import { GenreCard } from '../../components/Cards/GenreCard';
import { MoodCard } from '../../components/Cards/MoodCard';
import { LanguageChip } from '../../components/Cards/LanguageChip';
import { colors, typography, spacing } from '../../theme';
import { api } from '../../services/api';
import { usePlayerStore } from '../../stores/playerStore';
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

// Quick play card for trending preview (horizontal)
function QuickPlayCard({ song, onPress }: { song: Song; onPress: () => void }) {
  return (
    <TouchableOpacity style={quickStyles.card} onPress={onPress} activeOpacity={0.8}>
      <Image
        source={{ uri: song.image }}
        style={quickStyles.art}
        contentFit="cover"
        placeholder={{ blurhash: 'L6PZfSi_.AyE_3t7t7R**0o#DgR4' }}
        transition={200}
      />
      <Text style={quickStyles.title} numberOfLines={1}>{song.title}</Text>
      <Text style={quickStyles.artist} numberOfLines={1}>{song.artist}</Text>
    </TouchableOpacity>
  );
}

const quickStyles = StyleSheet.create({
  card: {
    width: 130,
    marginRight: 12,
  },
  art: {
    width: 130,
    height: 130,
    borderRadius: 14,
    backgroundColor: colors.surface,
    marginBottom: 8,
  },
  title: {
    ...typography.bodySmall,
    color: colors.textPrimary,
    fontWeight: '600',
  },
  artist: {
    ...typography.caption,
    color: colors.textTertiary,
    marginTop: 2,
  },
});

export default function HomeScreen() {
  const router = useRouter();
  const [trending, setTrending] = useState<Song[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const play = usePlayerStore((s) => s.play);
  const setQueue = usePlayerStore((s) => s.setQueue);

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

  return (
    <Screen scroll refreshing={refreshing} onRefresh={handleRefresh}>
      {/* Hero Header */}
      <Animated.View entering={FadeInDown.duration(500)} style={styles.header}>
        <Text style={styles.greeting}>{getGreeting()}</Text>
        <View style={styles.logoRow}>
          <Text style={styles.logo}>राग</Text>
          <Text style={styles.logoSub}>Raaga</Text>
        </View>
      </Animated.View>

      {/* Trending Preview — horizontal album art cards */}
      <Animated.View entering={FadeInDown.delay(100).duration(500)} style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Trending Now 🔥</Text>
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
        ) : trending.length === 0 ? (
          <GlassCard>
            <Text style={styles.emptyText}>No trending songs found</Text>
          </GlassCard>
        ) : (
          <FlatList
            data={trending.slice(0, 10)}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <QuickPlayCard song={item} onPress={() => handleSongPress(item)} />
            )}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.horizontalList}
          />
        )}
      </Animated.View>

      {/* Browse by Genre */}
      <Animated.View entering={FadeInDown.delay(200).duration(500)} style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Browse by Genre</Text>
        </View>
        <FlatList
          data={genres}
          keyExtractor={(item) => item.slug}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.browseList}
          renderItem={({ item }) => (
            <GenreCard genre={item} onPress={() => router.push(`/genre/${item.slug}`)} />
          )}
        />
      </Animated.View>

      {/* Browse by Mood */}
      <Animated.View entering={FadeInDown.delay(300).duration(500)} style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Browse by Mood</Text>
        </View>
        <FlatList
          data={moods}
          keyExtractor={(item) => item.slug}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.browseList}
          renderItem={({ item }) => (
            <MoodCard mood={item} onPress={() => router.push(`/mood/${item.slug}`)} />
          )}
        />
      </Animated.View>

      {/* Browse by Language */}
      <Animated.View entering={FadeInDown.delay(400).duration(500)} style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Browse by Language</Text>
        </View>
        <FlatList
          data={languages}
          keyExtractor={(item) => item.slug}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.browseList}
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
  header: {
    paddingHorizontal: spacing.screenPadding,
    paddingTop: spacing.xxl + 8,
    paddingBottom: spacing.lg,
  },
  greeting: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  logoRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: spacing.sm,
  },
  logo: {
    fontSize: 38,
    fontWeight: '800',
    color: colors.defaultAccent,
    letterSpacing: -1,
    textShadowColor: 'rgba(139, 92, 246, 0.4)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 16,
  },
  logoSub: {
    ...typography.h3,
    color: colors.textTertiary,
    fontWeight: '300',
  },
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
    ...typography.h3,
    color: colors.textPrimary,
  },
  seeAll: {
    ...typography.bodySmall,
    color: colors.defaultAccent,
    fontWeight: '600',
  },
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
    color: colors.textPrimary,
    fontWeight: '600',
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
  browseList: {
    paddingHorizontal: spacing.screenPadding,
  },
});
