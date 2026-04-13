import { Tabs } from 'expo-router';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, typography } from '../../theme';

const TAB_ICONS: Record<string, { active: string; inactive: string }> = {
  index: { active: 'home', inactive: 'home-outline' },
  search: { active: 'search', inactive: 'search-outline' },
  library: { active: 'library', inactive: 'library-outline' },
  downloads: { active: 'download', inactive: 'download-outline' },
  settings: { active: 'settings', inactive: 'settings-outline' },
};

export default function TabLayout() {
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
            <View style={styles.tabBarOuter}>
              <LinearGradient
                colors={['rgba(5,5,5,0.95)', 'rgba(5,5,5,0.99)']}
                style={StyleSheet.absoluteFill}
              />
              <View style={styles.tabBar}>
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
                      {isFocused && <View style={styles.activePill} />}
                      <Ionicons name={iconName as any} size={26} color={color} />
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
    borderTopColor: 'rgba(255, 255, 255, 0.04)',
    borderTopWidth: 0.5,
    overflow: 'hidden',
  },
  tabBar: {
    height: 64,
    flexDirection: 'row',
    paddingTop: 6,
    paddingBottom: 10,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  activePill: {
    position: 'absolute',
    top: 0,
    width: 32,
    height: 3,
    borderRadius: 2,
    backgroundColor: colors.defaultAccent,
  },
  tabLabel: {
    ...typography.tabLabel,
    fontSize: 10,
  },
});
