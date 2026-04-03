import React, { useState } from 'react';
import {
  StyleSheet, Text, View, TouchableOpacity, TextInput,
  StatusBar, ScrollView, ActivityIndicator, KeyboardAvoidingView, Platform,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useNavigation } from '@react-navigation/native';
import { Colors, Typography, Spacing } from '@theme';
import { api, type ScamCheckResponse, type URLCheckResponse, type ScamPattern } from '@services/api';

type Tab = 'message' | 'url';

const SCAM_URGENCY_COLOR = {
  critical: Colors.error,
  high: '#FF5722',
  medium: Colors.warning,
  low: '#8BC34A',
} as const;

export default function ScamCheckerScreen() {
  const navigation = useNavigation();
  const [tab, setTab] = useState<Tab>('message');
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [scamResult, setScamResult] = useState<ScamCheckResponse | null>(null);
  const [urlResult, setUrlResult] = useState<URLCheckResponse | null>(null);
  const [patterns, setPatterns] = useState<ScamPattern[]>([]);
  const [showPatterns, setShowPatterns] = useState(false);
  const [patternsLoading, setPatternsLoading] = useState(false);
  const [feedbackSent, setFeedbackSent] = useState<'up' | 'down' | null>(null);

  const handleAnalyze = async () => {
    if (!input.trim()) return;
    setLoading(true);
    setScamResult(null);
    setUrlResult(null);
    setFeedbackSent(null);
    try {
      if (tab === 'message') {
        const res = await api.scam.checkMessage(input.trim());
        setScamResult(res);
      } else {
        const res = await api.url.check(input.trim());
        setUrlResult(res);
      }
    } catch (e: any) {
      // show nothing on error — user can retry
    } finally {
      setLoading(false);
    }
  };

  const loadPatterns = async () => {
    if (patterns.length > 0) { setShowPatterns((s) => !s); return; }
    setPatternsLoading(true);
    try {
      const res = await api.scam.getPatterns();
      setPatterns(res);
      setShowPatterns(true);
    } catch {}
    finally { setPatternsLoading(false); }
  };

  const sendFeedback = async (correct: boolean) => {
    if (feedbackSent) return;
    try {
      if (tab === 'message' && scamResult) {
        await api.feedback.submit('scam_check', { message: input }, correct, scamResult.is_scam);
      } else if (urlResult) {
        await api.feedback.submit('url_check', { url: input }, correct, urlResult.is_fraud);
      }
      setFeedbackSent(correct ? 'up' : 'down');
    } catch {}
  };

  const hasResult = scamResult !== null || urlResult !== null;

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.primaryDark} />

      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Icon name="arrow-left" size={24} color={Colors.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Scam Shield</Text>
        <View style={styles.headerSpacer} />
      </View>

      {/* Tabs */}
      <View style={styles.tabRow}>
        <TouchableOpacity
          style={[styles.tabBtn, tab === 'message' && styles.tabBtnActive]}
          onPress={() => { setTab('message'); setInput(''); setScamResult(null); setUrlResult(null); }}>
          <Icon name="message-text-outline" size={16} color={tab === 'message' ? Colors.white : Colors.textSecondary} />
          <Text style={[styles.tabText, tab === 'message' && styles.tabTextActive]}>Message</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tabBtn, tab === 'url' && styles.tabBtnActive]}
          onPress={() => { setTab('url'); setInput(''); setScamResult(null); setUrlResult(null); }}>
          <Icon name="link-variant" size={16} color={tab === 'url' ? Colors.white : Colors.textSecondary} />
          <Text style={[styles.tabText, tab === 'url' && styles.tabTextActive]}>URL</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        {/* Input */}
        <View style={styles.inputCard}>
          <Text style={styles.inputLabel}>
            {tab === 'message'
              ? 'Paste the suspicious message below'
              : 'Paste the suspicious URL below'}
          </Text>
          <TextInput
            style={[styles.textInput, tab === 'url' && styles.textInputUrl]}
            value={input}
            onChangeText={setInput}
            placeholder={
              tab === 'message'
                ? 'e.g. "Your KYC is expired, click here to update..."'
                : 'e.g. https://paytm-offers.xyz/claim'
            }
            placeholderTextColor={Colors.placeholder}
            multiline={tab === 'message'}
            numberOfLines={tab === 'message' ? 4 : 1}
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType={tab === 'url' ? 'url' : 'default'}
          />
          <TouchableOpacity
            style={[styles.analyzeBtn, !input.trim() && styles.analyzeBtnDisabled]}
            onPress={handleAnalyze}
            disabled={!input.trim() || loading}
            activeOpacity={0.8}>
            {loading ? (
              <ActivityIndicator color={Colors.white} size="small" />
            ) : (
              <>
                <Icon name="shield-search" size={18} color={Colors.white} />
                <Text style={styles.analyzeBtnText}>Analyze Now</Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        {/* Scam result */}
        {scamResult && <ScamResult result={scamResult} feedbackSent={feedbackSent} onFeedback={sendFeedback} />}

        {/* URL result */}
        {urlResult && <URLResult result={urlResult} feedbackSent={feedbackSent} onFeedback={sendFeedback} />}

        {/* Known patterns */}
        {tab === 'message' && (
          <TouchableOpacity style={styles.patternsToggle} onPress={loadPatterns} activeOpacity={0.8}>
            {patternsLoading ? (
              <ActivityIndicator size="small" color={Colors.primary} />
            ) : (
              <Icon name={showPatterns ? 'chevron-up' : 'chevron-down'} size={16} color={Colors.primary} />
            )}
            <Text style={styles.patternsToggleText}>
              {showPatterns ? 'Hide' : 'View'} known scam patterns
            </Text>
          </TouchableOpacity>
        )}

        {showPatterns && patterns.length > 0 && (
          <View style={styles.patternsCard}>
            <Text style={styles.patternsTitle}>Known Scam Patterns</Text>
            {patterns.map((p, i) => (
              <View key={i} style={styles.patternItem}>
                <View style={styles.patternHeader}>
                  <View style={[styles.urgencyDot, { backgroundColor: SCAM_URGENCY_COLOR[p.urgency_level] }]} />
                  <Text style={styles.patternType}>{p.type}</Text>
                  <Text style={[styles.urgencyLabel, { color: SCAM_URGENCY_COLOR[p.urgency_level] }]}>
                    {p.urgency_level.toUpperCase()}
                  </Text>
                </View>
                <Text style={styles.patternDesc}>{p.description}</Text>
              </View>
            ))}
          </View>
        )}

        {!hasResult && !loading && (
          <View style={styles.emptyState}>
            <Icon name="shield-outline" size={64} color={Colors.border} />
            <Text style={styles.emptyTitle}>Stay Safe Online</Text>
            <Text style={styles.emptyDesc}>
              Paste any suspicious message or URL to check if it's a scam
            </Text>
          </View>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function ScamResult({
  result,
  feedbackSent,
  onFeedback,
}: {
  result: ScamCheckResponse;
  feedbackSent: 'up' | 'down' | null;
  onFeedback: (correct: boolean) => void;
}) {
  const isScam = result.is_scam;
  const color = isScam ? Colors.error : Colors.success;
  const bg = isScam ? '#FFEBEE' : '#E8F5E9';
  const icon = isScam ? 'alert-circle' : 'check-circle';

  return (
    <View style={[styles.resultCard, { borderColor: color + '50' }]}>
      <View style={[styles.resultHeader, { backgroundColor: bg }]}>
        <Icon name={icon} size={28} color={color} />
        <View style={styles.resultHeaderText}>
          <Text style={[styles.resultTitle, { color }]}>
            {isScam ? 'SCAM DETECTED' : 'Looks Safe'}
          </Text>
          <Text style={styles.resultConfidence}>
            {result.confidence}% confidence
            {result.scam_type ? ` · ${result.scam_type}` : ''}
          </Text>
        </View>
      </View>

      {result.warning_hindi ? (
        <View style={[styles.hindiWarning, { borderLeftColor: color }]}>
          <Icon name="translate" size={14} color={color} />
          <Text style={[styles.hindiText, { color }]}>{result.warning_hindi}</Text>
        </View>
      ) : null}

      {result.matched_patterns.length > 0 && (
        <View style={styles.matchedPatterns}>
          <Text style={styles.matchedTitle}>Matched patterns:</Text>
          {result.matched_patterns.map((p, i) => (
            <Text key={i} style={styles.matchedItem}>· {p.type} ({p.confidence}%)</Text>
          ))}
        </View>
      )}

      <FeedbackRow feedbackSent={feedbackSent} onFeedback={onFeedback} />
    </View>
  );
}

function URLResult({
  result,
  feedbackSent,
  onFeedback,
}: {
  result: URLCheckResponse;
  feedbackSent: 'up' | 'down' | null;
  onFeedback: (correct: boolean) => void;
}) {
  const RISK_COLOR: Record<string, string> = {
    Safe: Colors.success,
    Low: '#8BC34A',
    Medium: Colors.warning,
    High: '#FF5722',
    Critical: Colors.error,
  };
  const color = RISK_COLOR[result.risk_level] ?? Colors.warning;
  const bg = result.is_fraud ? '#FFEBEE' : '#E8F5E9';

  return (
    <View style={[styles.resultCard, { borderColor: color + '50' }]}>
      <View style={[styles.resultHeader, { backgroundColor: bg }]}>
        <Icon name={result.is_fraud ? 'link-off' : 'link-variant-check'} size={28} color={color} />
        <View style={styles.resultHeaderText}>
          <Text style={[styles.resultTitle, { color }]}>{result.risk_level} Risk</Text>
          <Text style={styles.resultConfidence}>{result.confidence}% confidence</Text>
        </View>
      </View>

      {result.warning_hindi ? (
        <View style={[styles.hindiWarning, { borderLeftColor: color }]}>
          <Icon name="translate" size={14} color={color} />
          <Text style={[styles.hindiText, { color }]}>{result.warning_hindi}</Text>
        </View>
      ) : null}

      {result.risk_factors.length > 0 && (
        <View style={styles.matchedPatterns}>
          <Text style={styles.matchedTitle}>Risk factors:</Text>
          {result.risk_factors.map((f, i) => (
            <Text key={i} style={styles.matchedItem}>· {f}</Text>
          ))}
        </View>
      )}

      <FeedbackRow feedbackSent={feedbackSent} onFeedback={onFeedback} />
    </View>
  );
}

function FeedbackRow({
  feedbackSent,
  onFeedback,
}: { feedbackSent: 'up' | 'down' | null; onFeedback: (c: boolean) => void }) {
  return (
    <View style={styles.feedbackRow}>
      <Text style={styles.feedbackLabel}>Was this helpful?</Text>
      {feedbackSent ? (
        <Text style={styles.feedbackThanks}>Thanks!</Text>
      ) : (
        <>
          <TouchableOpacity onPress={() => onFeedback(true)} style={styles.fbBtn}>
            <Icon name="thumb-up-outline" size={16} color={Colors.success} />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => onFeedback(false)} style={styles.fbBtn}>
            <Icon name="thumb-down-outline" size={16} color={Colors.error} />
          </TouchableOpacity>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.offWhite },
  header: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.primaryDark,
    paddingHorizontal: Spacing.base, paddingTop: Spacing['3xl'], paddingBottom: Spacing.base,
  },
  backBtn: { padding: 4 },
  headerTitle: { flex: 1, textAlign: 'center', fontSize: Typography.size.lg, fontWeight: Typography.weight.bold, color: Colors.white },
  headerSpacer: { width: 32 },
  tabRow: {
    flexDirection: 'row', backgroundColor: Colors.white,
    paddingHorizontal: Spacing.base, paddingVertical: Spacing.sm,
    gap: Spacing.sm, borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  tabBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: Spacing.xs, paddingVertical: Spacing.sm, borderRadius: 10,
    borderWidth: 1, borderColor: Colors.border,
  },
  tabBtnActive: { backgroundColor: Colors.primaryDark, borderColor: Colors.primaryDark },
  tabText: { fontSize: Typography.size.sm, fontWeight: Typography.weight.medium, color: Colors.textSecondary },
  tabTextActive: { color: Colors.white },
  scroll: { padding: Spacing.base, gap: Spacing.base, paddingBottom: Spacing['2xl'] },
  inputCard: {
    backgroundColor: Colors.white, borderRadius: 14, padding: Spacing.base,
    gap: Spacing.base, elevation: 1, shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2,
  },
  inputLabel: { fontSize: Typography.size.sm, color: Colors.textSecondary, fontWeight: Typography.weight.medium },
  textInput: {
    backgroundColor: Colors.inputBg, borderRadius: 10, padding: Spacing.md,
    fontSize: Typography.size.sm, color: Colors.textPrimary,
    textAlignVertical: 'top', minHeight: 100,
  },
  textInputUrl: { minHeight: 48 },
  analyzeBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: Colors.primaryDark, borderRadius: 10,
    paddingVertical: Spacing.base, gap: Spacing.sm,
  },
  analyzeBtnDisabled: { opacity: 0.5 },
  analyzeBtnText: { color: Colors.white, fontSize: Typography.size.base, fontWeight: Typography.weight.bold },
  resultCard: {
    backgroundColor: Colors.white, borderRadius: 14, overflow: 'hidden',
    borderWidth: 1.5, elevation: 1, shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2,
  },
  resultHeader: { flexDirection: 'row', alignItems: 'center', padding: Spacing.base, gap: Spacing.base },
  resultHeaderText: { flex: 1 },
  resultTitle: { fontSize: Typography.size.lg, fontWeight: Typography.weight.bold },
  resultConfidence: { fontSize: Typography.size.xs, color: Colors.textSecondary, marginTop: 2 },
  hindiWarning: {
    flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.sm,
    padding: Spacing.base, borderLeftWidth: 4, backgroundColor: Colors.offWhite,
  },
  hindiText: { flex: 1, fontSize: Typography.size.sm, lineHeight: 20, fontWeight: Typography.weight.medium },
  matchedPatterns: { padding: Spacing.base, gap: Spacing.xs },
  matchedTitle: { fontSize: Typography.size.xs, color: Colors.textSecondary, fontWeight: Typography.weight.semibold, marginBottom: 2 },
  matchedItem: { fontSize: Typography.size.xs, color: Colors.textSecondary },
  feedbackRow: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.sm,
    padding: Spacing.sm, paddingHorizontal: Spacing.base,
    borderTopWidth: 1, borderTopColor: Colors.border,
  },
  feedbackLabel: { flex: 1, fontSize: Typography.size.xs, color: Colors.textSecondary },
  feedbackThanks: { fontSize: Typography.size.xs, color: Colors.success, fontWeight: Typography.weight.medium },
  fbBtn: { padding: Spacing.sm },
  patternsToggle: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, justifyContent: 'center',
    paddingVertical: Spacing.sm,
  },
  patternsToggleText: { fontSize: Typography.size.sm, color: Colors.primary, fontWeight: Typography.weight.medium },
  patternsCard: {
    backgroundColor: Colors.white, borderRadius: 14, padding: Spacing.base,
    gap: Spacing.sm, elevation: 1, shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2,
  },
  patternsTitle: { fontSize: Typography.size.base, fontWeight: Typography.weight.bold, color: Colors.textPrimary },
  patternItem: { gap: 4, paddingVertical: Spacing.sm, borderBottomWidth: 1, borderBottomColor: Colors.border },
  patternHeader: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  urgencyDot: { width: 8, height: 8, borderRadius: 4 },
  patternType: { flex: 1, fontSize: Typography.size.sm, fontWeight: Typography.weight.semibold, color: Colors.textPrimary },
  urgencyLabel: { fontSize: Typography.size.xs, fontWeight: Typography.weight.bold },
  patternDesc: { fontSize: Typography.size.xs, color: Colors.textSecondary, lineHeight: 18 },
  emptyState: { alignItems: 'center', paddingTop: Spacing['3xl'], gap: Spacing.base },
  emptyTitle: { fontSize: Typography.size.xl, fontWeight: Typography.weight.bold, color: Colors.textSecondary },
  emptyDesc: { fontSize: Typography.size.sm, color: Colors.textLight, textAlign: 'center', lineHeight: 22, paddingHorizontal: Spacing.xl },
});
