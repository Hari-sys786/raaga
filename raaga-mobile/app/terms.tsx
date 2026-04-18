import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, spacing } from '../theme';

export default function TermsOfService() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  return (
    <View style={[s.root, { paddingTop: insets.top }]}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()} style={s.back}>
          <Ionicons name="arrow-back" size={22} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={s.title}>Terms of Service</Text>
        <View style={s.back} />
      </View>
      <ScrollView style={s.body} contentContainerStyle={s.content}>
        <Text style={s.updated}>Last updated: April 2026</Text>

        <Text style={s.h2}>Acceptance</Text>
        <Text style={s.p}>By using Raaga, you agree to these terms. If you disagree, please uninstall the app.</Text>

        <Text style={s.h2}>Usage</Text>
        <Text style={s.p}>Raaga is a free music streaming client. It provides access to music through third-party APIs. We do not own, host, or distribute any music content.</Text>

        <Text style={s.h2}>Content</Text>
        <Text style={s.p}>All music content is provided by JioSaavn, YouTube Music, and other third-party services. Copyright belongs to the respective artists, labels, and platforms.</Text>

        <Text style={s.h2}>Downloads</Text>
        <Text style={s.p}>The download feature caches songs locally for offline playback. Downloaded content remains subject to the original platform's terms of service.</Text>

        <Text style={s.h2}>No Warranty</Text>
        <Text style={s.p}>Raaga is provided "as is" without warranty. We are not responsible for content availability, quality, or interruptions in service from third-party APIs.</Text>

        <Text style={s.h2}>Changes</Text>
        <Text style={s.p}>We may update these terms at any time. Continued use constitutes acceptance of updated terms.</Text>

        <View style={{ height: 60 }} />
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.screenPadding, paddingVertical: 14 },
  back: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.surfaceElevated, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 17, fontWeight: '700', color: colors.textPrimary },
  body: { flex: 1 },
  content: { paddingHorizontal: spacing.screenPadding, paddingTop: 8 },
  updated: { fontSize: 12, color: colors.textTertiary, marginBottom: 20 },
  h2: { fontSize: 16, fontWeight: '700', color: colors.textPrimary, marginTop: 20, marginBottom: 8 },
  p: { fontSize: 14, color: colors.textSecondary, lineHeight: 22 },
});
