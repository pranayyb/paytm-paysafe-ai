import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import type { MerchantStackParamList } from './types';
import MerchantDashboardScreen from '@screens/merchant/MerchantDashboardScreen';
import MerchantVoiceQueryScreen from '@screens/merchant/MerchantVoiceQueryScreen';

const Stack = createNativeStackNavigator<MerchantStackParamList>();

export default function MerchantStackNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="MerchantDashboard" component={MerchantDashboardScreen} />
      <Stack.Screen name="MerchantVoiceQuery" component={MerchantVoiceQueryScreen} />
    </Stack.Navigator>
  );
}
