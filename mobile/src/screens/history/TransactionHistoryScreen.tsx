import React, { useState } from 'react';
import {
  StyleSheet, Text, View,
  TouchableOpacity, StatusBar, RefreshControl,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { FlashList } from '@shopify/flash-list';
import TransactionItem from '@components/transaction/TransactionItem';
import type { Transaction } from '@store/walletStore';
import { Colors, Typography, Spacing } from '@theme';
import { useWalletStore } from '@store/walletStore';
import { formatDateHeader } from '@utils/formatDate';

const FILTERS = ['All', 'Sent', 'Received', 'Recharge', 'Bills'] as const;
type Filter = typeof FILTERS[number];

const FILTER_MAP: Record<Filter, Transaction['type'] | null> = {
  All: null,
  Sent: 'sent',
  Received: 'received',
  Recharge: 'recharge',
  Bills: 'bill',
};

function groupByDate(txns: Transaction[]): Array<{ date: string; data: Transaction[] }> {
  const map = new Map<string, Transaction[]>();
  for (const txn of txns) {
    const key = formatDateHeader(txn.timestamp);
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(txn);
  }
  return Array.from(map.entries()).map(([date, data]) => ({ date, data }));
}

export default function TransactionHistoryScreen() {
  const insets = useSafeAreaInsets();
  const [filter, setFilter] = useState<Filter>('All');
  const { transactions, isRefreshing, setRefreshing } = useWalletStore();

  const filtered = FILTER_MAP[filter]
    ? transactions.filter((t) => t.type === FILTER_MAP[filter])
    : transactions;

  const grouped = groupByDate(filtered);

  const handleRefresh = () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1000);
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.white} />

      <View style={styles.header}>
        <Text style={styles.title}>Transactions</Text>
      </View>

      {/* Filter chips */}
      <View style={styles.filtersRow}>
        {FILTERS.map((f) => (
          <TouchableOpacity
            key={f}
            style={[styles.chip, filter === f && styles.chipActive]}
            onPress={() => setFilter(f)}>
            <Text style={[styles.chipText, filter === f && styles.chipTextActive]}>{f}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {grouped.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyText}>No transactions found</Text>
        </View>
      ) : (
        <FlashList
          data={grouped}
          keyExtractor={(item) => item.date}
          showsVerticalScrollIndicator={false}
          // @ts-ignore - estimatedItemSize is required by FlashList but missing from the types
          estimatedItemSize={150}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={handleRefresh}
              colors={[Colors.primary]}
              tintColor={Colors.primary}
            />
          }
          renderItem={({ item }) => (
            <View>
              <Text style={styles.dateHeader}>{item.date}</Text>
              <View style={styles.group}>
                {item.data.map((txn, idx) => (
                  <View key={txn.id}>
                    <TransactionItem txn={txn} />
                    {idx < item.data.length - 1 && <View style={styles.divider} />}
                  </View>
                ))}
              </View>
            </View>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.offWhite },
  header: {
    backgroundColor: Colors.white,
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.base,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  title: { fontSize: Typography.size.xl, fontWeight: Typography.weight.bold, color: Colors.textPrimary },
  filtersRow: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.sm,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    gap: Spacing.sm,
  },
  chip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs + 2,
    borderRadius: 20,
    backgroundColor: Colors.offWhite,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  chipActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  chipText: { fontSize: Typography.size.sm, color: Colors.textSecondary, fontWeight: Typography.weight.medium },
  chipTextActive: { color: Colors.white },
  dateHeader: {
    fontSize: Typography.size.sm,
    fontWeight: Typography.weight.semibold,
    color: Colors.textSecondary,
    paddingHorizontal: Spacing.base,
    paddingTop: Spacing.base,
    paddingBottom: Spacing.xs,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  group: {
    backgroundColor: Colors.white,
    marginHorizontal: Spacing.base,
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: Spacing.sm,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  divider: { height: 1, backgroundColor: Colors.border, marginLeft: Spacing.base + 40 + Spacing.md },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  emptyText: { fontSize: Typography.size.base, color: Colors.textLight },
});
