import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  Keyboard,
} from 'react-native';
import { Screen } from '../../components/Common/Screen';
import { SongCard } from '../../components/Cards/SongCard';
import { colors, typography, spacing } from '../../theme';
import { api } from '../../services/api';
import { usePlayerStore } from '../../stores/playerStore';
import { Song } from '../../types';

export default function SearchScreen() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Song[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const play = usePlayerStore((s) => s.play);
  const setQueue = usePlayerStore((s) => s.setQueue);

  const doSearch = useCallback(async (q: string) => {
    if (q.trim().length < 2) {
      setResults([]);
      setSearched(false);
      return;
    }

    setLoading(true);
    setSearched(true);

    try {
      const data = await api.search(q);
      // Normalize response
      const songs = Array.isArray(data)
        ? data
        : data?.results || data?.songs || data?.data || [];
      setResults(songs);
    } catch (err) {
      console.warn('Search error:', err);
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleQueryChange = useCallback(
    (text: string) => {
      setQuery(text);
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => doSearch(text), 300);
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

  return (
    <Screen>
      {/* Search Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Search</Text>
        <View style={styles.searchBar}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={styles.input}
            placeholder="Search for songs, artists, albums..."
            placeholderTextColor={colors.textTertiary}
            value={query}
            onChangeText={handleQueryChange}
            autoCorrect={false}
            autoCapitalize="none"
            returnKeyType="search"
            selectionColor={colors.defaultAccent}
          />
          {query.length > 0 && (
            <Text
              style={styles.clearButton}
              onPress={() => {
                setQuery('');
                setResults([]);
                setSearched(false);
              }}
            >
              ✕
            </Text>
          )}
        </View>
      </View>

      {/* Results */}
      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={colors.defaultAccent} />
        </View>
      ) : !searched ? (
        <View style={styles.centerContainer}>
          <Text style={styles.hintEmoji}>🎶</Text>
          <Text style={styles.hintText}>
            Find your next favorite song
          </Text>
        </View>
      ) : results.length === 0 ? (
        <View style={styles.centerContainer}>
          <Text style={styles.hintEmoji}>🤷</Text>
          <Text style={styles.hintText}>
            No results for "{query}"
          </Text>
        </View>
      ) : (
        <FlatList
          data={results}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <SongCard song={item} onPress={() => handleSongPress(item)} />
          )}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={styles.resultsList}
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
    borderRadius: spacing.cardRadius,
    paddingHorizontal: spacing.lg,
    height: 48,
    gap: spacing.sm,
  },
  searchIcon: {
    fontSize: 16,
  },
  input: {
    flex: 1,
    ...typography.body,
    color: colors.textPrimary,
    height: '100%',
  },
  clearButton: {
    color: colors.textTertiary,
    fontSize: 16,
    padding: spacing.xs,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: 100,
  },
  hintEmoji: {
    fontSize: 48,
    marginBottom: spacing.lg,
  },
  hintText: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  resultsList: {
    paddingTop: spacing.lg,
    paddingBottom: 100,
  },
});
