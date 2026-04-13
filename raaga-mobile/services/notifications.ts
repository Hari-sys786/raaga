// Notification service for Now Playing
// Safe for Expo Go — gracefully degrades when expo-notifications is unavailable

let Notifications: typeof import('expo-notifications') | null = null;

// Lazy load — only import if we're in a dev build (not Expo Go)
async function getNotifications() {
  if (Notifications !== null) return Notifications;
  try {
    Notifications = require('expo-notifications');
    // Test if it actually works (Expo Go will throw)
    await Notifications.getPermissionsAsync();
    return Notifications;
  } catch {
    Notifications = null;
    return null;
  }
}

export async function showNowPlaying(title: string, artist: string, artwork?: string) {
  try {
    const notif = await getNotifications();
    if (!notif) return; // Expo Go — skip silently

    const { status } = await notif.getPermissionsAsync();
    if (status !== 'granted') {
      const { status: newStatus } = await notif.requestPermissionsAsync();
      if (newStatus !== 'granted') return;
    }

    await notif.setNotificationChannelAsync('now-playing', {
      name: 'Now Playing',
      importance: notif.AndroidImportance.LOW,
      sound: undefined,
      vibrationPattern: [0],
      lockscreenVisibility: notif.AndroidNotificationVisibility.PUBLIC,
    });

    await notif.scheduleNotificationAsync({
      content: {
        title: `🎵 ${title}`,
        body: artist,
        sound: false,
        sticky: true,
        priority: notif.AndroidNotificationPriority.LOW,
      },
      trigger: null, // Show immediately
      identifier: 'now-playing',
    });
  } catch {
    // Silent fail — notifications are optional
  }
}

export async function clearNowPlaying() {
  try {
    const notif = await getNotifications();
    if (!notif) return;
    await notif.dismissNotificationAsync('now-playing');
  } catch {
    // Silent fail
  }
}
