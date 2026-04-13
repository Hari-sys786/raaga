// Notification service for Now Playing
// Uses a platform-safe approach — no expo-notifications import at all
// In Expo Go: completely silent no-op
// In production/dev build: uses expo-notifications if available

import { Platform } from 'react-native';
import Constants from 'expo-constants';

// Detect if we're in Expo Go (not dev build / production)
const isExpoGo = Constants.appOwnership === 'expo';

let _notifModule: any = null;
let _loaded = false;

async function loadNotifModule() {
  if (_loaded) return _notifModule;
  _loaded = true;

  if (isExpoGo) {
    // Never even attempt to load in Expo Go
    _notifModule = null;
    return null;
  }

  try {
    // Dynamic import — only in dev build / production
    _notifModule = await import('expo-notifications');
    return _notifModule;
  } catch {
    _notifModule = null;
    return null;
  }
}

export async function showNowPlaying(title: string, artist: string, _artwork?: string) {
  const notif = await loadNotifModule();
  if (!notif) return;

  try {
    const { status } = await notif.getPermissionsAsync();
    if (status !== 'granted') {
      const { status: newStatus } = await notif.requestPermissionsAsync();
      if (newStatus !== 'granted') return;
    }

    if (Platform.OS === 'android') {
      await notif.setNotificationChannelAsync('now-playing', {
        name: 'Now Playing',
        importance: notif.AndroidImportance?.LOW ?? 2,
        sound: undefined,
        vibrationPattern: [0],
        lockscreenVisibility: notif.AndroidNotificationVisibility?.PUBLIC ?? 1,
      });
    }

    await notif.scheduleNotificationAsync({
      content: {
        title: `🎵 ${title}`,
        body: artist,
        sound: false,
        sticky: true,
        priority: notif.AndroidNotificationPriority?.LOW ?? 'low',
      },
      trigger: null,
      identifier: 'now-playing',
    });
  } catch {
    // Silent fail
  }
}

export async function clearNowPlaying() {
  const notif = await loadNotifModule();
  if (!notif) return;

  try {
    await notif.dismissNotificationAsync('now-playing');
  } catch {
    // Silent fail
  }
}
