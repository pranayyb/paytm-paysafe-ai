import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import type { Transaction } from '@store/walletStore';
import { Colors, Typography, Spacing } from '@theme';
import { formatRelativeDate } from '@utils/formatDate';
import { formatAmount } from '@utils/formatCurrency';

const ICON_MAP: Record<Transaction['type'], { name: string; color: string }> = {
  sent: { name: 'arrow-up-circle', color: Colors.error },
  received: { name: 'arrow-down-circle', color: Colors.success },
  recharge: { name: 'cellphone', color: Colors.primary },
  bill: { name: 'lightning-bolt', color: Colors.warning },
};

const STATUS_COLOR: Record<Transaction['status'], string> = {
  success: Colors.success,
  failed: Colors.error,
  pending: Colors.warning,
};

interface Props {
  txn: Transaction;
}

export default function TransactionItem({ txn }: Props) {
  const icon = ICON_MAP[txn.type];
  const isDebit = txn.type === 'sent' || txn.type === 'recharge' || txn.type === 'bill';
  const amountColor = txn.status === 'failed' ? Colors.textSecondary : isDebit ? Colors.textPrimary : Colors.success;
  const prefix = txn.status === 'failed' ? '' : isDebit ? '- ₹' : '+ ₹';

  return (
    <View style={styles.row}>
      <View style={[styles.iconCircle, { backgroundColor: icon.color + '1A' }]}>
        <Icon name={icon.name} size={20} color={icon.color} />
      </View>
      <View style={styles.info}>
        <Text style={styles.name} numberOfLines={1}>{txn.counterparty}</Text>
        <Text style={styles.date}>{formatRelativeDate(txn.timestamp)}</Text>
      </View>
      <View style={styles.amountCol}>
        <Text style={[styles.amount, { color: amountColor }]}>
          {txn.status === 'failed' ? '₹' : prefix}{formatAmount(txn.amount)}
        </Text>
        {txn.status !== 'success' && (
          <Text style={[styles.status, { color: STATUS_COLOR[txn.status] }]}>
            {txn.status.charAt(0).toUpperCase() + txn.status.slice(1)}
          </Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.sm + 2,
    paddingHorizontal: Spacing.base,
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  info: { flex: 1 },
  name: {
    fontSize: Typography.size.md,
    fontWeight: Typography.weight.medium,
    color: Colors.textPrimary,
    marginBottom: 2,
  },
  date: { fontSize: Typography.size.xs, color: Colors.textLight },
  amountCol: { alignItems: 'flex-end' },
  amount: {
    fontSize: Typography.size.md,
    fontWeight: Typography.weight.semibold,
  },
  status: { fontSize: Typography.size.xs, marginTop: 2 },
});
