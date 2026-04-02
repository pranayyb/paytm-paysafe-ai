import React, { useState } from 'react';
import {
  StyleSheet, Text, View, TouchableOpacity,
  StatusBar, ScrollView, TextInput, Modal,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import LinearGradient from 'react-native-linear-gradient';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { HomeStackParamList } from '@navigation/types';
import { Colors, Typography, Spacing } from '@theme';
import { useWalletStore } from '@store/walletStore';
import { formatAmount } from '@utils/formatCurrency';

type Props = NativeStackScreenProps<HomeStackParamList, 'Wallet'>;

const PAYMENT_METHODS = [
  { id: '1', type: 'upi', label: 'rahulmehta@okicici', icon: 'bank-transfer', color: '#5C6BC0' },
  { id: '2', type: 'card', label: 'HDFC Debit ••••4521', icon: 'credit-card', color: '#E53935' },
  { id: '3', type: 'card', label: 'ICICI Credit ••••9832', icon: 'credit-card-outline', color: '#F57C00' },
];

export default function WalletScreen({ navigation }: Props) {
  const { balance, addMoney, addTransaction } = useWalletStore();
  const [showAddModal, setShowAddModal] = useState(false);
  const [addAmount, setAddAmount] = useState('');

  const handleAddMoney = () => {
    const amt = parseFloat(addAmount);
    if (!isNaN(amt) && amt > 0) {
      const reference = 'TXN' + Date.now();
      addMoney(amt);
      addTransaction({
        id: Date.now().toString(),
        type: 'received',
        amount: amt,
        counterparty: 'Added to Wallet',
        status: 'success',
        timestamp: Date.now(),
        reference,
      });
      setAddAmount('');
      setShowAddModal(false);
      navigation.replace('PaymentSuccess', {
        amount: amt,
        recipient: 'Paytm Wallet',
        type: 'addMoney',
        status: 'success',
        reference,
      });
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.primaryDark} />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Icon name="arrow-left" size={24} color={Colors.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Paytm Wallet</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Balance card */}
        <LinearGradient colors={Colors.gradientPrimary} style={styles.balanceCard} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
          <Text style={styles.balanceLabel}>Available Balance</Text>
          <Text style={styles.balanceAmount}>₹ {formatAmount(balance)}</Text>
          <View style={styles.kycRow}>
            <Icon name="shield-check" size={14} color={Colors.success} />
            <Text style={styles.kycText}>Full KYC Complete</Text>
          </View>
        </LinearGradient>

        {/* Action tiles */}
        <View style={styles.actionsGrid}>
          {[
            { id: 'add', icon: 'plus-circle-outline', label: 'Add Money', color: Colors.success, onPress: () => setShowAddModal(true) },
            { id: 'send', icon: 'bank-transfer', label: 'Send', color: Colors.primary, onPress: () => {} },
            { id: 'bills', icon: 'lightning-bolt', label: 'Pay Bills', color: Colors.warning, onPress: () => {} },
            { id: 'withdraw', icon: 'bank-outline', label: 'Withdraw', color: Colors.primaryMid, onPress: () => {} },
          ].map((action) => (
            <TouchableOpacity key={action.id} style={styles.actionTile} onPress={action.onPress} activeOpacity={0.7}>
              <View style={[styles.actionIcon, { backgroundColor: action.color + '1A' }]}>
                <Icon name={action.icon} size={24} color={action.color} />
              </View>
              <Text style={styles.actionLabel}>{action.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Payment methods */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Payment Methods</Text>
          {PAYMENT_METHODS.map((pm) => (
            <View key={pm.id} style={styles.methodRow}>
              <View style={[styles.methodIcon, { backgroundColor: pm.color + '15' }]}>
                <Icon name={pm.icon} size={20} color={pm.color} />
              </View>
              <Text style={styles.methodLabel}>{pm.label}</Text>
              <Icon name="chevron-right" size={18} color={Colors.textLight} />
            </View>
          ))}
          <TouchableOpacity style={styles.addMethodRow}>
            <View style={styles.addMethodIcon}>
              <Icon name="plus" size={20} color={Colors.primary} />
            </View>
            <Text style={styles.addMethodText}>Add Payment Method</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Add Money Modal */}
      <Modal visible={showAddModal} transparent animationType="slide">
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setShowAddModal(false)} />
        <View style={styles.modalSheet}>
          <Text style={styles.modalTitle}>Add Money to Wallet</Text>
          <View style={styles.amountInputRow}>
            <Text style={styles.rupee}>₹</Text>
            <TextInput
              style={styles.amountInput}
              value={addAmount}
              onChangeText={setAddAmount}
              placeholder="Enter amount"
              placeholderTextColor={Colors.placeholder}
              keyboardType="decimal-pad"
              autoFocus
            />
          </View>
          <View style={styles.quickRow}>
            {['500', '1000', '2000', '5000'].map((a) => (
              <TouchableOpacity key={a} style={styles.quickChip} onPress={() => setAddAmount(a)}>
                <Text style={styles.quickText}>₹{a}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <TouchableOpacity style={styles.addBtn} onPress={handleAddMoney} activeOpacity={0.8}>
            <Text style={styles.addBtnText}>Add Money</Text>
          </TouchableOpacity>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.offWhite },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: Colors.primaryDark, paddingHorizontal: Spacing.base,
    paddingTop: Spacing['3xl'], paddingBottom: Spacing.base,
  },
  headerTitle: { fontSize: Typography.size.lg, fontWeight: Typography.weight.bold, color: Colors.white },
  balanceCard: {
    margin: Spacing.base, borderRadius: 16, padding: Spacing.xl,
    elevation: 8, shadowColor: Colors.primaryDark, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3, shadowRadius: 8,
  },
  balanceLabel: { fontSize: Typography.size.xs, color: Colors.white, opacity: 0.7, textTransform: 'uppercase', letterSpacing: 0.5 },
  balanceAmount: { fontSize: Typography.size['3xl'], fontWeight: Typography.weight.bold, color: Colors.white, marginVertical: Spacing.sm },
  kycRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  kycText: { fontSize: Typography.size.xs, color: Colors.white, opacity: 0.9 },
  actionsGrid: {
    flexDirection: 'row', backgroundColor: Colors.white, marginHorizontal: Spacing.base,
    borderRadius: 12, marginBottom: Spacing.sm, paddingVertical: Spacing.base, elevation: 1,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2,
  },
  actionTile: { flex: 1, alignItems: 'center' },
  actionIcon: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center', marginBottom: Spacing.xs },
  actionLabel: { fontSize: Typography.size.xs, color: Colors.textPrimary, fontWeight: Typography.weight.medium },
  section: { backgroundColor: Colors.white, margin: Spacing.base, borderRadius: 12, overflow: 'hidden', elevation: 1, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2 },
  sectionTitle: { fontSize: Typography.size.base, fontWeight: Typography.weight.bold, color: Colors.textPrimary, padding: Spacing.base, borderBottomWidth: 1, borderBottomColor: Colors.border },
  methodRow: { flexDirection: 'row', alignItems: 'center', padding: Spacing.base, borderBottomWidth: 1, borderBottomColor: Colors.border },
  methodIcon: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginRight: Spacing.md },
  methodLabel: { flex: 1, fontSize: Typography.size.md, color: Colors.textPrimary, fontWeight: Typography.weight.medium },
  addMethodRow: { flexDirection: 'row', alignItems: 'center', padding: Spacing.base },
  addMethodIcon: { width: 36, height: 36, borderRadius: 10, borderWidth: 1.5, borderColor: Colors.primary, borderStyle: 'dashed', alignItems: 'center', justifyContent: 'center', marginRight: Spacing.md },
  addMethodText: { fontSize: Typography.size.md, color: Colors.primary, fontWeight: Typography.weight.medium },
  modalOverlay: { flex: 1, backgroundColor: Colors.overlay },
  modalSheet: { backgroundColor: Colors.white, borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: Spacing.xl },
  modalTitle: { fontSize: Typography.size.lg, fontWeight: Typography.weight.bold, color: Colors.textPrimary, marginBottom: Spacing.lg },
  amountInputRow: { flexDirection: 'row', alignItems: 'center', borderWidth: 1.5, borderColor: Colors.border, borderRadius: 12, paddingHorizontal: Spacing.base, marginBottom: Spacing.base },
  rupee: { fontSize: Typography.size['2xl'], fontWeight: Typography.weight.bold, color: Colors.textPrimary },
  amountInput: { flex: 1, fontSize: Typography.size['2xl'], fontWeight: Typography.weight.bold, color: Colors.textPrimary, paddingVertical: Spacing.base, paddingLeft: Spacing.sm },
  quickRow: { flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.xl },
  quickChip: { paddingHorizontal: Spacing.base, paddingVertical: Spacing.sm, borderRadius: 20, borderWidth: 1, borderColor: Colors.primary },
  quickText: { color: Colors.primary, fontSize: Typography.size.sm, fontWeight: Typography.weight.medium },
  addBtn: { backgroundColor: Colors.primary, borderRadius: 12, paddingVertical: Spacing.base, alignItems: 'center' },
  addBtnText: { color: Colors.white, fontSize: Typography.size.base, fontWeight: Typography.weight.bold },
});
