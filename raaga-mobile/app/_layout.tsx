import { Stack, usePathname } from 'expo-router';
import { View, StyleSheet } from 'react-native';
import { MiniPlayer } from '../components/Player/MiniPlayer';
import { colors } from '../theme';

export default function RootLayout() {
  const pathname = usePathname();
  const isPlayerOpen = pathname === '/player';

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
      </Stack>
      {/* Global MiniPlayer — shows on all screens except full player */}
      {!isPlayerOpen && <MiniPlayer />}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
  },
});
