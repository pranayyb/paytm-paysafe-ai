import React, { useState, useRef, useEffect } from 'react';
import {
  StyleSheet, Text, View, TouchableOpacity,
  StatusBar, ScrollView, ActivityIndicator,
  Animated, Alert, TextInput, PermissionsAndroid, Platform,
} from 'react-native';
import {
  createSound,
  AudioEncoderAndroidType,
  AudioSourceAndroidType,
  OutputFormatAndroidType,
  AVEncoderAudioQualityIOSType,
} from 'react-native-nitro-sound';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { HomeStackParamList } from '@navigation/types';
import { Colors, Typography, Spacing } from '@theme';
import { api, type VoicePayResponse } from '@services/api';
import { useAuthStore } from '@store/authStore';

type Step = 'record' | 'confirm' | 'pin' | 'processing';

const PIN_LENGTH = 4;

const sound = createSound();

export default function VoicePaymentScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<HomeStackParamList>>();
  const phone = useAuthStore((s) => s.phone) ?? '9999999999';

  const [step, setStep] = useState<Step>('record');
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [recordedPath, setRecordedPath] = useState<string | null>(null);
  const [pending, setPending] = useState<VoicePayResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pin, setPin] = useState('');
  const [loading, setLoading] = useState(false);
  const [confirmText, setConfirmText] = useState('haan');

  const pulseAnim = useRef(new Animated.Value(1)).current;
  const waveAnims = useRef(Array.from({ length: 5 }, () => new Animated.Value(0.3))).current;
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (isRecording) {
      // Pulse the mic button
      const pulse = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.15, duration: 600, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
        ]),
      );
      pulse.start();

      // Animate waveform bars
      const waves = waveAnims.map((anim, i) =>
        Animated.loop(
          Animated.sequence([
            Animated.delay(i * 80),
            Animated.timing(anim, { toValue: 1, duration: 300, useNativeDriver: true }),
            Animated.timing(anim, { toValue: 0.3, duration: 300, useNativeDriver: true }),
          ]),
        ),
      );
      waves.forEach((w) => w.start());

      // Timer
      timerRef.current = setInterval(() => setRecordingDuration((d) => d + 1), 1000);

      return () => {
        pulse.stop();
        waves.forEach((w) => w.stop());
      };
    }
  }, [isRecording, pulseAnim, waveAnims]);

  useEffect(() => {
    return () => {
      sound.stopRecorder().catch(() => { });
      sound.removeRecordBackListener();
    };
  }, []);

  const formatTime = (s: number) => `0:${String(s).padStart(2, '0')}`;

  const requestMicPermission = async () => {
    if (Platform.OS === 'android') {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
        { title: 'Microphone Permission', message: 'PaySafe AI needs mic access to hear your voice command.', buttonPositive: 'Allow' }
      );
      return granted === PermissionsAndroid.RESULTS.GRANTED;
    }
    return true;
  };

  const handleStartRecording = async () => {
    const perm = await requestMicPermission();
    if (!perm) return Alert.alert('Permission Denied', 'Mic access is required to use Voice Pay.');

    try {
      setRecordingDuration(0);
      setRecordedPath(null);

      const path = await sound.startRecorder(undefined, {
        AudioEncoderAndroid: AudioEncoderAndroidType.AAC,
        AudioSourceAndroid: AudioSourceAndroidType.MIC,
        OutputFormatAndroid: OutputFormatAndroidType.MPEG_4,
        AVEncoderAudioQualityKeyIOS: AVEncoderAudioQualityIOSType.high,
        AVNumberOfChannelsKeyIOS: 1,
        AVFormatIDKeyIOS: 'aac',
      });
      sound.addRecordBackListener((e) => setRecordingDuration(Math.floor(e.currentPosition / 1000)));
      setRecordedPath(path);
      setIsRecording(true);
    } catch (err) {
      console.error('[Recording] Failed:', err);
    }
  };

  const handleStopAndSend = async () => {
    if (!isRecording) return;

    try {
      const path = await sound.stopRecorder();
      sound.removeRecordBackListener();
      setIsRecording(false);
      setLoading(true);

      const audioPath = recordedPath ?? path;
      const cleanPath = audioPath.replace(/^file:\/\//, '');

      const form = new FormData();
      form.append('audio_file', {
        uri: Platform.OS === 'android' ? `file://${cleanPath}` : audioPath,
        name: 'voice.mp4',
        type: 'audio/mp4',
      } as any);

      const result = await api.voice.pay(form);
      setPending(result);
      if (result.status === 'ERROR') {
        setError(result.message || 'Could not identify payment details. Please try again.');
        setPending(null);
      } else {
        setStep('confirm');
      }
    } catch (err) {
      console.error(err);
      setError('Could not process. Make sure the backend is running and try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = async () => {
    if (!pending) return;
    setLoading(true);
    try {
      await api.voice.confirm(pending.transaction_id, confirmText, `91${phone}@upi`);
      setStep('pin');
    } catch {
      Alert.alert('Error', 'Failed to confirm. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyPin = async () => {
    if (pin.length !== PIN_LENGTH || !pending) return;
    setStep('processing');
    try {
      const result = await api.voice.verifyPin(pending.transaction_id, pin);
      if (result.status === 'SUCCESS') {
        navigation.replace('PaymentSuccess', {
          amount: pending.amount,
          recipient: pending.receiver,
          type: 'voice',
          status: 'success',
          reference: result.transaction_id,
        });
      } else {
        Alert.alert('Payment Failed', result.message);
        setStep('pin');
      }
    } catch {
      Alert.alert('Error', 'Payment failed. Please try again.');
      setStep('pin');
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.primaryDark} />

      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Icon name="arrow-left" size={24} color={Colors.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Voice Pay</Text>
        <View style={styles.headerSpacer} />
      </View>

      {/* Step indicator */}
      <View style={styles.steps}>
        {(['record', 'confirm', 'pin'] as const).map((s, i) => (
          <React.Fragment key={s}>
            <View style={[styles.stepDot, (step === s || (step === 'processing' && s === 'pin')) && styles.stepDotActive,
            (i === 0 && step !== 'record') || (i === 1 && (step === 'pin' || step === 'processing')) ? styles.stepDotDone : null]}>
              {((i === 0 && step !== 'record') || (i === 1 && (step === 'pin' || step === 'processing'))) ? (
                <Icon name="check" size={10} color={Colors.white} />
              ) : (
                <Text style={styles.stepNum}>{i + 1}</Text>
              )}
            </View>
            {i < 2 && <View style={[styles.stepLine, i === 0 && step !== 'record' ? styles.stepLineDone : null]} />}
          </React.Fragment>
        ))}
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Step 1: Record */}
        {step === 'record' && (
          <View style={styles.stepCard}>
            <Text style={styles.stepTitle}>Record Command</Text>
            <Text style={styles.stepDesc}>
              Tap the mic and say something like:{'\n'}
              <Text style={styles.exampleText}>"Rahul ko 500 rupaye bhejo"</Text>
            </Text>

            {error ? (
              <View style={styles.errorBox}>
                <View style={styles.errorHeader}>
                  <Icon name="alert-circle" size={24} color={Colors.error} />
                  <Text style={styles.errorTitle}>Analysis Failed</Text>
                </View>
                <Text style={styles.errorMsg}>{error}</Text>
                <TouchableOpacity
                  style={styles.retryBtn}
                  onPress={() => setError(null)}
                >
                  <Text style={styles.retryText}>Try Again</Text>
                  <Icon name="refresh" size={16} color={Colors.white} />
                </TouchableOpacity>
              </View>
            ) : (
              <>
                {/* Waveform */}
                <View style={styles.waveform}>
                  {waveAnims.map((anim, i) => (
                    <Animated.View
                      key={i}
                      style={[
                        styles.waveBar,
                        {
                          height: anim.interpolate({
                            inputRange: [1, 1.2, 1.4],
                            outputRange: [12, 32, 16],
                          }),
                          backgroundColor: isRecording ? Colors.error : Colors.border,
                          opacity: isRecording ? 1 : 0.4,
                        },
                      ]}
                    />
                  ))}
                </View>

                {isRecording && (
                  <Text style={styles.timerText}>{formatTime(recordingDuration)}</Text>
                )}

                <TouchableOpacity
                  style={[styles.micBtn, isRecording && styles.micBtnRecording]}
                  onPress={isRecording ? handleStopAndSend : handleStartRecording}
                  activeOpacity={0.8}
                >
                  {loading ? (
                    <ActivityIndicator color={Colors.white} />
                  ) : (
                    <Icon name={isRecording ? 'stop' : 'microphone'} size={42} color={Colors.white} />
                  )}
                </TouchableOpacity>

                <Text style={styles.micHint}>
                  {isRecording ? 'Tap to Stop' : 'Tap to Start'}
                </Text>
              </>
            )}
          </View>
        )}

        {/* Step 2: Confirm */}
        {step === 'confirm' && pending && (
          <View style={styles.stepCard}>
            <Text style={styles.stepTitle}>Confirm Payment</Text>

            <View style={styles.confirmBox}>
              <Icon name="account-circle" size={48} color={Colors.primary} />
              <Text style={styles.confirmName}>{pending.receiver}</Text>
              <Text style={styles.confirmAmount}>₹{pending.amount.toLocaleString('en-IN')}</Text>
              <Text style={styles.confirmMsg}>{pending.message}</Text>
            </View>

            <Text style={styles.confirmInputLabel}>Say "haan" to confirm or edit below:</Text>
            <View style={styles.confirmInputRow}>
              <TextInput
                style={styles.confirmInput}
                value={confirmText}
                onChangeText={setConfirmText}
                placeholder="haan / yes"
                placeholderTextColor={Colors.placeholder}
              />
            </View>

            <TouchableOpacity
              style={styles.confirmBtn}
              onPress={handleConfirm}
              disabled={loading}
              activeOpacity={0.8}>
              {loading ? (
                <ActivityIndicator color={Colors.white} />
              ) : (
                <>
                  <Icon name="check" size={20} color={Colors.white} />
                  <Text style={styles.confirmBtnText}>Confirm & Enter PIN</Text>
                </>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.cancelBtn}
              onPress={() => { setStep('record'); setPending(null); }}>
              <Text style={styles.cancelText}>Start Over</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Step 3: PIN */}
        {(step === 'pin' || step === 'processing') && pending && (
          <View style={styles.stepCard}>
            <Text style={styles.stepTitle}>Enter UPI PIN</Text>
            <Text style={styles.stepDesc}>
              Paying ₹{pending.amount} to {pending.receiver}
            </Text>

            <View style={styles.pinRow}>
              {Array(PIN_LENGTH).fill(null).map((_, i) => (
                <View
                  key={i}
                  style={[styles.pinDot, i < pin.length && styles.pinDotFilled]}
                />
              ))}
            </View>

            {/* Numeric keypad */}
            <View style={styles.keypad}>
              {['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', '⌫'].map((key, i) => (
                <TouchableOpacity
                  key={i}
                  style={[styles.keyBtn, key === '' && styles.keyBtnEmpty]}
                  onPress={() => {
                    if (key === '') return;
                    if (key === '⌫') {
                      setPin((p) => p.slice(0, -1));
                    } else if (pin.length < PIN_LENGTH) {
                      const newPin = pin + key;
                      setPin(newPin);
                      if (newPin.length === PIN_LENGTH) {
                        setTimeout(() => handleVerifyPin(), 200);
                      }
                    }
                  }}
                  disabled={step === 'processing'}>
                  <Text style={styles.keyText}>{key}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {step === 'processing' && (
              <View style={styles.processingRow}>
                <ActivityIndicator color={Colors.primary} />
                <Text style={styles.processingText}>Processing payment...</Text>
              </View>
            )}
          </View>
        )}
      </ScrollView>
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
  steps: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: Colors.white, paddingVertical: Spacing.base,
    paddingHorizontal: Spacing.xl, gap: 0,
    borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  stepDot: {
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: Colors.border, alignItems: 'center', justifyContent: 'center',
  },
  stepDotActive: { backgroundColor: Colors.primaryDark },
  stepDotDone: { backgroundColor: Colors.success },
  stepNum: { fontSize: Typography.size.xs, fontWeight: Typography.weight.bold, color: Colors.white },
  stepLine: { flex: 1, height: 2, backgroundColor: Colors.border, marginHorizontal: 4 },
  stepLineDone: { backgroundColor: Colors.success },
  scroll: { padding: Spacing.base, paddingBottom: Spacing['3xl'] },
  stepCard: {
    backgroundColor: Colors.white, borderRadius: 16, padding: Spacing.xl,
    alignItems: 'center', gap: Spacing.base, elevation: 2,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.07, shadowRadius: 6,
  },
  stepTitle: { fontSize: Typography.size.xl, fontWeight: Typography.weight.bold, color: Colors.textPrimary, textAlign: 'center' },
  stepDesc: { fontSize: Typography.size.sm, color: Colors.textSecondary, textAlign: 'center', lineHeight: 22 },
  exampleText: { fontStyle: 'italic', color: Colors.primaryMid, fontWeight: Typography.weight.medium },
  waveform: { flexDirection: 'row', alignItems: 'center', gap: 6, height: 48, marginVertical: Spacing.base },
  waveBar: { width: 6, height: 32, borderRadius: 3 },
  timerText: { fontSize: Typography.size.xl, fontWeight: Typography.weight.bold, color: Colors.error, letterSpacing: 2 },
  micBtn: {
    width: 88, height: 88, borderRadius: 44,
    backgroundColor: Colors.primaryDark, alignItems: 'center', justifyContent: 'center',
    elevation: 8, shadowColor: Colors.primaryDark, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4, shadowRadius: 10,
  },
  micBtnRecording: { backgroundColor: Colors.error },
  micHint: { fontSize: Typography.size.sm, color: Colors.textSecondary, marginTop: Spacing.sm },
  confirmBox: {
    alignItems: 'center', gap: Spacing.sm, backgroundColor: Colors.offWhite,
    borderRadius: 14, padding: Spacing.xl, width: '100%',
  },
  confirmName: { fontSize: Typography.size.lg, fontWeight: Typography.weight.bold, color: Colors.textPrimary, textTransform: 'capitalize' },
  confirmAmount: { fontSize: Typography.size['3xl'], fontWeight: Typography.weight.extrabold, color: Colors.primaryDark },
  confirmMsg: { fontSize: Typography.size.sm, color: Colors.textSecondary, textAlign: 'center' },
  confirmInputLabel: { fontSize: Typography.size.sm, color: Colors.textSecondary, alignSelf: 'flex-start' },
  confirmInputRow: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.inputBg,
    borderRadius: 10, paddingHorizontal: Spacing.base, width: '100%',
  },
  confirmInput: { flex: 1, paddingVertical: Spacing.base, fontSize: Typography.size.base, color: Colors.textPrimary },
  confirmBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: Colors.success, borderRadius: 12,
    paddingVertical: Spacing.base, gap: Spacing.sm, width: '100%',
  },
  confirmBtnText: { color: Colors.white, fontSize: Typography.size.base, fontWeight: Typography.weight.bold },
  cancelBtn: { paddingVertical: Spacing.sm },
  cancelText: { fontSize: Typography.size.sm, color: Colors.error, fontWeight: Typography.weight.medium },
  pinRow: { flexDirection: 'row', gap: Spacing.xl, marginVertical: Spacing.lg },
  pinDot: {
    width: 18, height: 18, borderRadius: 9,
    borderWidth: 2, borderColor: Colors.border, backgroundColor: Colors.white,
  },
  pinDotFilled: { backgroundColor: Colors.primaryDark, borderColor: Colors.primaryDark },
  keypad: { flexDirection: 'row', flexWrap: 'wrap', width: 240, gap: Spacing.base, justifyContent: 'center' },
  keyBtn: {
    width: 68, height: 58, borderRadius: 12, backgroundColor: Colors.inputBg,
    alignItems: 'center', justifyContent: 'center',
    elevation: 1, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2,
  },
  keyBtnEmpty: { backgroundColor: 'transparent', elevation: 0 },
  keyText: { fontSize: Typography.size.xl, fontWeight: Typography.weight.semibold, color: Colors.textPrimary },
  processingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.base,
  },
  processingText: { fontSize: Typography.size.sm, color: Colors.textSecondary },
  errorBox: {
    backgroundColor: '#FFF5F5',
    borderRadius: 14,
    padding: Spacing.lg,
    width: '100%',
    alignItems: 'center',
    gap: Spacing.sm,
    borderWidth: 1,
    borderColor: '#FED7D7',
    marginTop: Spacing.base,
  },
  errorHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  errorTitle: {
    fontSize: Typography.size.base,
    fontWeight: Typography.weight.bold,
    color: Colors.error,
  },
  errorMsg: {
    fontSize: Typography.size.sm,
    color: '#742A2A',
    textAlign: 'center',
    lineHeight: 20,
  },
  retryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    backgroundColor: Colors.primaryDark,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.xl,
    borderRadius: 8,
    marginTop: Spacing.xs,
  },
  retryText: {
    color: Colors.white,
    fontSize: Typography.size.sm,
    fontWeight: Typography.weight.bold,
  },
});
