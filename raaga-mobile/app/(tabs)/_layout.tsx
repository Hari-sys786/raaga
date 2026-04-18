import React from 'react';
import { Tabs } from 'expo-router';
import { View, Text, StyleSheet, Pressable, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MiniPlayer } from '../../components/Player/MiniPlayer';
import { usePlayerStore } from '../../stores/playerStore';
import { useLibraryStore } from '../../stores/libraryStore';
import { colors, typography } from '../../theme';
import { api } from '../../services/api';

const TAB_ICONS: Record<string, { active: string; inactive: string }> = {
  index: { active: 'home', inactive: 'home-outline' },
  library: { active: 'library', inactive: 'library-outline' },
  downloads: { active: 'download', inactive: 'download-outline' },
  settings: { active: 'settings', inactive: 'settings-outline' },
};

export default function TabLayout() {
  const insets = useSafeAreaInsets();
  const play = usePlayerStore((s) => s.play);
  const setQueue = usePlayerStore((s) => s.setQueue);
  const favorites = useLibraryStore((s) => s.favorites);
  const recentlyPlayed = useLibraryStore((s) => s.recentlyPlayed);

  const handlePlayMix = async () => {
    const seen = new Set<string>();
    const mix: any[] = [];
    [...favorites, ...recentlyPlayed].forEach((s) => {
      if (!seen.has(s.id)) { seen.add(s.id); mix.push(s); }
    });
    // If no history, fetch trending and shuffle
    if (mix.length === 0) {
      try {
        const data = await api.trending('hindi,english');
        const songs = Array.isArray(data) ? data : data?.results || [];
        songs.slice(0, 20).forEach((s: any) => {
          if (!seen.has(s.id)) { seen.add(s.id); mix.push(s); }
        });
      } catch {}
    }
    if (mix.length > 0) {
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
        tabBar={(props) => {
          // Filter out hidden tabs (search)
          const visibleRoutes = props.state.routes.filter(
            (r) => TAB_ICONS[r.name] !== undefined
          );
          const visibleIndexMap = new Map(
            visibleRoutes.map((r) => [r.key, props.state.routes.indexOf(r)])
          );

          return (
            <View>
              <MiniPlayer />
              <View style={styles.tabBarOuter}>
                <LinearGradient
                  colors={['rgba(8,11,18,0.97)', 'rgba(8,11,18,0.99)']}
                  style={StyleSheet.absoluteFill}
                />
                <View style={[styles.tabBar, { paddingBottom: Math.max(insets.bottom, 8) }]}>
                  {visibleRoutes.map((route, idx) => {
                    const realIndex = visibleIndexMap.get(route.key)!;
                    const isFocused = props.state.index === realIndex;
                    const iconConfig = TAB_ICONS[route.name];
                    const iconName = isFocused ? iconConfig?.active : iconConfig?.inactive;
                    const color = isFocused ? colors.defaultAccent : colors.textTertiary;
                    const label = props.descriptors[route.key]?.options?.title ?? route.name;

                    // Insert Play Mix FAB after Library (index 1 in visible = 2nd item)
                    const showMixAfter = idx === 1;

                    return (
                      <React.Fragment key={route.key}>
                        <Pressable
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
                          {isFocused && <View style={styles.activeDot} />}
                          <Ionicons name={iconName as any} size={22} color={color} />
                          <Text style={[styles.tabLabel, { color }]}>{label}</Text>
                        </Pressable>

                        {showMixAfter && (
                          <View style={styles.mixTabItem}>
                            <TouchableOpacity
                              style={styles.mixFab}
                              onPress={handlePlayMix}
                              activeOpacity={0.8}
                            >
                              <LinearGradient
                                colors={[colors.defaultAccent, '#0891B2']}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 1 }}
                                style={StyleSheet.absoluteFill}
                              />
                              <Ionicons name="sparkles" size={24} color="#fff" />
                            </TouchableOpacity>
                            <Text style={styles.mixLabel}>Mix</Text>
                          </View>
                        )}
                      </React.Fragment>
                    );
                  })}
                </View>
              </View>
            </View>
          );
        }}
      >
        <Tabs.Screen name="index" options={{ title: 'Home' }} />
        <Tabs.Screen name="search" options={{ title: 'Search', href: null }} />
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
    borderTopColor: 'rgba(255,255,255,0.04)',
    borderTopWidth: 0.5,
    overflow: 'hidden',
  },
  tabBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingTop: 8,
    minHeight: 64,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
    paddingTop: 4,
    paddingBottom: 4,
  },
  activeDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.defaultAccent,
    marginBottom: 1,
  },
  tabLabel: {
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  // Mix FAB
  mixTabItem: {
    alignItems: 'center',
    justifyContent: 'flex-end',
    width: 64,
    paddingBottom: 0,
  },
  mixFab: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -20,
    overflow: 'hidden',
    shadowColor: colors.defaultAccent,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.45,
    shadowRadius: 12,
    elevation: 10,
  },
  mixLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: colors.defaultAccent,
    marginTop: 3,
  },
});
