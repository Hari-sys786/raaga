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

interface SearchAlbum {
  id: string;
  title: string;
  artist: string;
  image: string;
  year?: string;
}

interface SearchArtist {
  id: string;
  name: string;
  image: string;
}

const POPULAR_SEARCHES = ['Arijit Singh', 'Diljit', 'AP Dhillon', 'Pritam', 'Shreya Ghoshal', 'KK'];

export default function SearchScreen() {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Song[]>([]);
  const [albums, setAlbums] = useState<SearchAlbum[]>([]);
  const [artists, setArtists] = useState<SearchArtist[]>([]);
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
      setAlbums([]);
      setArtists([]);
      setSearched(false);
      return;
    }

    if (p === 1) {
      setLoading(true);
      setResults([]);
      setAlbums([]);
      setArtists([]);
    } else {
      setLoadingMore(true);
    }
    setSearched(true);
    currentQuery.current = q;

    try {
      const data = await api.search(q, p, 'all');
      // Don't apply stale results
      if (currentQuery.current !== q) return;

      const songs: Song[] = data?.results || [];
      const albumResults: SearchAlbum[] = data?.albums || [];
      const artistResults: SearchArtist[] = data?.artists || [];

      if (p === 1) {
        setResults(songs);
        setAlbums(albumResults);
        setArtists(artistResults);
      } else {
        setResults(prev => [...prev, ...songs]);
      }
      setPage(p);
      setHasMore(data?.hasMore ?? songs.length >= 20);
    } catch (err) {
      console.warn('Search error:', err);
      if (p === 1) {
        setResults([]);
        setAlbums([]);
        setArtists([]);
      }
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, []);

  const handleQueryChange = useCallback(
    (text: string) => {
      setQuery(text);
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => doSearch(text, 1), 350);
    },
    [doSearch]
  );

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

  const handleLoadMore = useCallback(() => {
    if (!hasMore || loadingMore || loading) return;
    doSearch(query, page + 1);
  }, [hasMore, loadingMore, loading, query, page, doSearch]);

  // Album card (horizontal)
  const AlbumResult = ({ album }: { album: SearchAlbum }) => (
    <TouchableOpacity
      style={styles.albumCard}
      onPress={() => router.push(`/album/${album.id}`)}
      activeOpacity={0.8}
    >
      <Image
        source={{ uri: album.image }}
        style={styles.albumArt}
        contentFit="cover"
        placeholder={{ blurhash: 'L6PZfSi_.AyE_3t7t7R**0o#DgR4' }}
        transition={200}
      />
      <Text style={styles.albumTitle} numberOfLines={1}>{album.title}</Text>
      <Text style={styles.albumArtist} numberOfLines={1}>{album.artist}</Text>
    </TouchableOpacity>
  );

  // Artist card (horizontal)
  const ArtistResult = ({ artist }: { artist: SearchArtist }) => (
    <TouchableOpacity
      style={styles.artistCard}
      onPress={() => router.push(`/artist/${artist.id}`)}
      activeOpacity={0.8}
    >
      <Image
        source={{ uri: artist.image }}
        style={styles.artistAvatar}
        contentFit="cover"
        placeholder={{ blurhash: 'L6PZfSi_.AyE_3t7t7R**0o#DgR4' }}
        transition={200}
      />
      <Text style={styles.artistName} numberOfLines={1}>{artist.name}</Text>
    </TouchableOpacity>
  );

  const ListHeader = () => (
    <View>
      {/* Artists Section */}
      {artists.length > 0 && (
        <Animated.View entering={FadeInDown.duration(300)} style={styles.section}>
          <Text style={styles.sectionTitle}>Artists</Text>
          <FlatList
            data={artists}
            keyExtractor={(item) => item.id}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.horizontalList}
            renderItem={({ item }) => <ArtistResult artist={item} />}
          />
        </Animated.View>
      )}

      {/* Albums Section */}
      {albums.length > 0 && (
        <Animated.View entering={FadeInDown.delay(100).duration(300)} style={styles.section}>
          <Text style={styles.sectionTitle}>Albums</Text>
          <FlatList
            data={albums}
            keyExtractor={(item) => item.id}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.horizontalList}
            renderItem={({ item }) => <AlbumResult album={item} />}
          />
        </Animated.View>
      )}

      {/* Songs label */}
      {results.length > 0 && (
        <Animated.View entering={FadeInDown.delay(150).duration(300)}>
          <Text style={[styles.sectionTitle, { marginTop: 8 }]}>Songs</Text>
        </Animated.View>
      )}
    </View>
  );

  const ListFooter = () => {
    if (loadingMore) {
      return (
        <View style={styles.footerLoader}>
          <ActivityIndicator size="small" color={colors.defaultAccent} />
          <Text style={styles.loadingMoreText}>Loading more…</Text>
        </View>
      );
    }
    return <View style={{ height: 80 }} />;
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
                  setAlbums([]);
                  setArtists([]);
                  setSearched(false);
                  setPage(1);
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
      ) : results.length === 0 && albums.length === 0 && artists.length === 0 ? (
        <View style={styles.centerContainer}>
          <Ionicons name="musical-notes-outline" size={56} color={colors.surfaceLight} />
          <Text style={styles.hintText}>No results for "{query}"</Text>
        </View>
      ) : (
        <FlatList
          data={results}
          keyExtractor={(item, index) => `${item.id}-${index}`}
          renderItem={({ item }) => (
            <SongCard song={item} onPress={() => handleSongPress(item)} />
          )}
          ListHeaderComponent={<ListHeader />}
          ListFooterComponent={<ListFooter />}
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.4}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
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
    marginBottom: spacing.lg,
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
  // Album cards
  albumCard: {
    width: 130,
  },
  albumArt: {
    width: 130,
    height: 130,
    borderRadius: 12,
    backgroundColor: colors.surface,
    marginBottom: 8,
  },
  albumTitle: {
    ...typography.bodySmall,
    color: colors.textPrimary,
    fontWeight: '600',
  },
  albumArtist: {
    ...typography.caption,
    color: colors.textTertiary,
    marginTop: 2,
  },
  // Artist cards
  artistCard: {
    width: 90,
    alignItems: 'center',
  },
  artistAvatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.surface,
    marginBottom: 8,
  },
  artistName: {
    ...typography.caption,
    color: colors.textPrimary,
    fontWeight: '600',
    textAlign: 'center',
  },
  footerLoader: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 20,
    gap: 8,
  },
  loadingMoreText: {
    ...typography.caption,
    color: colors.textTertiary,
  },
});
