import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Screen } from '../../components/Common/Screen';
import { SongCard } from '../../components/Cards/SongCard';
import { AlbumCard } from '../../components/Cards/AlbumCard';
import { ArtistChip } from '../../components/Cards/ArtistChip';
import { GlassCard } from '../../components/Common/GlassCard';
import { colors, typography, spacing } from '../../theme';
import { api } from '../../services/api';
import { usePlayerStore } from '../../stores/playerStore';
import { Song, Artist, Album } from '../../types';

export default function ArtistPage() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [artist, setArtist] = useState<Artist | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const play = usePlayerStore((s) => s.play);
  const setQueue = usePlayerStore((s) => s.setQueue);

  const fetchArtist = useCallback(async () => {
    if (!id) return;
    try {
      setLoading(true);
      setError(null);
      const data = await api.artist(id);
      // Normalize: API may return nested or flat
      const normalized: Artist = data?.artist || data;
      setArtist(normalized);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load artist');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchArtist();
  }, [fetchArtist]);

  const topSongs = artist?.topSongs || [];

  const handlePlayAll = useCallback(() => {
    if (topSongs.length === 0) return;
    setQueue(topSongs);
    play(topSongs[0]);
  }, [topSongs, play, setQueue]);

  const handleShuffle = useCallback(() => {
    if (topSongs.length === 0) return;
    const shuffled = [...topSongs].sort(() => Math.random() - 0.5);
    setQueue(shuffled);
    play(shuffled[0]);
  }, [topSongs, play, setQueue]);

  const handleSongPress = useCallback(
    (song: Song) => {
      setQueue(topSongs);
      play(song);
    },
    [topSongs, play, setQueue]
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
      {/* Back Button */}
      <TouchableOpacity
        style={styles.backButton}
        onPress={() => router.back()}
      >
        <Text style={styles.backText}>← Back</Text>
      </TouchableOpacity>

      {/* Artist Header */}
      <View style={styles.header}>
        <Image
          source={{ uri: artist.image }}
          style={styles.artistImage}
          contentFit="cover"
          placeholder={{ blurhash: 'L6PZfSi_.AyE_3t7t7R**0o#DgR4' }}
          transition={300}
        />
        <Text style={styles.artistName}>{artist.name}</Text>
        {artist.bio ? (
          <Text style={styles.bio} numberOfLines={2}>
            {artist.bio}
          </Text>
        ) : null}
      </View>

      {/* Action Buttons */}
      {topSongs.length > 0 && (
        <View style={styles.actions}>
          <TouchableOpacity
            style={styles.playAllButton}
            onPress={handlePlayAll}
            activeOpacity={0.7}
          >
            <Text style={styles.actionButtonText}>▶ Play All</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.shuffleButton}
            onPress={handleShuffle}
            activeOpacity={0.7}
          >
            <Text style={styles.actionButtonText}>🔀 Shuffle</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Top Songs */}
      {topSongs.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Top Songs</Text>
          {topSongs.slice(0, 20).map((song) => (
            <SongCard
              key={song.id}
              song={song}
              onPress={() => handleSongPress(song)}
            />
          ))}
        </View>
      )}

      {/* Albums */}
      {artist.albums && artist.albums.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Albums</Text>
          <FlatList
            data={artist.albums}
            keyExtractor={(item) => item.id}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.horizontalList}
            renderItem={({ item }) => (
              <AlbumCard
                album={item}
                onPress={() => router.push(`/album/${item.id}`)}
              />
            )}
          />
        </View>
      )}

      {/* Bottom spacer */}
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
    alignItems: 'center',
    paddingHorizontal: spacing.screenPadding,
    paddingVertical: spacing.xl,
    gap: spacing.md,
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
  bio: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.screenPadding,
    marginBottom: spacing.xl,
  },
  playAllButton: {
    backgroundColor: colors.defaultAccent,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: spacing.buttonRadiusLarge,
  },
  shuffleButton: {
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
    marginBottom: spacing.sectionGap,
  },
  sectionTitle: {
    ...typography.h3,
    color: colors.textPrimary,
    paddingHorizontal: spacing.screenPadding,
    marginBottom: spacing.lg,
  },
  horizontalList: {
    paddingHorizontal: spacing.screenPadding,
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
