import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Modal,
  Share,
} from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { usePlayerStore } from '../../stores/playerStore';
import { useDownloadStore } from '../../stores/downloadStore';
import { useLibraryStore } from '../../stores/libraryStore';
import { useSettingsStore } from '../../stores/settingsStore';
import { downloadSong } from '../../services/downloads';
import { PlayerControls } from './PlayerControls';
import { ProgressBar } from './ProgressBar';
import { Queue } from './Queue';
import { colors, typography, spacing } from '../../theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const ART_SIZE = SCREEN_WIDTH - 64;

interface FullPlayerProps {
  visible: boolean;
  onClose: () => void;
}

export function FullPlayer({ visible, onClose }: FullPlayerProps) {
  const currentSong = usePlayerStore((s) => s.currentSong);
  const progress = usePlayerStore((s) => s.progress);
  const duration = usePlayerStore((s) => s.duration);
  const seekTo = usePlayerStore((s) => s.seekTo);
  const [showQueue, setShowQueue] = useState(false);

  // Download state
  const isDownloaded = useDownloadStore((s) =>
    currentSong ? s.isDownloaded(currentSong.id) : false
  );
  const downloadQueue = useDownloadStore((s) => s.queue);
  const startDownload = useDownloadStore((s) => s.startDownload);

  const currentDownloadItem = currentSong
    ? downloadQueue.find((q) => q.song.id === currentSong.id)
    : null;
  const isDownloading =
    currentDownloadItem?.status === 'downloading' ||
    currentDownloadItem?.status === 'pending';
  const downloadProgress = currentDownloadItem?.progress ?? 0;

  // Favorites state
  const isFavorite = useLibraryStore((s) =>
    currentSong ? s.isFavorite(currentSong.id) : false
  );
  const toggleFavorite = useLibraryStore((s) => s.toggleFavorite);

  // Sleep timer
  const sleepTimerEndTime = useSettingsStore((s) => s.sleepTimerEndTime);
  const [sleepRemaining, setSleepRemaining] = useState<string | null>(null);

  useEffect(() => {
    if (!sleepTimerEndTime) {
      setSleepRemaining(null);
      return;
    }
    const interval = setInterval(() => {
      const remaining = sleepTimerEndTime - Date.now();
      if (remaining <= 0) {
        setSleepRemaining(null);
      } else {
        const mins = Math.floor(remaining / 60000);
        const secs = Math.floor((remaining % 60000) / 1000);
        setSleepRemaining(`${mins}:${secs.toString().padStart(2, '0')}`);
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [sleepTimerEndTime]);

  const handleDownload = () => {
    if (!currentSong || isDownloaded || isDownloading) return;
    startDownload(currentSong);
    downloadSong(currentSong).catch(() => {});
  };

  const handleFavorite = () => {
    if (!currentSong) return;
    toggleFavorite(currentSong);
  };

  const handleShare = async () => {
    if (!currentSong) return;
    try {
      await Share.share({
        message: `${currentSong.title} — ${currentSong.artist}`,
      });
    } catch {}
  };

  if (!currentSong) return null;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="fullScreen"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        {showQueue ? (
          <>
            <View style={styles.topBar}>
              <TouchableOpacity
                onPress={() => setShowQueue(false)}
                style={styles.topButton}
              >
                <Ionicons
                  name="arrow-back"
                  size={22}
                  color={colors.textSecondary}
                />
              </TouchableOpacity>
              <Text style={styles.queueTitle}>Queue</Text>
              <View style={styles.topButton} />
            </View>
            <Queue onClose={() => setShowQueue(false)} />
          </>
        ) : (
          <>
            {/* Top Bar */}
            <View style={styles.topBar}>
              <TouchableOpacity onPress={onClose} style={styles.topButton}>
                <Ionicons
                  name="chevron-down"
                  size={26}
                  color={colors.textSecondary}
                />
              </TouchableOpacity>

              <View style={styles.topCenter}>
                <Text style={styles.nowPlayingLabel}>NOW PLAYING</Text>
                {sleepRemaining && (
                  <View style={styles.sleepRow}>
                    <Ionicons
                      name="timer-outline"
                      size={11}
                      color={colors.defaultAccent}
                    />
                    <Text style={styles.sleepTimer}>{sleepRemaining}</Text>
                  </View>
                )}
              </View>

              <TouchableOpacity
                onPress={() => setShowQueue(true)}
                style={styles.topButton}
              >
                <Ionicons
                  name="list"
                  size={22}
                  color={colors.textSecondary}
                />
              </TouchableOpacity>
            </View>

            {/* Album Art */}
            <View style={styles.artContainer}>
              <Image
                source={{ uri: currentSong.image }}
                style={[styles.artwork, { width: ART_SIZE, height: ART_SIZE }]}
                contentFit="cover"
                placeholder={{ blurhash: 'L6PZfSi_.AyE_3t7t7R**0o#DgR4' }}
                transition={300}
              />
            </View>

            {/* Song Info */}
            <View style={styles.songInfo}>
              <Text style={styles.songTitle} numberOfLines={2}>
                {currentSong.title}
              </Text>
              <Text style={styles.songArtist} numberOfLines={1}>
                {currentSong.artist}
              </Text>
            </View>

            {/* Progress Bar */}
            <View style={styles.progressContainer}>
              <ProgressBar
                progress={progress}
                duration={duration}
                onSeek={seekTo}
                showLabels
                height={5}
                thumbSize={14}
              />
            </View>

            {/* Controls */}
            <PlayerControls size="full" />

            {/* Actions Row */}
            <View style={styles.actionsRow}>
              <TouchableOpacity
                style={styles.actionButton}
                onPress={handleFavorite}
              >
                <Ionicons
                  name={isFavorite ? 'heart' : 'heart-outline'}
                  size={23}
                  color={
                    isFavorite ? colors.accentSecondary : colors.textTertiary
                  }
                  style={{ opacity: isFavorite ? 1 : 0.7 }}
                />
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.actionButton}
                onPress={handleDownload}
                disabled={isDownloaded}
              >
                {isDownloaded ? (
                  <Ionicons
                    name="checkmark-circle"
                    size={23}
                    color={colors.success}
                    style={{ opacity: 0.8 }}
                  />
                ) : isDownloading ? (
                  <Text style={styles.downloadPercent}>
                    {Math.round(downloadProgress * 100)}%
                  </Text>
                ) : (
                  <Ionicons
                    name="download-outline"
                    size={23}
                    color={colors.textTertiary}
                    style={{ opacity: 0.7 }}
                  />
                )}
              </TouchableOpacity>

              <TouchableOpacity style={styles.actionButton} onPress={handleShare}>
                <Ionicons
                  name="share-outline"
                  size={23}
                  color={colors.textTertiary}
                  style={{ opacity: 0.7 }}
                />
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => setShowQueue(true)}
              >
                <Ionicons
                  name="list"
                  size={23}
                  color={colors.textTertiary}
                  style={{ opacity: 0.7 }}
                />
              </TouchableOpacity>
            </View>
          </>
        )}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#080B12',
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.screenPadding,
    paddingTop: 52,
    paddingBottom: 10,
  },
  topButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  topCenter: {
    flex: 1,
    alignItems: 'center',
    gap: 3,
  },
  nowPlayingLabel: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 1.5,
    color: colors.textTertiary,
    textAlign: 'center',
  },
  sleepRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  sleepTimer: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.defaultAccent,
    letterSpacing: 0.5,
  },
  artContainer: {
    alignItems: 'center',
    marginTop: 14,
    marginBottom: 24,
  },
  artwork: {
    borderRadius: 16,
    backgroundColor: colors.surface,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 28,
    elevation: 12,
  },
  songInfo: {
    paddingHorizontal: spacing.screenPadding + 4,
    marginBottom: 20,
    gap: 4,
  },
  songTitle: {
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: -0.5,
    color: colors.textPrimary,
  },
  songArtist: {
    fontSize: 15,
    fontWeight: '300',
    letterSpacing: 0.5,
    color: colors.textSecondary,
  },
  progressContainer: {
    paddingHorizontal: spacing.screenPadding + 4,
    marginBottom: 12,
  },
  actionsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 36,
    paddingTop: 20,
    paddingBottom: 8,
  },
  actionButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  queueTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textPrimary,
    letterSpacing: -0.2,
  },
  downloadPercent: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.defaultAccent,
    letterSpacing: 0.3,
  },
});
