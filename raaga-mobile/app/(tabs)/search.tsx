import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  ScrollView,
  Keyboard,
  Dimensions,
} from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import Animated, { FadeInDown, FadeIn } from 'react-native-reanimated';
import { Screen } from '../../components/Common/Screen';
import { SongCard } from '../../components/Cards/SongCard';
import { api } from '../../services/api';
import { usePlayerStore } from '../../stores/playerStore';
import { colors, typography, spacing } from '../../theme';
import { Song } from '../../types';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const POPULAR_SEARCHES = [
  'Arijit Singh',
  'Kesariya',
  'Tum Hi Ho',
  'Agar Tum Saath Ho',
  'Raataan Lambiyan',
  'Apna Bana Le',
  'Chaand Baaliyan',
  'Excuses',
];

interface Artist {
  id: string;
  name: string;
  image?: string;
  isVerified?: boolean;
}

interface Album {
  id: string;
  title: string;
  artist: string;
  image?: string;
  year?: string;
  songCount?: number;
}

interface SearchResults {
  songs: Song[];
  artists: Artist[];
  albums: Album[];
}

export default function SearchScreen() {
  const [query, setQuery] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<SearchResults>({ songs: [], artists: [], albums: [] });
  const [trendingSongs, setTrendingSongs] = useState<Song[]>([]);
  const [trendingLoading, setTrendingLoading] = useState(true);

  const inputRef = useRef<TextInput>(null);
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const router = useRouter();

  const { play, setQueue } = usePlayerStore();

  useEffect(() => {
    loadTrending();
  }, []);

  const loadTrending = async () => {
    try {
      setTrendingLoading(true);
      const data = await api.trending?.() ?? [];
      setTrendingSongs(data.slice(0, 10));
    } catch (e) {
      setTrendingSongs([]);
    } finally {
      setTrendingLoading(false);
    }
  };

  const performSearch = useCallback(async (text: string) => {
    if (!text.trim()) {
      setResults({ songs: [], artists: [], albums: [] });
      setIsLoading(false);
      return;
    }
    try {
      setIsLoading(true);
      // Use searchAll which returns songs (as results), albums, artists
      const data = await api.searchAll(text);
      setResults({
        songs: data.results ?? [],
        artists: data.artists ?? [],
        albums: data.albums ?? [],
      });
    } catch (e) {
      setResults({ songs: [], artists: [], albums: [] });
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleQueryChange = (text: string) => {
    setQuery(text);
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    if (!text.trim()) {
      setResults({ songs: [], artists: [], albums: [] });
      setIsLoading(false);
      return;
    }
    // Only set loading if debounce triggers a search
    debounceTimer.current = setTimeout(() => {
      setIsLoading(true);
      performSearch(text);
    }, 400);
  };

  const handleClear = () => {
    setQuery('');
    setResults({ songs: [], artists: [], albums: [] });
    setIsLoading(false);
    inputRef.current?.focus();
  };

  const handlePopularSearch = (term: string) => {
    setQuery(term);
    inputRef.current?.blur();
    performSearch(term);
  };

  const handleSongPress = (song: Song, songList: Song[]) => {
    Keyboard.dismiss();
    setQueue(songList);
    play(song);
  };

  const handleAlbumPress = (album: Album) => {
    Keyboard.dismiss();
    router.push(`/album/${album.id}`);
  };

  const handleArtistPress = (artist: Artist) => {
    Keyboard.dismiss();
    router.push(`/artist/${artist.id}`);
  };

  const hasResults = query.trim().length > 0;
  const showDefault = !hasResults;

  const renderHeader = useCallback(() => (
    <View>
      {/* Albums section */}
      {results.albums.length > 0 && (
        <View style={styles.horizontalSection}>
          <Text style={styles.sectionLabel}>ALBUMS</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.horizontalList}
          >
            {results.albums.map((album, index) => (
              <TouchableOpacity
                key={album.id || index}
                style={styles.albumCard}
                onPress={() => handleAlbumPress(album)}
                activeOpacity={0.7}
              >
                <View style={styles.albumImageWrap}>
                  {album.image ? (
                    <Image
                      source={{ uri: album.image }}
                      style={styles.albumImage}
                      contentFit="cover"
                    />
                  ) : (
                    <View style={styles.albumImagePlaceholder}>
                      <Ionicons name="disc" size={24} color={colors.textTertiary} />
                    </View>
                  )}
                </View>
                <Text style={styles.albumTitle} numberOfLines={1}>{album.title}</Text>
                <Text style={styles.albumMeta} numberOfLines={1}>{album.artist}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

      {/* Artists section */}
      {results.artists.length > 0 && (
        <View style={styles.horizontalSection}>
          <Text style={styles.sectionLabel}>ARTISTS</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.horizontalList}
          >
            {results.artists.map((artist, index) => (
              <TouchableOpacity
                key={artist.id || index}
                style={styles.artistCard}
                onPress={() => handleArtistPress(artist)}
                activeOpacity={0.7}
              >
                <View style={styles.artistImageWrap}>
                  {artist.image ? (
                    <Image
                      source={{ uri: artist.image }}
                      style={styles.artistImage}
                      contentFit="cover"
                    />
                  ) : (
                    <View style={styles.artistImagePlaceholder}>
                      <Ionicons name="person" size={24} color={colors.textTertiary} />
                    </View>
                  )}
                </View>
                <Text style={styles.artistName} numberOfLines={1}>{artist.name}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

      {/* Songs label */}
      {results.songs.length > 0 && (
        <View>
          <Text style={[styles.sectionLabel, { marginTop: 4 }]}>SONGS</Text>
        </View>
      )}
    </View>
  ), [results.albums, results.artists, results.songs.length]);

  return (
    <Screen>
      <View style={styles.container}>
        {/* Header */}
        <Animated.View entering={FadeIn.duration(400)} style={styles.header}>
          <Text style={styles.headerTitle}>Search</Text>
        </Animated.View>

        {/* Search Bar */}
        <Animated.View
          entering={FadeInDown.duration(400).delay(80)}
          style={[
            styles.searchBar,
            isFocused && styles.searchBarFocused,
          ]}
        >
          <Ionicons
            name="search"
            size={18}
            color={isFocused ? colors.defaultAccent : colors.textTertiary}
            style={styles.searchIcon}
          />
          <TextInput
            ref={inputRef}
            style={styles.searchInput}
            placeholder="Songs, artists, albums…"
            placeholderTextColor={colors.textTertiary}
            value={query}
            onChangeText={handleQueryChange}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            returnKeyType="search"
            onSubmitEditing={() => performSearch(query)}
            autoCorrect={false}
            autoCapitalize="none"
          />
          {query.length > 0 && (
            <TouchableOpacity onPress={handleClear} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Text style={styles.clearBtn}>Clear</Text>
            </TouchableOpacity>
          )}
        </Animated.View>

        {/* Content */}
        {showDefault ? (
          <ScrollView
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={styles.scrollContent}
          >
            {/* Popular Searches */}
            <Animated.View entering={FadeInDown.duration(400).delay(140)}>
              <Text style={styles.sectionLabel}>POPULAR SEARCHES</Text>
              <View style={styles.chipsContainer}>
                {POPULAR_SEARCHES.map((term, index) => (
                  <TouchableOpacity
                    key={index}
                    style={styles.chip}
                    onPress={() => handlePopularSearch(term)}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.chipText}>{term}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </Animated.View>

            {/* Trending Now */}
            <Animated.View entering={FadeInDown.duration(400).delay(200)} style={styles.trendingSection}>
              <Text style={styles.sectionLabel}>TRENDING NOW</Text>
              {trendingLoading ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator color={colors.defaultAccent} size="small" />
                </View>
              ) : trendingSongs.length === 0 ? (
                <View style={styles.emptyInline}>
                  <Text style={styles.emptyInlineText}>Nothing trending right now</Text>
                </View>
              ) : (
                trendingSongs.map((song, index) => (
                  <Animated.View
                    key={song.id}
                    entering={FadeInDown.duration(300).delay(220 + index * 40)}
                  >
                    <SongCard
                      song={song}
                      onPress={() => handleSongPress(song, trendingSongs)}
                    />
                  </Animated.View>
                ))
              )}
            </Animated.View>
          </ScrollView>
        ) : (
          <View style={styles.resultsContainer}>
            {/* Loading */}
            {isLoading ? (
              <View style={styles.loadingFull}>
                <ActivityIndicator color={colors.defaultAccent} size="large" />
                <Text style={styles.loadingText}>Searching…</Text>
              </View>
            ) : results.songs.length === 0 && results.albums.length === 0 && results.artists.length === 0 ? (
              <EmptyState query={query} />
            ) : (
              <FlatList
                data={results.songs}
                keyExtractor={(item) => item.id}
                ListHeaderComponent={renderHeader}
                renderItem={({ item }) => (
                  <SongCard
                    song={item}
                    onPress={() => handleSongPress(item, results.songs)}
                  />
                )}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
                contentContainerStyle={styles.listContent}
                removeClippedSubviews
                maxToRenderPerBatch={10}
                windowSize={7}
                ListEmptyComponent={
                  (results.albums.length > 0 || results.artists.length > 0) ? null : undefined
                }
              />
            )}
          </View>
        )}
      </View>
    </Screen>
  );
}

function EmptyState({ query }: { query: string }) {
  return (
    <Animated.View entering={FadeIn.duration(300)} style={styles.emptyState}>
      <Ionicons name="search-outline" size={44} color={colors.textTertiary} />
      <Text style={styles.emptyTitle}>No results found</Text>
      <Text style={styles.emptySubtitle}>No results for "{query}"</Text>
    </Animated.View>
  );
}

const CARD_WIDTH = (SCREEN_WIDTH - spacing.screenPadding * 2 - 12) / 3;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    paddingHorizontal: spacing.screenPadding,
    paddingTop: 16,
    paddingBottom: 12,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.textPrimary,
    letterSpacing: -0.5,
  },

  // Search bar
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceElevated,
    borderRadius: spacing.cardRadius,
    marginHorizontal: spacing.screenPadding,
    marginBottom: 20,
    paddingHorizontal: 14,
    height: 46,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  searchBarFocused: {
    borderColor: 'rgba(6, 182, 212, 0.3)',
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: colors.textPrimary,
    paddingVertical: 0,
  },
  clearBtn: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.defaultAccent,
    paddingLeft: 8,
  },

  // Scroll
  scrollContent: {
    paddingBottom: 120,
  },

  // Section labels
  sectionLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.textTertiary,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    paddingHorizontal: spacing.screenPadding,
    marginBottom: 12,
  },

  // Chips
  chipsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: spacing.screenPadding,
    gap: 8,
    marginBottom: 28,
  },
  chip: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: 'rgba(232, 236, 242, 0.06)',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 7,
  },
  chipText: {
    fontSize: 13,
    color: colors.textSecondary,
    fontWeight: '500',
  },

  // Trending
  trendingSection: {
    marginBottom: 20,
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  emptyInline: {
    paddingHorizontal: spacing.screenPadding,
    paddingVertical: 16,
  },
  emptyInlineText: {
    fontSize: 14,
    color: colors.textTertiary,
  },

  // Results
  resultsContainer: {
    flex: 1,
  },
  listContent: {
    paddingBottom: 120,
  },

  // Horizontal sections
  horizontalSection: {
    marginBottom: 20,
  },
  horizontalList: {
    paddingHorizontal: spacing.screenPadding,
    gap: 12,
  },

  // Album cards (horizontal)
  albumCard: {
    width: CARD_WIDTH,
    gap: 6,
  },
  albumImageWrap: {
    width: CARD_WIDTH,
    height: CARD_WIDTH,
    borderRadius: 10,
    overflow: 'hidden',
    backgroundColor: colors.surfaceElevated,
  },
  albumImage: {
    width: '100%',
    height: '100%',
  },
  albumImagePlaceholder: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surfaceElevated,
  },
  albumTitle: {
    fontSize: 13,
    fontWeight: '500',
    color: colors.textPrimary,
  },
  albumMeta: {
    fontSize: 11,
    color: colors.textTertiary,
  },

  // Artist cards (horizontal)
  artistCard: {
    width: CARD_WIDTH * 0.85,
    alignItems: 'center',
    gap: 6,
  },
  artistImageWrap: {
    width: CARD_WIDTH * 0.85,
    height: CARD_WIDTH * 0.85,
    borderRadius: CARD_WIDTH * 0.5,
    overflow: 'hidden',
    backgroundColor: colors.surfaceElevated,
  },
  artistImage: {
    width: '100%',
    height: '100%',
    borderRadius: CARD_WIDTH * 0.5,
  },
  artistImagePlaceholder: {
    width: '100%',
    height: '100%',
    borderRadius: CARD_WIDTH * 0.5,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surfaceElevated,
  },
  artistName: {
    fontSize: 13,
    fontWeight: '500',
    color: colors.textPrimary,
    textAlign: 'center',
  },

  // Loading full
  loadingFull: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
    color: colors.textTertiary,
  },

  // Empty state
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingBottom: 80,
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: colors.textSecondary,
    marginTop: 4,
  },
  emptySubtitle: {
    fontSize: 14,
    color: colors.textTertiary,
    textAlign: 'center',
    paddingHorizontal: 40,
  },
});
