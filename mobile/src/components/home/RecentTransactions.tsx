import React from 'react';
import { StyleSheet, Text, View, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import type { MainTabParamList } from '@navigation/types';
import TransactionItem from '@components/transaction/TransactionItem';
import { Colors, Typography, Spacing } from '@theme';
import { useWalletStore } from '@store/walletStore';

type Nav = BottomTabNavigationProp<MainTabParamList>;

export default function RecentTransactions() {
  const navigation = useNavigation<Nav>();
  const transactions = useWalletStore((s) => s.transactions);
  const recent = transactions.slice(0, 3);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Recent Transactions</Text>
        <TouchableOpacity onPress={() => navigation.navigate('HistoryTab')}>
          <Text style={styles.viewAll}>View All</Text>
        </TouchableOpacity>
      </View>
      {recent.length === 0 ? (
        <Text style={styles.empty}>No transactions yet</Text>
      ) : (
        recent.map((txn, idx) => (
          <View key={txn.id}>
            <TransactionItem txn={txn} />
            {idx < recent.length - 1 && <View style={styles.divider} />}
          </View>
        ))
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.white,
    marginTop: Spacing.sm,
    paddingBottom: Spacing.sm,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.base,
  },
  title: {
    fontSize: Typography.size.base,
    fontWeight: Typography.weight.bold,
    color: Colors.textPrimary,
  },
  viewAll: {
    fontSize: Typography.size.sm,
    color: Colors.primary,
    fontWeight: Typography.weight.medium,
  },
  empty: {
    textAlign: 'center',
    color: Colors.textLight,
    paddingVertical: Spacing.xl,
    fontSize: Typography.size.md,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.border,
    marginLeft: Spacing.base + 40 + Spacing.md,
  },
});
