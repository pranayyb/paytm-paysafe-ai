import React, { useState, useRef } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  StatusBar,
  Animated,
} from 'react-native';
import ReactNativeHapticFeedback from 'react-native-haptic-feedback';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { HomeStackParamList } from '@navigation/types';
import { Colors, Typography, Spacing } from '@theme';
import { useWalletStore } from '@store/walletStore';
import { formatAmount } from '@utils/formatCurrency';

type Props = NativeStackScreenProps<HomeStackParamList, 'UPIPin'>;

const PIN_LENGTH = 6;

const KEYPAD = [
  ['1', '2', '3'],
  ['4', '5', '6'],
  ['7', '8', '9'],
  ['', '0', 'backspace'],
];

export default function UPIPinScreen({ navigation, route }: Props) {
  const { amount, recipient, upiId, type } = route.params;
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const shakeAnim = useRef(new Animated.Value(0)).current;
  const { deductMoney, addTransaction } = useWalletStore();
  const HAPTIC_OPTIONS = { enableVibrateFallback: true, ignoreAndroidSystemSettings: false };

  const shake = () => {
    ReactNativeHapticFeedback.trigger('notificationError', HAPTIC_OPTIONS);
    Animated.sequence([
      Animated.timing(shakeAnim, { toValue: 10, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -10, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 8, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -8, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 0, duration: 60, useNativeDriver: true }),
    ]).start();
  };

  const handleKey = (key: string) => {
    if (loading) return;
    setError('');

    if (key === 'backspace') {
      ReactNativeHapticFeedback.trigger('selection', HAPTIC_OPTIONS);
      setPin((p) => p.slice(0, -1));
      return;
    }
    if (pin.length >= PIN_LENGTH) return;

    ReactNativeHapticFeedback.trigger('impactLight', HAPTIC_OPTIONS);
    const newPin = pin + key;
    setPin(newPin);

    if (newPin.length === PIN_LENGTH) {
      verifyPin(newPin);
    }
  };

  const verifyPin = (enteredPin: string) => {
    setLoading(true);
    setTimeout(() => {
      // Mock: any PIN that isn't "000000" succeeds
      if (enteredPin === '000000') {
        setLoading(false);
        setPin('');
        setError('Incorrect PIN. Please try again.');
        shake();
        return;
      }

      ReactNativeHapticFeedback.trigger('notificationSuccess', HAPTIC_OPTIONS);

      const reference = 'TXN' + Date.now();
      const txnType = type === 'sent' ? 'sent' : type;

      if (type === 'sent') {
        deductMoney(amount);
      } else if (type === 'recharge') {
        deductMoney(amount);
      } else if (type === 'bill') {
        deductMoney(amount);
      }

      addTransaction({
        id: Date.now().toString(),
        type: txnType,
        amount,
        counterparty: recipient,
        status: 'success',
        timestamp: Date.now(),
        reference,
      });

      navigation.replace('PaymentSuccess', {
        amount,
        recipient,
        type,
        status: 'success' as const,
        reference,
        upiId,
      });
    }, 1200);
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.primaryDark} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} disabled={loading}>
          <Icon name="arrow-left" size={24} color={Colors.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Enter UPI PIN</Text>
        <View style={{ width: 24 }} />
      </View>

      {/* Payment summary */}
      <View style={styles.summary}>
        <Text style={styles.summaryLabel}>Paying</Text>
        <Text style={styles.summaryAmount}>₹ {formatAmount(amount)}</Text>
        <Text style={styles.summaryRecipient} numberOfLines={1}>{recipient}</Text>
        {upiId ? <Text style={styles.summaryUpi}>{upiId}</Text> : null}
      </View>

      {/* PIN dots */}
      <Animated.View style={[styles.dotsRow, { transform: [{ translateX: shakeAnim }] }]}>
        {Array(PIN_LENGTH).fill(null).map((_, i) => (
          <View
            key={i}
            style={[
              styles.dot,
              i < pin.length && styles.dotFilled,
              error && styles.dotError,
            ]}
          />
        ))}
      </Animated.View>

      {error ? <Text style={styles.errorText}>{error}</Text> : null}

      {loading ? (
        <View style={styles.processingRow}>
          <Text style={styles.processingText}>Verifying...</Text>
        </View>
      ) : null}

      {/* Keypad */}
      <View style={styles.keypad}>
        {KEYPAD.map((row, ri) => (
          <View key={ri} style={styles.keyRow}>
            {row.map((key, ki) => {
              if (key === '') {
                return <View key={ki} style={styles.keyEmpty} />;
              }
              return (
                <TouchableOpacity
                  key={ki}
                  style={styles.key}
                  onPress={() => handleKey(key)}
                  disabled={loading}
                  activeOpacity={0.6}>
                  {key === 'backspace' ? (
                    <Icon name="backspace-outline" size={24} color={Colors.textPrimary} />
                  ) : (
                    <Text style={styles.keyText}>{key}</Text>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        ))}
      </View>

      <Text style={styles.forgotPin}>Forgot UPI PIN?</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.white },
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
  summary: {
    alignItems: 'center',
    paddingVertical: Spacing.xl,
    paddingHorizontal: Spacing.base,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    backgroundColor: Colors.offWhite,
  },
  summaryLabel: {
    fontSize: Typography.size.sm,
    color: Colors.textSecondary,
    marginBottom: 4,
  },
  summaryAmount: {
    fontSize: Typography.size['3xl'],
    fontWeight: Typography.weight.extrabold,
    color: Colors.textPrimary,
    marginBottom: 4,
    letterSpacing: -0.5,
  },
  summaryRecipient: {
    fontSize: Typography.size.base,
    fontWeight: Typography.weight.semibold,
    color: Colors.textPrimary,
  },
  summaryUpi: {
    fontSize: Typography.size.sm,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  dotsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: Spacing.base,
    paddingVertical: Spacing.xl,
  },
  dot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 2,
    borderColor: Colors.border,
    backgroundColor: Colors.white,
  },
  dotFilled: {
    backgroundColor: Colors.primaryDark,
    borderColor: Colors.primaryDark,
  },
  dotError: {
    borderColor: Colors.error,
    backgroundColor: Colors.error,
  },
  errorText: {
    textAlign: 'center',
    color: Colors.error,
    fontSize: Typography.size.sm,
    marginTop: -Spacing.md,
    marginBottom: Spacing.sm,
  },
  processingRow: {
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  processingText: {
    color: Colors.primary,
    fontSize: Typography.size.sm,
    fontWeight: Typography.weight.medium,
  },
  keypad: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: Spacing['2xl'],
    paddingBottom: Spacing.xl,
  },
  keyRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.sm,
  },
  key: {
    width: 72,
    height: 64,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.offWhite,
  },
  keyEmpty: {
    width: 72,
    height: 64,
  },
  keyText: {
    fontSize: Typography.size['2xl'],
    fontWeight: Typography.weight.medium,
    color: Colors.textPrimary,
  },
  forgotPin: {
    textAlign: 'center',
    color: Colors.primary,
    fontSize: Typography.size.sm,
    fontWeight: Typography.weight.semibold,
    paddingBottom: Spacing['2xl'],
  },
});
