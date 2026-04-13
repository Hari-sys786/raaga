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
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Screen } from '../../components/Common/Screen';
import { SongCard } from '../../components/Cards/SongCard';
import { AlbumCard } from '../../components/Cards/AlbumCard';
import { GlassCard } from '../../components/Common/GlassCard';
import { colors, typography, spacing } from '../../theme';
import { api } from '../../services/api';
import { usePlayerStore } from '../../stores/playerStore';
import { Song, Album } from '../../types';

export default function ArtistPage() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [artist, setArtist] = useState<{
    id: string;
    name: string;
    image: string;
    topSongs?: Song[];
    topAlbums?: Album[];
    followerCount?: number;
    isVerified?: boolean;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const play = usePlayerStore((s) => s.play);
  const setQueue = usePlayerStore((s) => s.setQueue);

  const fetchArtist = useCallback(async () => {
    if (!id) return;
    try {
      setLoading(true);
      setError(null);
      const response = await api.artist(id);
      const normalizedData = response?.data || response;
      setArtist(normalizedData);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load artist.');
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
            <Text style={styles.errorText}>{error || 'Artist not found.'}</Text>
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
      {/* Header */}
      <View style={styles.header}>
        <Image
          source={{ uri: artist.image }}
          style={styles.artistImage}
          contentFit="cover"
        />
        <Text style={styles.artistName}>{artist.name}</Text>
        {artist?.followerCount ? (
          <Text style={styles.meta}>{artist.followerCount} Followers</Text>
        ) : null}
      </View>

      {/* Action Buttons */}
      {topSongs.length > 0 && (
        <View style={styles.actions}>
          <TouchableOpacity
            style={styles.playAllButton}
            onPress={handlePlayAll}
          >
            <Text style={styles.actionButtonText}>▶ Play All</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.shuffleButton}
            onPress={handleShuffle}
          >
            <Text style={styles.actionButtonText}>🔀 Shuffle</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Songs */}
      <View style={styles.songsSection}>
        {topSongs.slice(0, 20).map((song, idx) => (
          <SongCard key={idx} song={song} onPress={() => handleSongPress(song)} />
        ))}
      </View>

      {/* Bottom Spacer */}
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
  header: {
    alignItems: 'center',
  },
  artistImage: {
    height: 180,
    backgroundColor: colors.surface,
    borderRadius: 20,
  },
  artistName: {
    fontSize: 24,
    fontWeight: '700',
  },
});