import React, { useState } from 'react';
import {
  StyleSheet, Text, View, TextInput, TouchableOpacity,
  StatusBar, ScrollView, FlatList,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { HomeStackParamList } from '@navigation/types';
import { Colors, Typography, Spacing } from '@theme';
import { useWalletStore } from '@store/walletStore';

type Props = NativeStackScreenProps<HomeStackParamList, 'MobileRecharge'>;

const OPERATORS = [
  { id: 'jio', name: 'Jio', color: '#0066FF' },
  { id: 'airtel', name: 'Airtel', color: '#FF0000' },
  { id: 'vi', name: 'Vi', color: '#E40046' },
  { id: 'bsnl', name: 'BSNL', color: '#1A6B3A' },
];

const PLANS = [
  { id: 'p1', amount: 149, validity: '28 days', data: '1 GB/day', desc: 'Unlimited calls + SMS' },
  { id: 'p2', amount: 199, validity: '28 days', data: '1.5 GB/day', desc: 'Unlimited calls + SMS' },
  { id: 'p3', amount: 299, validity: '28 days', data: '2 GB/day', desc: 'Unlimited calls + 100 SMS/day' },
  { id: 'p4', amount: 499, validity: '56 days', data: '2 GB/day', desc: 'Unlimited calls + international roaming' },
  { id: 'p5', amount: 719, validity: '84 days', data: '2 GB/day', desc: 'Unlimited calls + Disney+ Hotstar' },
];

export default function MobileRechargeScreen({ navigation }: Props) {
  const [phone, setPhone] = useState('');
  const [selectedOp, setSelectedOp] = useState('jio');
  const { deductMoney, addTransaction } = useWalletStore();

  const handleRecharge = (amount: number) => {
    const opName = OPERATORS.find(o => o.id === selectedOp)?.name ?? 'Operator';
    const displayPhone = phone || '9876543210';
    const recipient = `${opName} - ${displayPhone}`;
    const reference = 'TXN' + Date.now();

    deductMoney(amount);
    addTransaction({
      id: Date.now().toString(),
      type: 'recharge',
      amount,
      counterparty: recipient,
      status: 'success',
      timestamp: Date.now(),
      reference,
    });

    navigation.replace('PaymentSuccess', {
      amount,
      recipient,
      type: 'recharge',
      status: 'success',
      reference,
    });
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.primaryDark} />

      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Icon name="arrow-left" size={24} color={Colors.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Mobile Recharge</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Operator selector */}
        <View style={styles.card}>
          <Text style={styles.sectionLabel}>Select Operator</Text>
          <View style={styles.operatorsRow}>
            {OPERATORS.map((op) => (
              <TouchableOpacity
                key={op.id}
                style={[styles.opChip, selectedOp === op.id && { borderColor: op.color, backgroundColor: op.color + '15' }]}
                onPress={() => setSelectedOp(op.id)}>
                <View style={[styles.opDot, { backgroundColor: op.color }]} />
                <Text style={[styles.opName, selectedOp === op.id && { color: op.color }]}>{op.name}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.sectionLabel}>Mobile Number</Text>
          <View style={styles.inputRow}>
            <Text style={styles.dialCode}>+91</Text>
            <TextInput
              style={styles.phoneInput}
              value={phone}
              onChangeText={setPhone}
              placeholder="10-digit number"
              placeholderTextColor={Colors.placeholder}
              keyboardType="numeric"
              maxLength={10}
            />
          </View>
        </View>

        <Text style={styles.plansTitle}>Popular Plans</Text>
        {PLANS.map((plan) => (
          <TouchableOpacity
            key={plan.id}
            style={styles.planCard}
            onPress={() => handleRecharge(plan.amount)}
            activeOpacity={0.8}>
            <View style={styles.planLeft}>
              <Text style={styles.planAmount}>₹{plan.amount}</Text>
              <Text style={styles.planValidity}>{plan.validity}</Text>
            </View>
            <View style={styles.planMid}>
              <Text style={styles.planData}>{plan.data}</Text>
              <Text style={styles.planDesc} numberOfLines={1}>{plan.desc}</Text>
            </View>
            <View style={styles.rechargeBtn}>
              <Text style={styles.rechargeBtnText}>Recharge</Text>
            </View>
          </TouchableOpacity>
        ))}
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
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: Spacing.base,
    marginBottom: Spacing.base,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.07,
    shadowRadius: 4,
  },
  sectionLabel: {
    fontSize: Typography.size.sm,
    color: Colors.textSecondary,
    fontWeight: Typography.weight.medium,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: Spacing.sm,
    marginTop: Spacing.sm,
  },
  operatorsRow: { flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.base },
  opChip: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    paddingVertical: Spacing.sm,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: Colors.border,
  },
  opDot: { width: 8, height: 8, borderRadius: 4 },
  opName: { fontSize: Typography.size.sm, fontWeight: Typography.weight.semibold, color: Colors.textPrimary },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderRadius: 10,
    overflow: 'hidden',
    backgroundColor: Colors.inputBg,
  },
  dialCode: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    fontSize: Typography.size.base,
    fontWeight: Typography.weight.semibold,
    color: Colors.textPrimary,
    borderRightWidth: 1,
    borderRightColor: Colors.border,
  },
  phoneInput: {
    flex: 1,
    paddingHorizontal: Spacing.md,
    fontSize: Typography.size.base,
    color: Colors.textPrimary,
  },
  plansTitle: {
    fontSize: Typography.size.base,
    fontWeight: Typography.weight.bold,
    color: Colors.textPrimary,
    marginBottom: Spacing.sm,
  },
  planCard: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: Spacing.base,
    marginBottom: Spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  planLeft: { width: 60, marginRight: Spacing.md },
  planAmount: { fontSize: Typography.size.lg, fontWeight: Typography.weight.bold, color: Colors.primaryDark },
  planValidity: { fontSize: Typography.size.xs, color: Colors.textSecondary, marginTop: 2 },
  planMid: { flex: 1 },
  planData: { fontSize: Typography.size.md, fontWeight: Typography.weight.semibold, color: Colors.textPrimary },
  planDesc: { fontSize: Typography.size.xs, color: Colors.textSecondary, marginTop: 2 },
  rechargeBtn: {
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: 8,
  },
  rechargeBtnText: { color: Colors.white, fontSize: Typography.size.sm, fontWeight: Typography.weight.semibold },
});
