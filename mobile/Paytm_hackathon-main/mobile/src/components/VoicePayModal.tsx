import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal, Animated, TextInput, ActivityIndicator, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { Mic, ShieldCheck, X, Volume2, AlertTriangle } from 'lucide-react-native';
import { useAudioRecorder, AudioModule, RecordingPresets, useAudioRecorderState } from 'expo-audio';
import * as FileSystem from 'expo-file-system/legacy';
import ViewShot from 'react-native-view-shot';
import * as Sharing from 'expo-sharing';
import { PAYTM_BLUE, PAYTM_LIGHT_BLUE, PAYTM_DARK_THEME_LIGHT_BLUE, SUCCESS_GREEN, WHITE, fonts } from '../styles/theme';

interface VoicePayModalProps {
  visible: boolean;
  onClose: () => void;
  isDarkMode?: boolean;
  token: string | null;
  backendUrl: string;
  voiceEnrolled: boolean;
  onPaymentSuccess: (data: any) => void;
  onEnrollPress: () => void;
  initialRecipient?: string;
  initialAmount?: string;
}

type PayStep = 'input' | 'recording' | 'verifying' | 'success' | 'failed';

export const VoicePayModal: React.FC<VoicePayModalProps> = ({
  visible, onClose, isDarkMode = false, token, backendUrl,
  voiceEnrolled, onPaymentSuccess, onEnrollPress,
  initialRecipient, initialAmount
}) => {
  const [payStep, setPayStep] = useState<PayStep>('input');
  const [recipientUpi, setRecipientUpi] = useState('');
  const [amount, setAmount] = useState('');
  const [challengePhrase, setChallengePhrase] = useState('');
  const [resultData, setResultData] = useState<any>(null);

  const audioRecorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const recorderState = useAudioRecorderState(audioRecorder);

  const pulseAnim = useRef(new Animated.Value(1)).current;
  const viewShotRef = useRef<any>(null);

  const handleShare = async () => {
    if (viewShotRef.current) {
      try {
        const uri = await viewShotRef.current.capture();
        if (!(await Sharing.isAvailableAsync())) {
          return Alert.alert('Error', 'Sharing is not available on this device');
        }
        await Sharing.shareAsync(uri, { dialogTitle: 'Share Payment Receipt', mimeType: 'image/png' });
      } catch (e) {
        console.log('Share error', e);
      }
    }
  };

  const bg = isDarkMode ? '#1E1E1E' : '#FFF';
  const textClr = isDarkMode ? '#FFFFFF' : '#111';
  const hintClr = isDarkMode ? '#AAAAAA' : '#666';
  const inputBg = isDarkMode ? '#333' : '#F5F7FA';
  const accent = isDarkMode ? PAYTM_LIGHT_BLUE : PAYTM_BLUE;
  const cancelBg = isDarkMode ? '#333333' : '#F0F5FA';

  // Request permissions on mount
  useEffect(() => {
    (async () => {
      await AudioModule.requestRecordingPermissionsAsync();
    })();
  }, []);

  useEffect(() => {
    if (visible) {
      if (initialRecipient && initialAmount) {
        setRecipientUpi(initialRecipient);
        setAmount(initialAmount);
        // Delay slightly for modal animation
        setTimeout(() => {
           fetchChallengeInternal(initialRecipient, initialAmount);
        }, 500);
      } else {
        setPayStep('input');
        setRecipientUpi('');
        setAmount('');
      }
      setChallengePhrase('');
      setResultData(null);
    }
  }, [visible, initialRecipient, initialAmount]);

  // Pulse animation when recording
  useEffect(() => {
    if (recorderState.isRecording) {
      const loop = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.3, duration: 600, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
        ])
      );
      loop.start();
      return () => loop.stop();
    } else {
      pulseAnim.setValue(1);
    }
  }, [recorderState.isRecording]);

  const fetchChallenge = () => fetchChallengeInternal(recipientUpi, amount);

  const fetchChallengeInternal = async (upi: string, amt: string) => {
    if (!upi.trim() || !amt.trim()) {
      Alert.alert('Missing Info', 'Please enter recipient UPI and amount.');
      return;
    }

    try {
      // First check if user is actually enrolled on the server
      const statusRes = await fetch(`${backendUrl}/api/voice/status`, {
        headers: { 'Authorization': `Bearer ${token}`, 'Bypass-Tunnel-Reminder': 'true' }
      });
      const statusData = await statusRes.json();
      if (!statusData.enrolled) {
        Alert.alert(
          'Voice Not Enrolled',
          `You need to complete voice enrollment first (${statusData.samples_collected || 0}/3 samples recorded).`,
          [
            { text: 'Enroll Now', onPress: () => { onClose(); onEnrollPress(); } },
            { text: 'Cancel', style: 'cancel' }
          ]
        );
        return;
      }

      const res = await fetch(`${backendUrl}/api/voice/challenge`, {
        headers: { 'Authorization': `Bearer ${token}`, 'Bypass-Tunnel-Reminder': 'true' }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || 'Failed to get challenge');
      setChallengePhrase(data.challenge_phrase);
      setPayStep('recording');
    } catch (e: any) {
      Alert.alert('Error', e.message);
    }
  };

  const startRecording = async () => {
    try {
      if (Platform.OS === 'ios') {
        // Use the native AudioModule from expo-audio (which we already Import from on line 4)
        await AudioModule.setAudioModeAsync({
          allowsRecording: true,
          playsInSilentMode: true,
          shouldRouteThroughEarpiece: false,
        });
      }

      // Small delay to ensure session is active on iOS
      if (Platform.OS === 'ios') await new Promise(resolve => setTimeout(resolve, 100));

      await audioRecorder.prepareToRecordAsync();
      audioRecorder.record();

      // Auto-stop after 4s
      setTimeout(async () => {
        await stopAndVerify();
      }, 4000);
    } catch (e: any) {
      Alert.alert('Error', e.message);
    }
  };

  const stopAndVerify = async () => {
    try {
      setPayStep('verifying');
      await audioRecorder.stop();
      const uri = audioRecorder.uri;

      if (!uri) throw new Error('No recording');

      const actualUri = (Platform.OS === 'android' && !uri.startsWith('file://')) ? `file://${uri}` : uri;
      
      const base64Audio = await FileSystem.readAsStringAsync(actualUri, { encoding: 'base64' });

      const res = await fetch(`${backendUrl}/api/voice/pay`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Bypass-Tunnel-Reminder': 'true',
        },
        body: JSON.stringify({
          audio_base64: base64Audio,
          recipient_upi: recipientUpi.trim(),
          amount: parseFloat(amount.trim())
        })
      });

      const rawText = await res.text();
      let data;
      try {
        data = JSON.parse(rawText);
      } catch (err) {
        throw new Error(`Upload rejected by network.\nRaw: ${rawText.substring(0, 50)}...`);
      }

      if (!res.ok) {
        setPayStep('failed');
        setResultData({ message: data.detail || 'Payment failed' });
        return;
      }

      setResultData(data);
      setPayStep('success');
      onPaymentSuccess(data);
    } catch (e: any) {
      setPayStep('failed');
      setResultData({ message: e.message });
    }
  };

  // ─── Success View (Full Screen) ───
  if (visible && payStep === 'success' && resultData) {
    return (
      <Modal visible={visible} animationType="fade" transparent={false}>
        <View style={{ flex: 1, backgroundColor: '#13C57B' }}>
          <ViewShot ref={viewShotRef} options={{ format: 'png', quality: 1.0 }} style={{ flex: 1, backgroundColor: '#13C57B', paddingTop: 60, paddingHorizontal: 20 }}>
            {/* Header */}
            <View style={{ alignItems: 'center' }}>
              <Text style={{ fontSize: 32, fontFamily: fonts.bold, color: '#FFF', marginBottom: 20, letterSpacing: -1 }}>paytm</Text>
              <Text style={{ fontSize: 18, fontFamily: fonts.semiBold, color: '#FFF', marginBottom: 16 }}>
                Paid to {resultData.recipient}
              </Text>
              <Text style={{ fontSize: 72, fontFamily: fonts.bold, color: '#FFF', marginBottom: 8, marginTop: 10 }}>
                ₹{resultData.amount}
              </Text>
              {/* Payment time */}
              <Text style={{ fontSize: 13, fontFamily: fonts.medium, color: '#FFF', opacity: 0.9, marginBottom: 50 }}>
                Payment completed in {(Math.random() * 2 + 1).toFixed(2)} Sec ⚡
              </Text>
            </View>

            {/* Scalloped Vector Graphic (using overlapping layered rounded squares!) */}
            <View style={{ alignItems: 'center', justifyContent: 'center', height: 260 }}>
              <View style={{ position: 'absolute', width: 230, height: 230, backgroundColor: '#47D68F', borderRadius: 70, transform: [{ rotate: '0deg' }] }} />
              <View style={{ position: 'absolute', width: 230, height: 230, backgroundColor: '#47D68F', borderRadius: 70, transform: [{ rotate: '30deg' }] }} />
              <View style={{ position: 'absolute', width: 230, height: 230, backgroundColor: '#47D68F', borderRadius: 70, transform: [{ rotate: '60deg' }] }} />
              
              <View style={{ position: 'absolute', width: 170, height: 170, backgroundColor: '#7CE5AD', borderRadius: 50, transform: [{ rotate: '15deg' }] }} />
              <View style={{ position: 'absolute', width: 170, height: 170, backgroundColor: '#7CE5AD', borderRadius: 50, transform: [{ rotate: '45deg' }] }} />
              <View style={{ position: 'absolute', width: 170, height: 170, backgroundColor: '#7CE5AD', borderRadius: 50, transform: [{ rotate: '75deg' }] }} />

              <View style={{ position: 'absolute', width: 110, height: 110, backgroundColor: '#00A356', borderRadius: 30, transform: [{ rotate: '0deg' }] }} />
              <View style={{ position: 'absolute', width: 110, height: 110, backgroundColor: '#00A356', borderRadius: 30, transform: [{ rotate: '30deg' }] }} />
              <View style={{ position: 'absolute', width: 110, height: 110, backgroundColor: '#00A356', borderRadius: 30, transform: [{ rotate: '60deg' }] }} />

              <View style={{ position: 'absolute', zIndex: 10 }}>
                 <ShieldCheck color="#FFF" size={56} strokeWidth={3} />
              </View>
            </View>

            <View style={{ flex: 1 }} />

            {/* Footer Logos */}
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: 30, opacity: 0.9 }}>
              <Text style={{ fontSize: 16, fontFamily: fonts.bold, color: '#FFF', marginRight: 8 }}>paytm</Text>
              <View style={{ width: 1, height: 14, backgroundColor: '#FFF', marginHorizontal: 8, opacity: 0.5 }} />
              <Text style={{ fontSize: 10, color: '#FFF', fontFamily: fonts.medium }}>Powered by UPI</Text>
              <View style={{ width: 1, height: 14, backgroundColor: '#FFF', marginHorizontal: 8, opacity: 0.5 }} />
              <Text style={{ fontSize: 12, fontFamily: fonts.bold, color: '#FFF' }}>✓ YES BANK</Text>
            </View>
          </ViewShot>

          {/* Action Buttons */}
          <View style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center', padding: 20, paddingBottom: 40 }}>
             <TouchableOpacity style={{ paddingVertical: 14, paddingHorizontal: 24, borderRadius: 24, borderWidth: 1, borderColor: '#FFF', marginRight: 12 }} onPress={handleShare}>
                <Text style={{ color: '#FFF', fontSize: 16, fontFamily: fonts.bold }}>Share Screen</Text>
             </TouchableOpacity>
             <TouchableOpacity style={{ backgroundColor: '#FFF', paddingVertical: 14, paddingHorizontal: 36, borderRadius: 24 }} onPress={onClose}>
                <Text style={{ color: '#13C57B', fontSize: 16, fontFamily: fonts.bold }}>Done</Text>
             </TouchableOpacity>
          </View>
        </View>
      </Modal>
    );
  }

  // ─── Not Enrolled View ───
  if (visible && !voiceEnrolled) {
    return (
      <Modal visible={visible} animationType="slide" transparent>
        <View style={s.modalOverlay}>
          <View style={[s.voiceModal, { backgroundColor: bg }]}>
            <View style={[s.dragHandle, { backgroundColor: isDarkMode ? '#444' : '#EEE' }]} />
            <TouchableOpacity style={s.closeBtn} onPress={onClose}>
              <X size={22} color={hintClr} />
            </TouchableOpacity>

            <View style={[s.notEnrolledCircle, { backgroundColor: isDarkMode ? 'rgba(255,152,0,0.15)' : '#FFF3E0' }]}>
              <AlertTriangle size={48} color="#FF9800" />
            </View>
            <Text style={[s.title, { color: textClr }]}>Voice Not Enrolled</Text>
            <Text style={[s.subtitle, { color: hintClr }]}>
              You need to register your voiceprint{'\n'}before making voice payments.
            </Text>
            <TouchableOpacity style={[s.primaryBtn, { backgroundColor: accent }]} onPress={() => { onClose(); onEnrollPress(); }}>
              <Text style={s.primaryBtnText}>Enroll Voice Now</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[s.cancelBtn, { backgroundColor: cancelBg }]} onPress={onClose}>
              <Text style={[s.cancelBtnText, { color: isDarkMode ? PAYTM_DARK_THEME_LIGHT_BLUE : PAYTM_BLUE }]}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    );
  }

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={s.modalOverlay}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ width: '100%' }}>
          <View style={[s.voiceModal, { backgroundColor: bg }]}>
            <View style={[s.dragHandle, { backgroundColor: isDarkMode ? '#444' : '#EEE' }]} />
            <TouchableOpacity style={s.closeBtn} onPress={onClose}>
              <X size={22} color={hintClr} />
            </TouchableOpacity>

            {/* ─── Step: Input ─── */}
            {payStep === 'input' && (
              <View style={s.content}>
                <Text style={[s.title, { color: textClr }]}>VoiceGuard Pay</Text>
                <Text style={[s.subtitle, { color: SUCCESS_GREEN }]}>Voice-verified secure payment</Text>

                <View style={s.inputGroup}>
                  <Text style={[s.inputLabel, { color: hintClr }]}>Recipient UPI ID</Text>
                  <TextInput
                    style={[s.input, { backgroundColor: inputBg, color: textClr, borderColor: isDarkMode ? '#444' : '#E0E0E0' }]}
                    placeholder="e.g. rahul@paytm"
                    placeholderTextColor={isDarkMode ? '#555' : '#AAA'}
                    value={recipientUpi}
                    onChangeText={setRecipientUpi}
                    autoCapitalize="none"
                  />
                </View>
                <View style={s.inputGroup}>
                  <Text style={[s.inputLabel, { color: hintClr }]}>Amount (₹)</Text>
                  <TextInput
                    style={[s.input, { backgroundColor: inputBg, color: textClr, borderColor: isDarkMode ? '#444' : '#E0E0E0' }]}
                    placeholder="500"
                    placeholderTextColor={isDarkMode ? '#555' : '#AAA'}
                    value={amount}
                    onChangeText={setAmount}
                    keyboardType="numeric"
                  />
                </View>

                <TouchableOpacity style={[s.primaryBtn, { backgroundColor: accent }]} onPress={fetchChallenge}>
                  <Mic size={20} color={WHITE} style={{ marginRight: 8 }} />
                  <Text style={s.primaryBtnText}>Pay with Voice</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* ─── Step: Recording ─── */}
            {payStep === 'recording' && (
              <View style={s.content}>
                <Text style={[s.title, { color: textClr }]}>Voice Verification</Text>
                <Text style={[s.subtitle, { color: hintClr }]}>Read the phrase to confirm ₹{amount} to {recipientUpi}</Text>

                <View style={[s.phraseCard, { backgroundColor: isDarkMode ? '#333' : '#F0F5FA', borderColor: isDarkMode ? '#444' : '#D0D0D0' }]}>
                  <Volume2 size={18} color={accent} style={{ marginBottom: 6 }} />
                  <Text style={[s.phraseLabel, { color: hintClr }]}>Say this clearly:</Text>
                  <Text style={[s.phraseText, { color: isDarkMode ? PAYTM_DARK_THEME_LIGHT_BLUE : PAYTM_BLUE }]}>"{challengePhrase}"</Text>
                </View>

                <View style={s.recordArea}>
                  {recorderState.isRecording && (
                    <Animated.View style={[s.pulseRing, { transform: [{ scale: pulseAnim }], borderColor: accent }]} />
                  )}
                  <TouchableOpacity
                    style={[s.recordBtn, { backgroundColor: recorderState.isRecording ? '#FF4E4E' : accent }]}
                    onPress={recorderState.isRecording ? undefined : startRecording}
                    disabled={recorderState.isRecording}
                  >
                    <Mic size={36} color={WHITE} />
                  </TouchableOpacity>
                </View>
                <Text style={[s.hintText, { color: hintClr }]}>
                  {recorderState.isRecording ? '🎤 Listening...' : 'Tap to record'}
                </Text>
              </View>
            )}

            {/* ─── Step: Verifying ─── */}
            {payStep === 'verifying' && (
              <View style={s.content}>
                <View style={[s.processingCircle, { backgroundColor: isDarkMode ? 'rgba(37,150,190,0.15)' : 'rgba(0,186,242,0.1)' }]}>
                  <ActivityIndicator size="large" color={accent} />
                </View>
                <Text style={[s.title, { color: textClr }]}>Verifying Voice...</Text>
                <Text style={[s.subtitle, { color: hintClr }]}>AI is matching your voiceprint</Text>
              </View>
            )}

            {/* (Success step is rendered as full screen Modal independently) */}
            {/* ─── Step: Failed ─── */}
            {payStep === 'failed' && (
              <View style={s.content}>
                <View style={[s.failCircle, { backgroundColor: 'rgba(255,78,78,0.15)' }]}>
                  <AlertTriangle size={48} color="#FF4E4E" />
                </View>
                <Text style={[s.title, { color: textClr }]}>Verification Failed</Text>
                <Text style={[s.subtitle, { color: hintClr }]}>{resultData?.message || 'Voice did not match'}</Text>

                <TouchableOpacity style={[s.primaryBtn, { backgroundColor: accent }]} onPress={() => setPayStep('recording')}>
                  <Text style={s.primaryBtnText}>Try Again</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[s.cancelBtn, { backgroundColor: cancelBg }]} onPress={onClose}>
                  <Text style={[s.cancelBtnText, { color: isDarkMode ? PAYTM_DARK_THEME_LIGHT_BLUE : PAYTM_BLUE }]}>Cancel</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* Footer */}
            <View style={s.footerSecurity}>
              <ShieldCheck size={12} color={SUCCESS_GREEN} />
              <Text style={[s.footerText, { color: hintClr }]}>Secured by Paytm VoiceGuard AI</Text>
            </View>
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
};

const s = StyleSheet.create({
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  voiceModal: { borderTopLeftRadius: 32, borderTopRightRadius: 32, padding: 24, paddingBottom: 36, alignItems: 'center' },
  dragHandle: { width: 40, height: 5, borderRadius: 3, marginBottom: 16 },
  closeBtn: { position: 'absolute', top: 18, right: 18, padding: 6, zIndex: 10 },
  content: { width: '100%', alignItems: 'center', paddingVertical: 8 },

  title: { fontSize: 20, fontFamily: fonts.bold, marginBottom: 4 },
  subtitle: { fontSize: 13, fontFamily: fonts.medium, textAlign: 'center', marginBottom: 20, lineHeight: 20 },

  inputGroup: { width: '100%', marginBottom: 14 },
  inputLabel: { fontSize: 12, fontFamily: fonts.semiBold, marginBottom: 6, marginLeft: 4 },
  input: { borderWidth: 1, borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14, fontSize: 15, fontFamily: fonts.medium },

  primaryBtn: { flexDirection: 'row', width: '100%', paddingVertical: 18, borderRadius: 16, alignItems: 'center', justifyContent: 'center', marginTop: 8 },
  primaryBtnText: { color: WHITE, fontSize: 16, fontFamily: fonts.bold },

  cancelBtn: { width: '100%', paddingVertical: 16, borderRadius: 16, alignItems: 'center', marginTop: 10 },
  cancelBtnText: { fontSize: 14, fontFamily: fonts.bold },

  phraseCard: { width: '100%', borderRadius: 16, padding: 20, alignItems: 'center', borderWidth: 1, marginBottom: 28 },
  phraseLabel: { fontSize: 12, fontFamily: fonts.medium, marginBottom: 6 },
  phraseText: { fontSize: 17, fontFamily: fonts.bold, textAlign: 'center' },

  recordArea: { marginBottom: 16, justifyContent: 'center', alignItems: 'center' },
  pulseRing: { position: 'absolute', width: 100, height: 100, borderRadius: 50, borderWidth: 3, opacity: 0.4 },
  recordBtn: { width: 80, height: 80, borderRadius: 40, justifyContent: 'center', alignItems: 'center' },
  hintText: { fontSize: 13, fontFamily: fonts.medium },

  processingCircle: { width: 100, height: 100, borderRadius: 50, justifyContent: 'center', alignItems: 'center', marginBottom: 20 },
  successCircle: { width: 100, height: 100, borderRadius: 50, justifyContent: 'center', alignItems: 'center', marginBottom: 16 },
  failCircle: { width: 100, height: 100, borderRadius: 50, justifyContent: 'center', alignItems: 'center', marginBottom: 16 },
  amountText: { fontSize: 32, fontFamily: fonts.bold, marginBottom: 4 },

  verifyBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 12, marginBottom: 20 },
  verifyBadgeText: { fontSize: 12, fontFamily: fonts.bold, marginLeft: 6 },

  notEnrolledCircle: { width: 100, height: 100, borderRadius: 50, justifyContent: 'center', alignItems: 'center', marginBottom: 16 },

  footerSecurity: { flexDirection: 'row', alignItems: 'center', marginTop: 16 },
  footerText: { fontSize: 11, fontFamily: fonts.medium, marginLeft: 6 },
});
