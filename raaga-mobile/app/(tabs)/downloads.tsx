import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Alert,
} from 'react-native';
import { Image } from 'expo-image';
import { Screen } from '../../components/Common/Screen';
import { useDownloadStore, DownloadedSong, DownloadQueueItem } from '../../stores/downloadStore';
import { usePlayerStore } from '../../stores/playerStore';
import { deleteSong, deleteAllDownloads, getStorageUsed } from '../../services/downloads';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, spacing } from '../../theme';

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 MB';
  const mb = bytes / (1024 * 1024);
  return mb < 0.1 ? `${(bytes / 1024).toFixed(0)} KB` : `${mb.toFixed(1)} MB`;
}

function DownloadingItem({ item }: { item: DownloadQueueItem }) {
  const progressPercent = Math.round(item.progress * 100);

  return (
    <View style={styles.downloadingItem}>
      <Image
        source={{ uri: item.song.image }}
        style={styles.artwork}
        contentFit="cover"
        placeholder={{ blurhash: 'L6PZfSi_.AyE_3t7t7R**0o#DgR4' }}
        transition={200}
      />
      <View style={styles.downloadingInfo}>
        <Text style={styles.songTitle} numberOfLines={1}>
          {item.song.title}
        </Text>
        <View style={styles.progressBarContainer}>
          <View style={styles.progressBarTrack}>
            <View
              style={[styles.progressBarFill, { width: `${progressPercent}%` }]}
            />
          </View>
          <Text style={styles.progressText}>
            {item.status === 'failed' ? '❌ Failed' : `${progressPercent}%`}
          </Text>
        </View>
      </View>
    </View>
  );
}

function DownloadedItem({
  item,
  onPlay,
  onDelete,
}: {
  item: DownloadedSong;
  onPlay: () => void;
  onDelete: () => void;
}) {
  return (
    <TouchableOpacity style={styles.downloadedItem} onPress={onPlay} activeOpacity={0.7}>
      <Image
        source={{ uri: item.song.image }}
        style={styles.artwork}
        contentFit="cover"
        placeholder={{ blurhash: 'L6PZfSi_.AyE_3t7t7R**0o#DgR4' }}
        transition={200}
      />
      <View style={styles.downloadedInfo}>
        <Text style={styles.songTitle} numberOfLines={1}>
          {item.song.title}
        </Text>
        <Text style={styles.songSubtitle} numberOfLines={1}>
          {item.song.artist} • {formatBytes(item.fileSize)}
        </Text>
      </View>
      <TouchableOpacity onPress={onDelete} style={styles.deleteButton} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
        <Ionicons name="trash-outline" size={20} color={colors.textTertiary} />
      </TouchableOpacity>
    </TouchableOpacity>
  );
}

export default function DownloadsScreen() {
  const downloads = useDownloadStore((s) => s.downloads);
  const queue = useDownloadStore((s) => s.queue);
  const play = usePlayerStore((s) => s.play);
  const [storageUsed, setStorageUsed] = useState(0);
  const [refreshing, setRefreshing] = useState(false);

  const downloadedList = Object.values(downloads).sort(
    (a, b) => b.downloadedAt - a.downloadedAt
  );
  const activeQueue = queue.filter(
    (q) => q.status === 'downloading' || q.status === 'pending' || q.status === 'failed'
  );
  const downloadCount = downloadedList.length;

  const refreshStorage = useCallback(async () => {
    const used = await getStorageUsed();
    setStorageUsed(used);
  }, []);

  useEffect(() => {
    refreshStorage();
  }, [downloads, refreshStorage]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await refreshStorage();
    setRefreshing(false);
  }, [refreshStorage]);

  const handleDeleteSong = useCallback(
    (songId: string, title: string) => {
      Alert.alert('Delete Download', `Remove "${title}" from downloads?`, [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => deleteSong(songId),
        },
      ]);
    },
    []
  );

  const handleDeleteAll = useCallback(() => {
    if (downloadCount === 0) return;
    Alert.alert(
      'Delete All Downloads',
      `Remove all ${downloadCount} downloaded songs? This cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete All',
          style: 'destructive',
          onPress: () => deleteAllDownloads(),
        },
      ]
    );
  }, [downloadCount]);

  const handlePlaySong = useCallback(
    (item: DownloadedSong) => {
      play(item.song);
    },
    [play]
  );

  if (downloadCount === 0 && activeQueue.length === 0) {
    return (
      <Screen scroll>
        <View style={styles.header}>
          <Text style={styles.title}>Downloads</Text>
          <Text style={styles.subtitle}>0 songs • 0 MB</Text>
        </View>
        <View style={styles.emptyState}>
          <Ionicons name="download" size={48} color={colors.textTertiary} style={{ marginBottom: spacing.lg }} />
          <Text style={styles.emptyTitle}>No downloads yet</Text>
          <Text style={styles.emptySubtitle}>
            Tap the download icon on any song to download it for offline listening
          </Text>
        </View>
        <View style={{ height: 100 }} />
      </Screen>
    );
  }

  return (
    <Screen
      scroll
      refreshing={refreshing}
      onRefresh={handleRefresh}
    >
      <View style={styles.header}>
        <Text style={styles.title}>Downloads</Text>
        <Text style={styles.subtitle}>
          {downloadCount} {downloadCount === 1 ? 'song' : 'songs'} •{' '}
          {formatBytes(storageUsed)}
        </Text>
      </View>

      {/* Downloading section */}
      {activeQueue.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Downloading</Text>
          {activeQueue.map((item) => (
            <DownloadingItem key={item.song.id} item={item} />
          ))}
        </View>
      )}

      {/* Downloaded section */}
      {downloadedList.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Downloaded</Text>
          {downloadedList.map((item) => (
            <DownloadedItem
              key={item.song.id}
              item={item}
              onPlay={() => handlePlaySong(item)}
              onDelete={() => handleDeleteSong(item.song.id, item.song.title)}
            />
          ))}
        </View>
      )}

      {/* Delete All button */}
      {downloadCount > 0 && (
        <View style={styles.deleteAllContainer}>
          <TouchableOpacity
            style={styles.deleteAllButton}
            onPress={handleDeleteAll}
            activeOpacity={0.7}
          >
            <Text style={styles.deleteAllText}>Delete All Downloads</Text>
          </TouchableOpacity>
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
    gap: spacing.xs,
  },
  title: {
    ...typography.h1,
    color: colors.textPrimary,
  },
  subtitle: {
    ...typography.bodySmall,
    color: colors.textTertiary,
  },
  section: {
    paddingHorizontal: spacing.screenPadding,
    marginBottom: spacing.xl,
  },
  sectionTitle: {
    ...typography.caption,
    color: colors.textTertiary,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: spacing.md,
  },
  downloadingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    gap: spacing.md,
  },
  artwork: {
    width: 48,
    height: 48,
    borderRadius: 8,
    backgroundColor: colors.surface,
  },
  downloadingInfo: {
    flex: 1,
    gap: spacing.xs,
  },
  songTitle: {
    ...typography.body,
    color: colors.textPrimary,
  },
  progressBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  progressBarTrack: {
    flex: 1,
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: 4,
    backgroundColor: colors.defaultAccent,
    borderRadius: 2,
  },
  progressText: {
    ...typography.caption,
    color: colors.textSecondary,
    width: 44,
    textAlign: 'right',
  },
  downloadedItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    gap: spacing.md,
  },
  downloadedInfo: {
    flex: 1,
    gap: 2,
  },
  songSubtitle: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  deleteButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteAllContainer: {
    paddingHorizontal: spacing.screenPadding,
    paddingTop: spacing.lg,
  },
  deleteAllButton: {
    backgroundColor: 'rgba(255, 68, 68, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(255, 68, 68, 0.3)',
    borderRadius: spacing.buttonRadiusLarge,
    paddingVertical: spacing.lg,
    alignItems: 'center',
  },
  deleteAllText: {
    ...typography.body,
    color: colors.error,
    fontWeight: '600',
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: spacing.xxl * 3,
    paddingHorizontal: spacing.screenPadding,
  },
  emptyTitle: {
    ...typography.h4,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
  emptySubtitle: {
    ...typography.bodySmall,
    color: colors.textTertiary,
    textAlign: 'center',
    lineHeight: 20,
  },
});
