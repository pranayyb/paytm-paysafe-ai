import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  StatusBar,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { HomeStackParamList } from '@navigation/types';
import { Colors, Typography, Spacing } from '@theme';
import { isValidUpiId, isValidAmount } from '@utils/validators';

type Props = NativeStackScreenProps<HomeStackParamList, 'SendMoney'>;

const RECENTS = [
  { name: 'Rahul S', upi: 'rahul@okicici' },
  { name: 'Priya M', upi: 'priya@upi' },
  { name: 'Amit K', upi: 'amit@ybl' },
  { name: 'Sneha G', upi: 'sneha@paytm' },
];

export default function SendMoneyScreen({ navigation, route }: Props) {
  const [upi, setUpi] = useState(route.params?.prefillUpi ?? '');
  const [amount, setAmount] = useState('');
  const [step, setStep] = useState<'upi' | 'amount'>(
    route.params?.prefillUpi ? 'amount' : 'upi',
  );

  const handleProceedToPin = () => {
    navigation.navigate('UPIPin', {
      amount: parseFloat(amount),
      recipient: upi.split('@')[0].replace(/\./g, ' '),
      upiId: upi,
      type: 'sent',
    });
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.primaryDark} />

      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Icon name="arrow-left" size={24} color={Colors.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Send Money</Text>
        <TouchableOpacity
          onPress={() => navigation.navigate('QRScanner', { returnTo: 'SendMoney' })}>
          <Icon name="qrcode-scan" size={22} color={Colors.white} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        {step === 'upi' ? (
          <>
            <Text style={styles.label}>Enter UPI ID or mobile number</Text>
            <View style={styles.inputRow}>
              <TextInput
                style={styles.input}
                value={upi}
                onChangeText={setUpi}
                placeholder="name@bank or 10-digit mobile"
                placeholderTextColor={Colors.placeholder}
                autoCapitalize="none"
                returnKeyType="next"
                autoFocus
              />
              {isValidUpiId(upi) && (
                <Icon name="check-circle" size={20} color={Colors.success} />
              )}
            </View>

            <Text style={styles.sectionTitle}>Recent Contacts</Text>
            <View style={styles.recentsRow}>
              {RECENTS.map((r) => (
                <TouchableOpacity
                  key={r.upi}
                  style={styles.contactChip}
                  onPress={() => { setUpi(r.upi); setStep('amount'); }}>
                  <View style={styles.contactAvatar}>
                    <Text style={styles.contactInitial}>{r.name[0]}</Text>
                  </View>
                  <Text style={styles.contactName} numberOfLines={1}>{r.name}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity
              style={[styles.button, !isValidUpiId(upi) && styles.buttonDisabled]}
              onPress={() => setStep('amount')}
              disabled={!isValidUpiId(upi)}
              activeOpacity={0.8}>
              <Text style={styles.buttonText}>Continue</Text>
            </TouchableOpacity>
          </>
        ) : (
          <>
            <View style={styles.recipientChip}>
              <View style={styles.recipientAvatar}>
                <Text style={styles.recipientInitial}>{upi[0].toUpperCase()}</Text>
              </View>
              <View style={styles.recipientInfo}>
                <Text style={styles.recipientName}>
                  {upi.split('@')[0].replace(/\./g, ' ')}
                </Text>
                <Text style={styles.recipientUpi}>{upi}</Text>
              </View>
              <TouchableOpacity onPress={() => setStep('upi')}>
                <Icon name="pencil" size={18} color={Colors.primary} />
              </TouchableOpacity>
            </View>

            <Text style={styles.label}>Enter Amount</Text>
            <View style={styles.amountRow}>
              <Text style={styles.rupeeSign}>₹</Text>
              <TextInput
                style={styles.amountInput}
                value={amount}
                onChangeText={setAmount}
                placeholder="0"
                placeholderTextColor={Colors.placeholder}
                keyboardType="decimal-pad"
                autoFocus
              />
            </View>

            <View style={styles.quickAmounts}>
              {['100', '200', '500', '1000'].map((a) => (
                <TouchableOpacity
                  key={a}
                  style={styles.quickChip}
                  onPress={() => setAmount(a)}>
                  <Text style={styles.quickChipText}>₹{a}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.upiHint}>
              <Icon name="lock-outline" size={12} color={Colors.textSecondary} />
              {'  '}You will enter UPI PIN on the next step
            </Text>

            <TouchableOpacity
              style={[styles.button, !isValidAmount(amount) && styles.buttonDisabled]}
              onPress={handleProceedToPin}
              disabled={!isValidAmount(amount)}
              activeOpacity={0.8}>
              <Text style={styles.buttonText}>Proceed to Pay ₹{amount || '0'}</Text>
            </TouchableOpacity>
          </>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
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
  headerTitle: {
    fontSize: Typography.size.lg,
    fontWeight: Typography.weight.bold,
    color: Colors.white,
  },
  content: { padding: Spacing.base, paddingTop: Spacing.lg },
  label: {
    fontSize: Typography.size.xs,
    color: Colors.textSecondary,
    marginBottom: Spacing.sm,
    fontWeight: Typography.weight.medium,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: 12,
    paddingHorizontal: Spacing.base,
    marginBottom: Spacing.lg,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  input: {
    flex: 1,
    fontSize: Typography.size.base,
    color: Colors.textPrimary,
    paddingVertical: Spacing.base,
  },
  sectionTitle: {
    fontSize: Typography.size.base,
    fontWeight: Typography.weight.semibold,
    color: Colors.textPrimary,
    marginBottom: Spacing.md,
  },
  recentsRow: { flexDirection: 'row', gap: Spacing.base, marginBottom: Spacing.xl },
  contactChip: { alignItems: 'center', width: 60 },
  contactAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.xs,
  },
  contactInitial: {
    color: Colors.white,
    fontSize: Typography.size.lg,
    fontWeight: Typography.weight.bold,
  },
  contactName: {
    fontSize: Typography.size.xs,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  recipientChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: Spacing.base,
    gap: Spacing.md,
    marginBottom: Spacing.xl,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  recipientAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.primaryMid,
    alignItems: 'center',
    justifyContent: 'center',
  },
  recipientInitial: {
    color: Colors.white,
    fontSize: Typography.size.lg,
    fontWeight: Typography.weight.bold,
  },
  recipientInfo: { flex: 1 },
  recipientName: {
    fontSize: Typography.size.base,
    fontWeight: Typography.weight.semibold,
    color: Colors.textPrimary,
    textTransform: 'capitalize',
  },
  recipientUpi: { fontSize: Typography.size.xs, color: Colors.textSecondary, marginTop: 2 },
  amountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: 12,
    paddingHorizontal: Spacing.base,
    marginBottom: Spacing.base,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  rupeeSign: {
    fontSize: Typography.size['2xl'],
    color: Colors.textPrimary,
    fontWeight: Typography.weight.bold,
  },
  amountInput: {
    flex: 1,
    fontSize: Typography.size['2xl'],
    fontWeight: Typography.weight.bold,
    color: Colors.textPrimary,
    paddingVertical: Spacing.base,
    paddingLeft: Spacing.sm,
  },
  quickAmounts: { flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.base },
  quickChip: {
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.sm,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.primary,
  },
  quickChipText: {
    color: Colors.primary,
    fontSize: Typography.size.sm,
    fontWeight: Typography.weight.medium,
  },
  upiHint: {
    fontSize: Typography.size.xs,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: Spacing.lg,
  },
  button: {
    backgroundColor: Colors.primary,
    borderRadius: 12,
    paddingVertical: Spacing.base,
    alignItems: 'center',
  },
  buttonDisabled: { opacity: 0.5 },
  buttonText: {
    color: Colors.white,
    fontSize: Typography.size.base,
    fontWeight: Typography.weight.bold,
  },
});
