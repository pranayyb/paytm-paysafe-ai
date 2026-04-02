import React, { useState } from 'react';
import {
  StyleSheet, Text, View, TextInput, TouchableOpacity,
  StatusBar, ScrollView,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { HomeStackParamList } from '@navigation/types';
import { Colors, Typography, Spacing } from '@theme';
import { useWalletStore } from '@store/walletStore';

type Props = NativeStackScreenProps<HomeStackParamList, 'BillPayment'>;

const PROVIDERS: Record<string, Array<{ id: string; name: string; color: string }>> = {
  electricity: [
    { id: 'mseb', name: 'MSEB', color: '#FF9800' },
    { id: 'bses', name: 'BSES Delhi', color: '#F44336' },
    { id: 'tata', name: 'Tata Power', color: '#2196F3' },
    { id: 'adani', name: 'Adani Elec.', color: '#009688' },
  ],
  gas: [
    { id: 'mgl', name: 'MGL', color: '#4CAF50' },
    { id: 'igl', name: 'IGL', color: '#00BCD4' },
  ],
  water: [
    { id: 'bwssb', name: 'BWSSB', color: '#2196F3' },
    { id: 'nmmc', name: 'NMMC', color: '#3F51B5' },
  ],
  broadband: [
    { id: 'act', name: 'ACT', color: '#E91E63' },
    { id: 'airtel', name: 'Airtel Fiber', color: '#FF0000' },
    { id: 'jio', name: 'JioFiber', color: '#0066FF' },
  ],
};

const BILL_TYPE_LABELS: Record<string, { label: string; icon: string; consumerLabel: string }> = {
  electricity: { label: 'Electricity Bill', icon: 'lightning-bolt', consumerLabel: 'Consumer Number' },
  gas: { label: 'Gas Bill', icon: 'gas-cylinder', consumerLabel: 'Customer ID' },
  water: { label: 'Water Bill', icon: 'water', consumerLabel: 'Consumer Number' },
  broadband: { label: 'Broadband Bill', icon: 'wifi', consumerLabel: 'Account Number / User ID' },
};

export default function BillPaymentScreen({ navigation, route }: Props) {
  const { billType } = route.params;
  const meta = BILL_TYPE_LABELS[billType] ?? BILL_TYPE_LABELS.electricity;
  const providers = PROVIDERS[billType] ?? [];
  const [selectedProvider, setSelectedProvider] = useState(providers[0]?.id ?? '');
  const [consumerId, setConsumerId] = useState('');
  const [billFetched, setBillFetched] = useState(false);
  const [mockAmount] = useState(Math.floor(Math.random() * 1500 + 300));
  const { deductMoney, addTransaction } = useWalletStore();

  const handleFetchBill = () => {
    if (consumerId.length >= 5) setBillFetched(true);
  };

  const handlePay = () => {
    const providerName = providers.find(p => p.id === selectedProvider)?.name ?? meta.label;
    const reference = 'TXN' + Date.now();

    deductMoney(mockAmount);
    addTransaction({
      id: Date.now().toString(),
      type: 'bill',
      amount: mockAmount,
      counterparty: providerName,
      status: 'success',
      timestamp: Date.now(),
      reference,
    });

    navigation.replace('PaymentSuccess', {
      amount: mockAmount,
      recipient: providerName,
      type: 'bill',
      status: 'success',
      reference,
    });
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.primaryDark} />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Icon name="arrow-left" size={24} color={Colors.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{meta.label}</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.card}>
          <Text style={styles.sectionLabel}>Select Provider</Text>
          <View style={styles.providerGrid}>
            {providers.map((p) => (
              <TouchableOpacity
                key={p.id}
                style={[styles.providerChip, selectedProvider === p.id && { borderColor: p.color, backgroundColor: p.color + '15' }]}
                onPress={() => { setSelectedProvider(p.id); setBillFetched(false); }}>
                <View style={[styles.providerDot, { backgroundColor: p.color }]} />
                <Text style={[styles.providerName, selectedProvider === p.id && { color: p.color }]}>{p.name}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.sectionLabel}>{meta.consumerLabel}</Text>
          <View style={styles.inputRow}>
            <Icon name={meta.icon} size={20} color={Colors.placeholder} style={{ marginRight: Spacing.sm }} />
            <TextInput
              style={styles.input}
              value={consumerId}
              onChangeText={(t) => { setConsumerId(t); setBillFetched(false); }}
              placeholder={`Enter ${meta.consumerLabel}`}
              placeholderTextColor={Colors.placeholder}
              keyboardType="default"
            />
          </View>

          <TouchableOpacity
            style={[styles.fetchBtn, consumerId.length < 5 && styles.btnDisabled]}
            onPress={handleFetchBill}
            disabled={consumerId.length < 5}
            activeOpacity={0.8}>
            <Text style={styles.fetchBtnText}>Fetch Bill</Text>
          </TouchableOpacity>
        </View>

        {billFetched && (
          <View style={styles.billCard}>
            <View style={styles.billRow}>
              <Text style={styles.billLabel}>Consumer Name</Text>
              <Text style={styles.billValue}>Arjun Mehta</Text>
            </View>
            <View style={styles.billRow}>
              <Text style={styles.billLabel}>Consumer ID</Text>
              <Text style={styles.billValue}>{consumerId}</Text>
            </View>
            <View style={styles.billRow}>
              <Text style={styles.billLabel}>Due Date</Text>
              <Text style={[styles.billValue, { color: Colors.error }]}>
                {new Date(Date.now() + 7 * 86400000).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
              </Text>
            </View>
            <View style={[styles.billRow, styles.amountRow]}>
              <Text style={styles.amountLabel}>Amount Due</Text>
              <Text style={styles.amountValue}>₹ {mockAmount.toLocaleString('en-IN')}</Text>
            </View>

            <TouchableOpacity style={styles.payBtn} onPress={handlePay} activeOpacity={0.8}>
              <Text style={styles.payBtnText}>Pay ₹{mockAmount.toLocaleString('en-IN')}</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.offWhite },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.primaryDark,
    paddingHorizontal: Spacing.base,
    paddingTop: Spacing['3xl'],
    paddingBottom: Spacing.base,
  },
  headerTitle: { fontSize: Typography.size.lg, fontWeight: Typography.weight.bold, color: Colors.white },
  content: { padding: Spacing.base },
  card: {
    backgroundColor: Colors.white, borderRadius: 16, padding: Spacing.base,
    marginBottom: Spacing.base, elevation: 2,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.07, shadowRadius: 4,
  },
  sectionLabel: {
    fontSize: Typography.size.xs, color: Colors.textSecondary, fontWeight: Typography.weight.medium,
    textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: Spacing.sm, marginTop: Spacing.sm,
  },
  providerGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm, marginBottom: Spacing.sm },
  providerChip: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingVertical: Spacing.sm, paddingHorizontal: Spacing.md,
    borderRadius: 8, borderWidth: 1.5, borderColor: Colors.border,
  },
  providerDot: { width: 8, height: 8, borderRadius: 4 },
  providerName: { fontSize: Typography.size.sm, fontWeight: Typography.weight.medium, color: Colors.textPrimary },
  inputRow: {
    flexDirection: 'row', alignItems: 'center', borderWidth: 1.5, borderColor: Colors.border,
    borderRadius: 10, paddingHorizontal: Spacing.md, backgroundColor: Colors.inputBg, marginBottom: Spacing.base,
  },
  input: { flex: 1, paddingVertical: Spacing.md, fontSize: Typography.size.base, color: Colors.textPrimary },
  fetchBtn: {
    backgroundColor: Colors.primary, borderRadius: 10,
    paddingVertical: Spacing.sm + 2, alignItems: 'center',
  },
  btnDisabled: { opacity: 0.5 },
  fetchBtnText: { color: Colors.white, fontSize: Typography.size.base, fontWeight: Typography.weight.semibold },
  billCard: {
    backgroundColor: Colors.white, borderRadius: 16, padding: Spacing.base,
    elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.07, shadowRadius: 4,
  },
  billRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: Spacing.sm, borderBottomWidth: 1, borderBottomColor: Colors.border },
  billLabel: { fontSize: Typography.size.sm, color: Colors.textSecondary },
  billValue: { fontSize: Typography.size.sm, fontWeight: Typography.weight.medium, color: Colors.textPrimary },
  amountRow: { borderBottomWidth: 0, marginTop: Spacing.sm },
  amountLabel: { fontSize: Typography.size.base, fontWeight: Typography.weight.bold, color: Colors.textPrimary },
  amountValue: { fontSize: Typography.size.xl, fontWeight: Typography.weight.bold, color: Colors.primaryDark },
  payBtn: { backgroundColor: Colors.primary, borderRadius: 12, paddingVertical: Spacing.base, alignItems: 'center', marginTop: Spacing.base },
  payBtnText: { color: Colors.white, fontSize: Typography.size.base, fontWeight: Typography.weight.bold },
});
