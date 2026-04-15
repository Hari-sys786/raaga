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

type LibraryTab = 'favorites' | 'recent';

export default function LibraryScreen() {
  const [activeTab, setActiveTab] = useState<LibraryTab>('favorites');

  const { favorites, recentlyPlayed } = useLibraryStore();
  const { play, setQueue } = usePlayerStore();

  const songs: Song[] = activeTab === 'favorites' ? favorites : recentlyPlayed;

  const handleSongPress = (song: Song) => {
    setQueue(songs);
    play(song);
  };

  return (
    <Screen>
      <View style={styles.container}>
        {/* Header */}
        <Animated.View entering={FadeInDown.duration(400)} style={styles.header}>
          <Text style={styles.headerTitle}>Library</Text>
        </Animated.View>

        {/* Tab Pills */}
        <Animated.View entering={FadeInDown.duration(400).delay(80)} style={styles.tabsRow}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'favorites' && styles.tabActive]}
            onPress={() => setActiveTab('favorites')}
            activeOpacity={0.75}
          >
            <Ionicons
              name={activeTab === 'favorites' ? 'heart' : 'heart-outline'}
              size={15}
              color={activeTab === 'favorites' ? colors.accentSecondary : colors.textTertiary}
              style={styles.tabIcon}
            />
            <Text style={[styles.tabText, activeTab === 'favorites' && styles.tabTextActive]}>
              Favorites
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tab, activeTab === 'recent' && styles.tabActive]}
            onPress={() => setActiveTab('recent')}
            activeOpacity={0.75}
          >
            <Ionicons
              name={activeTab === 'recent' ? 'time' : 'time-outline'}
              size={15}
              color={activeTab === 'recent' ? colors.defaultAccent : colors.textTertiary}
              style={styles.tabIcon}
            />
            <Text style={[styles.tabText, activeTab === 'recent' && styles.tabTextActive]}>
              Recent
            </Text>
          </TouchableOpacity>
        </Animated.View>

        {/* Song List or Empty State */}
        {songs.length === 0 ? (
          <EmptyState tab={activeTab} />
        ) : (
          <Animated.FlatList
            data={songs}
            keyExtractor={(item: Song) => item.id}
            renderItem={({ item, index }: { item: Song; index: number }) => (
              <Animated.View entering={FadeInDown.duration(300).delay(index * 40)}>
                <SongCard
                  song={item}
                  onPress={() => handleSongPress(item)}
                />
              </Animated.View>
            )}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.listContent}
          />
        )}
      </View>
    </Screen>
  );
}

function EmptyState({ tab }: { tab: LibraryTab }) {
  const isFavorites = tab === 'favorites';

  return (
    <Animated.View entering={FadeInDown.duration(400).delay(160)} style={styles.emptyState}>
      <View style={styles.emptyIconWrap}>
        <Ionicons
          name={isFavorites ? 'heart-outline' : 'time-outline'}
          size={48}
          color={colors.textTertiary}
        />
      </View>
      <Text style={styles.emptyTitle}>
        {isFavorites ? 'No favorites yet' : 'Nothing played yet'}
      </Text>
      <Text style={styles.emptySubtitle}>
        {isFavorites
          ? 'Songs you love will appear here.\nTap the heart on any track.'
          : 'Your recently played songs\nwill show up here.'}
      </Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },

  // Header
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

  // Tabs
  tabsRow: {
    flexDirection: 'row',
    paddingHorizontal: spacing.screenPadding,
    gap: 10,
    marginBottom: 20,
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: 'transparent',
    gap: 6,
  },
  tabActive: {
    backgroundColor: 'rgba(6,182,212,0.1)',
    borderColor: 'rgba(6,182,212,0.3)',
  },
  tabIcon: {
    // positioned via gap in parent
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.textSecondary,
  },
  tabTextActive: {
    color: colors.defaultAccent,
    fontWeight: '600',
  },

  // List
  listContent: {
    paddingBottom: 120,
  },

  // Empty
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: 80,
    gap: 12,
  },
  emptyIconWrap: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: colors.surfaceElevated,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  emptySubtitle: {
    fontSize: 14,
    color: colors.textTertiary,
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: 40,
  },
});
