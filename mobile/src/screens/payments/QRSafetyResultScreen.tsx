import React, { useState } from 'react';
import {
  StyleSheet, Text, View, TouchableOpacity,
  StatusBar, ScrollView, ActivityIndicator,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { HomeStackParamList } from '@navigation/types';
import { Colors, Typography, Spacing } from '@theme';
import { api } from '@services/api';

type Props = NativeStackScreenProps<HomeStackParamList, 'QRSafetyResult'>;

const RISK_CONFIG = {
  SAFE: { color: Colors.success, icon: 'shield-check', label: 'Safe to Pay', bg: '#E8F5E9' },
  LOW: { color: '#8BC34A', icon: 'shield-outline', label: 'Low Risk', bg: '#F1F8E9' },
  MEDIUM: { color: Colors.warning, icon: 'shield-alert-outline', label: 'Caution', bg: '#FFF3E0' },
  HIGH: { color: '#FF5722', icon: 'shield-alert', label: 'High Risk', bg: '#FBE9E7' },
  CRITICAL: { color: Colors.error, icon: 'shield-off', label: 'Danger — Do Not Pay', bg: '#FFEBEE' },
} as const;

export default function QRSafetyResultScreen({ navigation, route }: Props) {
  const { upiId, recipientName, analysisResult: result } = route.params;
  const [feedbackSent, setFeedbackSent] = useState<'up' | 'down' | null>(null);
  const [feedbackLoading, setFeedbackLoading] = useState(false);

  const risk = result.risk_level in RISK_CONFIG
    ? result.risk_level as keyof typeof RISK_CONFIG
    : 'MEDIUM';
  const cfg = RISK_CONFIG[risk];
  const canProceed = risk === 'SAFE' || risk === 'LOW';

  const handleProceed = () => {
    navigation.navigate('SendMoney', { prefillUpi: upiId });
  };

  const sendFeedback = async (correct: boolean) => {
    if (feedbackSent || feedbackLoading) return;
    setFeedbackLoading(true);
    try {
      await api.feedback.submit(
        'qr_scan',
        { upi_id: upiId },
        correct,
        result.is_safe,
      );
      setFeedbackSent(correct ? 'up' : 'down');
    } catch {
      // feedback is best-effort
    } finally {
      setFeedbackLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.primaryDark} />

      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Icon name="arrow-left" size={24} color={Colors.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>QR Safety Check</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Safety badge */}
        <View style={[styles.badgeCard, { backgroundColor: cfg.bg, borderColor: cfg.color + '60' }]}>
          <Icon name={cfg.icon} size={52} color={cfg.color} />
          <Text style={[styles.badgeLabel, { color: cfg.color }]}>{cfg.label}</Text>
          <Text style={styles.trustScore}>Trust Score: {result.trust_score}/100</Text>
        </View>

        {/* Recipient info */}
        <View style={styles.infoCard}>
          <Row icon="account-outline" label="Recipient" value={recipientName} />
          <Divider />
          <Row icon="identifier" label="UPI ID" value={upiId} />
          <Divider />
          <Row icon="calendar-outline" label="Account Age" value={`${result.account_age_days} days`} />
          <Divider />
          <Row icon="alert-circle-outline" label="Complaints" value={`${result.complaint_count}`} valueColor={result.complaint_count > 0 ? Colors.error : Colors.success} />
        </View>

        {/* Hindi warning */}
        {result.warning_hindi ? (
          <View style={[styles.warningCard, { borderLeftColor: cfg.color }]}>
            <Icon name="translate" size={16} color={cfg.color} style={styles.warningIcon} />
            <Text style={[styles.warningText, { color: cfg.color }]}>{result.warning_hindi}</Text>
          </View>
        ) : null}

        {/* Risk factors */}
        {result.risk_factors.length > 0 && (
          <View style={styles.infoCard}>
            <Text style={styles.sectionTitle}>Risk Factors</Text>
            {result.risk_factors.map((factor, i) => (
              <View key={i} style={styles.riskRow}>
                <Icon name="alert-circle" size={14} color={Colors.warning} />
                <Text style={styles.riskText}>{factor}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Feedback */}
        <View style={styles.feedbackCard}>
          <Text style={styles.feedbackLabel}>Was this analysis helpful?</Text>
          <View style={styles.feedbackBtns}>
            {feedbackLoading ? (
              <ActivityIndicator size="small" color={Colors.primary} />
            ) : feedbackSent ? (
              <Text style={styles.feedbackThanks}>Thanks for your feedback!</Text>
            ) : (
              <>
                <TouchableOpacity style={styles.feedbackBtn} onPress={() => sendFeedback(true)}>
                  <Icon name="thumb-up-outline" size={20} color={Colors.success} />
                  <Text style={[styles.feedbackBtnText, { color: Colors.success }]}>Yes</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.feedbackBtn} onPress={() => sendFeedback(false)}>
                  <Icon name="thumb-down-outline" size={20} color={Colors.error} />
                  <Text style={[styles.feedbackBtnText, { color: Colors.error }]}>No</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      </ScrollView>

      {/* CTA */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.backQRBtn]}
          onPress={() => navigation.goBack()}
          activeOpacity={0.8}>
          <Text style={styles.backQRText}>Scan Again</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.proceedBtn, !canProceed && styles.proceedBtnDanger]}
          onPress={handleProceed}
          activeOpacity={0.8}>
          <Text style={styles.proceedText}>
            {canProceed ? 'Proceed to Pay' : 'Proceed Anyway'}
          </Text>
          <Icon name="arrow-right" size={18} color={Colors.white} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

function Row({
  icon, label, value, valueColor,
}: { icon: string; label: string; value: string; valueColor?: string }) {
  return (
    <View style={styles.infoRow}>
      <Icon name={icon} size={16} color={Colors.textSecondary} />
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={[styles.infoValue, valueColor ? { color: valueColor } : null]}>{value}</Text>
    </View>
  );
}

function Divider() {
  return <View style={styles.divider} />;
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.offWhite },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primaryDark,
    paddingHorizontal: Spacing.base,
    paddingTop: Spacing['3xl'],
    paddingBottom: Spacing.base,
  },
  backBtn: { padding: 4 },
  headerTitle: { flex: 1, textAlign: 'center', fontSize: Typography.size.lg, fontWeight: Typography.weight.bold, color: Colors.white },
  headerSpacer: { width: 32 },
  scroll: { padding: Spacing.base, gap: Spacing.base, paddingBottom: Spacing['2xl'] },
  badgeCard: {
    alignItems: 'center',
    borderRadius: 16,
    padding: Spacing.xl,
    gap: Spacing.sm,
    borderWidth: 1.5,
  },
  badgeLabel: { fontSize: Typography.size.xl, fontWeight: Typography.weight.bold },
  trustScore: { fontSize: Typography.size.md, color: Colors.textSecondary },
  infoCard: {
    backgroundColor: Colors.white,
    borderRadius: 14,
    padding: Spacing.base,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, paddingVertical: Spacing.sm },
  infoLabel: { flex: 1, fontSize: Typography.size.sm, color: Colors.textSecondary },
  infoValue: { fontSize: Typography.size.sm, fontWeight: Typography.weight.semibold, color: Colors.textPrimary },
  divider: { height: 1, backgroundColor: Colors.border },
  sectionTitle: { fontSize: Typography.size.sm, fontWeight: Typography.weight.semibold, color: Colors.textPrimary, marginBottom: Spacing.sm },
  riskRow: { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.sm, marginTop: Spacing.xs },
  riskText: { flex: 1, fontSize: Typography.size.sm, color: Colors.textSecondary },
  warningCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: Spacing.base,
    borderLeftWidth: 4,
    gap: Spacing.sm,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  warningIcon: { marginTop: 2 },
  warningText: { flex: 1, fontSize: Typography.size.sm, lineHeight: 20, fontWeight: Typography.weight.medium },
  feedbackCard: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: Spacing.base,
    alignItems: 'center',
    gap: Spacing.sm,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  feedbackLabel: { fontSize: Typography.size.sm, color: Colors.textSecondary },
  feedbackBtns: { flexDirection: 'row', gap: Spacing.xl },
  feedbackBtn: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs, paddingVertical: Spacing.sm, paddingHorizontal: Spacing.base },
  feedbackBtnText: { fontSize: Typography.size.sm, fontWeight: Typography.weight.semibold },
  feedbackThanks: { fontSize: Typography.size.sm, color: Colors.success, fontWeight: Typography.weight.medium },
  footer: {
    flexDirection: 'row',
    padding: Spacing.base,
    paddingBottom: Spacing.xl,
    gap: Spacing.sm,
    backgroundColor: Colors.white,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  backQRBtn: {
    flex: 1,
    paddingVertical: Spacing.base,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: Colors.border,
    alignItems: 'center',
  },
  backQRText: { fontSize: Typography.size.base, fontWeight: Typography.weight.semibold, color: Colors.textPrimary },
  proceedBtn: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.base,
    borderRadius: 12,
    backgroundColor: Colors.success,
    gap: Spacing.xs,
  },
  proceedBtnDanger: { backgroundColor: Colors.error },
  proceedText: { fontSize: Typography.size.base, fontWeight: Typography.weight.bold, color: Colors.white },
});
