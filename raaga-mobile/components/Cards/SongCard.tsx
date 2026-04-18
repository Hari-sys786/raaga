import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  TouchableOpacity,
  Modal,
  Share,
  Platform,
} from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withRepeat,
  withTiming,
  withSequence,
  withDelay,
} from 'react-native-reanimated';
import { Song } from '../../types';
import { useDownloadStore } from '../../stores/downloadStore';
import { usePlayerStore } from '../../stores/playerStore';
import { useLibraryStore } from '../../stores/libraryStore';
import { downloadSong } from '../../services/downloads';
import { colors, typography, spacing } from '../../theme';

interface SongCardProps {
  song: Song;
  onPress?: () => void;
  onLongPress?: () => void;
  showDownloadIndicator?: boolean;
}

function formatDuration(seconds?: number): string {
  if (!seconds) return '';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

function EqualizerBar({ delay: barDelay }: { delay: number }) {
  const height = useSharedValue(4);

  useEffect(() => {
    height.value = withDelay(
      barDelay,
      withRepeat(
        withSequence(
          withTiming(16, { duration: 300 + Math.random() * 200 }),
          withTiming(4, { duration: 300 + Math.random() * 200 })
        ),
        -1,
        true
      )
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    height: height.value,
  }));

  return (
    <Animated.View
      style={[
        {
          width: 3,
          borderRadius: 1.5,
          backgroundColor: colors.defaultAccent,
        },
        animatedStyle,
      ]}
    />
  );
}

export const SongCard = React.memo(function SongCard({ song, onPress, onLongPress, showDownloadIndicator = true }: SongCardProps) {
  const isDownloaded = useDownloadStore((s) => s.isDownloaded(song.id));
  const currentSong = usePlayerStore((s) => s.currentSong);
  const isPlaying = usePlayerStore((s) => s.isPlaying);
  const addToQueue = usePlayerStore((s) => s.addToQueue);
  const playNextInQueue = usePlayerStore((s) => s.playNext);
  const isFavorite = useLibraryStore((s) => s.isFavorite(song.id));
  const toggleFavorite = useLibraryStore((s) => s.toggleFavorite);
  const startDownload = useDownloadStore((s) => s.startDownload);
  const isCurrentSong = currentSong?.id === song.id;
  const pressed = useSharedValue(false);
  const [menuVisible, setMenuVisible] = useState(false);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: withSpring(pressed.value ? 0.97 : 1, { damping: 15, stiffness: 200 }) }],
  }));

  const handleShare = async () => {
    setMenuVisible(false);
    try {
      await Share.share({
        message: `🎵 ${song.title} — ${song.artist}\nListening on Raaga`,
        ...(Platform.OS === 'ios' ? { url: song.image || '' } : {}),
      });
    } catch {}
  };

  const handleAddToQueue = () => {
    setMenuVisible(false);
    addToQueue(song);
  };

  const handlePlayNext = () => {
    setMenuVisible(false);
    playNextInQueue(song);
  };

  const handleToggleFavorite = () => {
    setMenuVisible(false);
    toggleFavorite(song);
  };

  const handleDownload = () => {
    setMenuVisible(false);
    if (!isDownloaded) {
      startDownload(song);
      downloadSong(song).catch(() => {});
    }
  };

  return (
    <Animated.View style={animatedStyle}>
      <Pressable
        style={[
          styles.container,
          isCurrentSong && styles.activeContainer,
        ]}
        onPress={onPress}
        onLongPress={onLongPress || (() => setMenuVisible(true))}
        onPressIn={() => { pressed.value = true; }}
        onPressOut={() => { pressed.value = false; }}
      >
        {/* Amber left border for active song */}
        {isCurrentSong && <View style={styles.activeBorder} />}

        <View style={styles.artWrapper}>
          <Image
            source={{ uri: song.image }}
            style={styles.artwork}
            contentFit="cover"
            placeholder={{ blurhash: 'L6PZfSi_.AyE_3t7t7R**0o#DgR4' }}
            transition={200}
          />
          {isCurrentSong && isPlaying && (
            <View style={styles.equalizerOverlay}>
              <EqualizerBar delay={0} />
              <EqualizerBar delay={150} />
              <EqualizerBar delay={300} />
            </View>
          )}
          {showDownloadIndicator && isDownloaded && (
            <View style={styles.downloadBadge}>
              <Ionicons name="cloud-download" size={9} color="#fff" />
            </View>
          )}
        </View>

        <View style={styles.info}>
          <Text
            style={[styles.title, isCurrentSong && { color: colors.defaultAccent }]}
            numberOfLines={1}
          >
            {song.title}
          </Text>
          <Text style={styles.artist} numberOfLines={1}>
            {song.artist}
          </Text>
        </View>

        {song.duration ? (
          <Text style={styles.duration}>{formatDuration(song.duration)}</Text>
        ) : null}

        <TouchableOpacity
          style={styles.menuIcon}
          onPress={() => setMenuVisible(true)}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        >
          <Ionicons name="ellipsis-vertical" size={16} color={colors.textTertiary} />
        </TouchableOpacity>
      </Pressable>

      {/* Context Menu Modal */}
      <Modal
        visible={menuVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setMenuVisible(false)}
      >
        <Pressable style={styles.overlay} onPress={() => setMenuVisible(false)}>
          <View style={styles.menuContainer}>
            {/* Song preview */}
            <View style={styles.menuHeader}>
              <Image
                source={{ uri: song.image }}
                style={styles.menuArt}
                contentFit="cover"
              />
              <View style={styles.menuInfo}>
                <Text style={styles.menuTitle} numberOfLines={1}>{song.title}</Text>
                <Text style={styles.menuArtist} numberOfLines={1}>{song.artist}</Text>
              </View>
            </View>
            <View style={styles.menuDivider} />

            {/* Menu items */}
            <TouchableOpacity style={styles.menuItem} onPress={handlePlayNext}>
              <Ionicons name="play-forward" size={22} color={colors.textSecondary} />
              <Text style={styles.menuItemText}>Play Next</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.menuItem} onPress={handleAddToQueue}>
              <Ionicons name="list" size={22} color={colors.textSecondary} />
              <Text style={styles.menuItemText}>Add to Queue</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.menuItem} onPress={handleToggleFavorite}>
              <Ionicons
                name={isFavorite ? 'heart' : 'heart-outline'}
                size={22}
                color={isFavorite ? colors.accentSecondary : colors.textSecondary}
              />
              <Text style={styles.menuItemText}>
                {isFavorite ? 'Remove from Favorites' : 'Add to Favorites'}
              </Text>
            </TouchableOpacity>

            {!isDownloaded && (
              <TouchableOpacity style={styles.menuItem} onPress={handleDownload}>
                <Ionicons name="download-outline" size={22} color={colors.textSecondary} />
                <Text style={styles.menuItemText}>Download</Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity style={styles.menuItem} onPress={handleShare}>
              <Ionicons name="share-outline" size={22} color={colors.textSecondary} />
              <Text style={styles.menuItemText}>Share</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.menuItem, styles.menuCancel]}
              onPress={() => setMenuVisible(false)}
            >
              <Text style={styles.menuCancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Modal>
    </Animated.View>
  );
});

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: spacing.screenPadding,
    gap: spacing.md,
  },
  activeContainer: {
    // No background change — left border handles active state
  },
  activeBorder: {
    position: 'absolute',
    left: 0,
    top: 6,
    bottom: 6,
    width: 3,
    borderRadius: 2,
    backgroundColor: colors.defaultAccent,
  },
  artWrapper: {
    position: 'relative',
  },
  artwork: {
    width: 52,
    height: 52,
    borderRadius: 10,
    backgroundColor: colors.surface,
  },
  equalizerOverlay: {
    position: 'absolute',
    bottom: 4,
    right: 4,
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 2,
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: 4,
    padding: 2,
  },
  downloadBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: colors.defaultAccent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  info: {
    flex: 1,
    gap: 3,
  },
  title: {
    ...typography.body,
    fontSize: 15,
    color: colors.textPrimary,
    fontWeight: '500',
  },
  artist: {
    ...typography.caption,
    fontSize: 12,
    color: colors.textSecondary,
  },
  duration: {
    ...typography.caption,
    color: colors.textTertiary,
  },
  menuIcon: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Context menu
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'flex-end',
  },
  menuContainer: {
    backgroundColor: '#0F1520',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 34,
    paddingTop: 12,
  },
  menuHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    gap: 14,
  },
  menuArt: {
    width: 48,
    height: 48,
    borderRadius: 10,
    backgroundColor: colors.background,
  },
  menuInfo: {
    flex: 1,
    gap: 2,
  },
  menuTitle: {
    ...typography.body,
    color: colors.textPrimary,
    fontWeight: '600',
  },
  menuArtist: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  menuDivider: {
    height: 0.5,
    backgroundColor: 'rgba(232,236,242,0.06)',
    marginHorizontal: 20,
    marginVertical: 4,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
    gap: 16,
  },
  menuItemText: {
    ...typography.body,
    color: colors.textPrimary,
  },
  menuCancel: {
    justifyContent: 'center',
    marginTop: 8,
    borderTopWidth: 0.5,
    borderTopColor: 'rgba(232,236,242,0.06)',
    paddingTop: 16,
  },
  menuCancelText: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
    width: '100%',
  },
});
