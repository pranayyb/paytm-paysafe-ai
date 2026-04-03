import React, { useEffect, useState, useCallback } from 'react';
import {
  StyleSheet, Text, View, TouchableOpacity,
  StatusBar, ScrollView, ActivityIndicator,
  RefreshControl, Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { MerchantStackParamList } from '@navigation/types';
import { Colors, Typography, Spacing } from '@theme';
import { api, type MerchantInsightsResponse, type MerchantAnomalyResponse } from '@services/api';
import { useAuthStore } from '@store/authStore';
import { useUserStore } from '@store/userStore';

type Period = 'day' | 'week' | 'month';
type Nav = NativeStackNavigationProp<MerchantStackParamList>;

// Merchant UPI derived from phone — in production this comes from auth context
function useMerchantId() {
  const phone = useAuthStore((s) => s.phone) ?? '9999999999';
  return `${phone}@paytm`;
}

export default function MerchantDashboardScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<Nav>();
  const { name } = useUserStore();
  const merchantId = useMerchantId();
  const phone = useAuthStore((s) => s.phone) ?? '9999999999';

  const [period, setPeriod] = useState<Period>('day');
  const [insights, setInsights] = useState<MerchantInsightsResponse | null>(null);
  const [anomalies, setAnomalies] = useState<MerchantAnomalyResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [reportLoading, setReportLoading] = useState(false);

  const fetchData = useCallback(async (p: Period = period) => {
    try {
      const [ins, anom] = await Promise.all([
        api.merchant.getInsights(merchantId, p),
        api.merchant.getAnomalies(merchantId),
      ]);
      setInsights(ins);
      setAnomalies(anom);
    } catch {
      // silently handle — show cached state
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [merchantId, period]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handlePeriodChange = (p: Period) => {
    setPeriod(p);
    fetchData(p);
  };

  const handleSendReport = async () => {
    setReportLoading(true);
    try {
      await api.merchant.sendReport(merchantId, phone);
      Alert.alert('Report Sent', 'Daily report has been sent to your WhatsApp!');
    } catch {
      Alert.alert('Error', 'Could not send report. Please try again.');
    } finally {
      setReportLoading(false);
    }
  };

  const maxBarCount = insights?.hourly_heatmap
    ? Math.max(...insights.hourly_heatmap.map((h) => h.transactions), 1)
    : 1;

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.primaryDark} />

      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Welcome back,</Text>
          <Text style={styles.merchantName}>{insights?.merchant?.name || name}</Text>
        </View>
        <TouchableOpacity
          style={styles.voiceQueryBtn}
          onPress={() => navigation.navigate('MerchantVoiceQuery')}>
          <Icon name="microphone" size={20} color={Colors.white} />
        </TouchableOpacity>
      </View>

      {/* Anomaly banner */}
      {anomalies?.has_anomalies && (
        <View style={styles.anomalyBanner}>
          <Icon name="alert" size={16} color={Colors.white} />
          <Text style={styles.anomalyBannerText}>
            {anomalies.anomalies.length} anomal{anomalies.anomalies.length > 1 ? 'ies' : 'y'} detected
          </Text>
        </View>
      )}

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => { setRefreshing(true); fetchData(); }}
            colors={[Colors.primary]}
          />
        }>
        {/* Period selector */}
        <View style={styles.periodRow}>
          {(['day', 'week', 'month'] as Period[]).map((p) => (
            <TouchableOpacity
              key={p}
              style={[styles.periodBtn, period === p && styles.periodBtnActive]}
              onPress={() => handlePeriodChange(p)}>
              <Text style={[styles.periodText, period === p && styles.periodTextActive]}>
                {p.charAt(0).toUpperCase() + p.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {loading ? (
          <View style={styles.loadingState}>
            <ActivityIndicator size="large" color={Colors.primary} />
            <Text style={styles.loadingText}>Loading insights...</Text>
          </View>
        ) : insights ? (
          <>
            {/* Revenue cards */}
            <View style={styles.metricsRow}>
              <MetricCard
                icon="currency-inr"
                label="Revenue"
                value={`₹${insights.revenue.this_period.toLocaleString('en-IN')}`}
                color={Colors.success}
              />
              <MetricCard
                icon="swap-horizontal"
                label="Transactions"
                value={String(insights.revenue.total_transactions)}
                color={Colors.primary}
              />
            </View>
            <View style={styles.metricsRow}>
              <MetricCard
                icon="account-group"
                label="Total Customers"
                value={String(insights.customers.total)}
                color={Colors.primaryMid}
              />
              <MetricCard
                icon="shield-alert-outline"
                label="Risk Tier"
                value={insights.risk_assessment?.risk_tier || '🟢 LOW'}
                color={insights.risk_assessment?.risk_tier?.includes("CRITICAL") ? Colors.error : Colors.success}
              />
            </View>

            {/* Peak hours chart */}
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Daily Heatmap</Text>
              <View style={styles.barChart}>
                {insights.hourly_heatmap.filter((_, i) => i % 2 === 0).slice(0, 12).map((h, i) => (
                  <View key={i} style={styles.barGroup}>
                    <View style={styles.barTrack}>
                      <View
                        style={[
                          styles.bar,
                          { height: Math.max(4, (h.transactions / maxBarCount) * 60) },
                        ]}
                      />
                    </View>
                    <Text style={styles.barLabel}>{h.hour.split(':')[0]}</Text>
                  </View>
                ))}
              </View>
            </View>

            {/* Anomalies */}
            {anomalies?.has_anomalies && (
              <View style={[styles.card, styles.anomalyCard]}>
                <View style={styles.cardTitleRow}>
                  <Icon name="alert-circle" size={18} color={Colors.error} />
                  <Text style={[styles.cardTitle, { color: Colors.error }]}>Anomalies Detected</Text>
                </View>
                {anomalies.anomalies.map((a, i) => (
                  <View key={i} style={styles.anomalyItem}>
                    <View style={[styles.severityDot, {
                      backgroundColor: a.severity === 'HIGH' ? Colors.error : Colors.warning,
                    }]} />
                    <View style={styles.anomalyText}>
                      <Text style={styles.anomalyType}>{a.type}</Text>
                      <Text style={styles.anomalyDesc}>{a.description}</Text>
                    </View>
                  </View>
                ))}
              </View>
            )}

            {/* AI recommendations */}
            {insights.recommendations.length > 0 && (
              <View style={styles.card}>
                <View style={styles.cardTitleRow}>
                  <Icon name="robot-outline" size={18} color={Colors.primaryMid} />
                  <Text style={styles.cardTitle}>AI Recommendations</Text>
                </View>
                {insights.recommendations.map((rec, i) => (
                  <View key={i} style={styles.recItem}>
                    <Icon name="lightbulb-outline" size={14} color={Colors.warning} />
                    <Text style={styles.recText}>{rec}</Text>
                  </View>
                ))}
              </View>
            )}
          </>
        ) : (
          <View style={styles.emptyState}>
            <Icon name="chart-bar-stacked" size={64} color={Colors.border} />
            <Text style={styles.emptyTitle}>No data available</Text>
            <Text style={styles.emptyDesc}>Pull to refresh or check your connection</Text>
          </View>
        )}

        <View style={styles.bottomPad} />
      </ScrollView>

      {/* Send Report FAB */}
      <TouchableOpacity
        style={styles.reportBtn}
        onPress={handleSendReport}
        disabled={reportLoading}
        activeOpacity={0.85}>
        {reportLoading ? (
          <ActivityIndicator color={Colors.white} size="small" />
        ) : (
          <>
            <Icon name="whatsapp" size={20} color={Colors.white} />
            <Text style={styles.reportBtnText}>Send Report</Text>
          </>
        )}
      </TouchableOpacity>
    </View>
  );
}

function MetricCard({
  icon, label, value, color,
}: { icon: string; label: string; value: string; color: string }) {
  return (
    <View style={[styles.metricCard, { borderLeftColor: color }]}>
      <Icon name={icon} size={20} color={color} />
      <Text style={styles.metricValue}>{value}</Text>
      <Text style={styles.metricLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.offWhite },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: Colors.primaryDark, paddingHorizontal: Spacing.base, paddingVertical: Spacing.base,
  },
  greeting: { fontSize: Typography.size.sm, color: Colors.white, opacity: 0.8 },
  merchantName: { fontSize: Typography.size.lg, fontWeight: Typography.weight.bold, color: Colors.white },
  voiceQueryBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center',
  },
  anomalyBanner: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.sm,
    backgroundColor: Colors.error, paddingHorizontal: Spacing.base, paddingVertical: Spacing.sm,
  },
  anomalyBannerText: { color: Colors.white, fontSize: Typography.size.sm, fontWeight: Typography.weight.semibold },
  periodRow: {
    flexDirection: 'row', backgroundColor: Colors.white,
    margin: Spacing.base, borderRadius: 12, padding: 4, gap: 4,
    elevation: 1, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2,
  },
  periodBtn: { flex: 1, paddingVertical: Spacing.sm, borderRadius: 10, alignItems: 'center' },
  periodBtnActive: { backgroundColor: Colors.primaryDark },
  periodText: { fontSize: Typography.size.sm, fontWeight: Typography.weight.medium, color: Colors.textSecondary },
  periodTextActive: { color: Colors.white },
  loadingState: { alignItems: 'center', paddingTop: Spacing['3xl'], gap: Spacing.base },
  loadingText: { fontSize: Typography.size.sm, color: Colors.textSecondary },
  metricsRow: { flexDirection: 'row', marginHorizontal: Spacing.base, gap: Spacing.base, marginBottom: Spacing.base },
  metricCard: {
    flex: 1, backgroundColor: Colors.white, borderRadius: 14, padding: Spacing.base,
    borderLeftWidth: 4, gap: 4, elevation: 1,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2,
  },
  metricValue: { fontSize: Typography.size.xl, fontWeight: Typography.weight.extrabold, color: Colors.textPrimary },
  metricLabel: { fontSize: Typography.size.xs, color: Colors.textSecondary },
  card: {
    backgroundColor: Colors.white, borderRadius: 14, padding: Spacing.base,
    marginHorizontal: Spacing.base, marginBottom: Spacing.base,
    elevation: 1, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2,
  },
  anomalyCard: { borderWidth: 1.5, borderColor: Colors.error + '40' },
  cardTitle: { fontSize: Typography.size.base, fontWeight: Typography.weight.bold, color: Colors.textPrimary, marginBottom: Spacing.sm },
  cardTitleRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginBottom: Spacing.sm },
  barChart: { flexDirection: 'row', alignItems: 'flex-end', gap: 4, height: 80 },
  barGroup: { flex: 1, alignItems: 'center', gap: 4 },
  barTrack: { flex: 1, justifyContent: 'flex-end', width: '100%' },
  bar: { backgroundColor: Colors.primary, borderRadius: 3, width: '100%', opacity: 0.85 },
  barLabel: { fontSize: 9, color: Colors.textLight },
  anomalyItem: { flexDirection: 'row', gap: Spacing.sm, alignItems: 'flex-start', paddingVertical: Spacing.xs },
  severityDot: { width: 8, height: 8, borderRadius: 4, marginTop: 4 },
  anomalyText: { flex: 1 },
  anomalyType: { fontSize: Typography.size.sm, fontWeight: Typography.weight.semibold, color: Colors.textPrimary },
  anomalyDesc: { fontSize: Typography.size.xs, color: Colors.textSecondary, marginTop: 2, lineHeight: 18 },
  recItem: { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.sm, paddingVertical: Spacing.xs },
  recText: { flex: 1, fontSize: Typography.size.sm, color: Colors.textSecondary, lineHeight: 20 },
  emptyState: { alignItems: 'center', paddingTop: Spacing['3xl'], gap: Spacing.base },
  emptyTitle: { fontSize: Typography.size.xl, fontWeight: Typography.weight.bold, color: Colors.textSecondary },
  emptyDesc: { fontSize: Typography.size.sm, color: Colors.textLight, textAlign: 'center' },
  bottomPad: { height: 80 },
  reportBtn: {
    position: 'absolute', bottom: Spacing.xl, right: Spacing.base,
    flexDirection: 'row', alignItems: 'center', gap: Spacing.sm,
    backgroundColor: '#25D366', borderRadius: 28,
    paddingVertical: Spacing.base, paddingHorizontal: Spacing.lg,
    elevation: 6, shadowColor: '#25D366', shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.4, shadowRadius: 6,
  },
  reportBtnText: { color: Colors.white, fontSize: Typography.size.base, fontWeight: Typography.weight.bold },
});
