import React from 'react';
import { useAuthStore } from '@store/authStore';
import AuthStackNavigator from './AuthStackNavigator';
import MainTabNavigator from './MainTabNavigator';
import MerchantTabNavigator from './MerchantTabNavigator';

export default function AppNavigator() {
  const isLoggedIn = useAuthStore((state) => state.isLoggedIn);
  const mode = useAuthStore((state) => state.mode);

  if (!isLoggedIn) return <AuthStackNavigator />;
  return mode === 'merchant' ? <MerchantTabNavigator /> : <MainTabNavigator />;
}
