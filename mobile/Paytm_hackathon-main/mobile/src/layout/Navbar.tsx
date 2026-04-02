import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { Home, ScrollText, Mic, Bell, User } from 'lucide-react-native';
import { PAYTM_BLUE, PAYTM_LIGHT_BLUE, PAYTM_DARK_THEME_LIGHT_BLUE, WHITE, fonts } from '../styles/theme';

interface NavbarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  setShowVoicePay: (show: boolean) => void;
  isDarkMode?: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({ activeTab, setActiveTab, setShowVoicePay, isDarkMode = false }) => {
  const tabs = [
    { id: 'home', icon: Home, label: 'Home' },
    { id: 'history', icon: ScrollText, label: 'History' },
    { id: 'voice', icon: Mic, label: 'Voice' },
    { id: 'notifs', icon: Bell, label: 'Alerts' },
    { id: 'profile', icon: User, label: 'Profile' }
  ];

  return (
    <View style={[s.tabBarReal, { backgroundColor: isDarkMode ? '#121212' : WHITE, borderTopColor: isDarkMode ? '#2A2A2A' : '#EEE' }]}>
      {tabs.map((tab) => (
        <TouchableOpacity
          key={tab.id}
          style={s.tabReal}
          onPress={() => tab.id === 'voice' ? setShowVoicePay(true) : setActiveTab(tab.id)}
          activeOpacity={0.8}
        >
          {tab.id === 'voice' ? (
            <View style={s.voiceFabRealCenter}>
              <View style={s.voiceFabReal}><Mic size={28} color="#FFF" /></View>
              {/* <Text style={s.voiceFabLabel}>Voice</Text> */}
            </View>
          ) : (
            <View style={s.tabContentReal}>
              <tab.icon size={24} color={activeTab === tab.id ? (isDarkMode ? PAYTM_DARK_THEME_LIGHT_BLUE : PAYTM_LIGHT_BLUE) : '#888'} />
              <Text style={[s.tabLabelReal, activeTab === tab.id && { color: isDarkMode ? PAYTM_DARK_THEME_LIGHT_BLUE : PAYTM_LIGHT_BLUE, fontWeight: '700' }]}>
                {tab.label}
              </Text>
            </View>
          )}
        </TouchableOpacity>
      ))}
    </View>
  );
};

const s = StyleSheet.create({
  tabBarReal: {
    flexDirection: 'row',
    backgroundColor: WHITE,
    height: 80,
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    borderTopWidth: 1,
    borderTopColor: '#EEE',
    paddingBottom: Platform.OS === 'ios' ? 24 : 0
  },
  tabReal: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  tabContentReal: { alignItems: 'center', justifyContent: 'center', marginTop: 4 },
  tabLabelReal: { fontSize: 10, color: '#888', marginTop: 4, fontFamily: fonts.medium },
  voiceFabRealCenter: { position: 'absolute', top: -24, alignItems: 'center' },
  voiceFabReal: {
    width: 62,
    height: 62,
    borderRadius: 31,
    backgroundColor: PAYTM_LIGHT_BLUE,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 0,
    shadowColor: PAYTM_LIGHT_BLUE,
    shadowOpacity: 0.5,
    shadowRadius: 12,
  },
  voiceFabLabel: { fontSize: 11, color: PAYTM_BLUE, fontFamily: fonts.bold, marginTop: 6 },
});
