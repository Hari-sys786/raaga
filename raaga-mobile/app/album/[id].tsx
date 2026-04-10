import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Screen } from '../../components/Common/Screen';
import { GlassCard } from '../../components/Common/GlassCard';
import { colors, typography, spacing } from '../../theme';
import { api } from '../../services/api';
import { usePlayerStore } from '../../stores/playerStore';
import { Song, Album } from '../../types';
import { formatTime } from '../../utils/formatTime';

export default function AlbumPage() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [album, setAlbum] = useState<Album | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const play = usePlayerStore((s) => s.play);
  const setQueue = usePlayerStore((s) => s.setQueue);

  const fetchAlbum = useCallback(async () => {
    if (!id) return;
    try {
      setLoading(true);
      setError(null);
      const data = await api.album(id);
      const normalized: Album = data?.album || data;
      setAlbum(normalized);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load album');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchAlbum();
  }, [fetchAlbum]);

  const songs = album?.songs || [];

  const totalDuration = songs.reduce((sum, s) => sum + (s.duration || 0), 0);
  const totalMinutes = Math.round(totalDuration / 60);

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

  const handleTrackPress = useCallback(
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

  if (error || !album) {
    return (
      <Screen>
        <View style={styles.centered}>
          <GlassCard style={styles.errorCard}>
            <Text style={styles.errorText}>{error || 'Album not found'}</Text>
            <TouchableOpacity onPress={fetchAlbum} style={styles.retryButton}>
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

      {/* Album Header */}
      <View style={styles.header}>
        <Image
          source={{ uri: album.image }}
          style={styles.albumArt}
          contentFit="cover"
          placeholder={{ blurhash: 'L6PZfSi_.AyE_3t7t7R**0o#DgR4' }}
          transition={300}
        />
        <Text style={styles.albumTitle}>{album.title}</Text>
        <TouchableOpacity
          onPress={() => {
            // Try to navigate to artist - use first song's artist info or album artist
            // Album may not have artistId, so we search
            if (songs.length > 0) {
              // Navigate using artist name search as fallback
              router.push(`/genre/${encodeURIComponent(album.artist)}`);
            }
          }}
        >
          <Text style={styles.albumArtist}>{album.artist}</Text>
        </TouchableOpacity>
        <Text style={styles.albumMeta}>
          {album.year ? `${album.year} • ` : ''}
          {songs.length} song{songs.length !== 1 ? 's' : ''}
          {totalMinutes > 0 ? ` • ${totalMinutes} min` : ''}
        </Text>
      </View>

      {/* Action Buttons */}
      {songs.length > 0 && (
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

      {/* Track List */}
      <View style={styles.trackList}>
        {songs.map((song, index) => (
          <TouchableOpacity
            key={song.id}
            style={styles.trackRow}
            onPress={() => handleTrackPress(song)}
            activeOpacity={0.7}
          >
            <Text style={styles.trackNumber}>{index + 1}</Text>
            <View style={styles.trackInfo}>
              <Text style={styles.trackTitle} numberOfLines={1}>
                {song.title}
              </Text>
              <Text style={styles.trackArtist} numberOfLines={1}>
                {song.artist}
              </Text>
            </View>
            {song.duration ? (
              <Text style={styles.trackDuration}>
                {formatTime(song.duration)}
              </Text>
            ) : null}
          </TouchableOpacity>
        ))}
      </View>

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
    gap: spacing.sm,
  },
  albumArt: {
    width: 200,
    height: 200,
    borderRadius: spacing.cardRadius,
    backgroundColor: colors.surface,
    marginBottom: spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 12,
  },
  albumTitle: {
    ...typography.h2,
    color: colors.textPrimary,
    textAlign: 'center',
  },
  albumArtist: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  albumMeta: {
    ...typography.caption,
    color: colors.textTertiary,
    textAlign: 'center',
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
  trackList: {
    paddingHorizontal: spacing.screenPadding,
  },
  trackRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    gap: spacing.md,
  },
  trackNumber: {
    ...typography.bodySmall,
    color: colors.textTertiary,
    width: 28,
    textAlign: 'center',
  },
  trackInfo: {
    flex: 1,
    gap: 2,
  },
  trackTitle: {
    ...typography.body,
    color: colors.textPrimary,
  },
  trackArtist: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  trackDuration: {
    ...typography.caption,
    color: colors.textTertiary,
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
