import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

type AudioQuality = '96' | '160' | '320';

interface EqualizerBands {
  hz60: number;
  hz230: number;
  hz910: number;
  khz3_6: number;
  khz14: number;
}

interface SettingsState {
  streamingQuality: AudioQuality;
  downloadQuality: AudioQuality;
  sleepTimer: number | null;
  sleepTimerEndTime: number | null;
  crossfade: boolean;
  playbackSpeed: number;
  equalizerPreset: string;
  equalizerBands: EqualizerBands;

  setStreamingQuality: (q: AudioQuality) => void;
  setDownloadQuality: (q: AudioQuality) => void;
  setSleepTimer: (minutes: number | null) => void;
  clearSleepTimer: () => void;
  setPlaybackSpeed: (speed: number) => void;
  toggleCrossfade: () => void;
  setEqualizerPreset: (preset: string) => void;
  setEqualizerBands: (bands: EqualizerBands) => void;
  getSleepTimerRemaining: () => number | null;
}

const DEFAULT_BANDS: EqualizerBands = {
  hz60: 0,
  hz230: 0,
  hz910: 0,
  khz3_6: 0,
  khz14: 0,
};

export const EQ_PRESETS: Record<string, EqualizerBands> = {
  Flat: { hz60: 0, hz230: 0, hz910: 0, khz3_6: 0, khz14: 0 },
  Bass: { hz60: 6, hz230: 4, hz910: 0, khz3_6: -1, khz14: -2 },
  Rock: { hz60: 4, hz230: 2, hz910: -1, khz3_6: 3, khz14: 4 },
  Pop: { hz60: -1, hz230: 2, hz910: 4, khz3_6: 3, khz14: -1 },
  Vocal: { hz60: -2, hz230: 0, hz910: 4, khz3_6: 3, khz14: 1 },
  Classical: { hz60: 0, hz230: 0, hz910: 0, khz3_6: 2, khz14: 4 },
};

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set, get) => ({
      streamingQuality: '320',
      downloadQuality: '320',
      sleepTimer: null,
      sleepTimerEndTime: null,
      crossfade: false,
      playbackSpeed: 1.0,
      equalizerPreset: 'Flat',
      equalizerBands: { ...DEFAULT_BANDS },

      setStreamingQuality: (q: AudioQuality) => set({ streamingQuality: q }),
      setDownloadQuality: (q: AudioQuality) => set({ downloadQuality: q }),

      setSleepTimer: (minutes: number | null) => {
        if (minutes === null) {
          set({ sleepTimer: null, sleepTimerEndTime: null });
        } else {
          set({
            sleepTimer: minutes,
            sleepTimerEndTime: Date.now() + minutes * 60 * 1000,
          });
        }
      },

      clearSleepTimer: () => set({ sleepTimer: null, sleepTimerEndTime: null }),

      setPlaybackSpeed: (speed: number) => set({ playbackSpeed: speed }),
      toggleCrossfade: () => set((s) => ({ crossfade: !s.crossfade })),

      setEqualizerPreset: (preset: string) => {
        const bands = EQ_PRESETS[preset] ?? DEFAULT_BANDS;
        set({ equalizerPreset: preset, equalizerBands: { ...bands } });
      },

      setEqualizerBands: (bands: EqualizerBands) => {
        set({ equalizerBands: bands, equalizerPreset: 'Custom' });
      },

      getSleepTimerRemaining: () => {
        const { sleepTimerEndTime } = get();
        if (!sleepTimerEndTime) return null;
        const remaining = sleepTimerEndTime - Date.now();
        return remaining > 0 ? remaining : 0;
      },
    }),
    {
      name: 'raaga-settings',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        streamingQuality: state.streamingQuality,
        downloadQuality: state.downloadQuality,
        crossfade: state.crossfade,
        playbackSpeed: state.playbackSpeed,
        equalizerPreset: state.equalizerPreset,
        equalizerBands: state.equalizerBands,
      }),
    }
  )
);
