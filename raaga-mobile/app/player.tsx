import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Share,
  Platform,
} from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import Animated, { FadeIn } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { usePlayerStore } from '../stores/playerStore';
import { useDownloadStore } from '../stores/downloadStore';
import { useLibraryStore } from '../stores/libraryStore';
import { useSettingsStore } from '../stores/settingsStore';
import { downloadSong } from '../services/downloads';
import { PlayerControls } from '../components/Player/PlayerControls';
import { ProgressBar } from '../components/Player/ProgressBar';
import { Queue } from '../components/Player/Queue';
import { colors, typography, spacing } from '../theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const ART_SIZE = Math.min(SCREEN_WIDTH - 64, 320);

export default function PlayerScreen() {
  const currentSong = usePlayerStore((s) => s.currentSong);
  const progress = usePlayerStore((s) => s.progress);
  const duration = usePlayerStore((s) => s.duration);
  const seekTo = usePlayerStore((s) => s.seekTo);
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [showQueue, setShowQueue] = useState(false);

  const isDownloaded = useDownloadStore((s) =>
    currentSong ? s.isDownloaded(currentSong.id) : false
  );
  const downloadQueue = useDownloadStore((s) => s.queue);
  const startDownload = useDownloadStore((s) => s.startDownload);
  const currentDownloadItem = currentSong
    ? downloadQueue.find((q) => q.song.id === currentSong.id)
    : null;
  const isDownloading = currentDownloadItem?.status === 'downloading' || currentDownloadItem?.status === 'pending';
  const downloadProgress = currentDownloadItem?.progress ?? 0;

  const isFavorite = useLibraryStore((s) =>
    currentSong ? s.isFavorite(currentSong.id) : false
  );
  const toggleFavorite = useLibraryStore((s) => s.toggleFavorite);

  const sleepTimerEndTime = useSettingsStore((s) => s.sleepTimerEndTime);
  const [sleepRemaining, setSleepRemaining] = useState<string | null>(null);

  useEffect(() => {
    if (!sleepTimerEndTime) { setSleepRemaining(null); return; }
    const interval = setInterval(() => {
      const remaining = sleepTimerEndTime - Date.now();
      if (remaining <= 0) { setSleepRemaining(null); }
      else {
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
        message: `🎵 ${currentSong.title} — ${currentSong.artist}\nListening on Raaga`,
        ...(Platform.OS === 'ios' ? { url: currentSong.image || '' } : {}),
      });
    } catch {
      // User cancelled or share failed
    }
  };

  if (!currentSong) {
    return (
      <View style={styles.container}>
        <View style={[styles.topBar, { paddingTop: insets.top + 8 }]}>
          <TouchableOpacity onPress={() => router.back()} style={styles.topButton}>
            <Ionicons name="chevron-down" size={28} color={colors.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.topTitle}>Not Playing</Text>
          <View style={styles.topButton} />
        </View>
        <View style={styles.emptyContainer}>
          <Ionicons name="musical-notes-outline" size={56} color={colors.surfaceLight} />
          <Text style={styles.emptyText}>No song selected</Text>
        </View>
      </View>
    );
  }

  if (showQueue) {
    return (
      <View style={styles.container}>
        <View style={[styles.topBar, { paddingTop: insets.top + 8 }]}>
          <TouchableOpacity onPress={() => setShowQueue(false)} style={styles.topButton}>
            <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.topTitle}>Queue</Text>
          <View style={styles.topButton} />
        </View>
        <Queue onClose={() => setShowQueue(false)} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Blur background tint */}
      <LinearGradient
        colors={['rgba(139,92,246,0.08)', 'transparent', 'rgba(5,5,5,1)']}
        locations={[0, 0.4, 1]}
        style={StyleSheet.absoluteFill}
      />

      {/* Top Bar */}
      <View style={[styles.topBar, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.topButton}>
          <Ionicons name="chevron-down" size={28} color={colors.textPrimary} />
        </TouchableOpacity>
        <View style={styles.topCenter}>
          <Text style={styles.topTitle} numberOfLines={1}>Now Playing</Text>
          {sleepRemaining && (
            <View style={styles.sleepRow}>
              <Ionicons name="timer-outline" size={12} color={colors.defaultAccent} />
              <Text style={styles.sleepTimer}>{sleepRemaining}</Text>
            </View>
          )}
        </View>
        <TouchableOpacity onPress={() => setShowQueue(true)} style={styles.topButton}>
          <Ionicons name="list" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
      </View>

      {/* Album Art */}
      <Animated.View entering={FadeIn.duration(400)} style={styles.artContainer}>
        <Image
          source={{ uri: currentSong.image }}
          style={[styles.artwork, { width: ART_SIZE, height: ART_SIZE }]}
          contentFit="cover"
          placeholder={{ blurhash: 'L6PZfSi_.AyE_3t7t7R**0o#DgR4' }}
          transition={300}
        />
      </Animated.View>

      {/* Song Info */}
      <View style={styles.songInfo}>
        <Text style={styles.songTitle} numberOfLines={2}>{currentSong.title}</Text>
        <Text style={styles.songArtist} numberOfLines={1}>{currentSong.artist}</Text>
      </View>

      {/* Progress Bar */}
      <View style={styles.progressContainer}>
        <ProgressBar progress={progress} duration={duration} onSeek={seekTo} showLabels height={4} thumbSize={14} />
      </View>

      {/* Controls */}
      <PlayerControls size="full" />

      {/* Actions Row */}
      <View style={styles.actionsRow}>
        <TouchableOpacity style={styles.actionButton} onPress={handleFavorite}>
          <Ionicons
            name={isFavorite ? 'heart' : 'heart-outline'}
            size={24}
            color={isFavorite ? '#FF6B6B' : colors.textSecondary}
          />
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionButton} onPress={handleDownload} disabled={isDownloaded}>
          {isDownloaded ? (
            <Ionicons name="checkmark-circle" size={24} color={colors.success} />
          ) : isDownloading ? (
            <Text style={styles.downloadPercent}>{Math.round(downloadProgress * 100)}%</Text>
          ) : (
            <Ionicons name="download-outline" size={24} color={colors.textSecondary} />
          )}
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionButton} onPress={handleShare}>
          <Ionicons name="share-outline" size={24} color={colors.textSecondary} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.screenPadding, paddingBottom: 12 },
  topButton: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  topCenter: { flex: 1, alignItems: 'center' },
  topTitle: { ...typography.bodySmall, color: colors.textSecondary, fontWeight: '600', textAlign: 'center' },
  sleepRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
  sleepTimer: { ...typography.caption, color: colors.defaultAccent },
  artContainer: { alignItems: 'center', marginTop: 8, marginBottom: 32 },
  artwork: { borderRadius: 24, backgroundColor: colors.surface, ...colors.heavyShadow },
  songInfo: { paddingHorizontal: spacing.screenPadding + 8, marginBottom: 24 },
  songTitle: { ...typography.playerTitle, color: colors.textPrimary, marginBottom: 4 },
  songArtist: { ...typography.playerArtist, color: colors.textSecondary },
  progressContainer: { paddingHorizontal: spacing.screenPadding + 8, marginBottom: 16 },
  actionsRow: { flexDirection: 'row', justifyContent: 'center', gap: 40, paddingTop: 24 },
  actionButton: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  downloadPercent: { ...typography.caption, color: colors.defaultAccent, fontWeight: '600' },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: spacing.md },
  emptyText: { ...typography.body, color: colors.textSecondary },
});
