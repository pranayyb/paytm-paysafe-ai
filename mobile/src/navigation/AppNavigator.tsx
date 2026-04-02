import React from 'react';
import { useAuthStore } from '@store/authStore';
import AuthStackNavigator from './AuthStackNavigator';
import MainTabNavigator from './MainTabNavigator';

export default function AppNavigator() {
  const isLoggedIn = useAuthStore((state) => state.isLoggedIn);
  return isLoggedIn ? <MainTabNavigator /> : <AuthStackNavigator />;
}
