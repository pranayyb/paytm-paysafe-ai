import React from 'react';
import { StyleSheet, View, TouchableOpacity, Platform } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import type { BottomTabBarButtonProps } from '@react-navigation/bottom-tabs';
import type { MerchantTabParamList } from './types';
import MerchantStackNavigator from './MerchantStackNavigator';
import QRScannerScreen from '@screens/payments/QRScannerScreen';
import TransactionHistoryScreen from '@screens/history/TransactionHistoryScreen';
import ProfileScreen from '@screens/profile/ProfileScreen';
import { Colors } from '@theme';

const Tab = createBottomTabNavigator<MerchantTabParamList>();

function ScanTabButton({ onPress, children }: BottomTabBarButtonProps) {
  return (
    <TouchableOpacity
      style={styles.scanTabWrapper}
      onPress={onPress}
      activeOpacity={0.85}>
      <View style={styles.scanTabCircle}>{children}</View>
    </TouchableOpacity>
  );
}

export default function MerchantTabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: styles.tabBar,
        tabBarActiveTintColor: Colors.primaryDark,
        tabBarInactiveTintColor: Colors.textSecondary,
        tabBarLabelStyle: styles.tabLabel,
        tabBarIcon: ({ color, size, focused }) => {
          const icons: Record<string, { default: string; focused: string }> = {
            DashboardTab: { default: 'view-dashboard-outline', focused: 'view-dashboard' },
            ScanTab: { default: 'qrcode-scan', focused: 'qrcode-scan' },
            HistoryTab: { default: 'history', focused: 'history' },
            ProfileTab: { default: 'account-outline', focused: 'account' },
          };
          const iconSet = icons[route.name] ?? { default: 'circle', focused: 'circle' };
          const iconName = focused ? iconSet.focused : iconSet.default;
          const iconColor = route.name === 'ScanTab' ? Colors.white : color;
          const iconSize = route.name === 'ScanTab' ? 28 : size;
          return <Icon name={iconName} size={iconSize} color={iconColor} />;
        },
      })}>
      <Tab.Screen
        name="DashboardTab"
        component={MerchantStackNavigator}
        options={{ tabBarLabel: 'Dashboard' }}
      />
      <Tab.Screen
        name="ScanTab"
        component={QRScannerScreen}
        options={{
          tabBarLabel: () => null,
          tabBarButton: (props) => <ScanTabButton {...props} />,
        }}
      />
      <Tab.Screen
        name="HistoryTab"
        component={TransactionHistoryScreen}
        options={{ tabBarLabel: 'History' }}
      />
      <Tab.Screen
        name="ProfileTab"
        component={ProfileScreen}
        options={{ tabBarLabel: 'Profile' }}
      />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: Colors.tabBarBg,
    borderTopColor: Colors.border,
    height: Platform.OS === 'ios' ? 80 : 64,
    paddingBottom: Platform.OS === 'ios' ? 20 : 8,
    paddingTop: 4,
    elevation: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
  },
  tabLabel: { fontSize: 11, fontWeight: '500' },
  scanTabWrapper: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingBottom: Platform.OS === 'ios' ? 20 : 8,
  },
  scanTabCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.primaryDark,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 2,
    elevation: 6,
    shadowColor: Colors.primaryDark,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
    transform: [{ translateY: -12 }],
  },
});
