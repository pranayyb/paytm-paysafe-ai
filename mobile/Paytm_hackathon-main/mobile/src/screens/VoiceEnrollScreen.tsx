import React, { useState, useRef, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated, Dimensions, ActivityIndicator, Alert, Platform } from 'react-native';
import { Mic, ShieldCheck, CheckCircle2, ChevronLeft, Volume2, AlertTriangle } from 'lucide-react-native';
import { useAudioRecorder, AudioModule, RecordingPresets, useAudioRecorderState } from 'expo-audio';
import * as FileSystem from 'expo-file-system/legacy';
import { PAYTM_BLUE, PAYTM_LIGHT_BLUE, PAYTM_DARK_THEME_LIGHT_BLUE, WHITE, SUCCESS_GREEN, fonts } from '../styles/theme';

const { width } = Dimensions.get('window');

interface VoiceEnrollScreenProps {
  onBack: () => void;
  onComplete: () => void;
  token: string | null;
  backendUrl: string;
  isDarkMode?: boolean;
}

type EnrollStep = 'intro' | 'recording' | 'processing' | 'complete';

export const VoiceEnrollScreen: React.FC<VoiceEnrollScreenProps> = ({ onBack, onComplete, token, backendUrl, isDarkMode = false }) => {
  const [step, setStep] = useState<EnrollStep>('intro');
  const [samplesCollected, setSamplesCollected] = useState(0);
  const [challengePhrase, setChallengePhrase] = useState('');
  const [processing, setProcessing] = useState(false);

  const audioRecorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const recorderState = useAudioRecorderState(audioRecorder);

  const pulseAnim = useRef(new Animated.Value(1)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;

  const bg = isDarkMode ? '#121212' : '#F5F7FA';
  const surface = isDarkMode ? '#1E1E1E' : WHITE;
  const text = isDarkMode ? '#FFFFFF' : '#111';
  const textMuted = isDarkMode ? '#AAAAAA' : '#666';
  const accent = isDarkMode ? PAYTM_LIGHT_BLUE : PAYTM_BLUE;

  // Request permissions on mount
  useEffect(() => {
    (async () => {
      const status = await AudioModule.requestRecordingPermissionsAsync();
      if (!status.granted) {
        Alert.alert('Permission Required', 'Microphone access is needed for voice enrollment.');
      }
    })();
  }, []);

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
    }
  }, [recorderState.isRecording]);

  const startEnrollment = async () => {
    try {
      setProcessing(true);
      const res = await fetch(`${backendUrl}/api/voice/enroll/start`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Bypass-Tunnel-Reminder': 'true' }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || 'Failed to start enrollment');
      setChallengePhrase(data.challenge_phrase);
      setSamplesCollected(0);
      setStep('recording');
    } catch (e: any) {
      Alert.alert('Error', e.message);
    }
    setProcessing(false);
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

      // Auto-stop after 4 seconds
      setTimeout(async () => {
        await stopAndSubmit();
      }, 4000);
    } catch (e: any) {
      Alert.alert('Recording Error', e.message);
    }
  };

  const stopAndSubmit = async () => {
    try {
      setProcessing(true);
      await audioRecorder.stop();
      const uri = audioRecorder.uri;

      if (!uri) throw new Error('No recording found');

      const actualUri = (Platform.OS === 'android' && !uri.startsWith('file://')) ? `file://${uri}` : uri;

      // Convert to base64 to completely bypass tunnel HTTP chunking bugs
      const base64Audio = await FileSystem.readAsStringAsync(actualUri, { encoding: 'base64' });

      // Upload to backend
      const res = await fetch(`${backendUrl}/api/voice/enroll/sample`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Bypass-Tunnel-Reminder': 'true',
        },
        body: JSON.stringify({ audio_base64: base64Audio })
      });

      const rawText = await res.text();
      let data;
      try {
        data = JSON.parse(rawText);
      } catch (err) {
        console.log("RAW UPLOAD RESPONSE:", rawText);
        throw new Error(`Upload rejected by tunnel/network.\nRaw response: ${rawText.substring(0, 50)}...`);
      }

      if (!res.ok) throw new Error(data.detail || 'Sample upload failed');

      setSamplesCollected(data.samples_collected);
      Animated.timing(progressAnim, {
        toValue: data.samples_collected / 3,
        duration: 500,
        useNativeDriver: false,
      }).start();

      if (data.status === 'enrollment_complete') {
        setStep('complete');
      } else {
        setChallengePhrase(data.challenge_phrase);
      }
    } catch (e: any) {
      Alert.alert('Error', e.message);
    }
    setProcessing(false);
  };

  const renderIntro = () => (
    <View style={s.centerContent}>
      <View style={[s.heroCircle, { backgroundColor: isDarkMode ? 'rgba(37,150,190,0.15)' : 'rgba(26,103,184,0.1)' }]}>
        <ShieldCheck size={64} color={accent} />
      </View>

      <Text style={[s.heroTitle, { color: text }]}>Enable VoiceGuard</Text>
      <Text style={[s.heroSubtitle, { color: textMuted }]}>
        Your voice becomes your secure key.{'\n'}
        We'll record 3 short samples to create{'\n'}
        your unique voiceprint.
      </Text>

      <View style={[s.featureList, { backgroundColor: surface }]}>
        {[
          { icon: ShieldCheck, label: 'Speaker Recognition AI' },
          { icon: Volume2, label: 'Challenge Phrase Liveness' },
          { icon: AlertTriangle, label: 'Anti-Replay Protection' },
        ].map((f, i) => (
          <View key={i} style={s.featureItem}>
            <View style={[s.featureIcon, { backgroundColor: isDarkMode ? 'rgba(37,150,190,0.15)' : '#E8F4FD' }]}>
              <f.icon size={18} color={accent} />
            </View>
            <Text style={[s.featureText, { color: text }]}>{f.label}</Text>
          </View>
        ))}
      </View>

      <TouchableOpacity style={[s.primaryBtn, { backgroundColor: accent }]} onPress={startEnrollment} disabled={processing}>
        {processing ? (
          <ActivityIndicator color={WHITE} />
        ) : (
          <Text style={s.primaryBtnText}>Begin Voice Enrollment</Text>
        )}
      </TouchableOpacity>
    </View>
  );

  const renderRecording = () => (
    <View style={s.centerContent}>
      {/* Progress Dots */}
      <View style={s.progressRow}>
        {[0, 1, 2].map(i => (
          <View key={i} style={[s.progressDot,
            { backgroundColor: i < samplesCollected ? SUCCESS_GREEN : (i === samplesCollected ? accent : (isDarkMode ? '#333' : '#DDD')) }
          ]}>
            {i < samplesCollected && <CheckCircle2 size={14} color={WHITE} />}
            {i === samplesCollected && <Text style={s.dotNumber}>{i + 1}</Text>}
            {i > samplesCollected && <Text style={[s.dotNumber, { color: textMuted }]}>{i + 1}</Text>}
          </View>
        ))}
      </View>
      <Text style={[s.progressLabel, { color: textMuted }]}>
        Sample {samplesCollected + 1} of 3
      </Text>

      {/* Challenge Phrase */}
      <View style={[s.phraseCard, { backgroundColor: surface, borderColor: isDarkMode ? '#333' : '#E0E0E0' }]}>
        <Text style={[s.phraseLabel, { color: textMuted }]}>Read this phrase aloud:</Text>
        <Text style={[s.phraseText, { color: isDarkMode ? PAYTM_DARK_THEME_LIGHT_BLUE : PAYTM_BLUE }]}>
          "{challengePhrase}"
        </Text>
      </View>

      {/* Recording Button */}
      <View style={s.recordArea}>
        {recorderState.isRecording && (
          <Animated.View style={[s.pulseRing, { transform: [{ scale: pulseAnim }], borderColor: accent }]} />
        )}
        <TouchableOpacity
          style={[s.recordBtn, {
            backgroundColor: recorderState.isRecording ? '#FF4E4E' : accent,
          }]}
          onPress={recorderState.isRecording ? undefined : startRecording}
          disabled={processing || recorderState.isRecording}
          activeOpacity={0.8}
        >
          {processing ? (
            <ActivityIndicator color={WHITE} size="large" />
          ) : (
            <Mic size={40} color={WHITE} />
          )}
        </TouchableOpacity>
      </View>

      <Text style={[s.recordHint, { color: textMuted }]}>
        {recorderState.isRecording ? '🎤 Listening... speak now' :
         processing ? 'Analyzing voiceprint...' :
         'Tap the microphone to record'}
      </Text>
    </View>
  );

  const renderComplete = () => (
    <View style={s.centerContent}>
      <View style={[s.heroCircle, { backgroundColor: 'rgba(33,193,124,0.15)' }]}>
        <CheckCircle2 size={64} color={SUCCESS_GREEN} />
      </View>

      <Text style={[s.heroTitle, { color: text }]}>Voice Enrolled!</Text>
      <Text style={[s.heroSubtitle, { color: textMuted }]}>
        Your unique voiceprint has been secured.{'\n'}
        You can now make payments using your voice.
      </Text>

      <View style={[s.securityBadge, { backgroundColor: isDarkMode ? '#1A2E1A' : '#E8F5E9' }]}>
        <ShieldCheck size={20} color={SUCCESS_GREEN} />
        <Text style={[s.securityText, { color: SUCCESS_GREEN }]}>Triple-Layer AI Protection Active</Text>
      </View>

      <TouchableOpacity style={[s.primaryBtn, { backgroundColor: accent }]} onPress={onComplete}>
        <Text style={s.primaryBtnText}>Go to Home</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={[s.container, { backgroundColor: bg }]}>
      {/* Header */}
      <View style={[s.header, { backgroundColor: bg }]}>
        <TouchableOpacity onPress={onBack} style={s.backBtn}>
          <ChevronLeft size={26} color={text} />
        </TouchableOpacity>
        <Text style={[s.headerTitle, { color: text }]}>VoiceGuard Setup</Text>
        <View style={{ width: 40 }} />
      </View>

      {step === 'intro' && renderIntro()}
      {step === 'recording' && renderRecording()}
      {step === 'complete' && renderComplete()}
    </View>
  );
};

const s = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 14, paddingTop: 40 },
  backBtn: { padding: 8 },
  headerTitle: { fontSize: 16, fontFamily: fonts.bold },

  centerContent: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24 },

  heroCircle: { width: 120, height: 120, borderRadius: 60, justifyContent: 'center', alignItems: 'center', marginBottom: 24 },
  heroTitle: { fontSize: 22, fontFamily: fonts.bold, marginBottom: 8 },
  heroSubtitle: { fontSize: 13, fontFamily: fonts.medium, textAlign: 'center', lineHeight: 20, marginBottom: 28 },

  featureList: { width: '100%', borderRadius: 16, padding: 16, marginBottom: 32 },
  featureItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10 },
  featureIcon: { width: 36, height: 36, borderRadius: 10, justifyContent: 'center', alignItems: 'center', marginRight: 14 },
  featureText: { fontSize: 14, fontFamily: fonts.semiBold },

  primaryBtn: { width: '100%', paddingVertical: 18, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  primaryBtnText: { color: WHITE, fontSize: 16, fontFamily: fonts.bold },

  progressRow: { flexDirection: 'row', gap: 16, marginBottom: 8 },
  progressDot: { width: 32, height: 32, borderRadius: 16, justifyContent: 'center', alignItems: 'center' },
  dotNumber: { color: WHITE, fontSize: 13, fontFamily: fonts.bold },
  progressLabel: { fontSize: 12, fontFamily: fonts.medium, marginBottom: 28 },

  phraseCard: { width: '100%', borderRadius: 16, padding: 20, alignItems: 'center', borderWidth: 1, marginBottom: 40 },
  phraseLabel: { fontSize: 12, fontFamily: fonts.medium, marginBottom: 8 },
  phraseText: { fontSize: 18, fontFamily: fonts.bold, textAlign: 'center', lineHeight: 26 },

  recordArea: { marginBottom: 20, justifyContent: 'center', alignItems: 'center' },
  pulseRing: { position: 'absolute', width: 120, height: 120, borderRadius: 60, borderWidth: 3, opacity: 0.4 },
  recordBtn: { width: 88, height: 88, borderRadius: 44, justifyContent: 'center', alignItems: 'center' },
  recordHint: { fontSize: 13, fontFamily: fonts.medium },

  securityBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 14, marginBottom: 32 },
  securityText: { fontSize: 13, fontFamily: fonts.bold, marginLeft: 8 },
});
