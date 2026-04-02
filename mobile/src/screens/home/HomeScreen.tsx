import React from 'react';
import { StyleSheet, View, ScrollView, StatusBar } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { HomeStackParamList } from '@navigation/types';
import HomeHeader from '@components/home/HomeHeader';
import BalanceCard from '@components/home/BalanceCard';
import QuickActionGrid from '@components/home/QuickActionGrid';
import PromoBanner from '@components/home/PromoBanner';
import ServiceSection from '@components/home/ServiceSection';
import RecentTransactions from '@components/home/RecentTransactions';
import { Colors, Spacing } from '@theme';

type Nav = NativeStackNavigationProp<HomeStackParamList>;

const RECHARGE_SERVICES = [
  { id: 's1', iconName: 'cellphone', label: 'Mobile', iconColor: '#00BAF2' },
  { id: 's2', iconName: 'television', label: 'DTH', iconColor: '#9C27B0' },
  { id: 's3', iconName: 'lightning-bolt', label: 'Electricity', iconColor: '#FF9800' },
  { id: 's4', iconName: 'water', label: 'Water', iconColor: '#2196F3' },
  { id: 's5', iconName: 'gas-cylinder', label: 'Gas', iconColor: '#F44336' },
  { id: 's6', iconName: 'wifi', label: 'Broadband', iconColor: '#4CAF50' },
];

const TRAVEL_SERVICES = [
  { id: 't1', iconName: 'train', label: 'Train', iconColor: '#E91E63' },
  { id: 't2', iconName: 'bus', label: 'Bus', iconColor: '#00BCD4' },
  { id: 't3', iconName: 'airplane', label: 'Flight', iconColor: '#3F51B5' },
  { id: 't4', iconName: 'hotel', label: 'Hotel', iconColor: '#FF5722' },
  { id: 't5', iconName: 'car', label: 'Cab', iconColor: '#FFC107' },
];

export default function HomeScreen() {
  const navigation = useNavigation<Nav>();

  const rechargeWithNav = RECHARGE_SERVICES.map((s) => ({
    ...s,
    onPress: () => navigation.navigate('MobileRecharge'),
  }));

  const travelWithNav = TRAVEL_SERVICES.map((s) => ({
    ...s,
    onPress: () => {},
  }));

  return (
    <View style={styles.container}>
      <StatusBar translucent backgroundColor="transparent" barStyle="light-content" />
      <HomeHeader />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
        stickyHeaderIndices={[]}>
        <BalanceCard />
        <QuickActionGrid />
        <PromoBanner />
        <ServiceSection title="Recharge & Bills" services={rechargeWithNav} />
        <ServiceSection title="Travel & Stays" services={travelWithNav} />
        <RecentTransactions />
        <View style={styles.bottomPad} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.offWhite },
  scroll: {},
  bottomPad: { height: Spacing.xl },
});
