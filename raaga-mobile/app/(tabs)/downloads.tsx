import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Pressable,
  Dimensions,
} from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown, FadeIn, SlideInDown } from 'react-native-reanimated';
import { Screen } from '../../components/Common/Screen';
import { useDownloadStore, DownloadedSong, DownloadQueueItem } from '../../stores/downloadStore';
import { usePlayerStore } from '../../stores/playerStore';
import { deleteSong, deleteAllDownloads, getStorageUsed } from '../../services/downloads';
import { colors, typography, spacing } from '../../theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// ─── Helpers ────────────────────────────────────────────────────────────────

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

// ─── DeleteModal ─────────────────────────────────────────────────────────────

interface DeleteModalProps {
  visible: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  subtitle: string;
  songImage?: string;
  songTitle?: string;
  songArtist?: string;
  isDeleteAll?: boolean;
}

function DeleteModal({
  visible,
  onClose,
  onConfirm,
  title,
  subtitle,
  songImage,
  songTitle,
  songArtist,
  isDeleteAll,
}: DeleteModalProps) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={modalStyles.overlay} onPress={onClose}>
        <Animated.View
          entering={SlideInDown.duration(300).springify().damping(18)}
          style={modalStyles.container}
        >
          <Pressable onPress={(e) => e.stopPropagation()}>
            {/* Drag indicator */}
            <View style={modalStyles.dragIndicator} />

            {/* Icon */}
            <View style={modalStyles.iconWrap}>
              <Ionicons
                name={isDeleteAll ? 'trash' : 'trash-outline'}
                size={28}
                color={colors.error}
              />
            </View>

            {/* Song preview (single delete) */}
            {songTitle && !isDeleteAll && (
              <View style={modalStyles.songPreview}>
                {songImage ? (
                  <Image
                    source={{ uri: songImage }}
                    style={modalStyles.songArt}
                    contentFit="cover"
                  />
                ) : (
                  <View style={modalStyles.songArtPlaceholder}>
                    <Ionicons name="musical-note" size={18} color={colors.textTertiary} />
                  </View>
                )}
                <View style={modalStyles.songInfo}>
                  <Text style={modalStyles.songTitle} numberOfLines={1}>{songTitle}</Text>
                  {songArtist && (
                    <Text style={modalStyles.songArtist} numberOfLines={1}>{songArtist}</Text>
                  )}
                </View>
              </View>
            )}

            {/* Title & subtitle */}
            <Text style={modalStyles.title}>{title}</Text>
            <Text style={modalStyles.subtitle}>{subtitle}</Text>

            {/* Action buttons */}
            <View style={modalStyles.actions}>
              <TouchableOpacity
                style={modalStyles.cancelButton}
                onPress={onClose}
                activeOpacity={0.7}
              >
                <Text style={modalStyles.cancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={modalStyles.deleteButton}
                onPress={onConfirm}
                activeOpacity={0.7}
              >
                <Ionicons name="trash-outline" size={16} color="#fff" />
                <Text style={modalStyles.deleteText}>Delete</Text>
              </TouchableOpacity>
            </View>
          </Pressable>
        </Animated.View>
      </Pressable>
    </Modal>
  );
}

const modalStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'flex-end',
  },
  container: {
    backgroundColor: colors.surfaceElevated,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 24,
    paddingBottom: 40,
    paddingTop: 12,
    alignItems: 'center',
  },
  dragIndicator: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.surfaceLight,
    marginBottom: 20,
  },
  iconWrap: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  songPreview: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 10,
    gap: 12,
    width: '100%',
    marginBottom: 16,
  },
  songArt: {
    width: 44,
    height: 44,
    borderRadius: 8,
    backgroundColor: colors.background,
  },
  songArtPlaceholder: {
    width: 44,
    height: 44,
    borderRadius: 8,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  songInfo: {
    flex: 1,
    gap: 2,
  },
  songTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  songArtist: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.textPrimary,
    textAlign: 'center',
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
    paddingHorizontal: 8,
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  cancelButton: {
    flex: 1,
    height: 48,
    borderRadius: 14,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(232, 236, 242, 0.06)',
  },
  cancelText: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  deleteButton: {
    flex: 1,
    height: 48,
    borderRadius: 14,
    backgroundColor: colors.error,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  deleteText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#fff',
  },
});

// ─── StorageBar ──────────────────────────────────────────────────────────────

interface StorageBarProps {
  used: number;
  total: number;
}

function StorageBar({ used, total }: StorageBarProps) {
  const ratio = total > 0 ? Math.min(used / total, 1) : 0;
  const pct = Math.round(ratio * 100);

  return (
    <View style={styles.storageBarContainer}>
      <View style={styles.storageBarRow}>
        <Text style={styles.storageLabel}>Storage</Text>
        <Text style={styles.storageValue}>
          {formatBytes(used)} / {formatBytes(total)}
        </Text>
      </View>
      <View style={styles.storageTrack}>
        <View style={[styles.storageFill, { width: `${pct}%` }]} />
      </View>
      <Text style={styles.storagePercent}>{pct}% used</Text>
    </View>
  );
}

// ─── DownloadingItem ─────────────────────────────────────────────────────────

interface DownloadingItemProps {
  item: DownloadQueueItem;
}

function DownloadingItem({ item }: DownloadingItemProps) {
  const progress = item.progress ?? 0;

  return (
    <Animated.View entering={FadeInDown.duration(300)} style={styles.songRow}>
      <View style={styles.artworkPlaceholder}>
        <Ionicons name="musical-note" size={22} color={colors.textTertiary} />
      </View>
      <View style={styles.songInfo}>
        <Text style={styles.songTitle} numberOfLines={1}>
          {item.song.title}
        </Text>
        <Text style={styles.songSubtitle} numberOfLines={1}>
          {item.song.artist ?? 'Unknown Artist'}
        </Text>
        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: `${Math.round(progress * 100)}%` }]} />
        </View>
        <Text style={styles.progressText}>{Math.round(progress * 100)}%</Text>
      </View>
      <Ionicons name="cloud-download-outline" size={20} color={colors.defaultAccent} />
    </Animated.View>
  );
}

// ─── DownloadedItem ──────────────────────────────────────────────────────────

interface DownloadedItemProps {
  song: DownloadedSong;
  onDelete: (song: DownloadedSong) => void;
  onPlay: (song: DownloadedSong) => void;
}

function DownloadedItem({ song, onDelete, onPlay }: DownloadedItemProps) {
  return (
    <Animated.View entering={FadeInDown.duration(300)} style={styles.songRow}>
      <TouchableOpacity onPress={() => onPlay(song)} activeOpacity={0.75}>
        {song.localArtwork ? (
          <Image
            source={{ uri: song.localArtwork }}
            style={styles.artwork}
            contentFit="cover"
          />
        ) : (
          <View style={styles.artworkPlaceholder}>
            <Ionicons name="musical-note" size={22} color={colors.textTertiary} />
          </View>
        )}
      </TouchableOpacity>
      <TouchableOpacity style={styles.songInfo} onPress={() => onPlay(song)} activeOpacity={0.75}>
        <Text style={styles.songTitle} numberOfLines={1}>
          {song.song.title}
        </Text>
        <Text style={styles.songSubtitle} numberOfLines={1}>
          {song.song.artist ?? 'Unknown Artist'}{song.fileSize ? `  ·  ${formatBytes(song.fileSize)}` : ''}
        </Text>
      </TouchableOpacity>
      <TouchableOpacity
        onPress={() => onDelete(song)}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        activeOpacity={0.7}
      >
        <Ionicons name="trash-outline" size={20} color={colors.textTertiary} />
      </TouchableOpacity>
    </Animated.View>
  );
}

// ─── Downloads Screen ────────────────────────────────────────────────────────

export default function DownloadsScreen() {
  const { queue, downloads, removeDownload, clearAll } = useDownloadStore();
  const { play } = usePlayerStore();
  const downloaded = Object.values(downloads);
  const [storageUsed, setStorageUsed] = useState(0);
  const STORAGE_TOTAL = 4 * 1024 * 1024 * 1024; // 4 GB display cap

  // Delete modal state
  const [deleteTarget, setDeleteTarget] = useState<DownloadedSong | null>(null);
  const [showDeleteAll, setShowDeleteAll] = useState(false);

  const refreshStorage = useCallback(async () => {
    try {
      const used = await getStorageUsed();
      setStorageUsed(used);
    } catch {
      // silently ignore
    }
  }, []);

  useEffect(() => {
    refreshStorage();
  }, [downloaded, refreshStorage]);

  const handleDelete = useCallback(
    (song: DownloadedSong) => {
      setDeleteTarget(song);
    },
    [],
  );

  const confirmDelete = useCallback(
    async () => {
      if (!deleteTarget) return;
      await deleteSong(deleteTarget.song.id);
      removeDownload(deleteTarget.song.id);
      refreshStorage();
      // Only close modal after async completes
      setTimeout(() => setDeleteTarget(null), 100);
    },
    [deleteTarget, removeDownload, refreshStorage],
  );

  const handleDeleteAll = useCallback(() => {
    if (downloaded.length === 0) return;
    setShowDeleteAll(true);
  }, [downloaded.length]);

  const confirmDeleteAll = useCallback(
    async () => {
      await deleteAllDownloads();
      clearAll();
      refreshStorage();
      // Only close modal after async completes
      setTimeout(() => setShowDeleteAll(false), 100);
    },
    [clearAll, refreshStorage],
  );

  const handlePlay = useCallback(
    (dl: DownloadedSong) => {
      play(dl.song);
    },
    [play],
  );

  const hasContent = queue.length > 0 || downloaded.length > 0;

  return (
    <Screen scroll>
      {/* Storage Bar */}
      <StorageBar used={storageUsed} total={STORAGE_TOTAL} />

      {/* Delete All */}
      {downloaded.length > 0 && (
        <TouchableOpacity style={styles.deleteAllButton} onPress={handleDeleteAll} activeOpacity={0.75}>
          <Ionicons name="trash-outline" size={15} color={colors.error} />
          <Text style={styles.deleteAllText}>Delete All</Text>
        </TouchableOpacity>
      )}

      {/* Active Downloads */}
      {queue.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Downloading</Text>
          {queue.map((item) => (
            <DownloadingItem key={item.song.id} item={item} />
          ))}
        </View>
      )}

      {/* Completed Downloads */}
      {downloaded.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Downloaded</Text>
          {downloaded.map((dl) => (
            <DownloadedItem
              key={dl.song.id}
              song={dl}
              onDelete={handleDelete}
              onPlay={handlePlay}
            />
          ))}
        </View>
      )}

      {/* Empty State */}
      {!hasContent && (
        <View style={styles.emptyState}>
          <View style={styles.emptyIconWrap}>
            <Ionicons name="cloud-download-outline" size={40} color={colors.textTertiary} />
          </View>
          <Text style={styles.emptyTitle}>No Downloads Yet</Text>
          <Text style={styles.emptySubtitle}>
            Songs you download will appear here for offline listening.
          </Text>
        </View>
      )}

      {/* Delete single song modal */}
      <DeleteModal
        visible={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={confirmDelete}
        title="Delete Download"
        subtitle="This song will be removed from your device. You can always download it again."
        songImage={deleteTarget?.localArtwork}
        songTitle={deleteTarget?.song.title}
        songArtist={deleteTarget?.song.artist}
      />

      {/* Delete all modal */}
      <DeleteModal
        visible={showDeleteAll}
        onClose={() => setShowDeleteAll(false)}
        onConfirm={confirmDeleteAll}
        title="Delete All Downloads"
        subtitle={`This will remove all ${downloaded.length} downloaded songs from your device.`}
        isDeleteAll
      />
    </Screen>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  // Storage bar
  storageBarContainer: {
    marginHorizontal: spacing.screenPadding,
    marginBottom: 20,
    marginTop: 8,
  },
  storageBarRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  storageLabel: {
    ...typography.caption,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  storageValue: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  storageTrack: {
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.surfaceLight,
    overflow: 'hidden',
  },
  storageFill: {
    height: '100%',
    borderRadius: 3,
    backgroundColor: colors.defaultAccent,
  },
  storagePercent: {
    ...typography.caption,
    color: colors.textTertiary,
    marginTop: 5,
  },

  // Delete all
  deleteAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-end',
    marginHorizontal: spacing.screenPadding,
    marginBottom: 16,
    paddingVertical: 7,
    paddingHorizontal: 14,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.error,
    backgroundColor: 'rgba(239,68,68,0.1)',
    gap: 6,
  },
  deleteAllText: {
    ...typography.caption,
    color: colors.error,
    fontWeight: '600',
  },

  // Sections
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '500',
    letterSpacing: 1,
    textTransform: 'uppercase',
    color: colors.textTertiary,
    marginHorizontal: spacing.screenPadding,
    marginBottom: 12,
  },

  // Song rows
  songRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.screenPadding,
    paddingVertical: 10,
    gap: 12,
  },
  artwork: {
    width: 52,
    height: 52,
    borderRadius: 10,
    backgroundColor: colors.surfaceElevated,
  },
  artworkPlaceholder: {
    width: 52,
    height: 52,
    borderRadius: 10,
    backgroundColor: colors.surfaceElevated,
    alignItems: 'center',
    justifyContent: 'center',
  },
  songInfo: {
    flex: 1,
    gap: 3,
  },
  songTitle: {
    ...typography.body,
    color: colors.textPrimary,
    fontWeight: '500',
  },
  songSubtitle: {
    ...typography.caption,
    color: colors.textSecondary,
  },

  // Progress bar
  progressTrack: {
    height: 3,
    borderRadius: 2,
    backgroundColor: colors.surfaceLight,
    overflow: 'hidden',
    marginTop: 6,
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
    backgroundColor: colors.defaultAccent,
  },
  progressText: {
    ...typography.caption,
    color: colors.textTertiary,
    marginTop: 3,
  },

  // Empty state
  emptyState: {
    alignItems: 'center',
    paddingTop: 80,
    paddingHorizontal: spacing.screenPadding,
    gap: 12,
  },
  emptyIconWrap: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.surfaceLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  emptyTitle: {
    ...typography.h3,
    color: colors.textPrimary,
  },
  emptySubtitle: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
});
