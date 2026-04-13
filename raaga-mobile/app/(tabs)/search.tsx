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
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Screen } from '../../components/Common/Screen';
import { SongCard } from '../../components/Cards/SongCard';
import { colors, typography, spacing } from '../../theme';
import { api } from '../../services/api';
import { usePlayerStore } from '../../stores/playerStore';
import { Song } from '../../types';

const POPULAR_SEARCHES = ['Arijit Singh', 'Diljit', 'AP Dhillon', 'Pritam', 'Shreya Ghoshal', 'KK'];

export default function SearchScreen() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Song[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [focused, setFocused] = useState(false);
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

  const handleChipPress = useCallback(
    (term: string) => {
      setQuery(term);
      doSearch(term);
    },
    [doSearch]
  );

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
      ) : results.length === 0 ? (
        <View style={styles.centerContainer}>
          <Ionicons name="musical-notes-outline" size={56} color={colors.surfaceLight} />
          <Text style={styles.hintText}>No results for &ldquo;{query}&rdquo;</Text>
        </View>
      ) : (
        <FlatList
          data={results}
          keyExtractor={(item) => item.id}
          renderItem={({ item, index }) => (
            <Animated.View entering={FadeInDown.delay(index * 50).springify()}>
              <SongCard song={item} onPress={() => handleSongPress(item)} />
            </Animated.View>
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
  resultsList: {
    paddingTop: spacing.lg,
    paddingBottom: 100,
  },
});
