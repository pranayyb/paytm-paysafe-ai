import React from 'react';
import { StyleSheet, View, FlatList } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { HomeStackParamList } from '@navigation/types';
import QuickActionItem from './QuickActionItem';
import { Colors, Spacing } from '@theme';

type Nav = NativeStackNavigationProp<HomeStackParamList>;

const ACTIONS = [
  { id: '1', iconName: 'bank-transfer', label: 'Send Money', route: 'SendMoney' as const, iconColor: '#00BAF2' },
  { id: '2', iconName: 'qrcode-scan', label: 'Scan & Pay', route: 'QRScanner' as const, iconColor: '#002970' },
  { id: '3', iconName: 'cellphone', label: 'Mobile Recharge', route: 'MobileRecharge' as const, iconColor: '#4CAF50' },
  { id: '4', iconName: 'lightning-bolt', label: 'Electricity', route: 'BillPayment' as const, billType: 'electricity' as const, iconColor: '#FF9800' },
  { id: '5', iconName: 'shield-search', label: 'Scam Shield', route: 'ScamChecker' as const, iconColor: '#E91E63' },
  { id: '6', iconName: 'microphone', label: 'Voice Pay', route: 'VoicePayment' as const, iconColor: '#9C27B0' },
  { id: '7', iconName: 'television', label: 'DTH / Cable', route: 'BillPayment' as const, billType: 'broadband' as const, iconColor: '#9C27B0' },
  { id: '8', iconName: 'dots-grid', label: 'See All', route: null, iconColor: '#607D8B' },
];

export default function QuickActionGrid() {
  const navigation = useNavigation<Nav>();

  const handlePress = (action: (typeof ACTIONS)[0]) => {
    if (!action.route) return;
    if (action.route === 'BillPayment') {
      navigation.navigate('BillPayment', { billType: action.billType ?? 'electricity' });
    } else if (action.route === 'SendMoney') {
      navigation.navigate('SendMoney', {});
    } else if (action.route === 'QRScanner') {
      navigation.navigate('QRScanner', { returnTo: 'Home' });
    } else if (action.route === 'MobileRecharge') {
      navigation.navigate('MobileRecharge');
    } else if (action.route === 'ScamChecker') {
      navigation.navigate('ScamChecker');
    } else if (action.route === 'VoicePayment') {
      navigation.navigate('VoicePayment');
    }
  };

  return (
    <View style={styles.container}>
      <FlatList
        data={ACTIONS}
        numColumns={4}
        scrollEnabled={false}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <QuickActionItem
            iconName={item.iconName}
            label={item.label}
            onPress={() => handlePress(item)}
          />
        )}
        columnWrapperStyle={styles.row}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.white,
    marginTop: Spacing.sm,
    paddingVertical: Spacing.base,
    paddingHorizontal: Spacing.sm,
  },
  row: { marginBottom: Spacing.sm },
});
