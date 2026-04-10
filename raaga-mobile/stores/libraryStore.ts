import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Song } from '../types';

const MAX_RECENTLY_PLAYED = 50;

interface LibraryState {
  favorites: Song[];
  recentlyPlayed: Song[];

  addFavorite: (song: Song) => void;
  removeFavorite: (songId: string) => void;
  isFavorite: (songId: string) => boolean;
  toggleFavorite: (song: Song) => void;
  addToRecentlyPlayed: (song: Song) => void;
}

export const useLibraryStore = create<LibraryState>()(
  persist(
    (set, get) => ({
      favorites: [],
      recentlyPlayed: [],

      addFavorite: (song: Song) => {
        const { favorites } = get();
        if (favorites.some((s) => s.id === song.id)) return;
        set({ favorites: [song, ...favorites] });
      },

      removeFavorite: (songId: string) => {
        set((state) => ({
          favorites: state.favorites.filter((s) => s.id !== songId),
        }));
      },

      isFavorite: (songId: string) => {
        return get().favorites.some((s) => s.id === songId);
      },

      toggleFavorite: (song: Song) => {
        const { isFavorite, addFavorite, removeFavorite } = get();
        if (isFavorite(song.id)) {
          removeFavorite(song.id);
        } else {
          addFavorite(song);
        }
      },

      addToRecentlyPlayed: (song: Song) => {
        set((state) => {
          const filtered = state.recentlyPlayed.filter((s) => s.id !== song.id);
          const updated = [song, ...filtered].slice(0, MAX_RECENTLY_PLAYED);
          return { recentlyPlayed: updated };
        });
      },
    }),
    {
      name: 'raaga-library',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
