import { Tabs, useRouter } from 'expo-router';
import { View, Text, StyleSheet, Pressable, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MiniPlayer } from '../../components/Player/MiniPlayer';
import { usePlayerStore } from '../../stores/playerStore';
import { useLibraryStore } from '../../stores/libraryStore';
import { colors, typography } from '../../theme';

const TAB_ICONS: Record<string, { active: string; inactive: string }> = {
  index: { active: 'home', inactive: 'home-outline' },
  search: { active: 'search', inactive: 'search-outline' },
  library: { active: 'library', inactive: 'library-outline' },
  downloads: { active: 'download', inactive: 'download-outline' },
  settings: { active: 'settings', inactive: 'settings-outline' },
};

export default function TabLayout() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const play = usePlayerStore((s) => s.play);
  const setQueue = usePlayerStore((s) => s.setQueue);
  const favorites = useLibraryStore((s) => s.favorites);
  const recentlyPlayed = useLibraryStore((s) => s.recentlyPlayed);

  const handlePlayMix = () => {
    const seen = new Set<string>();
    const mix: any[] = [];
    [...favorites, ...recentlyPlayed].forEach((s) => {
      if (!seen.has(s.id)) { seen.add(s.id); mix.push(s); }
    });
    if (mix.length > 0) {
      // Fisher-Yates shuffle
      for (let i = mix.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [mix[i], mix[j]] = [mix[j], mix[i]];
      }
      setQueue(mix);
      play(mix[0]);
    }
  };

  return (
    <View style={styles.wrapper}>
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarStyle: { display: 'none' },
          tabBarHideOnKeyboard: true,
        }}
        tabBar={(props) => (
          <View>
            {/* MiniPlayer sits above tab bar on tab screens */}
            <View>
              <MiniPlayer />
            </View>
            {/* Quick actions row */}
            <View style={styles.quickActions}>
              <TouchableOpacity
                style={styles.quickButton}
                onPress={() => props.navigation.navigate('search')}
                activeOpacity={0.7}
              >
                <Ionicons name="search" size={16} color={colors.defaultAccent} />
                <Text style={styles.quickButtonText}>Search</Text>
              </TouchableOpacity>
              {(favorites.length > 0 || recentlyPlayed.length > 0) && (
                <TouchableOpacity
                  style={[styles.quickButton, styles.quickButtonAccent]}
                  onPress={handlePlayMix}
                  activeOpacity={0.7}
                >
                  <Ionicons name="sparkles" size={16} color="#fff" />
                  <Text style={[styles.quickButtonText, { color: '#fff' }]}>Play Mix</Text>
                </TouchableOpacity>
              )}
            </View>
            <View style={styles.tabBarOuter}>
              <LinearGradient
                colors={['rgba(15,21,32,0.95)', 'rgba(8,11,18,0.99)']}
                style={StyleSheet.absoluteFill}
              />
              <View style={[styles.tabBar, { paddingBottom: Math.max(insets.bottom, 8) }]}> 
                {props.state.routes.map((route, index) => {
                  const { options } = props.descriptors[route.key];
                  const label = options.title ?? route.name;
                  const isFocused = props.state.index === index;
                  const iconConfig = TAB_ICONS[route.name];
                  const iconName = isFocused ? iconConfig?.active : iconConfig?.inactive;
                  const color = isFocused ? colors.defaultAccent : colors.textTertiary;

                  return (
                    <Pressable
                      key={route.key}
                      style={styles.tabItem}
                      onPress={() => {
                        const event = props.navigation.emit({
                          type: 'tabPress',
                          target: route.key,
                          canPreventDefault: true,
                        });
                        if (!isFocused && !event.defaultPrevented) {
                          props.navigation.navigate(route.name);
                        }
                      }}
                    >
                      {/* Amber dot indicator above icon */}
                      {isFocused ? (
                        <View style={styles.activeDot} />
                      ) : (
                        <View style={styles.dotPlaceholder} />
                      )}
                      <Ionicons name={iconName as any} size={24} color={color} />
                      <Text style={[styles.tabLabel, { color }]}>
                        {label}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>
          </View>
        )}
      >
        <Tabs.Screen name="index" options={{ title: 'Home' }} />
        <Tabs.Screen name="search" options={{ title: 'Search' }} />
        <Tabs.Screen name="library" options={{ title: 'Library' }} />
        <Tabs.Screen name="downloads" options={{ title: 'Downloads' }} />
        <Tabs.Screen name="settings" options={{ title: 'Settings' }} />
      </Tabs>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    backgroundColor: colors.background,
  },
  tabBarOuter: {
    borderTopColor: 'rgba(232,236,242,0.04)',
    borderTopWidth: 0.5,
    overflow: 'hidden',
  },
  tabBar: {
    flexDirection: 'row',
    paddingTop: 4,
    minHeight: 56,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  activeDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.defaultAccent,
    marginBottom: 2,
  },
  dotPlaceholder: {
    width: 4,
    height: 4,
    marginBottom: 2,
  },
  tabLabel: {
    ...typography.tabLabel,
    fontSize: 10,
  },
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 6,
    paddingHorizontal: 16,
    backgroundColor: 'rgba(8,11,18,0.95)',
  },
  quickButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: 'rgba(6,182,212,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(6,182,212,0.2)',
  },
  quickButtonAccent: {
    backgroundColor: colors.defaultAccent,
    borderColor: colors.defaultAccent,
  },
  quickButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.defaultAccent,
  },
});
