import React from 'react';
import {
  StyleSheet, Text, View, TouchableOpacity,
  StatusBar, ScrollView,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { AuthStackParamList } from '@navigation/types';
import { Colors, Typography, Spacing } from '@theme';

type Props = NativeStackScreenProps<AuthStackParamList, 'ModeSelect'>;

export default function ModeSelectScreen({ navigation }: Props) {
  return (
    <ScrollView
      contentContainerStyle={styles.container}
      keyboardShouldPersistTaps="handled">
      <StatusBar barStyle="dark-content" backgroundColor={Colors.white} />

      <View style={styles.logoRow}>
        <View style={styles.logoBox}>
          <Text style={styles.logoText}>Paytm</Text>
        </View>
      </View>

      <Text style={styles.title}>How will you use Paytm?</Text>
      <Text style={styles.subtitle}>Choose your account type to get started</Text>

      <View style={styles.cardsRow}>
        {/* User card */}
        <TouchableOpacity
          style={styles.card}
          onPress={() => navigation.navigate('Login', { mode: 'user' })}
          activeOpacity={0.85}>
          <View style={[styles.cardIconWrap, { backgroundColor: Colors.primary + '18' }]}>
            <Icon name="wallet-outline" size={38} color={Colors.primary} />
          </View>
          <Text style={styles.cardTitle}>I'm a Customer</Text>
          <Text style={styles.cardDesc}>
            Send money, pay bills, scan QR codes, and stay safe with AI scam detection
          </Text>
          <View style={[styles.cardBadge, { backgroundColor: Colors.primary }]}>
            <Text style={styles.cardBadgeText}>Personal</Text>
          </View>
        </TouchableOpacity>

        {/* Merchant card */}
        <TouchableOpacity
          style={[styles.card, styles.cardMerchant]}
          onPress={() => navigation.navigate('Login', { mode: 'merchant' })}
          activeOpacity={0.85}>
          <View style={[styles.cardIconWrap, { backgroundColor: Colors.primaryDark + '18' }]}>
            <Icon name="store-outline" size={38} color={Colors.primaryDark} />
          </View>
          <Text style={styles.cardTitle}>I'm a Merchant</Text>
          <Text style={styles.cardDesc}>
            View business analytics, detect anomalies, and manage your store with AI insights
          </Text>
          <View style={[styles.cardBadge, { backgroundColor: Colors.primaryDark }]}>
            <Text style={styles.cardBadgeText}>Business</Text>
          </View>
        </TouchableOpacity>
      </View>

      <View style={styles.featureRow}>
        <FeatureChip icon="shield-check-outline" label="AI Fraud Detection" />
        <FeatureChip icon="microphone-outline" label="Voice Payments" />
        <FeatureChip icon="chart-bar" label="Smart Analytics" />
      </View>

      <Text style={styles.terms}>
        By continuing, you agree to our{' '}
        <Text style={styles.link}>Terms of Service</Text> and{' '}
        <Text style={styles.link}>Privacy Policy</Text>
      </Text>
    </ScrollView>
  );
}

function FeatureChip({ icon, label }: { icon: string; label: string }) {
  return (
    <View style={styles.chip}>
      <Icon name={icon} size={14} color={Colors.primary} />
      <Text style={styles.chipText}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: Colors.white,
    padding: Spacing['2xl'],
    paddingTop: Spacing['5xl'],
  },
  logoRow: { alignItems: 'flex-start', marginBottom: Spacing['3xl'] },
  logoBox: {
    backgroundColor: Colors.primaryDark,
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.sm,
    borderRadius: 8,
  },
  logoText: {
    fontSize: Typography.size['2xl'],
    fontWeight: Typography.weight.extrabold,
    color: Colors.white,
    letterSpacing: -0.5,
  },
  title: {
    fontSize: Typography.size['2xl'],
    fontWeight: Typography.weight.bold,
    color: Colors.textPrimary,
    marginBottom: Spacing.sm,
  },
  subtitle: {
    fontSize: Typography.size.md,
    color: Colors.textSecondary,
    marginBottom: Spacing['2xl'],
  },
  cardsRow: { gap: Spacing.base, marginBottom: Spacing.xl },
  card: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: Spacing.lg,
    borderWidth: 1.5,
    borderColor: Colors.border,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 6,
    gap: Spacing.sm,
  },
  cardMerchant: { borderColor: Colors.primaryDark + '40' },
  cardIconWrap: {
    width: 64,
    height: 64,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.xs,
  },
  cardTitle: {
    fontSize: Typography.size.lg,
    fontWeight: Typography.weight.bold,
    color: Colors.textPrimary,
  },
  cardDesc: {
    fontSize: Typography.size.sm,
    color: Colors.textSecondary,
    lineHeight: 20,
  },
  cardBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
    borderRadius: 20,
    marginTop: Spacing.xs,
  },
  cardBadgeText: {
    color: Colors.white,
    fontSize: Typography.size.xs,
    fontWeight: Typography.weight.semibold,
  },
  featureRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
    marginBottom: Spacing.xl,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 5,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.primary + '40',
    backgroundColor: Colors.primary + '08',
  },
  chipText: {
    fontSize: Typography.size.xs,
    color: Colors.primary,
    fontWeight: Typography.weight.medium,
  },
  terms: {
    fontSize: Typography.size.sm,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  link: { color: Colors.primary, fontWeight: Typography.weight.medium },
});
