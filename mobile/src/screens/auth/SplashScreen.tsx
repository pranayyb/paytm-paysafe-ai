import React, { useEffect } from 'react';
import { StyleSheet, Text, View, StatusBar } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { AuthStackParamList } from '@navigation/types';
import { Colors, Typography, Spacing } from '@theme';

type Props = NativeStackScreenProps<AuthStackParamList, 'Splash'>;

export default function SplashScreen({ navigation }: Props) {
  useEffect(() => {
    const timer = setTimeout(() => {
      navigation.replace('ModeSelect');
    }, 2500);
    return () => clearTimeout(timer);
  }, [navigation]);

  return (
    <LinearGradient colors={Colors.gradientPrimary} style={styles.container}>
      <StatusBar translucent backgroundColor="transparent" barStyle="light-content" />
      <View style={styles.logoContainer}>
        <View style={styles.logoBox}>
          <Text style={styles.logoText}>Paytm</Text>
        </View>
        <Text style={styles.tagline}>India's most loved payments app</Text>
      </View>
      <Text style={styles.footer}>Powered by One97 Communications</Text>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoContainer: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
  },
  logoBox: {
    backgroundColor: Colors.white,
    paddingHorizontal: Spacing['2xl'],
    paddingVertical: Spacing.base,
    borderRadius: 12,
    marginBottom: Spacing.lg,
  },
  logoText: {
    fontSize: Typography.size['4xl'],
    fontWeight: Typography.weight.extrabold,
    color: Colors.primaryDark,
    letterSpacing: -1,
  },
  tagline: {
    fontSize: Typography.size.base,
    color: Colors.white,
    opacity: 0.9,
    fontWeight: Typography.weight.medium,
  },
  footer: {
    fontSize: Typography.size.xs,
    color: Colors.white,
    opacity: 0.6,
    marginBottom: Spacing['2xl'],
  },
});
