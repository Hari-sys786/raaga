import { create } from 'zustand';
import { Song } from '../types';
import { playerService } from '../services/player';
import { api } from '../services/api';
import { getLocalPath } from '../services/downloads';
import { useLibraryStore } from './libraryStore';
import { useSettingsStore } from './settingsStore';

type RepeatMode = 'off' | 'one' | 'all';

interface PlayerState {
  currentSong: Song | null;
  queue: Song[];
  isPlaying: boolean;
  progress: number;
  duration: number;
  shuffle: boolean;
  repeat: RepeatMode;
  isLoading: boolean;

  // Actions
  play: (song: Song) => void;
  pause: () => void;
  resume: () => void;
  next: () => void;
  previous: () => void;
  addToQueue: (song: Song) => void;
  setQueue: (songs: Song[]) => void;
  setProgress: (progress: number) => void;
  setDuration: (duration: number) => void;
  toggleShuffle: () => void;
  cycleRepeat: () => void;
  seekTo: (seconds: number) => void;
  playFromQueue: (index: number) => void;
  clearQueue: () => void;
}

export const usePlayerStore = create<PlayerState>((set, get) => {
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
        // Timer expired — pause playback
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
      playerService.loadAndPlay(uri).catch(console.error);
    } else {
      get().next();
    }
  });

  return {
    currentSong: null,
    queue: [],
    isPlaying: false,
    progress: 0,
    duration: 0,
    shuffle: false,
    repeat: 'off',
    isLoading: false,

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
      });

      // Add to recently played
      try {
        useLibraryStore.getState().addToRecentlyPlayed(song);
      } catch {
        // store may not be initialized yet
      }

      // Check for offline file first
      const localPath = getLocalPath(song.id);
      const uri = localPath ?? api.streamUrl(song.id, song.source || 'jiosaavn');

      console.log('[PlayerStore] Playing:', song.title, localPath ? '(offline)' : '(stream)');
      playerService.loadAndPlay(uri)
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
          randomIndex = 0;
        } else {
          do {
            randomIndex = Math.floor(Math.random() * queue.length);
          } while (randomIndex === currentIndex);
        }
        get().play(queue[randomIndex]);
        return;
      }

      let nextIndex = currentIndex + 1;
      if (nextIndex >= queue.length) {
        if (repeat === 'all') {
          nextIndex = 0;
        } else {
          set({ isPlaying: false });
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
      set((state) => ({ queue: [...state.queue, song] })),

    setQueue: (songs: Song[]) => set({ queue: songs }),

    setProgress: (progress: number) => set({ progress }),
    setDuration: (duration: number) => set({ duration }),
    toggleShuffle: () => set((state) => ({ shuffle: !state.shuffle })),

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
      set({ queue: [], currentSong: null, isPlaying: false, progress: 0, duration: 0 });
      playerService.stop();
    },
  };
});
