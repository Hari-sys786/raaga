import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { SongCard } from '../../components/Cards/SongCard';
import { GlassCard } from '../../components/Common/GlassCard';
import { colors, typography, spacing } from '../../theme';
import { api } from '../../services/api';
import { usePlayerStore } from '../../stores/playerStore';
import { Song } from '../../types';
import * as jiosaavn from '../../services/jiosaavn';

export default function ArtistPage() {
  const { id, name: paramName, image: paramImage } = useLocalSearchParams<{
    id: string;
    name?: string;
    image?: string;
  }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [artist, setArtist] = useState<{
    id: string;
    name: string;
    image: string;
    topSongs?: Song[];
    followerCount?: number;
    isVerified?: boolean;
  } | null>(null);
  const [songs, setSongs] = useState<Song[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const play = usePlayerStore((s) => s.play);
  const setQueue = usePlayerStore((s) => s.setQueue);

  const fetchArtist = useCallback(async () => {
    if (!id) return;
    try {
      setLoading(true);
      setError(null);
      const response = await api.artist(id);
      const data = response?.data || response;
      // Handle image being an array (some API responses return [{quality, url}])
      let resolvedImage = data?.image || '';
      if (Array.isArray(resolvedImage)) {
        resolvedImage = resolvedImage.find((i: any) => i.quality === '500x500')?.url ||
          resolvedImage[resolvedImage.length - 1]?.url || '';
      }
      setArtist({ ...data, image: resolvedImage });
      let topSongs = data?.topSongs || [];
      // If no topSongs, fetch songs by artist name
      if (!topSongs.length && data?.name) {
        topSongs = await jiosaavn.searchSongs(data.name, 1, 30);
      }
      setSongs(topSongs);
      // Allow loading more as long as we got any songs
      setHasMore(topSongs.length >= 5);
      setPage(1);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load artist.');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchArtist();
  }, [fetchArtist]);

  const loadMore = useCallback(async () => {
    if (loadingMore || !hasMore || !artist?.name) return;
    setLoadingMore(true);
    try {
      // Search for more songs by this artist
      const nextPage = page + 1;
      const moreResults = await jiosaavn.searchSongs(artist.name, nextPage, 30);
      // Filter to songs by this artist (fuzzy match)
      const artistLower = artist.name.toLowerCase();
      const filtered = moreResults.filter(
        (s) =>
          s.artist.toLowerCase().includes(artistLower) ||
          artistLower.includes(s.artist.toLowerCase().split(',')[0].trim())
      );
      if (filtered.length === 0) {
        setHasMore(false);
      } else {
        const existingIds = new Set(songs.map((s) => s.id));
        // Map source 'youtube' to 'ytmusic' for type compatibility and cast to Song
        const newSongs = filtered
          .filter((s) => !existingIds.has(s.id))
          .map((s) => ({
            ...s,
            source: (s.source === 'youtube' ? 'ytmusic' : s.source) as 'jiosaavn' | 'ytmusic' | undefined,
          }) as Song);
        setSongs((prev: Song[]) => [...prev, ...newSongs]);
        setPage(nextPage);
        if (newSongs.length < 5) setHasMore(false);
      }
    } catch {
      setHasMore(false);
    } finally {
      setLoadingMore(false);
    }
  }, [loadingMore, hasMore, artist, page, songs]);

  const handlePlayAll = useCallback(() => {
    if (songs.length === 0) return;
    setQueue(songs);
    play(songs[0]);
  }, [songs, play, setQueue]);

  const handleShuffle = useCallback(() => {
    if (songs.length === 0) return;
    const shuffled = [...songs].sort(() => Math.random() - 0.5);
    setQueue(shuffled);
    play(shuffled[0]);
  }, [songs, play, setQueue]);

  const handleSongPress = useCallback(
    (song: Song) => {
      setQueue(songs);
      play(song);
    },
    [songs, play, setQueue]
  );

  // Fallback to placeholder if image is missing or empty string
  const artistImage = artist?.image && artist.image.trim() !== ''
    ? artist.image
    : (paramImage ? decodeURIComponent(paramImage) : '');
  const artistName = artist?.name || (paramName ? decodeURIComponent(paramName) : '');

  const renderHeader = () => (
    <View>
      {/* Hero image with gradient */}
      <View style={styles.heroContainer}>
        {artistImage ? (
          <Image
            source={{ uri: artistImage }}
            style={styles.heroImage}
            contentFit="cover"
            transition={300}
          />
        ) : (
          <View style={[styles.heroImage, styles.heroPlaceholder]}>
            <Ionicons name="person" size={64} color={colors.textTertiary} />
          </View>
        )}
        <LinearGradient
          colors={['transparent', 'rgba(8,11,18,0.7)', colors.background]}
          style={styles.heroGradient}
        />
        <View style={[styles.heroInfo, { paddingTop: insets.top + 8 }]}>
          {/* Back button */}
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            <Ionicons name="chevron-back" size={24} color="#fff" />
          </TouchableOpacity>
        </View>
        <View style={styles.heroTextBlock}>
          <Text style={styles.artistName}>{artistName}</Text>
          {artist?.followerCount ? (
            <Text style={styles.meta}>
              {Number(artist.followerCount).toLocaleString()} Followers
            </Text>
          ) : null}
        </View>
      </View>

      {/* Action Buttons */}
      {songs.length > 0 && (
        <View style={styles.actions}>
          <TouchableOpacity style={styles.playAllButton} onPress={handlePlayAll}>
            <Ionicons name="play" size={18} color="#fff" />
            <Text style={styles.actionButtonText}>Play All</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.shuffleButton} onPress={handleShuffle}>
            <Ionicons name="shuffle" size={18} color={colors.textPrimary} />
            <Text style={styles.actionButtonText}>Shuffle</Text>
          </TouchableOpacity>
        </View>
      )}

      {songs.length > 0 && (
        <Text style={styles.songCount}>
          {songs.length} song{songs.length !== 1 ? 's' : ''}
        </Text>
      )}
    </View>
  );

  const renderFooter = () => {
    if (loadingMore) {
      return (
        <View style={styles.footerLoader}>
          <ActivityIndicator size="small" color={colors.defaultAccent} />
        </View>
      );
    }
    return <View style={{ height: 120 }} />;
  };

  if (loading) {
    return (
      <View style={[styles.screen, { paddingTop: insets.top }]}>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.defaultAccent} />
        </View>
      </View>
    );
  }

  if (error || !artist) {
    return (
      <View style={[styles.screen, { paddingTop: insets.top }]}>
        <View style={styles.centered}>
          <GlassCard style={styles.errorCard}>
            <Text style={styles.errorText}>{error || 'Artist not found.'}</Text>
            <TouchableOpacity onPress={fetchArtist} style={styles.retryBtn}>
              <Text style={styles.retryText}>Retry</Text>
            </TouchableOpacity>
          </GlassCard>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <FlatList
        data={songs}
        keyExtractor={(item, idx) => item.id + idx}
        ListHeaderComponent={renderHeader}
        ListFooterComponent={renderFooter}
        renderItem={({ item }) => (
          <SongCard song={item} onPress={() => handleSongPress(item)} />
        )}
        onEndReached={loadMore}
        onEndReachedThreshold={0.3}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.screenPadding,
  },
  // Hero
  heroContainer: {
    height: 320,
    position: 'relative',
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },
  heroPlaceholder: {
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 180,
  },
  heroInfo: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    paddingHorizontal: spacing.screenPadding,
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(0,0,0,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroTextBlock: {
    position: 'absolute',
    bottom: 16,
    left: spacing.screenPadding,
    right: spacing.screenPadding,
  },
  artistName: {
    fontSize: 32,
    fontWeight: '800',
    color: '#fff',
    letterSpacing: -0.5,
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 8,
  },
  meta: {
    ...typography.bodySmall,
    color: 'rgba(255,255,255,0.7)',
    marginTop: 4,
  },
  // Actions
  actions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: spacing.lg,
    paddingHorizontal: spacing.screenPadding,
  },
  playAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.defaultAccent,
    paddingHorizontal: 22,
    paddingVertical: 11,
    borderRadius: 24,
  },
  shuffleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255,255,255,0.08)',
    paddingHorizontal: 22,
    paddingVertical: 11,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  actionButtonText: {
    ...typography.bodySmall,
    color: '#fff',
    fontWeight: '600',
  },
  songCount: {
    ...typography.caption,
    color: colors.textTertiary,
    paddingHorizontal: spacing.screenPadding,
    marginTop: spacing.md,
    marginBottom: 4,
  },
  // Footer
  footerLoader: {
    paddingVertical: 20,
    alignItems: 'center',
  },
  // Error
  errorCard: {
    alignItems: 'center',
    gap: spacing.md,
  },
  errorText: {
    ...typography.bodySmall,
    color: colors.error,
    textAlign: 'center',
  },
  retryBtn: {
    backgroundColor: colors.defaultAccent,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.sm,
    borderRadius: spacing.buttonRadiusLarge,
  },
  retryText: {
    ...typography.bodySmall,
    color: '#fff',
    fontWeight: '600',
  },
});
