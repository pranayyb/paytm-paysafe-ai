import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { HomeStackParamList } from '@navigation/types';
import PrimaryButton from '@components/common/PrimaryButton';
import { Colors, Typography, Spacing } from '@theme';
import { useWalletStore } from '@store/walletStore';
import { useUserStore } from '@store/userStore';
import { formatAmount } from '@utils/formatCurrency';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

type Nav = NativeStackNavigationProp<HomeStackParamList>;

export default function BalanceCard() {
  const navigation = useNavigation<Nav>();
  const balance = useWalletStore((s) => s.balance);
  const kycStatus = useUserStore((s) => s.kycStatus);

  return (
    <LinearGradient colors={Colors.gradientPrimary} style={styles.card} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
      {/* Header row */}
      <View style={styles.headerRow}>
        <Text style={styles.walletLabel}>Paytm Wallet</Text>
        {kycStatus === 'verified' && (
          <View style={styles.kycChip}>
            <Icon name="shield-check" size={12} color={Colors.success} />
            <Text style={styles.kycText}>KYC Verified</Text>
          </View>
        )}
      </View>

      {/* Balance */}
      <Text style={styles.balanceLabel}>Available Balance</Text>
      <Text style={styles.balanceAmount}>₹ {formatAmount(balance)}</Text>

      {/* Actions */}
      <View style={styles.actionsRow}>
        <PrimaryButton
          label="+ Add Money"
          onPress={() => navigation.navigate('Wallet')}
          ghost
          style={styles.actionBtn}
        />
        <PrimaryButton
          label="Pay"
          onPress={() => navigation.navigate('SendMoney', {})}
          style={{ ...styles.actionBtn, ...styles.payBtn }}
          textColor={Colors.primaryDark}
        />
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  card: {
    marginHorizontal: Spacing.base,
    marginTop: Spacing.base,
    borderRadius: 16,
    padding: Spacing.lg,
    elevation: 8,
    shadowColor: Colors.primaryDark,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.md,
  },
  walletLabel: {
    fontSize: Typography.size.sm,
    color: Colors.white,
    opacity: 0.8,
    fontWeight: Typography.weight.medium,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  kycChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.15)',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
    borderRadius: 20,
    gap: 4,
  },
  kycText: {
    fontSize: Typography.size.xs,
    color: Colors.white,
    fontWeight: Typography.weight.medium,
  },
  balanceLabel: {
    fontSize: Typography.size.xs,
    color: Colors.white,
    opacity: 0.7,
    marginBottom: 4,
  },
  balanceAmount: {
    fontSize: Typography.size['3xl'],
    fontWeight: Typography.weight.bold,
    color: Colors.white,
    marginBottom: Spacing.lg,
    letterSpacing: -0.5,
  },
  actionsRow: { flexDirection: 'row', gap: Spacing.sm },
  actionBtn: { flex: 1 },
  payBtn: { backgroundColor: Colors.white },
});
