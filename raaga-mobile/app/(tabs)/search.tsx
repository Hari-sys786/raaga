import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  Keyboard,
  TouchableOpacity,
} from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Screen } from '../../components/Common/Screen';
import { SongCard } from '../../components/Cards/SongCard';
import { colors, typography, spacing } from '../../theme';
import { api } from '../../services/api';
import { usePlayerStore } from '../../stores/playerStore';
import { Song } from '../../types';

const POPULAR_SEARCHES = ['Arijit Singh', 'Diljit', 'AP Dhillon', 'Pritam', 'Shreya Ghoshal', 'KK'];

interface ArtistResult {
  id: string;
  name: string;
  image: string;
  isVerified?: boolean;
}

interface AlbumResult {
  id: string;
  title: string;
  artist: string;
  image: string;
  year?: string;
  songCount?: number;
}

export default function SearchScreen() {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Song[]>([]);
  const [artists, setArtists] = useState<ArtistResult[]>([]);
  const [albums, setAlbums] = useState<AlbumResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [searched, setSearched] = useState(false);
  const [focused, setFocused] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const currentQuery = useRef('');
  const play = usePlayerStore((s) => s.play);
  const setQueue = usePlayerStore((s) => s.setQueue);

  const doSearch = useCallback(async (q: string, p: number = 1) => {
    if (q.trim().length < 2) {
      setResults([]);
      setArtists([]);
      setAlbums([]);
      setSearched(false);
      return;
    }

    if (p === 1) {
      setLoading(true);
      setResults([]);
      setArtists([]);
      setAlbums([]);
    } else {
      setLoadingMore(true);
    }
    setSearched(true);
    currentQuery.current = q;

    try {
      if (p === 1) {
        // First page: search all types
        const data = await api.searchAll(q);
        const songs = data?.results || [];
        setResults(songs);
        setArtists(data?.artists || []);
        setAlbums(data?.albums || []);
        setHasMore(data?.hasMore || false);
        setPage(1);
      } else {
        // Subsequent pages: songs only
        const data = await api.search(q, p);
        const songs = Array.isArray(data)
          ? data
          : data?.results || data?.songs || data?.data || [];
        if (songs.length > 0) {
          setResults(prev => [...prev, ...songs]);
        }
        setHasMore(data?.hasMore || false);
        setPage(p);
      }
    } catch (err) {
      console.warn('Search error:', err);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, []);

  const handleQueryChange = useCallback(
    (text: string) => {
      setQuery(text);
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => doSearch(text, 1), 300);
    },
    [doSearch]
  );

  const handleLoadMore = useCallback(() => {
    if (loadingMore || !hasMore) return;
    doSearch(currentQuery.current, page + 1);
  }, [loadingMore, hasMore, page, doSearch]);

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  const handleSongPress = useCallback(
    (song: Song) => {
      Keyboard.dismiss();
      play(song);
      setQueue(results);
    },
    [play, setQueue, results]
  );

  const handleChipPress = useCallback(
    (term: string) => {
      setQuery(term);
      doSearch(term, 1);
    },
    [doSearch]
  );

  const renderHeader = () => (
    <View>
      {/* Artists */}
      {artists.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Artists</Text>
          <FlatList
            data={artists.slice(0, 6)}
            keyExtractor={(item) => `artist-${item.id}`}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.horizontalList}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.artistCard}
                onPress={() => router.push(`/artist/${item.id}`)}
                activeOpacity={0.7}
              >
                <Image
                  source={{ uri: item.image }}
                  style={styles.artistImage}
                  contentFit="cover"
                  placeholder={{ blurhash: 'L6PZfSi_.AyE_3t7t7R**0o#DgR4' }}
                />
                <Text style={styles.artistName} numberOfLines={1}>{item.name}</Text>
                {item.isVerified && (
                  <View style={styles.verifiedBadge}>
                    <Ionicons name="checkmark-circle" size={12} color={colors.defaultAccent} />
                  </View>
                )}
              </TouchableOpacity>
            )}
          />
        </View>
      )}

      {/* Albums */}
      {albums.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Albums</Text>
          <FlatList
            data={albums.slice(0, 6)}
            keyExtractor={(item) => `album-${item.id}`}
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
                <Text style={styles.albumArtist} numberOfLines={1}>{item.artist}</Text>
              </TouchableOpacity>
            )}
          />
        </View>
      )}

      {/* Songs header */}
      {results.length > 0 && (
        <Text style={[styles.sectionLabel, { paddingHorizontal: spacing.screenPadding, marginTop: 4 }]}>
          Songs
        </Text>
      )}
    </View>
  );

  const renderFooter = () => {
    if (!loadingMore) return <View style={{ height: 100 }} />;
    return (
      <View style={styles.loadingMore}>
        <ActivityIndicator size="small" color={colors.defaultAccent} />
      </View>
    );
  };

  return (
    <Screen>
      <View style={styles.header}>
        <Animated.View entering={FadeInDown.duration(400)}>
          <Text style={styles.title}>Search</Text>
        </Animated.View>
        <Animated.View entering={FadeInDown.delay(100).duration(400)}>
          <View style={[styles.searchBar, focused && styles.searchBarFocused]}>
            <Ionicons name="search" size={20} color={focused ? colors.defaultAccent : colors.textTertiary} />
            <TextInput
              style={styles.input}
              placeholder="Songs, artists, albums..."
              placeholderTextColor={colors.textTertiary}
              value={query}
              onChangeText={handleQueryChange}
              onFocus={() => setFocused(true)}
              onBlur={() => setFocused(false)}
              autoCorrect={false}
              autoCapitalize="none"
              returnKeyType="search"
              selectionColor={colors.defaultAccent}
            />
            {query.length > 0 && (
              <TouchableOpacity
                onPress={() => {
                  setQuery('');
                  setResults([]);
                  setArtists([]);
                  setAlbums([]);
                  setSearched(false);
                }}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Ionicons name="close-circle" size={20} color={colors.textTertiary} />
              </TouchableOpacity>
            )}
          </View>
        </Animated.View>
      </View>

      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={colors.defaultAccent} />
        </View>
      ) : !searched ? (
        <View style={styles.suggestionsContainer}>
          <Text style={styles.suggestionsLabel}>Popular Searches</Text>
          <View style={styles.chips}>
            {POPULAR_SEARCHES.map((term, i) => (
              <Animated.View key={term} entering={FadeInDown.delay(200 + i * 60).springify()}>
                <TouchableOpacity
                  style={styles.chip}
                  onPress={() => handleChipPress(term)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.chipText}>{term}</Text>
                </TouchableOpacity>
              </Animated.View>
            ))}
          </View>
          <View style={styles.emptyIconContainer}>
            <Ionicons name="search" size={64} color={colors.surfaceElevated} />
            <Text style={styles.hintText}>Find your next favorite song</Text>
          </View>
        </View>
      ) : results.length === 0 && artists.length === 0 && albums.length === 0 ? (
        <View style={styles.centerContainer}>
          <Ionicons name="musical-notes-outline" size={56} color={colors.surfaceLight} />
          <Text style={styles.hintText}>No results for &ldquo;{query}&rdquo;</Text>
        </View>
      ) : (
        <FlatList
          data={results}
          keyExtractor={(item, index) => `${item.id}-${index}`}
          ListHeaderComponent={renderHeader}
          ListFooterComponent={renderFooter}
          renderItem={({ item }) => (
            <SongCard song={item} onPress={() => handleSongPress(item)} />
          )}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.5}
        />
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: spacing.screenPadding,
    paddingTop: spacing.xxl,
    gap: spacing.lg,
  },
  title: {
    ...typography.h1,
    color: colors.textPrimary,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceElevated,
    borderRadius: 16,
    paddingHorizontal: spacing.lg,
    height: 52,
    gap: spacing.sm,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  searchBarFocused: {
    borderColor: 'rgba(139,92,246,0.3)',
  },
  input: {
    flex: 1,
    ...typography.body,
    color: colors.textPrimary,
    height: '100%',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: 100,
    gap: spacing.lg,
  },
  suggestionsContainer: {
    paddingHorizontal: spacing.screenPadding,
    paddingTop: spacing.xl,
  },
  suggestionsLabel: {
    ...typography.caption,
    color: colors.textTertiary,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: spacing.md,
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  chipText: {
    ...typography.bodySmall,
    color: colors.textSecondary,
  },
  emptyIconContainer: {
    alignItems: 'center',
    marginTop: 60,
    gap: spacing.md,
  },
  hintText: {
    ...typography.body,
    color: colors.textTertiary,
    textAlign: 'center',
  },
  section: {
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
  },
  sectionLabel: {
    ...typography.caption,
    color: colors.textTertiary,
    textTransform: 'uppercase',
    letterSpacing: 1,
    paddingHorizontal: spacing.screenPadding,
    marginBottom: spacing.sm,
  },
  horizontalList: {
    paddingHorizontal: spacing.screenPadding,
    gap: 12,
  },
  artistCard: {
    alignItems: 'center',
    width: 80,
  },
  artistImage: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: colors.surface,
    marginBottom: 6,
  },
  artistName: {
    ...typography.caption,
    color: colors.textPrimary,
    textAlign: 'center',
    fontWeight: '600',
  },
  verifiedBadge: {
    position: 'absolute',
    top: 50,
    right: 4,
  },
  albumCard: {
    width: 120,
  },
  albumImage: {
    width: 120,
    height: 120,
    borderRadius: 10,
    backgroundColor: colors.surface,
    marginBottom: 6,
  },
  albumTitle: {
    ...typography.caption,
    color: colors.textPrimary,
    fontWeight: '600',
  },
  albumArtist: {
    ...typography.caption,
    color: colors.textTertiary,
    fontSize: 11,
  },
  loadingMore: {
    paddingVertical: 20,
    alignItems: 'center',
  },
});
