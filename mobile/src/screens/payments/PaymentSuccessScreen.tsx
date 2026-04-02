import React, { useEffect, useRef } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  StatusBar,
  Animated,
  Share,
} from 'react-native';
import LottieView from 'lottie-react-native';
import ReactNativeHapticFeedback from 'react-native-haptic-feedback';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { HomeStackParamList } from '@navigation/types';
import { Colors, Typography, Spacing } from '@theme';
import { formatAmount } from '@utils/formatCurrency';
import { formatRelativeDate } from '@utils/formatDate';

type Props = NativeStackScreenProps<HomeStackParamList, 'PaymentSuccess'>;

const HAPTIC_OPTIONS = { enableVibrateFallback: true, ignoreAndroidSystemSettings: false };

const TYPE_LABELS: Record<string, string> = {
  sent: 'Money Sent',
  recharge: 'Recharge Successful',
  bill: 'Bill Paid',
  addMoney: 'Money Added',
};

export default function PaymentSuccessScreen({ navigation, route }: Props) {
  const { amount, recipient, type, status, reference, upiId } = route.params;

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(40)).current;
  const lottieRef = useRef<LottieView>(null);

  const isSuccess = status === 'success';

  useEffect(() => {
    // Play lottie animation
    lottieRef.current?.play();

    // Haptic feedback on mount
    ReactNativeHapticFeedback.trigger(
      isSuccess ? 'notificationSuccess' : 'notificationError',
      HAPTIC_OPTIONS,
    );

    // Details fade+slide in after lottie starts
    setTimeout(() => {
      Animated.parallel([
        Animated.timing(fadeAnim, { toValue: 1, duration: 350, useNativeDriver: true }),
        Animated.timing(slideAnim, { toValue: 0, duration: 350, useNativeDriver: true }),
      ]).start();
    }, 500);
  }, []);

  const handleShare = async () => {
    await Share.share({
      message: `Paytm Payment Receipt\n${TYPE_LABELS[type] ?? 'Payment'}\nAmount: ₹${formatAmount(amount)}\nTo: ${recipient}\nRef: ${reference}\nDate: ${formatRelativeDate(Date.now())}`,
    });
  };

  const handleGoHome = () => {
    navigation.popToTop();
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.white} />

      <View style={styles.topSection}>
        {/* Lottie animation */}
        <LottieView
          ref={lottieRef}
          source={
            isSuccess
              ? require('@assets/animations/payment_success.json')
              : require('@assets/animations/payment_failure.json')
          }
          autoPlay={false}
          loop={false}
          style={styles.lottie}
        />

        <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
          <Text style={styles.statusTitle}>
            {isSuccess ? (TYPE_LABELS[type] ?? 'Payment Done') : 'Payment Failed'}
          </Text>
          <Text style={styles.amountText}>₹ {formatAmount(amount)}</Text>
          {!isSuccess && (
            <Text style={styles.failedSub}>
              Your money was not deducted. Please try again.
            </Text>
          )}
        </Animated.View>
      </View>

      {/* Receipt card */}
      <Animated.View
        style={[
          styles.receiptCard,
          { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
        ]}>
        <Row label="To" value={recipient} />
        {upiId ? <Row label="UPI ID" value={upiId} /> : null}
        <Row label="Transaction ID" value={reference} mono />
        <Row
          label="Date & Time"
          value={new Date().toLocaleString('en-IN', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
          })}
        />
        <Row label="Payment Method" value="Paytm Wallet" last />
      </Animated.View>

      {/* Cashback nudge (success only) */}
      {isSuccess && (
        <Animated.View style={[styles.cashbackBadge, { opacity: fadeAnim }]}>
          <Icon name="gift-outline" size={16} color={Colors.success} />
          <Text style={styles.cashbackText}>
            Cashback of ₹{Math.floor(amount * 0.02) || 1} will be credited in 24 hours
          </Text>
        </Animated.View>
      )}

      {/* Actions */}
      <Animated.View style={[styles.actions, { opacity: fadeAnim }]}>
        <TouchableOpacity style={styles.shareBtn} onPress={handleShare} activeOpacity={0.8}>
          <Icon name="share-variant" size={18} color={Colors.primary} />
          <Text style={styles.shareBtnText}>Share Receipt</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.homeBtn} onPress={handleGoHome} activeOpacity={0.8}>
          <Text style={styles.homeBtnText}>Go to Home</Text>
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
}

function Row({
  label,
  value,
  mono = false,
  last = false,
}: {
  label: string;
  value: string;
  mono?: boolean;
  last?: boolean;
}) {
  return (
    <View style={[rowStyles.row, !last && rowStyles.bordered]}>
      <Text style={rowStyles.label}>{label}</Text>
      <Text style={[rowStyles.value, mono && rowStyles.mono]} numberOfLines={1}>
        {value}
      </Text>
    </View>
  );
}

const rowStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.sm + 2,
  },
  bordered: {
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  label: {
    fontSize: Typography.size.sm,
    color: Colors.textSecondary,
  },
  value: {
    fontSize: Typography.size.sm,
    fontWeight: Typography.weight.semibold,
    color: Colors.textPrimary,
    maxWidth: '60%',
    textAlign: 'right',
  },
  mono: {
    fontFamily: 'monospace',
    fontSize: Typography.size.xs,
    letterSpacing: 0.5,
  },
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.offWhite,
    paddingHorizontal: Spacing.base,
    paddingTop: Spacing['3xl'],
  },
  topSection: {
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  lottie: {
    width: 160,
    height: 160,
  },
  statusTitle: {
    fontSize: Typography.size.xl,
    fontWeight: Typography.weight.bold,
    color: Colors.textPrimary,
    textAlign: 'center',
    marginBottom: Spacing.xs,
  },
  amountText: {
    fontSize: Typography.size['3xl'],
    fontWeight: Typography.weight.extrabold,
    color: Colors.textPrimary,
    textAlign: 'center',
    letterSpacing: -0.5,
  },
  failedSub: {
    fontSize: Typography.size.sm,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: Spacing.sm,
  },
  receiptCard: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: Spacing.base,
    marginBottom: Spacing.sm,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.07,
    shadowRadius: 4,
  },
  cashbackBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.success + '12',
    borderWidth: 1,
    borderColor: Colors.success + '40',
    borderRadius: 10,
    padding: Spacing.md,
    marginBottom: Spacing.lg,
  },
  cashbackText: {
    fontSize: Typography.size.sm,
    color: Colors.success,
    fontWeight: Typography.weight.medium,
    flex: 1,
  },
  actions: {
    gap: Spacing.sm,
    marginTop: 'auto',
    paddingBottom: Spacing['2xl'],
  },
  shareBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    borderWidth: 1.5,
    borderColor: Colors.primary,
    borderRadius: 12,
    paddingVertical: Spacing.base,
  },
  shareBtnText: {
    color: Colors.primary,
    fontSize: Typography.size.base,
    fontWeight: Typography.weight.semibold,
  },
  homeBtn: {
    backgroundColor: Colors.primary,
    borderRadius: 12,
    paddingVertical: Spacing.base,
    alignItems: 'center',
  },
  homeBtnText: {
    color: Colors.white,
    fontSize: Typography.size.base,
    fontWeight: Typography.weight.bold,
  },
});
