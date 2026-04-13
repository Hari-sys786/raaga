import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Screen } from '../../components/Common/Screen';
import { SongCard } from '../../components/Cards/SongCard';
import { useLibraryStore } from '../../stores/libraryStore';
import { usePlayerStore } from '../../stores/playerStore';
import { colors, typography, spacing } from '../../theme';
import { Song } from '../../types';

type Tab = 'favorites' | 'recent';

export default function LibraryScreen() {
  const favorites = useLibraryStore((s) => s.favorites);
  const recentlyPlayed = useLibraryStore((s) => s.recentlyPlayed);
  const play = usePlayerStore((s) => s.play);
  const setQueue = usePlayerStore((s) => s.setQueue);
  const [activeTab, setActiveTab] = useState<Tab>('favorites');

  const handlePlaySong = (song: Song, list: Song[]) => {
    setQueue(list);
    play(song);
  };

  const currentList = activeTab === 'favorites' ? favorites : recentlyPlayed;

  return (
    <Screen scroll>
      <View style={styles.header}>
        <Text style={styles.title}>Library</Text>
      </View>

      {/* Tabs */}
      <View style={styles.tabRow}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'favorites' && styles.tabActive]}
          onPress={() => setActiveTab('favorites')}
        >
          <Ionicons name="heart" size={16} color={activeTab === 'favorites' ? colors.defaultAccent : colors.textTertiary} />
          <Text style={[styles.tabText, activeTab === 'favorites' && styles.tabTextActive]}>
            Favorites ({favorites.length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'recent' && styles.tabActive]}
          onPress={() => setActiveTab('recent')}
        >
          <Ionicons name="time" size={16} color={activeTab === 'recent' ? colors.defaultAccent : colors.textTertiary} />
          <Text style={[styles.tabText, activeTab === 'recent' && styles.tabTextActive]}>
            Recent ({recentlyPlayed.length})
          </Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      {currentList.length > 0 ? (
        currentList.map((song, index) => (
          <Animated.View key={song.id} entering={FadeInDown.delay(index * 50).springify()}>
            <SongCard
              song={song}
              onPress={() => handlePlaySong(song, currentList)}
            />
          </Animated.View>
        ))
      ) : (
        <View style={styles.emptyState}>
          <Ionicons
            name={activeTab === 'favorites' ? 'heart-outline' : 'time-outline'}
            size={56}
            color={colors.surfaceLight}
          />
          <Text style={styles.emptyTitle}>
            {activeTab === 'favorites' ? 'No favorites yet' : 'No recent songs'}
          </Text>
          <Text style={styles.emptySubtitle}>
            {activeTab === 'favorites'
              ? 'Tap the heart on a song to save it here'
              : 'Start playing music to build your history'}
          </Text>
        </View>
      )}

      <View style={{ height: 100 }} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: spacing.screenPadding,
    paddingTop: spacing.xxl,
    paddingBottom: spacing.lg,
  },
  title: {
    ...typography.h1,
    color: colors.textPrimary,
  },
  tabRow: {
    flexDirection: 'row',
    paddingHorizontal: spacing.screenPadding,
    marginBottom: spacing.xl,
    gap: spacing.sm,
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  tabActive: {
    borderColor: 'rgba(139,92,246,0.3)',
    backgroundColor: 'rgba(139,92,246,0.1)',
  },
  tabText: {
    ...typography.bodySmall,
    color: colors.textTertiary,
    fontWeight: '500',
  },
  tabTextActive: {
    color: colors.defaultAccent,
  },
  emptyState: {
    alignItems: 'center',
    paddingTop: 80,
    paddingHorizontal: spacing.screenPadding,
    gap: spacing.md,
  },
  emptyTitle: {
    ...typography.h4,
    color: colors.textSecondary,
  },
  emptySubtitle: {
    ...typography.bodySmall,
    color: colors.textTertiary,
    textAlign: 'center',
    lineHeight: 20,
  },
});
