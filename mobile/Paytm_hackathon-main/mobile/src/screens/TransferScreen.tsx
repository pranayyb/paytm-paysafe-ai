import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform, ScrollView, Modal, ActivityIndicator } from 'react-native';
import { ArrowLeft, ShieldCheck, Lock, Eye, EyeOff, X, Mic, ChevronRight, Activity } from 'lucide-react-native';
import { PAYTM_BLUE, PAYTM_LIGHT_BLUE, PAYTM_DARK_THEME_LIGHT_BLUE, WHITE, fonts, DARK_BACKGROUND, DARK_SURFACE, DARK_TEXT, DARK_TEXT_MUTED, SUCCESS_GREEN, ERROR_RED } from '../styles/theme';

interface TransferScreenProps {
  onBack: () => void;
  onTransfer: (amount: number, recipient: string, password: string) => void;
  onVoicePay: (amount: number, recipient: string) => void;
  initialRecipient?: { id: string; name: string };
  isDarkMode?: boolean;
}

export const TransferScreen: React.FC<TransferScreenProps> = ({ onBack, onTransfer, onVoicePay, initialRecipient, isDarkMode = false }) => {
  const [recipient, setRecipient] = useState(initialRecipient?.id || '');
  const [recipientName] = useState(initialRecipient?.name || 'Unknown Recipient');
  const [amount, setAmount] = useState('');
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showAuthSelector, setShowAuthSelector] = useState(false);
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const bg = isDarkMode ? DARK_BACKGROUND : '#F5F7FA';
  const surface = isDarkMode ? DARK_SURFACE : WHITE;
  const text = isDarkMode ? DARK_TEXT : '#111';
  const textMuted = isDarkMode ? DARK_TEXT_MUTED : '#666';

  const handlePayPress = () => {
    if (!recipient || !amount) return;
    setShowAuthSelector(true);
  };

  const selectPasswordAuth = () => {
    setShowAuthSelector(false);
    setPassword('');
    setShowPasswordModal(true);
  };

  const selectVoiceAuth = async () => {
    setShowAuthSelector(false);
    setIsProcessing(true);
    try {
      await onVoicePay(parseFloat(amount), recipient);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleConfirmPayment = async () => {
    if (!password) return;
    setIsProcessing(true);
    try {
      // Small simulation delay to ensure the loader is seen if the network is too fast
      await new Promise(r => setTimeout(r, 600));
      await onTransfer(parseFloat(amount), recipient, password);
      setShowPasswordModal(false);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <View style={[s.container, { backgroundColor: bg }]}>
      <View style={[s.header, { backgroundColor: bg }]}>
        <TouchableOpacity onPress={onBack} style={s.backBtn}>
          <ArrowLeft size={24} color={text} />
        </TouchableOpacity>
        <Text style={[s.headerTitle, { color: text }]}>Transfer Money</Text>
        <View style={{ width: 40 }} />
      </View>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={s.scrollContent} keyboardShouldPersistTaps="handled">

          {/* Detailed Recipient Banner (Only if scanned) */}
          {initialRecipient ? (
            <View style={s.recipientBanner}>
              <View style={s.avatarBig}>
                <Text style={s.avatarBigText}>{(initialRecipient.name || 'U')[0].toUpperCase()}</Text>
              </View>
              <Text style={[s.recipientName, { color: text }]}>{initialRecipient.name}</Text>
              <Text style={[s.recipientId, { color: textMuted }]}>UPI ID: {initialRecipient.id}</Text>

              <View style={s.verifiedBadge}>
                <ShieldCheck size={14} color="#21C17C" style={{ marginRight: 4 }} />
                <Text style={s.verifiedText}>Verified Paytm User</Text>
              </View>
            </View>
          ) : (
            <View style={[s.inputGroup, { backgroundColor: surface }]}>
              <Text style={[s.label, { color: textMuted }]}>Send To (UPI ID / Mobile Number)</Text>
              <TextInput
                style={[s.input, { color: text, borderColor: isDarkMode ? '#333' : '#EEE' }]}
                placeholder="Enter recipient UPI ID"
                placeholderTextColor={isDarkMode ? '#666' : '#999'}
                value={recipient}
                onChangeText={setRecipient}
                autoCapitalize="none"
              />
            </View>
          )}

          {/* Amount Input */}
          <View style={s.amountContainer}>
            <Text style={[s.amountSymbol, { color: text }]}>₹</Text>
            <TextInput
              style={[s.amountInput, { color: text }]}
              placeholder="0"
              placeholderTextColor={isDarkMode ? '#333' : '#CCC'}
              value={amount}
              onChangeText={setAmount}
              keyboardType="numeric"
              autoFocus={!!initialRecipient}
            />
          </View>

          {amount ? (
            <Text style={[s.amountWords, { color: textMuted }]}>
              Rupees {amount} only
            </Text>
          ) : null}

        </ScrollView>

        {/* Sticky Pay Button */}
        <View style={[s.footer, { backgroundColor: bg, borderTopColor: isDarkMode ? '#333' : '#E0E0E0' }]}>
          <TouchableOpacity
            style={[s.payBtn, { backgroundColor: isDarkMode ? PAYTM_LIGHT_BLUE : PAYTM_BLUE }, (!recipient || !amount) && s.payBtnDisabled]}
            onPress={handlePayPress}
            disabled={!recipient || !amount}
          >
            <Text style={s.payBtnText}>Pay ₹{amount || '0'}</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>

      {/* ─── Authentication Method Selector Modal ─── */}
      <Modal visible={showAuthSelector} transparent animationType="fade">
        <View style={s.modalOverlay}>
          <View style={[s.modalContainer, { backgroundColor: isDarkMode ? '#1E1E1E' : WHITE }]}>
            <TouchableOpacity style={s.modalClose} onPress={() => setShowAuthSelector(false)}>
              <X size={22} color={textMuted} />
            </TouchableOpacity>

            <View style={[s.modalLockCircle, { backgroundColor: isDarkMode ? PAYTM_LIGHT_BLUE : '#00BAF2', marginBottom: 12 }]}>
              <ShieldCheck size={32} color={WHITE} />
            </View>

            <Text style={[s.modalTitle, { color: text, marginBottom: 4 }]}>Secure Payment</Text>
            <Text style={[s.modalSubtitle, { color: textMuted, marginBottom: 28 }]}>Choose how you'd like to verify this payment of ₹{amount}</Text>

            {/* Voice Option */}
            <TouchableOpacity 
              style={[s.authOptionBtn, { backgroundColor: isDarkMode ? 'rgba(33, 193, 124, 0.1)' : '#F0FDF4', borderColor: SUCCESS_GREEN }, isProcessing && { opacity: 0.6 }]} 
              onPress={selectVoiceAuth}
              disabled={isProcessing}
            >
              <View style={[s.authIconCircle, { backgroundColor: SUCCESS_GREEN }]}>
                {isProcessing ? <ActivityIndicator size="small" color={WHITE} /> : <Activity size={20} color={WHITE} />}
              </View>
              <View style={s.authTextBody}>
                <Text style={[s.authOptionTitle, { color: SUCCESS_GREEN }]}>{isProcessing ? 'Initializing VoiceGuard...' : 'VoiceGuard AI'}</Text>
                <Text style={[s.authOptionSub, { color: isDarkMode ? '#A5D6A7' : '#14532D' }]}>Verification via your unique voiceprint</Text>
              </View>
              {!isProcessing && <ChevronRight size={18} color={SUCCESS_GREEN} />}
            </TouchableOpacity>

            {/* Password Option */}
            <TouchableOpacity 
              style={[s.authOptionBtn, { backgroundColor: isDarkMode ? 'rgba(37, 150, 190, 0.1)' : '#F0F9FF', borderColor: isDarkMode ? PAYTM_LIGHT_BLUE : PAYTM_BLUE, marginTop: 12 }, isProcessing && { opacity: 0.6 }]} 
              onPress={selectPasswordAuth}
              disabled={isProcessing}
            >
              <View style={[s.authIconCircle, { backgroundColor: isDarkMode ? PAYTM_LIGHT_BLUE : PAYTM_BLUE }]}>
                <Lock size={20} color={WHITE} />
              </View>
              <View style={s.authTextBody}>
                <Text style={[s.authOptionTitle, { color: isDarkMode ? PAYTM_DARK_THEME_LIGHT_BLUE : PAYTM_BLUE }]}>Secure PIN / Password</Text>
                <Text style={[s.authOptionSub, { color: isDarkMode ? '#90CAF9' : '#1E3A8A' }]}>Traditional password authentication</Text>
              </View>
              <ChevronRight size={18} color={isDarkMode ? PAYTM_LIGHT_BLUE : PAYTM_BLUE} />
            </TouchableOpacity>

            <View style={[s.modalSecurityRow, { marginTop: 24 }]}>
              <ShieldCheck size={12} color="#21C17C" />
              <Text style={[s.modalSecurityText, { color: textMuted }]}>Security verified by Paytm VoiceGuard AI</Text>
            </View>
          </View>
        </View>
      </Modal>

      {/* ─── Password Verification Modal ─── */}
      <Modal visible={showPasswordModal} transparent animationType="slide">
        <View style={s.modalOverlay}>
          <View style={[s.modalContainer, { backgroundColor: isDarkMode ? '#1E1E1E' : WHITE }]}>
            {/* Close button */}
            <TouchableOpacity style={s.modalClose} onPress={() => setShowPasswordModal(false)}>
              <X size={22} color={textMuted} />
            </TouchableOpacity>

            {/* Lock Icon */}
            <View style={[s.modalLockCircle, { backgroundColor: isDarkMode ? PAYTM_LIGHT_BLUE : PAYTM_BLUE }]}>
              <Lock size={32} color={WHITE} />
            </View>

            <Text style={[s.modalTitle, { color: text }]}>Enter Password</Text>
            <Text style={[s.modalSubtitle, { color: textMuted }]}>
              Enter your password to send ₹{amount} to {initialRecipient?.name || recipient}
            </Text>

            {/* Password Input */}
            <View style={[s.passwordRow, { borderColor: isDarkMode ? '#444' : '#DDD' }]}>
              <TextInput
                style={[s.passwordInput, { color: text }]}
                placeholder="Password"
                placeholderTextColor={isDarkMode ? '#666' : '#AAA'}
                secureTextEntry={!showPassword}
                value={password}
                onChangeText={setPassword}
                autoFocus
              />
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={s.eyeBtn}>
                {showPassword ? <EyeOff size={20} color={textMuted} /> : <Eye size={20} color={textMuted} />}
              </TouchableOpacity>
            </View>

            {/* Confirm Button */}
            <TouchableOpacity
              style={[s.confirmBtn, { backgroundColor: isDarkMode ? PAYTM_LIGHT_BLUE : PAYTM_BLUE }, !password && { backgroundColor: '#A0AEC0' }]}
              onPress={handleConfirmPayment}
              disabled={!password || isProcessing}
            >
              {isProcessing ? (
                <ActivityIndicator size="small" color={WHITE} />
              ) : (
                <>
                  <ShieldCheck size={20} color={WHITE} style={{ marginRight: 8 }} />
                  <Text style={s.confirmBtnText}>Confirm Payment</Text>
                </>
              )}
            </TouchableOpacity>

            <View style={s.modalSecurityRow}>
              <Lock size={12} color="#21C17C" />
              <Text style={[s.modalSecurityText, { color: textMuted }]}>Secured by Paytm VoiceGuard AI</Text>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const s = StyleSheet.create({
  container: { flex: 1, paddingTop: 30 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingBottom: 16 },
  backBtn: { padding: 8 },
  headerTitle: { fontSize: 18, fontFamily: fonts.bold },

  scrollContent: { padding: 20, alignItems: 'center' },

  recipientBanner: { alignItems: 'center', marginBottom: 40, marginTop: 20 },
  avatarBig: { width: 80, height: 80, borderRadius: 40, backgroundColor: PAYTM_LIGHT_BLUE, justifyContent: 'center', alignItems: 'center', marginBottom: 16, elevation: 0 },
  avatarBigText: { fontSize: 36, fontFamily: fonts.bold, color: WHITE },
  recipientName: { fontSize: 24, fontFamily: fonts.bold, marginBottom: 4 },
  recipientId: { fontSize: 14, fontFamily: fonts.medium, marginBottom: 12 },
  verifiedBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#E8F5E9', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  verifiedText: { fontSize: 11, fontFamily: fonts.bold, color: '#1A531B' },

  inputGroup: { width: '100%', borderRadius: 16, padding: 16, marginBottom: 30, elevation: 0 },
  label: { fontSize: 12, fontFamily: fonts.medium, marginBottom: 8 },
  input: { borderWidth: 1, borderRadius: 12, padding: 16, fontSize: 16, fontFamily: fonts.medium },

  amountContainer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginVertical: 20 },
  amountSymbol: { fontSize: 40, fontFamily: fonts.regular, marginRight: 8, marginTop: 4 },
  amountInput: { fontSize: 56, fontFamily: fonts.bold, minWidth: 100, textAlign: 'center' },
  amountWords: { fontSize: 12, fontFamily: fonts.medium, marginTop: -10, marginBottom: 40 },

  footer: { padding: 16, borderTopWidth: 1 },
  payBtn: { backgroundColor: PAYTM_BLUE, paddingVertical: 18, borderRadius: 16, alignItems: 'center', elevation: 0 },
  payBtnDisabled: { backgroundColor: '#A0AEC0', elevation: 0 },
  payBtnText: { color: WHITE, fontSize: 16, fontFamily: fonts.bold },

  // ─── Modal Styles ───
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.55)', justifyContent: 'flex-end' },
  modalContainer: { borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 28, paddingBottom: 40, alignItems: 'center' },
  modalClose: { position: 'absolute', top: 18, right: 18, padding: 6 },
  modalLockCircle: { width: 68, height: 68, borderRadius: 34, backgroundColor: PAYTM_BLUE, justifyContent: 'center', alignItems: 'center', marginBottom: 18, elevation: 0 },
  modalTitle: { fontSize: 20, fontFamily: fonts.bold, marginBottom: 8 },
  modalSubtitle: { fontSize: 13, fontFamily: fonts.medium, textAlign: 'center', lineHeight: 20, marginBottom: 24, paddingHorizontal: 10 },
  passwordRow: { flexDirection: 'row', alignItems: 'center', borderWidth: 1.5, borderRadius: 14, width: '100%', paddingHorizontal: 16, marginBottom: 24 },
  passwordInput: { flex: 1, fontSize: 16, fontFamily: fonts.medium, paddingVertical: 16 },
  eyeBtn: { padding: 8 },
  confirmBtn: { flexDirection: 'row', backgroundColor: PAYTM_BLUE, paddingVertical: 18, borderRadius: 16, alignItems: 'center', justifyContent: 'center', width: '100%', elevation: 0 },
  confirmBtnText: { color: WHITE, fontSize: 16, fontFamily: fonts.bold },
  modalSecurityRow: { flexDirection: 'row', alignItems: 'center', marginTop: 16 },
  modalSecurityText: { fontSize: 11, fontFamily: fonts.medium, marginLeft: 6 },

  // Auth Selector
  authOptionBtn: { flexDirection: 'row', alignItems: 'center', padding: 16, borderRadius: 16, borderWidth: 1, width: '100%' },
  authIconCircle: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center', marginRight: 14 },
  authTextBody: { flex: 1 },
  authOptionTitle: { fontSize: 15, fontFamily: fonts.bold, marginBottom: 2 },
  authOptionSub: { fontSize: 11, fontFamily: fonts.medium, opacity: 0.8 },
});
