import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, spacing } from '../theme';

export default function PrivacyPolicy() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  return (
    <View style={[s.root, { paddingTop: insets.top }]}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()} style={s.back}>
          <Ionicons name="arrow-back" size={22} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={s.title}>Privacy Policy</Text>
        <View style={s.back} />
      </View>
      <ScrollView style={s.body} contentContainerStyle={s.content}>
        <Text style={s.updated}>Last updated: April 2026</Text>

        <Text style={s.h2}>Data We Collect</Text>
        <Text style={s.p}>Raaga does not collect, store, or transmit any personal data to external servers. All your listening history, favorites, and settings are stored locally on your device.</Text>

        <Text style={s.h2}>Music Streaming</Text>
        <Text style={s.p}>Songs are streamed from third-party APIs (JioSaavn, YouTube Music). We do not host any music content. Your search queries are sent directly to these services to fetch results.</Text>

        <Text style={s.h2}>Downloads</Text>
        <Text style={s.p}>Downloaded songs are stored on your device's local storage. They are not uploaded or shared with any server.</Text>

        <Text style={s.h2}>Analytics</Text>
        <Text style={s.p}>Raaga does not use any analytics or tracking SDKs. No usage data is collected.</Text>

        <Text style={s.h2}>Third-Party Services</Text>
        <Text style={s.p}>Audio streaming relies on JioSaavn and YouTube Music APIs. Their respective privacy policies apply to the data they process.</Text>

        <Text style={s.h2}>Contact</Text>
        <Text style={s.p}>For questions about this privacy policy, contact the developer through the app's GitHub repository.</Text>

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
