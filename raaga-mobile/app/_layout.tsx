import { useEffect } from 'react';
import { Stack, usePathname } from 'expo-router';
import { View, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MiniPlayer } from '../components/Player/MiniPlayer';
import { usePlayerStore } from '../stores/playerStore';
import { colors } from '../theme';

export default function RootLayout() {
  const pathname = usePathname();
  const insets = useSafeAreaInsets();
  const isPlayerOpen = pathname === '/player';
  // MiniPlayer is rendered inside (tabs)/_layout for tab screens
  // For other stack screens (genre, mood, artist, album, trending), show it from root
  const isTabScreen = pathname === '/' || pathname === '/search' || pathname === '/library' || pathname === '/downloads' || pathname === '/settings';
  const showMiniPlayer = !isPlayerOpen && !isTabScreen;

  // Restore persisted player state on app launch
  useEffect(() => {
    usePlayerStore.getState().restorePlayback();
  }, []);

  return (
    <View style={styles.root}>
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: colors.background },
          animation: 'fade',
          navigationBarColor: colors.background,
        }}
      >
        <Stack.Screen name="(tabs)" options={{ animation: 'fade' }} />
        <Stack.Screen
          name="player"
          options={{
            presentation: 'modal',
            animation: 'slide_from_bottom',
            gestureEnabled: true,
            gestureDirection: 'vertical',
            contentStyle: { backgroundColor: colors.background },
          }}
        />
        <Stack.Screen name="artist/[id]" options={{ animation: 'slide_from_right', contentStyle: { backgroundColor: colors.background } }} />
        <Stack.Screen name="album/[id]" options={{ animation: 'slide_from_right', contentStyle: { backgroundColor: colors.background } }} />
        <Stack.Screen name="genre/[slug]" options={{ animation: 'slide_from_right', contentStyle: { backgroundColor: colors.background } }} />
        <Stack.Screen name="mood/[slug]" options={{ animation: 'slide_from_right', contentStyle: { backgroundColor: colors.background } }} />
        <Stack.Screen name="trending" options={{ animation: 'slide_from_right', contentStyle: { backgroundColor: colors.background } }} />
        <Stack.Screen name="settings/equalizer" options={{ animation: 'slide_from_right', contentStyle: { backgroundColor: colors.background } }} />
        <Stack.Screen name="privacy" options={{ animation: 'slide_from_right', contentStyle: { backgroundColor: colors.background } }} />
        <Stack.Screen name="terms" options={{ animation: 'slide_from_right', contentStyle: { backgroundColor: colors.background } }} />
      </Stack>
      {/* MiniPlayer for non-tab stack screens (genre, mood, artist, album, trending) */}
      {showMiniPlayer && (
        <View style={[styles.miniPlayerWrapper, { paddingBottom: Math.max(insets.bottom, 0) }]} pointerEvents="box-none">
          <MiniPlayer />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
  },
  miniPlayerWrapper: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
  },
});
