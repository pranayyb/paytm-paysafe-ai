import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View, ActivityIndicator, TouchableOpacity } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { api, type TrustScoreResponse } from '@services/api';
import { Colors, Typography, Spacing } from '@theme';

interface Props {
  upiId: string;
}

const LEVEL_CONFIG = {
  LOW: { color: Colors.success, icon: 'shield-check', bg: '#E8F5E9' },
  MEDIUM: { color: Colors.warning, icon: 'shield-alert-outline', bg: '#FFF3E0' },
  HIGH: { color: '#FF5722', icon: 'shield-alert', bg: '#FBE9E7' },
  CRITICAL: { color: Colors.error, icon: 'shield-off', bg: '#FFEBEE' },
} as const;

export default function TrustBadge({ upiId }: Props) {
  const [data, setData] = useState<TrustScoreResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!upiId) return;
    let cancelled = false;

    const timer = setTimeout(async () => {
      setLoading(true);
      setError(false);
      try {
        const result = await api.trust.getScore(upiId);
        if (!cancelled) setData(result);
      } catch {
        if (!cancelled) setError(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }, 600);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [upiId]);

  if (loading) {
    return (
      <View style={styles.loadingRow}>
        <ActivityIndicator size="small" color={Colors.primary} />
        <Text style={styles.loadingText}>Checking trust score...</Text>
      </View>
    );
  }

  if (error || !data) return null;

  const level = data.risk_level in LEVEL_CONFIG
    ? data.risk_level as keyof typeof LEVEL_CONFIG
    : 'MEDIUM';
  const cfg = LEVEL_CONFIG[level];

  return (
    <TouchableOpacity
      style={[styles.badge, { backgroundColor: cfg.bg, borderColor: cfg.color + '50' }]}
      onPress={() => setExpanded((e) => !e)}
      activeOpacity={0.8}>
      <View style={styles.badgeRow}>
        <Icon name={cfg.icon} size={16} color={cfg.color} />
        <Text style={[styles.badgeScore, { color: cfg.color }]}>
          Trust Score: {data.trust_score}/100
        </Text>
        <Text style={[styles.badgeLevel, { color: cfg.color }]}>{data.risk_level} RISK</Text>
        <Icon name={expanded ? 'chevron-up' : 'chevron-down'} size={14} color={cfg.color} />
      </View>

      {expanded && (
        <View style={styles.details}>
          <DetailItem label="Account age" value={`${data.account_age_days} days`} />
          <DetailItem label="Transactions" value={`${data.total_transactions}`} />
          <DetailItem
            label="Complaints"
            value={`${data.complaint_count}`}
            valueColor={data.complaint_count > 0 ? Colors.error : Colors.success}
          />
          <DetailItem
            label="Disputes"
            value={`${data.dispute_count}`}
            valueColor={data.dispute_count > 0 ? Colors.warning : Colors.success}
          />
        </View>
      )}
    </TouchableOpacity>
  );
}

function DetailItem({
  label,
  value,
  valueColor,
}: { label: string; value: string; valueColor?: string }) {
  return (
    <View style={styles.detailRow}>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={[styles.detailValue, valueColor ? { color: valueColor } : null]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
    paddingHorizontal: Spacing.xs,
  },
  loadingText: {
    fontSize: Typography.size.xs,
    color: Colors.textSecondary,
  },
  badge: {
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  badgeScore: {
    flex: 1,
    fontSize: Typography.size.sm,
    fontWeight: Typography.weight.semibold,
  },
  badgeLevel: {
    fontSize: Typography.size.xs,
    fontWeight: Typography.weight.bold,
  },
  details: {
    marginTop: Spacing.sm,
    paddingTop: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.08)',
    gap: Spacing.xs,
  },
  detailRow: { flexDirection: 'row', justifyContent: 'space-between' },
  detailLabel: { fontSize: Typography.size.xs, color: Colors.textSecondary },
  detailValue: { fontSize: Typography.size.xs, fontWeight: Typography.weight.semibold, color: Colors.textPrimary },
});
