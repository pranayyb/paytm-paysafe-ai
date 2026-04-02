import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { PAYTM_LIGHT_BLUE, WHITE, fonts, DARK_BACKGROUND, DARK_SURFACE, DARK_TEXT, DARK_TEXT_MUTED } from '../styles/theme';

interface AlertsScreenProps {
  notifications: any[];
  isDarkMode?: boolean;
}

export const AlertsScreen: React.FC<AlertsScreenProps> = ({ notifications, isDarkMode = false }) => {
  const bg = isDarkMode ? DARK_BACKGROUND : '#F5F7FA';
  const surface = isDarkMode ? DARK_SURFACE : WHITE;
  const text = isDarkMode ? DARK_TEXT : '#111';
  const textMuted = isDarkMode ? DARK_TEXT_MUTED : '#555';
  const timeText = isDarkMode ? '#888' : '#999';

  return (
    <ScrollView style={[s.screen, { backgroundColor: bg }]} showsVerticalScrollIndicator={false}>
      <View style={s.pageHeader}><Text style={[s.pageTitle, { color: text }]}>Notifications</Text></View>
      {notifications.map((n, i) => (
        <View key={i} style={[s.notifCard, { backgroundColor: surface }, !n.read && s.notifUnread]}>
          <Text style={[s.notifTitle, { color: text }]}>{n.title}</Text>
          <Text style={[s.notifBody, { color: textMuted }]}>{n.body}</Text>
          <Text style={[s.notifTime, { color: timeText }]}>{n.time}</Text>
        </View>
      ))}
      <View style={{ height: 120 }} />
    </ScrollView>
  );
};

const s = StyleSheet.create({
  screen: { flex: 1 },
  pageHeader: { padding: 24, paddingBottom: 10 },
  pageTitle: { fontSize: 18, fontFamily: fonts.bold },
  notifCard: { borderRadius: 16, padding: 20, marginHorizontal: 16, marginBottom: 12, elevation: 0 },
  notifUnread: { borderLeftWidth: 4, borderLeftColor: PAYTM_LIGHT_BLUE },
  notifTitle: { fontSize: 14, fontFamily: fonts.bold, marginBottom: 4 },
  notifBody: { fontSize: 12, fontFamily: fonts.regular, marginBottom: 10 },
  notifTime: { fontSize: 10, fontFamily: fonts.medium },
});
