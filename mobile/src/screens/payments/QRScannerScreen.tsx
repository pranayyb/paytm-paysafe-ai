import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet, Text, View, TouchableOpacity,
  StatusBar, Animated,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { HomeStackParamList } from '@navigation/types';
import { Colors, Typography, Spacing } from '@theme';

// Mock QR payloads that simulate real Paytm QR scans
const MOCK_QR_RESULTS = [
  { upi: 'zomato@icici', name: 'Zomato' },
  { upi: 'swiggy@ybl', name: 'Swiggy' },
  { upi: 'merchant@paytm', name: 'Local Store' },
  { upi: 'petrol@okaxis', name: 'HP Petrol Pump' },
];

export default function QRScannerScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<HomeStackParamList>>();
  const route = useRoute();
  const returnTo = (route.params as { returnTo?: string } | undefined)?.returnTo ?? 'Home';
  const [scanning, setScanning] = useState(false);
  const [torchOn, setTorchOn] = useState(false);
  const [scanned, setScanned] = useState(false);
  const scanLineAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  // Animate scan line up/down
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(scanLineAnim, { toValue: 1, duration: 2000, useNativeDriver: true }),
        Animated.timing(scanLineAnim, { toValue: 0, duration: 2000, useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, []);

  const handleTapToScan = () => {
    if (scanning || scanned) return;
    setScanning(true);

    // Pulse animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.08, duration: 300, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 300, useNativeDriver: true }),
      ]),
      { iterations: 3 },
    ).start();

    // Simulate scan after 1.5s
    setTimeout(() => {
      const result = MOCK_QR_RESULTS[Math.floor(Math.random() * MOCK_QR_RESULTS.length)];
      setScanned(true);
      setScanning(false);

      setTimeout(() => {
        if (returnTo === 'SendMoney') {
          navigation.replace('SendMoney', { prefillUpi: result.upi });
        } else {
          navigation.navigate('SendMoney', { prefillUpi: result.upi });
        }
      }, 600);
    }, 1500);
  };

  const scanLineTranslate = scanLineAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-80, 80],
  });

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />

      {/* Top bar */}
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.iconBtn}>
          <Icon name="arrow-left" size={24} color={Colors.white} />
        </TouchableOpacity>
        <Text style={styles.title}>Scan & Pay</Text>
        <TouchableOpacity
          style={styles.iconBtn}
          onPress={() => setTorchOn((t) => !t)}>
          <Icon
            name={torchOn ? 'flashlight' : 'flashlight-off'}
            size={22}
            color={torchOn ? Colors.primary : Colors.white}
          />
        </TouchableOpacity>
      </View>

      {/* Camera dark background */}
      <TouchableOpacity
        style={styles.camera}
        activeOpacity={1}
        onPress={handleTapToScan}>

        {/* Scan frame */}
        <Animated.View style={[styles.frame, scanned && styles.frameSuccess, { transform: [{ scale: pulseAnim }] }]}>
          <View style={[styles.corner, styles.topLeft, scanned && styles.cornerSuccess]} />
          <View style={[styles.corner, styles.topRight, scanned && styles.cornerSuccess]} />
          <View style={[styles.corner, styles.bottomLeft, scanned && styles.cornerSuccess]} />
          <View style={[styles.corner, styles.bottomRight, scanned && styles.cornerSuccess]} />

          {/* Animated scan line */}
          {!scanned && (
            <Animated.View
              style={[styles.scanLine, { transform: [{ translateY: scanLineTranslate }] }]}
            />
          )}

          {/* Success checkmark */}
          {scanned && (
            <View style={styles.successIcon}>
              <Icon name="check" size={40} color={Colors.success} />
            </View>
          )}
        </Animated.View>

        {/* Status text inside camera area */}
        <Text style={styles.tapHint}>
          {scanned
            ? 'QR Code Scanned!'
            : scanning
            ? 'Scanning...'
            : 'Tap anywhere to simulate scan'}
        </Text>
      </TouchableOpacity>

      {/* Bottom bar */}
      <View style={styles.bottomBar}>
        <Text style={styles.hint}>Align the QR code within the frame</Text>
        <View style={styles.bottomActions}>
          <TouchableOpacity style={styles.actionChip} onPress={handleTapToScan}>
            <Icon name="lightning-bolt" size={16} color={Colors.white} />
            <Text style={styles.actionChipText}>Tap to Scan (Mock)</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionChip}>
            <Icon name="image-outline" size={16} color={Colors.white} />
            <Text style={styles.actionChipText}>Gallery</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const FRAME_SIZE = 220;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#111' },
  topBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: Spacing['3xl'],
    paddingHorizontal: Spacing.base,
    paddingBottom: Spacing.base,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  iconBtn: { padding: Spacing.xs },
  title: {
    fontSize: Typography.size.lg,
    fontWeight: Typography.weight.bold,
    color: Colors.white,
  },
  camera: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1a1a1a',
  },
  frame: {
    width: FRAME_SIZE,
    height: FRAME_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  frameSuccess: {},
  corner: {
    position: 'absolute',
    width: 28,
    height: 28,
    borderColor: Colors.primary,
  },
  cornerSuccess: { borderColor: Colors.success },
  topLeft: { top: 0, left: 0, borderTopWidth: 3, borderLeftWidth: 3 },
  topRight: { top: 0, right: 0, borderTopWidth: 3, borderRightWidth: 3 },
  bottomLeft: { bottom: 0, left: 0, borderBottomWidth: 3, borderLeftWidth: 3 },
  bottomRight: { bottom: 0, right: 0, borderBottomWidth: 3, borderRightWidth: 3 },
  scanLine: {
    position: 'absolute',
    left: 4,
    right: 4,
    height: 2,
    backgroundColor: Colors.primary,
    opacity: 0.8,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 6,
    elevation: 4,
  },
  successIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: Colors.success + '20',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tapHint: {
    color: Colors.white,
    fontSize: Typography.size.sm,
    opacity: 0.7,
    marginTop: Spacing.xl,
    textAlign: 'center',
  },
  bottomBar: {
    padding: Spacing.xl,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center',
    gap: Spacing.md,
    paddingBottom: Spacing['2xl'],
  },
  hint: {
    color: Colors.white,
    fontSize: Typography.size.md,
    opacity: 0.9,
    textAlign: 'center',
  },
  bottomActions: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  actionChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.base,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  actionChipText: { color: Colors.white, fontSize: Typography.size.xs },
});
