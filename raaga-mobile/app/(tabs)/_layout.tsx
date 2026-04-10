import { Tabs } from 'expo-router';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { MiniPlayer } from '../../components/Player/MiniPlayer';
import { colors, typography } from '../../theme';

type TabIconConfig = {
  active: string;
  inactive: string;
  family: 'ionicons' | 'material';
};

const TAB_ICONS: Record<string, TabIconConfig> = {
  index: { active: 'home', inactive: 'home-outline', family: 'ionicons' },
  search: { active: 'search', inactive: 'search-outline', family: 'ionicons' },
  library: { active: 'library', inactive: 'library-outline', family: 'ionicons' },
  downloads: { active: 'download', inactive: 'download-outline', family: 'ionicons' },
  settings: { active: 'settings', inactive: 'settings-outline', family: 'ionicons' },
};

function TabIcon({ name, focused }: { name: string; focused: boolean }) {
  const config = TAB_ICONS[name];
  if (!config) return null;

  const iconName = focused ? config.active : config.inactive;
  const color = focused ? colors.defaultAccent : '#666666';
  const size = 22;

  if (config.family === 'material') {
    return <MaterialCommunityIcons name={iconName as any} size={size} color={color} />;
  }
  return <Ionicons name={iconName as any} size={size} color={color} />;
}

export default function TabLayout() {
  return (
    <View style={styles.wrapper}>
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarStyle: styles.tabBar,
          tabBarActiveTintColor: colors.defaultAccent,
          tabBarInactiveTintColor: '#666666',
          tabBarLabelStyle: {
            ...typography.tabLabel,
            marginTop: -2,
          },
          tabBarHideOnKeyboard: true,
        }}
        tabBar={(props) => (
          <View>
            <MiniPlayer />
            <View style={styles.tabBar}>
              {props.state.routes.map((route, index) => {
                const { options } = props.descriptors[route.key];
                const label = options.title ?? route.name;
                const isFocused = props.state.index === index;
                const color = isFocused ? colors.defaultAccent : '#666666';

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
                    <TabIcon name={route.name} focused={isFocused} />
                    <Text
                      style={[
                        typography.tabLabel,
                        { color, marginTop: 2, fontSize: 10 },
                      ]}
                    >
                      {label}
                    </Text>
                  </Pressable>
                );
              })}
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
  tabBar: {
    backgroundColor: colors.background,
    borderTopColor: 'rgba(255, 255, 255, 0.06)',
    borderTopWidth: 0.5,
    height: 60,
    flexDirection: 'row',
    paddingTop: 6,
    paddingBottom: 8,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
