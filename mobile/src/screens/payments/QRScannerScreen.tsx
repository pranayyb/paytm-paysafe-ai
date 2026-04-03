import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  StyleSheet, Text, View, TouchableOpacity,
  StatusBar, Animated, AppState, ActivityIndicator,
} from 'react-native';
import {
  Camera,
  useCameraDevice,
  useCameraPermission,
  useCodeScanner,
} from 'react-native-vision-camera';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useNavigation, useRoute, useIsFocused } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { HomeStackParamList } from '@navigation/types';
import { Colors, Typography, Spacing } from '@theme';
import { api } from '@services/api';

function parseUpiQR(value: string): { upi: string; name: string } | null {
  try {
    if (value.startsWith('upi://')) {
      const url = new URL(value);
      const pa = url.searchParams.get('pa');
      const pn = url.searchParams.get('pn');
      if (pa) return { upi: pa, name: pn ?? pa };
    }
    // Plain UPI ID (e.g. merchant@paytm)
    if (/^[\w.\-]+@[\w]+$/.test(value)) {
      return { upi: value, name: value };
    }
  } catch { }
  return null;
}

export default function QRScannerScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<HomeStackParamList>>();
  const route = useRoute();
  const returnTo = (route.params as { returnTo?: string } | undefined)?.returnTo ?? 'Home';
  const [torchOn, setTorchOn] = useState(false);
  const [scanned, setScanned] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const scannedRef = useRef(false);
  const scanLineAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const isFocused = useIsFocused();
  const [appStateActive, setAppStateActive] = useState(true);

  const { hasPermission, requestPermission } = useCameraPermission();
  const device = useCameraDevice('back');
  const isActive = isFocused && appStateActive && !scanned;

  useEffect(() => {
    if (!hasPermission) {
      requestPermission();
    }
  }, [hasPermission, requestPermission]);

  useEffect(() => {
    const sub = AppState.addEventListener('change', (state) => {
      setAppStateActive(state === 'active');
    });
    return () => sub.remove();
  }, []);

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(scanLineAnim, { toValue: 1, duration: 2000, useNativeDriver: true }),
        Animated.timing(scanLineAnim, { toValue: 0, duration: 2000, useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [scanLineAnim]);

  const runSafetyCheck = useCallback(
    async (rawValue: string, upi: string, name: string) => {
      setAnalyzing(true);
      try {
        const analysisResult = await api.qr.scan(rawValue);
        setAnalyzing(false);
        // Because QRScanner can be accessed directly from MainTabNavigator (ScanTab), 
        // we must route the navigation explicitly to the HomeTab stack which contains QRSafetyResult.
        (navigation as any).navigate('HomeTab', {
          screen: 'QRSafetyResult',
          params: { upiId: upi, recipientName: name, analysisResult }
        });
      } catch {
        setAnalyzing(false);
        if (returnTo === 'SendMoney') {
          navigation.replace('SendMoney', { prefillUpi: upi });
        } else {
          navigation.navigate('SendMoney', { prefillUpi: upi });
        }
      }
    },
    [navigation, returnTo],
  );

  const handleCodeScanned = useCallback(
    (codes: any[]) => {
      if (scannedRef.current || codes.length === 0) return;
      const value: string | undefined = codes[0]?.value;
      if (!value) return;

      const result = parseUpiQR(value);
      if (!result) return;

      scannedRef.current = true;
      setScanned(true);

      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.08, duration: 200, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 200, useNativeDriver: true }),
      ]).start();

      runSafetyCheck(value, result.upi, result.name);
    },
    [pulseAnim, runSafetyCheck],
  );

  const codeScanner = useCodeScanner({
    codeTypes: ['qr'],
    onCodeScanned: handleCodeScanned,
  });

  const scanLineTranslate = scanLineAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-80, 80],
  });

  if (!hasPermission) {
    return (
      <View style={[styles.container, styles.centered]}>
        <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
        <Icon name="camera-off" size={48} color={Colors.white} style={{ opacity: 0.5 }} />
        <Text style={styles.permissionText}>Camera permission required to scan QR codes</Text>
        <TouchableOpacity style={styles.permissionBtn} onPress={requestPermission}>
          <Text style={styles.permissionBtnText}>Grant Permission</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (!device) {
    return (
      <View style={[styles.container, styles.centered]}>
        <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
        <Text style={styles.permissionText}>No camera found on this device</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />

      {/* Real device camera */}
      <Camera
        style={StyleSheet.absoluteFill}
        device={device}
        isActive={isActive}
        codeScanner={codeScanner}
        torch={torchOn ? 'on' : 'off'}
      />

      {/* UI overlay */}
      <View style={styles.overlay}>
        {/* Top bar */}
        <View style={styles.topBar}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.iconBtn}>
            <Icon name="arrow-left" size={24} color={Colors.white} />
          </TouchableOpacity>
          <Text style={styles.title}>Scan & Pay</Text>
          <TouchableOpacity style={styles.iconBtn} onPress={() => setTorchOn((t) => !t)}>
            <Icon
              name={torchOn ? 'flashlight' : 'flashlight-off'}
              size={22}
              color={torchOn ? Colors.primary : Colors.white}
            />
          </TouchableOpacity>
        </View>

        {/* Scan frame (centered over camera) */}
        <View style={styles.cameraArea} pointerEvents="none">
          <Animated.View
            style={[styles.frame, scanned && styles.frameSuccess, { transform: [{ scale: pulseAnim }] }]}>
            <View style={[styles.corner, styles.topLeft, scanned && styles.cornerSuccess]} />
            <View style={[styles.corner, styles.topRight, scanned && styles.cornerSuccess]} />
            <View style={[styles.corner, styles.bottomLeft, scanned && styles.cornerSuccess]} />
            <View style={[styles.corner, styles.bottomRight, scanned && styles.cornerSuccess]} />

            {!scanned && (
              <Animated.View
                style={[styles.scanLine, { transform: [{ translateY: scanLineTranslate }] }]}
              />
            )}

            {scanned && (
              <View style={styles.successIcon}>
                <Icon name="check" size={40} color={Colors.success} />
              </View>
            )}
          </Animated.View>

          <Text style={styles.tapHint}>
            {analyzing ? 'Checking safety...' : scanned ? 'QR Code Scanned!' : 'Point camera at a UPI QR code'}
          </Text>
          {analyzing && (
            <View style={styles.analyzingRow}>
              <ActivityIndicator size="small" color={Colors.primary} />
              <Text style={styles.analyzingText}>AI safety analysis in progress</Text>
            </View>
          )}
        </View>

        {/* Bottom bar */}
        <View style={styles.bottomBar}>
          <Text style={styles.hint}>Align the QR code within the frame</Text>
          <View style={styles.bottomActions}>
            <TouchableOpacity style={styles.actionChip}>
              <Icon name="image-outline" size={16} color={Colors.white} />
              <Text style={styles.actionChipText}>Gallery</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </View>
  );
}

const FRAME_SIZE = 220;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  centered: { alignItems: 'center', justifyContent: 'center', gap: Spacing.base },
  overlay: { flex: 1 },
  topBar: {
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
  cameraArea: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  frame: {
    width: FRAME_SIZE,
    height: FRAME_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
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
    opacity: 0.9,
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
  permissionText: {
    color: Colors.white,
    fontSize: Typography.size.md,
    textAlign: 'center',
    paddingHorizontal: Spacing.xl,
    opacity: 0.8,
  },
  permissionBtn: {
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.xl,
    backgroundColor: Colors.primary,
    borderRadius: 8,
  },
  permissionBtnText: {
    color: Colors.white,
    fontSize: Typography.size.md,
    fontWeight: Typography.weight.semibold,
  },
  analyzingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginTop: Spacing.sm,
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.xs,
    borderRadius: 20,
  },
  analyzingText: {
    color: Colors.white,
    fontSize: Typography.size.xs,
    opacity: 0.9,
  },
});
