import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { Song } from '../types';

// Configure notification handler
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: false,
    shouldPlaySound: false,
    shouldSetBadge: false,
    priority: Notifications.AndroidNotificationPriority.LOW,
  }),
});

const CHANNEL_ID = 'raaga-now-playing';
let currentNotificationId: string | null = null;

async function ensureChannel() {
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync(CHANNEL_ID, {
      name: 'Now Playing',
      importance: Notifications.AndroidImportance.LOW,
      sound: undefined,
      vibrationPattern: [0],
      lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
    });
  }
}

export async function showNowPlaying(song: Song) {
  try {
    await ensureChannel();

    // Dismiss previous
    if (currentNotificationId) {
      await Notifications.dismissNotificationAsync(currentNotificationId).catch(() => {});
    }

    currentNotificationId = await Notifications.scheduleNotificationAsync({
      content: {
        title: song.title,
        body: song.artist,
        data: { songId: song.id },
        sound: false,
        sticky: true,
        ...(Platform.OS === 'android'
          ? {
              categoryIdentifier: CHANNEL_ID,
            }
          : {}),
      },
      trigger: null, // immediate
    });
  } catch (err) {
    console.warn('[Notifications] showNowPlaying failed:', err);
  }
}

export async function clearNowPlaying() {
  try {
    if (currentNotificationId) {
      await Notifications.dismissNotificationAsync(currentNotificationId);
      currentNotificationId = null;
    }
  } catch {
    // ignore
  }
}
