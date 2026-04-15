import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Song } from '../types';
import { playerService } from '../services/player';
import { api } from '../services/api';
import { getLocalPath } from '../services/downloads';
import { useLibraryStore } from './libraryStore';
import { useSettingsStore } from './settingsStore';
import { showNowPlaying, clearNowPlaying } from '../services/notifications';

type RepeatMode = 'off' | 'one' | 'all';

interface PlayerState {
  currentSong: Song | null;
  queue: Song[];
  originalQueue: Song[]; // preserve original order for un-shuffle
  isPlaying: boolean;
  progress: number;
  duration: number;
  shuffle: boolean;
  repeat: RepeatMode;
  isLoading: boolean;
  _hydrated: boolean;

  // Actions
  play: (song: Song) => void;
  pause: () => void;
  resume: () => void;
  next: () => void;
  previous: () => void;
  addToQueue: (song: Song) => void;
  removeFromQueue: (songId: string) => void;
  setQueue: (songs: Song[]) => void;
  setProgress: (progress: number) => void;
  setDuration: (duration: number) => void;
  toggleShuffle: () => void;
  cycleRepeat: () => void;
  seekTo: (seconds: number) => void;
  playFromQueue: (index: number) => void;
  clearQueue: () => void;
  restorePlayback: () => void;
}

export const usePlayerStore = create<PlayerState>()(
  persist(
    (set, get) => {
      // Wire up player service callbacks
      playerService.setOnStatusUpdate((status) => {
        if (status.isLoaded) {
          set({
            progress: (status.positionMillis ?? 0) / 1000,
            duration: (status.durationMillis ?? 0) / 1000,
            isPlaying: status.isPlaying,
          });

          // Check sleep timer
          const settingsStore = useSettingsStore.getState();
          const endTime = settingsStore.sleepTimerEndTime;
          if (endTime && Date.now() >= endTime) {
            settingsStore.clearSleepTimer();
            get().pause();
          }
        }
      });

      playerService.setOnPlaybackFinished(() => {
        const { repeat, currentSong } = get();
        if (repeat === 'one' && currentSong) {
          // Replay same song
          const localPath = getLocalPath(currentSong.id);
          const uri = localPath ?? api.streamUrl(currentSong.id, currentSong.source || 'jiosaavn');
          playerService.loadAndPlay(uri, {
            title: currentSong.title,
            artist: currentSong.artist,
            artwork: currentSong.image,
          }).catch(console.error);
        } else {
          get().next();
        }
      });

      return {
        currentSong: null,
        queue: [],
        originalQueue: [],
        isPlaying: false,
        progress: 0,
        duration: 0,
        shuffle: false,
        repeat: 'off',
        isLoading: false,
        _hydrated: false,

        play: (song: Song) => {
          const { queue } = get();
          const inQueue = queue.some((s) => s.id === song.id);
          set({
            currentSong: song,
            isPlaying: true,
            progress: 0,
            duration: 0,
            isLoading: true,
            queue: inQueue ? queue : [...queue, song],
            originalQueue: inQueue ? get().originalQueue : [...get().originalQueue, song],
          });

          // Add to recently played
          try {
            useLibraryStore.getState().addToRecentlyPlayed(song);
          } catch {
            // store may not be initialized yet
          }

          // Check for offline file first
          const localPath = getLocalPath ? getLocalPath(song.id) : null;
          const uri = localPath ?? api.streamUrl(song.id, song.source || 'jiosaavn');

          console.log('[PlayerStore] Playing:', song.title, localPath ? '(offline)' : '(stream)');

          // Show notification bar
          showNowPlaying(song.title, song.artist, song.image).catch(() => {});

          playerService.loadAndPlay(uri, {
            title: song.title,
            artist: song.artist,
            artwork: song.image,
          })
            .then(() => {
              set({ isLoading: false });
              // Apply playback speed from settings
              const speed = useSettingsStore.getState().playbackSpeed;
              if (speed !== 1.0) {
                playerService.setPlaybackRate(speed).catch(console.error);
              }
            })
            .catch((err) => {
              console.error('[PlayerStore] Play error:', err);
              set({ isPlaying: false, isLoading: false });
              // Auto-skip to next on stream error
              setTimeout(() => get().next(), 500);
            });
        },

        pause: () => {
          set({ isPlaying: false });
          playerService.pause();
        },

        resume: () => {
          set({ isPlaying: true });
          playerService.resume();
        },

        next: () => {
          const { queue, currentSong, shuffle, repeat } = get();
          if (queue.length === 0) return;

          const currentIndex = queue.findIndex((s) => s.id === currentSong?.id);

          if (shuffle) {
            let randomIndex: number;
            if (queue.length === 1) {
              if (repeat === 'all' || repeat === 'one') {
                get().play(queue[0]);
              } else {
                set({ isPlaying: false });
              }
              return;
            }
            do {
              randomIndex = Math.floor(Math.random() * queue.length);
            } while (randomIndex === currentIndex);
            get().play(queue[randomIndex]);
            return;
          }

          // Sequential play
          let nextIndex: number;
          if (currentIndex === -1) {
            // Song not found in queue (shouldn't happen but safety)
            nextIndex = 0;
          } else {
            nextIndex = currentIndex + 1;
          }

          if (nextIndex >= queue.length) {
            if (repeat === 'all') {
              nextIndex = 0;
            } else {
              // End of queue, repeat off — stop
              set({ isPlaying: false });
              clearNowPlaying().catch(() => {});
              return;
            }
          }

          get().play(queue[nextIndex]);
        },

        previous: () => {
          const { queue, currentSong, progress } = get();
          if (queue.length === 0) return;

          // If more than 3 seconds in, restart current song
          if (progress > 3 && currentSong) {
            playerService.seekTo(0);
            set({ progress: 0 });
            return;
          }

          const currentIndex = queue.findIndex((s) => s.id === currentSong?.id);
          const prevIndex = currentIndex > 0 ? currentIndex - 1 : queue.length - 1;
          get().play(queue[prevIndex]);
        },

        addToQueue: (song: Song) =>
          set((state) => ({
            queue: [...state.queue, song],
            originalQueue: [...state.originalQueue, song],
          })),

        removeFromQueue: (songId: string) =>
          set((state) => ({
            queue: state.queue.filter((s) => s.id !== songId),
            originalQueue: state.originalQueue.filter((s) => s.id !== songId),
          })),

        setQueue: (songs: Song[]) => set({ queue: songs, originalQueue: songs }),

        setProgress: (progress: number) => set({ progress }),
        setDuration: (duration: number) => set({ duration }),

        toggleShuffle: () =>
          set((state) => {
            if (!state.shuffle) {
              // Turning shuffle ON — shuffle the queue but keep current song first
              const currentId = state.currentSong?.id;
              const rest = state.queue.filter((s) => s.id !== currentId);
              // Fisher-Yates shuffle
              for (let i = rest.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [rest[i], rest[j]] = [rest[j], rest[i]];
              }
              const currentSongArr = state.currentSong
                ? state.queue.filter((s) => s.id === currentId)
                : [];
              return { shuffle: true, queue: [...currentSongArr, ...rest] };
            } else {
              // Turning shuffle OFF — restore original order
              return { shuffle: false, queue: [...state.originalQueue] };
            }
          }),

        cycleRepeat: () =>
          set((state) => {
            const modes: RepeatMode[] = ['off', 'all', 'one'];
            const currentIdx = modes.indexOf(state.repeat);
            return { repeat: modes[(currentIdx + 1) % modes.length] };
          }),

        seekTo: (seconds: number) => {
          set({ progress: seconds });
          playerService.seekTo(seconds * 1000);
        },

        playFromQueue: (index: number) => {
          const { queue } = get();
          if (index >= 0 && index < queue.length) {
            get().play(queue[index]);
          }
        },

        clearQueue: () => {
          set({ queue: [], originalQueue: [], currentSong: null, isPlaying: false, progress: 0, duration: 0 });
          playerService.stop();
          clearNowPlaying().catch(() => {});
        },

        // Call this on app startup to resume from persisted state
        restorePlayback: () => {
          const { currentSong, queue } = get();
          if (currentSong && queue.length > 0) {
            console.log('[PlayerStore] Restored queue:', queue.length, 'songs. Last playing:', currentSong.title);
            // Don't auto-play — just show the queue/mini player.
            // User taps play to resume.
            set({ isPlaying: false, progress: 0, _hydrated: true });
          } else {
            set({ _hydrated: true });
          }
        },
      };
    },
    {
      name: 'raaga-player',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        currentSong: state.currentSong,
        queue: state.queue,
        originalQueue: state.originalQueue,
        shuffle: state.shuffle,
        repeat: state.repeat,
      }),
      onRehydrateStorage: () => (state) => {
        if (state) {
          state._hydrated = true;
        }
      },
    }
  )
);
