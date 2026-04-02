import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, TextInput, Modal, ActivityIndicator, Alert } from 'react-native';
import { Send, Gift, Smartphone, ScrollText, CreditCard, ArrowLeft, Lock, Eye, EyeOff, ShieldCheck, IndianRupee, TrendingUp, TrendingDown } from 'lucide-react-native';
import { PAYTM_BLUE, PAYTM_LIGHT_BLUE, WHITE, fonts, DARK_BACKGROUND, DARK_SURFACE, DARK_TEXT, DARK_TEXT_MUTED } from '../styles/theme';

interface HistoryScreenProps {
  transactions: any[];
  isDarkMode?: boolean;
  onBack?: () => void;
  token?: string | null;
  backendUrl?: string;
}

export const HistoryScreen: React.FC<HistoryScreenProps> = ({ transactions, isDarkMode = false, onBack, token, backendUrl }) => {
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(true);
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [verifiedBalance, setVerifiedBalance] = useState<number | null>(null);
  const [verifiedName, setVerifiedName] = useState('');
  const [verifiedUpi, setVerifiedUpi] = useState('');

  const getCategoryIcon = (cat: string) => {
    switch (cat) {
      case 'Transfer': return <Send size={22} color={PAYTM_LIGHT_BLUE} />;
      case 'Cashback': return <Gift size={22} color="#21C17C" />;
      case 'Recharge': return <Smartphone size={22} color="#FF9800" />;
      case 'Bill Payment': return <ScrollText size={22} color="#9C27B0" />;
      default: return <CreditCard size={22} color="#555" />;
    }
  };

  const bg = isDarkMode ? '#121212' : '#F5F7FA';
  const surface = isDarkMode ? '#1E1E1E' : WHITE;
  const text = isDarkMode ? DARK_TEXT : '#111';
  const textMuted = isDarkMode ? DARK_TEXT_MUTED : '#666';
  const subtleIconBg = isDarkMode ? '#1A67B8' : '#F5F7FA';

  const handleVerify = async () => {
    if (!password || !token || !backendUrl) return;
    setVerifying(true);
    try {
      const res = await fetch(`${backendUrl}/auth/verify-password`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Bypass-Tunnel-Reminder': 'true',
        },
        body: JSON.stringify({ password }),
      });
      const rawText = await res.text();
      let data: any;
      try { data = JSON.parse(rawText); } catch { throw new Error('Server returned an invalid response. Please try again.'); }
      if (!res.ok) throw new Error(data.detail || 'Verification failed');
      setVerifiedBalance(data.balance);
      setVerifiedName(data.name || '');
      setVerifiedUpi(data.upi_id || '');
      setIsUnlocked(true);
      setShowPasswordModal(false);
    } catch (e: any) {
      Alert.alert('Verification Failed', e.message);
    }
    setVerifying(false);
  };

  // Total sent & received
  const totalSent = transactions.filter(t => t.type === 'sent').reduce((a, t) => a + t.amount, 0);
  const totalReceived = transactions.filter(t => t.type === 'received').reduce((a, t) => a + t.amount, 0);

  return (
    <View style={[s.screen, { backgroundColor: bg }]}>
      {/* Header */}
      <View style={[s.pageHeader, { backgroundColor: bg }]}>
        {onBack && <TouchableOpacity onPress={onBack} style={s.backBtn}><ArrowLeft size={24} color={text} /></TouchableOpacity>}
        <Text style={[s.pageTitle, { color: text }]}>Balance & History</Text>
        <View style={{ width: 40 }} />
      </View>

      {isUnlocked ? (
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 120 }}>
          {/* ─── Balance Card ─── */}
          <View style={[s.balanceCard, { backgroundColor: isDarkMode ? PAYTM_LIGHT_BLUE : PAYTM_BLUE }]}>
            <View style={s.balanceCardHeader}>
              <View style={s.balanceLockBadge}>
                <ShieldCheck size={14} color="#21C17C" />
                <Text style={s.balanceBadgeText}>Verified</Text>
              </View>
              <Text style={s.balanceName}>{verifiedName}</Text>
            </View>
            <Text style={s.balanceLabel}>Available Balance</Text>
            <Text style={s.balanceAmount}>₹{(verifiedBalance ?? 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</Text>
            <Text style={s.balanceUpi}>{verifiedUpi}</Text>

            {/* Mini Stats */}
            <View style={s.miniStatsRow}>
              <View style={s.miniStat}>
                <TrendingDown size={16} color="#FF6B6B" />
                <Text style={s.miniStatLabel}>Sent</Text>
                <Text style={s.miniStatValue}>₹{totalSent.toLocaleString('en-IN')}</Text>
              </View>
              <View style={[s.miniStatDivider]} />
              <View style={s.miniStat}>
                <TrendingUp size={16} color="#21C17C" />
                <Text style={s.miniStatLabel}>Received</Text>
                <Text style={s.miniStatValue}>₹{totalReceived.toLocaleString('en-IN')}</Text>
              </View>
            </View>
          </View>

          {/* ─── Transactions List ─── */}
          <View style={s.txSection}>
            <Text style={[s.txSectionTitle, { color: text }]}>Transaction History</Text>
            {transactions.length === 0 ? (
              <View style={[s.emptyState, { backgroundColor: surface }]}>
                <CreditCard size={40} color={textMuted} />
                <Text style={[s.emptyText, { color: textMuted }]}>No transactions yet</Text>
              </View>
            ) : (
              transactions.map((t, i) => (
                <View key={i} style={[s.txCard, { backgroundColor: surface }]}>
                  <View style={[s.txIconWrapper, { backgroundColor: subtleIconBg }]}>{getCategoryIcon(t.category)}</View>
                  <View style={s.txInfo}>
                    <Text style={[s.txRecipient, { color: text }]}>{t.recipient}</Text>
                    <Text style={[s.txMemo, { color: textMuted }]}>{t.memo}</Text>
                    <Text style={[s.txTime, { color: isDarkMode ? '#555' : '#BBB' }]}>{t.timestamp}</Text>
                  </View>
                  <View style={s.txAmountCol}>
                    <Text style={[s.txAmount, { color: t.type === 'received' ? '#21C17C' : '#FF6B6B' }]}>
                      {t.type === 'received' ? '+' : '-'}₹{t.amount}
                    </Text>
                    <Text style={[s.txStatus, { color: t.status === 'completed' ? '#21C17C' : textMuted }]}>
                      {t.status === 'completed' ? '✓ Done' : t.status}
                    </Text>
                  </View>
                </View>
              ))
            )}
          </View>
        </ScrollView>
      ) : (
        /* ─── Locked State ─── */
        <View style={s.lockedContainer}>
          <View style={[s.lockedCard, { backgroundColor: surface }]}>
            <View style={[s.lockedIconCircle, { backgroundColor: isDarkMode ? 'rgba(255,255,255,0.1)' : '#EBF8FF' }]}>
              <Lock size={40} color={isDarkMode ? PAYTM_LIGHT_BLUE : PAYTM_BLUE} />
            </View>
            <Text style={[s.lockedTitle, { color: text }]}>Balance is Protected</Text>
            <Text style={[s.lockedSubtitle, { color: textMuted }]}>Enter your password to view your{'\n'}account balance and transaction history</Text>
            <TouchableOpacity
              style={[s.unlockBtn, { backgroundColor: isDarkMode ? PAYTM_LIGHT_BLUE : PAYTM_BLUE }]}
              onPress={() => { setPassword(''); setShowPasswordModal(true); }}
            >
              <Lock size={18} color={WHITE} style={{ marginRight: 8 }} />
              <Text style={s.unlockBtnText}>Unlock with Password</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* ─── Password Modal ─── */}
      <Modal visible={showPasswordModal} transparent animationType="slide">
        <View style={s.modalOverlay}>
          <View style={[s.modalContainer, { backgroundColor: isDarkMode ? '#1E1E1E' : WHITE }]}>
            <View style={s.modalHandle} />
            <View style={[s.modalLockCircle, { backgroundColor: isDarkMode ? 'rgba(255,255,255,0.1)' : '#EBF8FF' }]}>
              <Lock size={32} color={isDarkMode ? PAYTM_LIGHT_BLUE : PAYTM_BLUE} />
            </View>
            <Text style={[s.modalTitle, { color: text }]}>Verify Identity</Text>
            <Text style={[s.modalSubtitle, { color: textMuted }]}>Enter your account password to access balance & transaction history</Text>

            <View style={[s.passwordRow, { borderColor: isDarkMode ? '#444' : '#DDD', backgroundColor: isDarkMode ? '#121212' : '#F9FAFB' }]}>
              <Lock size={18} color={textMuted} style={{ marginRight: 12 }} />
              <TextInput
                style={[s.passwordInput, { color: text }]}
                placeholder="Enter your password"
                placeholderTextColor={isDarkMode ? '#555' : '#AAA'}
                secureTextEntry={!showPassword}
                value={password}
                onChangeText={setPassword}
                autoFocus
              />
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={s.eyeBtn}>
                {showPassword ? <EyeOff size={20} color={textMuted} /> : <Eye size={20} color={textMuted} />}
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={[s.verifyBtn, { backgroundColor: isDarkMode ? PAYTM_LIGHT_BLUE : PAYTM_BLUE }, !password && { backgroundColor: '#A0AEC0' }]}
              onPress={handleVerify}
              disabled={!password || verifying}
            >
              {verifying ? (
                <ActivityIndicator color={WHITE} size="small" />
              ) : (
                <>
                  <ShieldCheck size={20} color={WHITE} style={{ marginRight: 8 }} />
                  <Text style={s.verifyBtnText}>Verify & View Balance</Text>
                </>
              )}
            </TouchableOpacity>

            <TouchableOpacity onPress={() => { setShowPasswordModal(false); if (!isUnlocked && onBack) onBack(); }} style={s.cancelLink}>
              <Text style={[s.cancelText, { color: textMuted }]}>Cancel</Text>
            </TouchableOpacity>

            <View style={s.modalSecurityRow}>
              <ShieldCheck size={12} color="#21C17C" />
              <Text style={[s.modalSecurityText, { color: textMuted }]}>End-to-end encrypted by Paytm VoiceGuard</Text>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const s = StyleSheet.create({
  screen: { flex: 1 },
  pageHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 16 },
  backBtn: { padding: 8 },
  pageTitle: { fontSize: 18, fontFamily: fonts.bold },

  // ─── Balance Card ───
  balanceCard: { marginHorizontal: 16, borderRadius: 20, padding: 24, marginBottom: 24, elevation: 0 },
  balanceCardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  balanceLockBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(33,193,124,0.15)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  balanceBadgeText: { color: '#21C17C', fontSize: 11, fontFamily: fonts.bold, marginLeft: 4 },
  balanceName: { color: 'rgba(255,255,255,0.8)', fontSize: 13, fontFamily: fonts.semiBold },
  balanceLabel: { color: 'rgba(255,255,255,0.6)', fontSize: 13, fontFamily: fonts.medium, marginBottom: 4 },
  balanceAmount: { color: WHITE, fontSize: 38, fontFamily: fonts.bold, marginBottom: 4 },
  balanceUpi: { color: 'rgba(255,255,255,0.5)', fontSize: 12, fontFamily: fonts.medium, marginBottom: 20 },

  miniStatsRow: { flexDirection: 'row', backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 14, paddingVertical: 14, paddingHorizontal: 16 },
  miniStat: { flex: 1, alignItems: 'center' },
  miniStatDivider: { width: 1, backgroundColor: 'rgba(255,255,255,0.2)', marginHorizontal: 8 },
  miniStatLabel: { color: 'rgba(255,255,255,0.6)', fontSize: 11, fontFamily: fonts.medium, marginTop: 4 },
  miniStatValue: { color: WHITE, fontSize: 14, fontFamily: fonts.bold, marginTop: 2 },

  // ─── Transaction List ───
  txSection: { paddingHorizontal: 16 },
  txSectionTitle: { fontSize: 16, fontFamily: fonts.bold, marginBottom: 14 },
  txCard: { padding: 16, marginBottom: 10, borderRadius: 16, flexDirection: 'row', alignItems: 'center', elevation: 0 },
  txIconWrapper: { width: 42, height: 42, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginRight: 14 },
  txInfo: { flex: 1 },
  txRecipient: { fontSize: 14, fontFamily: fonts.bold },
  txMemo: { fontSize: 11, fontFamily: fonts.medium, marginTop: 2 },
  txTime: { fontSize: 10, fontFamily: fonts.regular, marginTop: 4 },
  txAmountCol: { alignItems: 'flex-end' },
  txAmount: { fontSize: 14, fontFamily: fonts.bold },
  txStatus: { fontSize: 10, fontFamily: fonts.medium, marginTop: 4 },
  emptyState: { padding: 40, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  emptyText: { fontSize: 14, fontFamily: fonts.medium, marginTop: 12 },

  // ─── Locked State ───
  lockedContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 24 },
  lockedCard: { width: '100%', borderRadius: 24, padding: 36, alignItems: 'center', elevation: 0 },
  lockedIconCircle: { width: 88, height: 88, borderRadius: 44, justifyContent: 'center', alignItems: 'center', marginBottom: 20 },
  lockedTitle: { fontSize: 20, fontFamily: fonts.bold, marginBottom: 8 },
  lockedSubtitle: { fontSize: 13, fontFamily: fonts.medium, textAlign: 'center', lineHeight: 20, marginBottom: 28 },
  unlockBtn: { flexDirection: 'row', backgroundColor: PAYTM_BLUE, paddingVertical: 16, paddingHorizontal: 32, borderRadius: 16, alignItems: 'center', elevation: 0 },
  unlockBtnText: { color: WHITE, fontSize: 15, fontFamily: fonts.bold },

  // ─── Modal ───
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.55)', justifyContent: 'flex-end' },
  modalContainer: { borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 28, paddingBottom: 40, alignItems: 'center' },
  modalHandle: { width: 40, height: 4, backgroundColor: '#DDD', borderRadius: 2, marginBottom: 20 },
  modalLockCircle: { width: 68, height: 68, borderRadius: 34, justifyContent: 'center', alignItems: 'center', marginBottom: 18 },
  modalTitle: { fontSize: 20, fontFamily: fonts.bold, marginBottom: 8 },
  modalSubtitle: { fontSize: 13, fontFamily: fonts.medium, textAlign: 'center', lineHeight: 20, marginBottom: 24, paddingHorizontal: 10 },
  passwordRow: { flexDirection: 'row', alignItems: 'center', borderWidth: 1.5, borderRadius: 14, width: '100%', paddingHorizontal: 16, marginBottom: 20 },
  passwordInput: { flex: 1, fontSize: 16, fontFamily: fonts.medium, paddingVertical: 16 },
  eyeBtn: { padding: 8 },
  verifyBtn: { flexDirection: 'row', backgroundColor: PAYTM_BLUE, paddingVertical: 18, borderRadius: 16, alignItems: 'center', justifyContent: 'center', width: '100%', elevation: 0 },
  verifyBtnText: { color: WHITE, fontSize: 16, fontFamily: fonts.bold },
  cancelLink: { paddingVertical: 14 },
  cancelText: { fontSize: 14, fontFamily: fonts.semiBold },
  modalSecurityRow: { flexDirection: 'row', alignItems: 'center', marginTop: 8 },
  modalSecurityText: { fontSize: 11, fontFamily: fonts.medium, marginLeft: 6 },
});
