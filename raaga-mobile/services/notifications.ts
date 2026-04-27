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
    _notifModule = null;
    return null;
  }

  try {
    _notifModule = await import('expo-notifications');
    return _notifModule;
  } catch {
    _notifModule = null;
    return null;
  }
}

const CHANNEL_ID = 'now-playing';
const NOTIF_ID = 'now-playing';

async function ensureChannel(notif: any) {
  if (Platform.OS !== 'android') return;
  await notif.setNotificationChannelAsync(CHANNEL_ID, {
    name: 'Now Playing',
    // DEFAULT importance = non-dismissible on most Android versions
    // LOW causes the notification to be easily swiped away
    importance: notif.AndroidImportance?.DEFAULT ?? 3,
    sound: undefined,
    vibrationPattern: [0],
    lockscreenVisibility: notif.AndroidNotificationVisibility?.PUBLIC ?? 1,
    enableVibrate: false,
  });
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

    await ensureChannel(notif);

    await notif.scheduleNotificationAsync({
      identifier: NOTIF_ID,
      content: {
        title: `🎵 ${title}`,
        body: artist,
        sound: false,
        sticky: true,
        // ongoing flag via data — expo-notifications passes this through on Android
        data: { ongoing: true },
        ...(Platform.OS === 'android' && {
          priority: notif.AndroidNotificationPriority?.DEFAULT ?? 'default',
          // categoryIdentifier maps to Android notification category
          // TRANSPORT = media-style controls, stays in drawer
          categoryIdentifier: 'transport',
        }),
      },
      trigger: null,
    });
  } catch {
    // Silent fail — notification is optional UX
  }
}

export async function updateNowPlaying(title: string, artist: string) {
  // Same as show — scheduling with same identifier replaces the existing one
  return showNowPlaying(title, artist);
}

export async function clearNowPlaying() {
  const notif = await loadNotifModule();
  if (!notif) return;

  try {
    await notif.dismissNotificationAsync(NOTIF_ID);
  } catch {
    // Silent fail
  }
}
