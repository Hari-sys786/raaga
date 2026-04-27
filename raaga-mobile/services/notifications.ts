// Notification service for Now Playing
// Supports prev/play-pause/next action buttons via expo-notifications categories
// In Expo Go: completely silent no-op
// In dev build / production: full notification with media controls

import { Platform } from 'react-native';
import Constants from 'expo-constants';

const isExpoGo = Constants.appOwnership === 'expo';

let _notifModule: any = null;
let _loaded = false;
let _responseSubscription: any = null;
let _isPlaying = false;

// Callbacks wired by playerStore
let _onNext: (() => void) | null = null;
let _onPrevious: (() => void) | null = null;
let _onPlayPause: (() => void) | null = null;

export function setNotificationCallbacks(callbacks: {
  onNext: () => void;
  onPrevious: () => void;
  onPlayPause: () => void;
}) {
  _onNext = callbacks.onNext;
  _onPrevious = callbacks.onPrevious;
  _onPlayPause = callbacks.onPlayPause;
}

// Action identifiers
const ACTION_PREV = 'raaga.prev';
const ACTION_PLAY_PAUSE = 'raaga.playpause';
const ACTION_NEXT = 'raaga.next';
const CATEGORY_ID = 'raaga-now-playing';
const CHANNEL_ID = 'now-playing';
const NOTIF_ID = 'now-playing';

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

async function ensureChannel(notif: any) {
  if (Platform.OS !== 'android') return;
  await notif.setNotificationChannelAsync(CHANNEL_ID, {
    name: 'Now Playing',
    importance: notif.AndroidImportance?.DEFAULT ?? 3,
    sound: undefined,
    vibrationPattern: [0],
    lockscreenVisibility: notif.AndroidNotificationVisibility?.PUBLIC ?? 1,
    enableVibrate: false,
  });
}

async function ensureCategory(notif: any, isPlaying: boolean) {
  // Register notification action category with prev/playpause/next buttons
  await notif.setNotificationCategoryAsync(CATEGORY_ID, [
    {
      identifier: ACTION_PREV,
      buttonTitle: '⏮',
      options: { isDestructive: false, isAuthenticationRequired: false },
    },
    {
      identifier: ACTION_PLAY_PAUSE,
      buttonTitle: isPlaying ? '⏸' : '▶',
      options: { isDestructive: false, isAuthenticationRequired: false },
    },
    {
      identifier: ACTION_NEXT,
      buttonTitle: '⏭',
      options: { isDestructive: false, isAuthenticationRequired: false },
    },
  ]);
}

async function ensureResponseListener(notif: any) {
  if (_responseSubscription) return;
  _responseSubscription = notif.addNotificationResponseReceivedListener(
    (response: any) => {
      const action = response.actionIdentifier;
      if (action === ACTION_NEXT) _onNext?.();
      else if (action === ACTION_PREV) _onPrevious?.();
      else if (action === ACTION_PLAY_PAUSE) _onPlayPause?.();
    }
  );
}

async function requestPermission(notif: any): Promise<boolean> {
  const { status } = await notif.getPermissionsAsync();
  if (status === 'granted') return true;
  const { status: newStatus } = await notif.requestPermissionsAsync();
  return newStatus === 'granted';
}

export async function showNowPlaying(
  title: string,
  artist: string,
  isPlaying = true,
  _artwork?: string
) {
  const notif = await loadNotifModule();
  if (!notif) return;

  try {
    const granted = await requestPermission(notif);
    if (!granted) return;

    _isPlaying = isPlaying;

    await ensureChannel(notif);
    await ensureCategory(notif, isPlaying);
    await ensureResponseListener(notif);

    await notif.scheduleNotificationAsync({
      identifier: NOTIF_ID,
      content: {
        title: `🎵 ${title}`,
        body: artist,
        sound: false,
        sticky: true,
        categoryIdentifier: CATEGORY_ID,
        data: { type: 'now-playing' },
        ...(Platform.OS === 'android' && {
          priority: notif.AndroidNotificationPriority?.DEFAULT ?? 'default',
        }),
      },
      trigger: null,
    });
  } catch {
    // Silent fail — notification is optional UX
  }
}

export async function updateNowPlaying(
  title: string,
  artist: string,
  isPlaying: boolean,
  artwork?: string
) {
  // Update play/pause button by re-registering category then re-posting
  if (_isPlaying !== isPlaying) {
    _isPlaying = isPlaying;
    const notif = await loadNotifModule();
    if (!notif) return;
    try {
      await ensureCategory(notif, isPlaying);
    } catch {
      // ignore
    }
  }
  return showNowPlaying(title, artist, isPlaying, artwork);
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
