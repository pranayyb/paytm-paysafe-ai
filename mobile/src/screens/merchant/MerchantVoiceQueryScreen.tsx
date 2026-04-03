import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  StyleSheet, Text, View, TouchableOpacity,
  StatusBar, ScrollView, ActivityIndicator,
  Animated, Alert, PermissionsAndroid, Platform,
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
import { Colors, Typography, Spacing } from '@theme';
import { API_BASE_URL } from '@config/env';
import { api, type MerchantVoiceQueryResponse } from '@services/api';
import { useAuthStore } from '@store/authStore';

const EXAMPLE_QUERIES = [
  'Aaj kitna revenue hua?',
  'Is hafte ke top customers kaun hain?',
  'Meri peak hours kab hain?',
  'Koi fraud transaction hua kya?',
];

// createSound() gives an isolated recorder/player instance
const sound = createSound();

export default function MerchantVoiceQueryScreen() {
  const navigation = useNavigation();
  const phone = useAuthStore((s) => s.phone) ?? '9999999999';
  const merchantId = `${phone}@paytm`;

  const [isRecording, setIsRecording] = useState(false);
  const [duration, setDuration] = useState(0);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<MerchantVoiceQueryResponse | null>(null);
  const [history, setHistory] = useState<MerchantVoiceQueryResponse[]>([]);
  const [recordedPath, setRecordedPath] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  const pulseAnim = useRef(new Animated.Value(1)).current;
  const waveAnims = useRef(Array.from({ length: 7 }, () => new Animated.Value(0.2))).current;
  const pulseRef = useRef<Animated.CompositeAnimation | null>(null);
  const wavesRef = useRef<Animated.CompositeAnimation[]>([]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      sound.stopRecorder().catch(() => { });
      sound.stopPlayer().catch(() => { });
      sound.removeRecordBackListener();
      sound.removePlaybackEndListener();
    };
  }, []);

  const handlePlayAudio = useCallback(async (url: string) => {
    if (isPlaying) {
      await sound.stopPlayer();
      setIsPlaying(false);
      return;
    }
    try {
      const fullUrl = url.startsWith('http') ? url : `${API_BASE_URL}${url}`;
      sound.addPlaybackEndListener(() => {
        setIsPlaying(false);
        sound.removePlaybackEndListener();
      });
      setIsPlaying(true);
      await sound.startPlayer(fullUrl);
    } catch (err) {
      console.error('[Playback] Failed:', err);
      setIsPlaying(false);
      Alert.alert('Playback Error', 'Could not play the voice response.');
    }
  }, [isPlaying]);

  // Recording animations
  useEffect(() => {
    if (!isRecording) {
      pulseRef.current?.stop();
      wavesRef.current.forEach((w) => w.stop());
      pulseAnim.setValue(1);
      waveAnims.forEach((a) => a.setValue(0.2));
      return;
    }

    pulseRef.current = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.12, duration: 500, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
      ]),
    );
    pulseRef.current.start();

    wavesRef.current = waveAnims.map((a, i) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(i * 60),
          Animated.timing(a, { toValue: Math.random() * 0.7 + 0.3, duration: 250, useNativeDriver: true }),
          Animated.timing(a, { toValue: 0.2, duration: 250, useNativeDriver: true }),
        ]),
      ),
    );
    wavesRef.current.forEach((w) => w.start());
  }, [isRecording, pulseAnim, waveAnims]);

  const requestMicPermission = async (): Promise<boolean> => {
    if (Platform.OS === 'android') {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
        {
          title: 'Microphone Permission',
          message: 'PaySafe AI needs microphone access to process your voice query.',
          buttonPositive: 'Allow',
          buttonNegative: 'Cancel',
        },
      );
      return granted === PermissionsAndroid.RESULTS.GRANTED;
    }
    return true; // iOS handles this via Info.plist
  };

  const handleStartRecording = useCallback(async () => {
    const hasPermission = await requestMicPermission();
    if (!hasPermission) {
      Alert.alert('Permission Denied', 'Microphone permission is required to use voice query.');
      return;
    }

    try {
      setResult(null);
      setDuration(0);
      setRecordedPath(null);

      const path = await sound.startRecorder(
        undefined, // use default path
        {
          AudioEncoderAndroid: AudioEncoderAndroidType.AAC,
          AudioSourceAndroid: AudioSourceAndroidType.MIC,
          OutputFormatAndroid: OutputFormatAndroidType.MPEG_4,
          AVEncoderAudioQualityKeyIOS: AVEncoderAudioQualityIOSType.high,
          AVNumberOfChannelsKeyIOS: 1,
          AVFormatIDKeyIOS: 'aac', // string literal — AVEncodingOption is a type, not enum
        },
      );

      sound.addRecordBackListener((e) => {
        setDuration(Math.floor(e.currentPosition / 1000));
      });

      setRecordedPath(path);
      setIsRecording(true);
    } catch (err) {
      console.error('[Recording] Failed to start:', err);
      Alert.alert('Error', 'Could not start recording. Please try again.');
    }
  }, []);

  const handleStopAndQuery = useCallback(async () => {
    if (!isRecording) return;

    try {
      const path = await sound.stopRecorder();
      sound.removeRecordBackListener();
      setIsRecording(false);
      setLoading(true);

      const audioPath = recordedPath ?? path;
      const cleanPath = audioPath.replace(/^file:\/\//, ''); // Ensure no double prefix

      const form = new FormData();
      form.append('merchant_id', merchantId);
      form.append('audio_file', {
        uri: Platform.OS === 'android' ? `file://${cleanPath}` : audioPath,
        name: 'voice_query.mp4',
        type: 'audio/mp4',
      } as any);

      const res = await api.merchant.voiceQuery(form);
      setResult(res);
      setHistory((h) => [res, ...h.slice(0, 4)]);

      if (res.voice_response_url) {
        handlePlayAudio(res.voice_response_url);
      }
    } catch (err) {
      console.error('[VoiceQuery] API failed:', err);
      setResult({
        query_text: 'Voice query',
        answer_text: 'Could not process your query. Please check your connection and try again.',
        voice_response_url: '',
      });
    } finally {
      setLoading(false);
    }
  }, [isRecording, recordedPath, merchantId]);

  const formatTime = (s: number) => `0:${String(s).padStart(2, '0')}`;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.primaryDark} />

      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Icon name="arrow-left" size={24} color={Colors.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Voice Business Query</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Mic card */}
        <View style={styles.micCard}>
          <Text style={styles.micTitle}>Ask about your business</Text>
          <Text style={styles.micSubtitle}>Speak in Hindi or English</Text>

          {/* Waveform */}
          <View style={styles.waveform}>
            {waveAnims.map((anim, i) => (
              <Animated.View
                key={i}
                style={[
                  styles.waveBar,
                  {
                    transform: [{ scaleY: anim }],
                    backgroundColor: isRecording ? Colors.primaryDark : Colors.border,
                  },
                ]}
              />
            ))}
          </View>

          {isRecording && (
            <Text style={styles.timerText}>{formatTime(duration)}</Text>
          )}

          <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
            <TouchableOpacity
              style={[styles.micBtn, isRecording && styles.micBtnActive]}
              onPress={isRecording ? handleStopAndQuery : handleStartRecording}
              disabled={loading}
              activeOpacity={0.85}>
              {loading ? (
                <ActivityIndicator size="large" color={Colors.white} />
              ) : (
                <Icon
                  name={isRecording ? 'stop' : 'microphone'}
                  size={34}
                  color={Colors.white}
                />
              )}
            </TouchableOpacity>
          </Animated.View>

          <Text style={styles.micHint}>
            {loading
              ? 'Processing your query...'
              : isRecording
                ? 'Tap to stop & send'
                : 'Tap to ask a question'}
          </Text>
        </View>

        {/* Example queries */}
        {!result && !loading && (
          <View style={styles.examplesCard}>
            <Text style={styles.examplesTitle}>Try asking:</Text>
            {EXAMPLE_QUERIES.map((q, i) => (
              <View key={i} style={styles.exampleRow}>
                <Icon name="microphone-outline" size={14} color={Colors.primary} />
                <Text style={styles.exampleText}>{q}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Latest result */}
        {result && (
          <View style={styles.resultCard}>
            <View style={styles.resultHeader}>
              <Icon name="comment-question-outline" size={18} color={Colors.textSecondary} />
              <Text style={styles.resultQuestion}>{result.query_text}</Text>
            </View>
            <View style={styles.resultBody}>
              <Icon name="robot-outline" size={18} color={Colors.primaryMid} />
              <Text style={styles.resultAnswer}>{result.answer_text}</Text>
            </View>
            {result.voice_response_url ? (
              <TouchableOpacity
                style={styles.playbackBtn}
                onPress={() => handlePlayAudio(result.voice_response_url)}>
                <Icon name={isPlaying ? "stop-circle-outline" : "play-circle-outline"} size={22} color={Colors.primaryDark} />
                <Text style={styles.playbackText}>{isPlaying ? 'Stop Audio' : 'Play Voice Answer'}</Text>
              </TouchableOpacity>
            ) : null}
          </View>
        )}

        {/* History */}
        {history.length > 1 && (
          <View style={styles.historyCard}>
            <Text style={styles.historyTitle}>Recent Queries</Text>
            {history.slice(1).map((item, i) => (
              <View key={i} style={styles.historyItem}>
                <Text style={styles.historyQ} numberOfLines={1}>{item.query_text}</Text>
                <Text style={styles.historyA} numberOfLines={2}>{item.answer_text}</Text>
              </View>
            ))}
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
  scroll: { padding: Spacing.base, gap: Spacing.base, paddingBottom: Spacing['3xl'] },
  micCard: {
    backgroundColor: Colors.white, borderRadius: 16, padding: Spacing.xl,
    alignItems: 'center', gap: Spacing.base,
    elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.07, shadowRadius: 6,
  },
  micTitle: { fontSize: Typography.size.xl, fontWeight: Typography.weight.bold, color: Colors.textPrimary },
  micSubtitle: { fontSize: Typography.size.sm, color: Colors.textSecondary },
  waveform: { flexDirection: 'row', alignItems: 'center', gap: 5, height: 52, marginVertical: Spacing.sm },
  waveBar: { width: 5, height: 36, borderRadius: 3 },
  timerText: { fontSize: Typography.size.xl, fontWeight: Typography.weight.bold, color: Colors.primaryDark, letterSpacing: 2 },
  micBtn: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: Colors.primaryDark, alignItems: 'center', justifyContent: 'center',
    elevation: 8, shadowColor: Colors.primaryDark, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35, shadowRadius: 10,
  },
  micBtnActive: { backgroundColor: Colors.error },
  micHint: { fontSize: Typography.size.sm, color: Colors.textSecondary },
  examplesCard: {
    backgroundColor: Colors.white, borderRadius: 14, padding: Spacing.base,
    gap: Spacing.sm, elevation: 1, shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2,
  },
  examplesTitle: { fontSize: Typography.size.sm, fontWeight: Typography.weight.bold, color: Colors.textPrimary, marginBottom: 4 },
  exampleRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, paddingVertical: 4 },
  exampleText: { fontSize: Typography.size.sm, color: Colors.textSecondary, fontStyle: 'italic' },
  resultCard: {
    backgroundColor: Colors.white, borderRadius: 14, overflow: 'hidden',
    borderWidth: 1.5, borderColor: Colors.primary + '40',
    elevation: 1, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2,
  },
  resultHeader: {
    flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.sm,
    padding: Spacing.base, backgroundColor: Colors.offWhite, borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  resultQuestion: { flex: 1, fontSize: Typography.size.sm, color: Colors.textSecondary, fontStyle: 'italic' },
  resultBody: { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.sm, padding: Spacing.base },
  resultAnswer: { flex: 1, fontSize: Typography.size.md, color: Colors.textPrimary, lineHeight: 22 },
  playbackBtn: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.xs,
    alignSelf: 'flex-start', paddingHorizontal: Spacing.base, paddingBottom: Spacing.base
  },
  playbackText: { fontSize: Typography.size.sm, color: Colors.primaryDark, fontWeight: Typography.weight.medium },
  historyCard: {
    backgroundColor: Colors.white, borderRadius: 14, padding: Spacing.base,
    elevation: 1, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2,
  },
  historyTitle: { fontSize: Typography.size.base, fontWeight: Typography.weight.bold, color: Colors.textPrimary, marginBottom: Spacing.sm },
  historyItem: { paddingVertical: Spacing.sm, borderTopWidth: 1, borderTopColor: Colors.border },
  historyQ: { fontSize: Typography.size.xs, color: Colors.primary, fontWeight: Typography.weight.medium, marginBottom: 2 },
  historyA: { fontSize: Typography.size.xs, color: Colors.textSecondary, lineHeight: 18 },
});
