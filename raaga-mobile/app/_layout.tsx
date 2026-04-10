import { Stack } from 'expo-router';
import { colors } from '../theme';

export default function RootLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.background },
        animation: 'fade',
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
        }}
      />
      <Stack.Screen name="artist/[id]" options={{ animation: 'slide_from_right' }} />
      <Stack.Screen name="album/[id]" options={{ animation: 'slide_from_right' }} />
      <Stack.Screen name="genre/[slug]" options={{ animation: 'slide_from_right' }} />
      <Stack.Screen name="mood/[slug]" options={{ animation: 'slide_from_right' }} />
      <Stack.Screen name="settings/equalizer" options={{ animation: 'slide_from_right' }} />
    </Stack>
  );
}
