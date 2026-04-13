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
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
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

export default function ArtistPage() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [artist, setArtist] = useState<any>(null);
  const [songs, setSongs] = useState<Song[]>([]);
  const [albums, setAlbums] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const play = usePlayerStore((s) => s.play);
  const setQueue = usePlayerStore((s) => s.setQueue);

  const fetchArtist = useCallback(async () => {
    if (!id) return;
    try {
      setLoading(true);
      setError(null);
      const res = await api.artist(id);
      // API returns { data: { id, name, image, topSongs, topAlbums, ... } }
      const d = res?.data || res;
      setArtist(d);
      setSongs(d?.topSongs || []);
      // Normalize albums: server returns { id, name, year, artwork }
      const rawAlbums = d?.topAlbums || [];
      setAlbums(rawAlbums.map((a: any) => ({
        id: a.id || a.albumid,
        title: a.name || a.title || '',
        artist: d?.name || '',
        image: a.artwork || a.image || '',
        year: a.year || '',
      })));
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load artist');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchArtist();
  }, [fetchArtist]);

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

  if (loading) {
    return (
      <Screen>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.defaultAccent} />
        </View>
      </Screen>
    );
  }

  if (error || !artist) {
    return (
      <Screen>
        <View style={styles.centered}>
          <GlassCard style={styles.errorCard}>
            <Text style={styles.errorText}>{error || 'Artist not found'}</Text>
            <TouchableOpacity onPress={fetchArtist} style={styles.retryButton}>
              <Text style={styles.retryText}>Retry</Text>
            </TouchableOpacity>
          </GlassCard>
        </View>
      </Screen>
    );
  }

  return (
    <Screen scroll>
      {/* Header with gradient */}
      <LinearGradient
        colors={[colors.defaultAccent + '20', 'transparent']}
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
          <Text style={styles.headerTitle} numberOfLines={1}>Artist</Text>
        </View>

        <View style={styles.artistHeader}>
          <Image
            source={{ uri: artist.image }}
            style={styles.artistImage}
            contentFit="cover"
            placeholder={{ blurhash: 'L6PZfSi_.AyE_3t7t7R**0o#DgR4' }}
            transition={300}
          />
          <Text style={styles.artistName}>{artist.name || 'Unknown Artist'}</Text>
          {artist.followerCount > 0 && (
            <Text style={styles.followers}>
              {Number(artist.followerCount).toLocaleString()} followers
            </Text>
          )}
        </View>
      </LinearGradient>

      {/* Action Buttons */}
      {songs.length > 0 && (
        <View style={styles.actions}>
          <TouchableOpacity style={styles.playAllButton} onPress={handlePlayAll} activeOpacity={0.7}>
            <Ionicons name="play" size={18} color={colors.textPrimary} />
            <Text style={styles.actionButtonText}>Play All</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.shuffleButton} onPress={handleShuffle} activeOpacity={0.7}>
            <Ionicons name="shuffle" size={18} color={colors.textPrimary} />
            <Text style={styles.actionButtonText}>Shuffle</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Top Songs */}
      {songs.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Top Songs</Text>
          {songs.map((song, index) => (
            <Animated.View key={song.id} entering={FadeInDown.delay(index * 30).springify()}>
              <SongCard song={song} onPress={() => handleSongPress(song)} />
            </Animated.View>
          ))}
        </View>
      )}

      {/* Albums */}
      {albums.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Albums</Text>
          <FlatList
            data={albums}
            keyExtractor={(item) => item.id}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.horizontalList}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.albumCard}
                onPress={() => router.push(`/album/${item.id}`)}
                activeOpacity={0.7}
              >
                <Image
                  source={{ uri: item.image }}
                  style={styles.albumImage}
                  contentFit="cover"
                  placeholder={{ blurhash: 'L6PZfSi_.AyE_3t7t7R**0o#DgR4' }}
                />
                <Text style={styles.albumTitle} numberOfLines={1}>{item.title}</Text>
                {item.year ? <Text style={styles.albumYear}>{item.year}</Text> : null}
              </TouchableOpacity>
            )}
          />
        </View>
      )}

      {songs.length === 0 && albums.length === 0 && (
        <GlassCard style={styles.emptyCard}>
          <Ionicons name="musical-notes" size={40} color={colors.textTertiary} />
          <Text style={styles.emptyText}>No songs or albums found</Text>
        </GlassCard>
      )}

      <View style={{ height: 100 }} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.screenPadding,
  },
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
  headerTitle: {
    ...typography.body,
    color: colors.textSecondary,
  },
  artistHeader: {
    alignItems: 'center',
    paddingTop: spacing.lg,
    gap: spacing.sm,
  },
  artistImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 2,
    borderColor: colors.defaultAccent,
    backgroundColor: colors.surface,
  },
  artistName: {
    ...typography.h1,
    color: colors.textPrimary,
    textAlign: 'center',
  },
  followers: {
    ...typography.caption,
    color: colors.textTertiary,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.screenPadding,
    marginBottom: spacing.xl,
  },
  playAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.defaultAccent,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: spacing.buttonRadiusLarge,
  },
  shuffleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.surfaceElevated,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: spacing.buttonRadiusLarge,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  actionButtonText: {
    ...typography.bodySmall,
    color: colors.textPrimary,
    fontWeight: '600',
  },
  section: {
    marginBottom: spacing.xl,
  },
  sectionTitle: {
    ...typography.h3,
    color: colors.textPrimary,
    paddingHorizontal: spacing.screenPadding,
    marginBottom: spacing.md,
  },
  horizontalList: {
    paddingHorizontal: spacing.screenPadding,
    gap: 12,
  },
  albumCard: {
    width: 130,
  },
  albumImage: {
    width: 130,
    height: 130,
    borderRadius: 10,
    backgroundColor: colors.surface,
    marginBottom: 6,
  },
  albumTitle: {
    ...typography.caption,
    color: colors.textPrimary,
    fontWeight: '600',
  },
  albumYear: {
    ...typography.caption,
    color: colors.textTertiary,
    fontSize: 11,
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
  errorCard: {
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
});
