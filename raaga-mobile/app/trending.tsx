import React, { useEffect, useState, useCallback, useRef } from 'react';
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
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { SongCard } from '../components/Cards/SongCard';
import { api } from '../services/api';
import { usePlayerStore } from '../stores/playerStore';
import { colors, typography, spacing } from '../theme';
import { Song } from '../types';

const MORE_LANGS = ['english', 'telugu', 'tamil', 'punjabi', 'kannada', 'malayalam'];

export default function TrendingScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [songs, setSongs] = useState<Song[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [langIndex, setLangIndex] = useState(0);
  const seenIdsRef = useRef(new Set<string>());
  const play = usePlayerStore((s) => s.play);
  const setQueue = usePlayerStore((s) => s.setQueue);

  const fetchTrending = useCallback(async () => {
    seenIdsRef.current = new Set<string>();
    setLangIndex(0);
    try {
      const data = await api.viral();
      const list = Array.isArray(data) ? data : data?.data || data?.results || [];
      const unique = list.filter((s: Song) => {
        if (seenIdsRef.current.has(s.id)) return false;
        seenIdsRef.current.add(s.id);
        return true;
      });
      setSongs(unique);
    } catch {
      try {
        const data = await api.trending('hindi');
        const list = Array.isArray(data) ? data : data?.results || data?.data || [];
        const unique = list.filter((s: Song) => {
          if (seenIdsRef.current.has(s.id)) return false;
          seenIdsRef.current.add(s.id);
          return true;
        });
        setSongs(unique);
      } catch {
        // silent
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  const loadMore = useCallback(async () => {
    if (loadingMore || langIndex >= MORE_LANGS.length) return;
    try {
      setLoadingMore(true);
      const lang = MORE_LANGS[langIndex];
      const data = await api.trending(lang);
      const list = Array.isArray(data) ? data : data?.results || data?.data || [];
      const newSongs = list.filter((s: Song) => {
        if (seenIdsRef.current.has(s.id)) return false;
        seenIdsRef.current.add(s.id);
        return true;
      });
      if (newSongs.length > 0) {
        setSongs((prev) => {
          const updated = [...prev, ...newSongs];
          setQueue(updated);
          return updated;
        });
      }
      setLangIndex((i) => i + 1);
    } catch {
      // silent
    } finally {
      setLoadingMore(false);
    }
  }, [loadingMore, langIndex, setQueue]);

  useEffect(() => {
    fetchTrending();
  }, [fetchTrending]);

  const handleSongPress = useCallback(
    (song: Song) => {
      play(song);
      setQueue(songs);
    },
    [play, setQueue, songs]
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        >
          <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.title}>Trending Now 🔥</Text>
        <View style={{ width: 40 }} />
      </View>

      {loading ? (
        <View style={styles.loading}>
          <ActivityIndicator size="large" color={colors.defaultAccent} />
        </View>
      ) : (
        <FlatList
          data={songs}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <SongCard song={item} onPress={() => handleSongPress(item)} />
          )}
          refreshing={refreshing}
          onRefresh={() => {
            setRefreshing(true);
            fetchTrending();
          }}
          onEndReached={loadMore}
          onEndReachedThreshold={0.4}
          contentContainerStyle={{ paddingBottom: 120 }}
          showsVerticalScrollIndicator={false}
          removeClippedSubviews
          maxToRenderPerBatch={15}
          windowSize={10}
          ListFooterComponent={
            loadingMore ? (
              <View style={styles.loading}>
                <ActivityIndicator size="small" color={colors.defaultAccent} />
              </View>
            ) : null
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.screenPadding,
    paddingVertical: 14,
    borderBottomWidth: 0.5,
    borderBottomColor: 'rgba(255,255,255,0.06)',
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    ...typography.h3,
    color: colors.textPrimary,
  },
  loading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
