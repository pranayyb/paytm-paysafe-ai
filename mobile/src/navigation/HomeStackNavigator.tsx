import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import type { HomeStackParamList } from './types';
import HomeScreen from '@screens/home/HomeScreen';
import SendMoneyScreen from '@screens/payments/SendMoneyScreen';
import QRScannerScreen from '@screens/payments/QRScannerScreen';
import UPIPinScreen from '@screens/payments/UPIPinScreen';
import PaymentSuccessScreen from '@screens/payments/PaymentSuccessScreen';
import MobileRechargeScreen from '@screens/payments/MobileRechargeScreen';
import BillPaymentScreen from '@screens/payments/BillPaymentScreen';
import WalletScreen from '@screens/wallet/WalletScreen';

const Stack = createNativeStackNavigator<HomeStackParamList>();

export default function HomeStackNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Home" component={HomeScreen} />
      <Stack.Screen name="SendMoney" component={SendMoneyScreen} />
      <Stack.Screen name="QRScanner" component={QRScannerScreen} />
      <Stack.Screen name="UPIPin" component={UPIPinScreen} />
      <Stack.Screen
        name="PaymentSuccess"
        component={PaymentSuccessScreen}
        options={{ gestureEnabled: false }}
      />
      <Stack.Screen name="MobileRecharge" component={MobileRechargeScreen} />
      <Stack.Screen name="BillPayment" component={BillPaymentScreen} />
      <Stack.Screen name="Wallet" component={WalletScreen} />
    </Stack.Navigator>
  );
}
