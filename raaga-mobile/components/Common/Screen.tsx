import React from 'react';
import {
  SafeAreaView,
  StatusBar,
  StyleSheet,
  ScrollView,
  View,
  ViewStyle,
  RefreshControl,
} from 'react-native';
import { colors } from '../../theme';

interface ScreenProps {
  children: React.ReactNode;
  scroll?: boolean;
  style?: ViewStyle;
  refreshing?: boolean;
  onRefresh?: () => void;
}

export function Screen({
  children,
  scroll = false,
  style,
  refreshing,
  onRefresh,
}: ScreenProps) {
  const Container = scroll ? ScrollView : View;

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" backgroundColor={colors.background} />
      <Container
        style={[styles.container, style]}
        {...(scroll && {
          showsVerticalScrollIndicator: false,
          contentContainerStyle: styles.scrollContent,
          refreshControl:
            onRefresh ? (
              <RefreshControl
                refreshing={refreshing ?? false}
                onRefresh={onRefresh}
                tintColor={colors.defaultAccent}
                colors={[colors.defaultAccent]}
                progressBackgroundColor={colors.surface}
              />
            ) : undefined,
        })}
      >
        {children}
      </Container>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.background,
  },
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    flexGrow: 1,
  },
});
