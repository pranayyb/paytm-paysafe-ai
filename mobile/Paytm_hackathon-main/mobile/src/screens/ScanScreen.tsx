import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions, Platform } from 'react-native';
import { ChevronLeft, Camera as CameraIcon, Image as ImageIcon, Zap, ShieldCheck } from 'lucide-react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import { Alert, ActivityIndicator } from 'react-native';
import { PAYTM_BLUE, PAYTM_LIGHT_BLUE, WHITE, SUCCESS_GREEN, fonts } from '../styles/theme';

const { width, height } = Dimensions.get('window');

interface ScanScreenProps {
  onBack: () => void;
  onScan: (data: { id: string, name: string }) => void;
  token: string | null;
  backendUrl: string;
  isDarkMode?: boolean;
}

export const ScanScreen: React.FC<ScanScreenProps> = ({ onBack, onScan, token, backendUrl, isDarkMode = false }) => {
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [isTorchOn, setIsTorchOn] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const themeBlue = isDarkMode ? PAYTM_LIGHT_BLUE : PAYTM_BLUE;

  useEffect(() => {
    if (permission && !permission.granted && permission.canAskAgain) {
      requestPermission();
    }
  }, [permission]);

  const handleBarcodeScanned = async ({ type, data }: { type: string; data: string }) => {
    if (scanned) return;
    setScanned(true);

    let upiId = data;

    // If it's a UPI Intent: upi://pay?pa=piyush@paytm&pn=Piyush
    if (data.includes('upi://pay')) {
      const paMatch = data.match(/[?&]pa=([^&]+)/);
      if (paMatch && paMatch[1]) {
        upiId = decodeURIComponent(paMatch[1]);
      }
    }

    // Verify against backend
    try {
      const res = await fetch(`${backendUrl}/user/verify-upi?upi_id=${encodeURIComponent(upiId)}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Bypass-Tunnel-Reminder': 'true'
        }
      });
      if (!res.ok) {
        throw new Error('User not found!');
      }
      const rawTxt = await res.text();
      let val: any;
      try { val = JSON.parse(rawTxt); } catch { throw new Error('Invalid server response'); }
      onScan({ id: upiId, name: val.name });
    } catch (err: any) {
      Alert.alert('Scan Failed', 'This QR code is invalid or the user does not exist.', [{ text: 'Try Again', onPress: () => setScanned(false) }]);
    }
  };

  const handlePickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Denied', 'We need gallery permission to scan QR from images.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: false,
      quality: 0.8,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      const uri = result.assets[0].uri;
      setIsProcessing(true);
      try {
        // Upload to backend for robust server-side decoding
        const formData = new FormData();
        // @ts-ignore
        formData.append('file', {
          uri: Platform.OS === 'ios' ? uri.replace('file://', '') : uri,
          name: 'scan.jpg',
          type: 'image/jpeg',
        });

        const response = await fetch(`${backendUrl}/qr/decode`, {
          method: 'POST',
          body: formData,
          headers: {
            'Content-Type': 'multipart/form-data',
            'Bypass-Tunnel-Reminder': 'true'
          },
        });

        const resData = await response.json();
        if (response.ok && resData.data) {
          handleBarcodeScanned({ type: 'qr', data: resData.data });
        } else {
          Alert.alert('No QR Found', 'Could not detect any QR code in the selected image.');
        }
      } catch (e) {
        console.error('QR Upload Error:', e);
        Alert.alert('Error', 'Failed to securely process the image. Please check your connection.');
      } finally {
        setIsProcessing(false);
      }
    }
  };

  if (!permission) {
    return <View style={s.container} />;
  }

  if (!permission.granted) {
    return (
      <View style={[s.permissionContainer, { backgroundColor: isDarkMode ? '#121212' : '#F5F7FA' }]}>
        <Text style={[s.permissionText, { color: isDarkMode ? '#FFF' : '#333' }]}>We need your permission to show the camera</Text>
        <TouchableOpacity style={[s.permissionBtn, { backgroundColor: themeBlue }]} onPress={requestPermission}>
          <Text style={s.permissionBtnText}>Grant Permission</Text>
        </TouchableOpacity>
        <TouchableOpacity style={s.cancelBtn} onPress={onBack}>
          <Text style={s.cancelBtnText}>Cancel</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={s.container}>
      <CameraView
        style={StyleSheet.absoluteFillObject}
        facing="back"
        enableTorch={isTorchOn}
        onBarcodeScanned={scanned || isProcessing ? undefined : handleBarcodeScanned}
        barcodeScannerSettings={{
          barcodeTypes: ["qr", "pdf417", "aztec", "datamatrix", "code128"],
        }}
      />

      {/* Overlay UI */}
      <View style={s.overlay}>
        <View style={s.overlayTop}>
          <TouchableOpacity onPress={onBack} style={s.backBtn}>
            <ChevronLeft color={WHITE} size={30} />
          </TouchableOpacity>
          <Text style={s.headerTitle}>Scan Any QR Code</Text>
          <TouchableOpacity 
            style={[s.flashBtn, isTorchOn && { backgroundColor: 'rgba(255, 235, 59, 0.4)', borderRadius: 20 }]} 
            onPress={() => setIsTorchOn(!isTorchOn)}
          >
            <Zap color={isTorchOn ? '#FFEB3B' : WHITE} size={24} />
          </TouchableOpacity>
        </View>

        {/* Scanning Frame */}
        <View style={s.scannerFrameContainer}>
          <View style={s.scannerFrame}>
            <View style={[s.corner, s.topLeft]} />
            <View style={[s.corner, s.topRight]} />
            <View style={[s.corner, s.bottomLeft]} />
            <View style={[s.corner, s.bottomRight]} />
            {!scanned && !isProcessing && <View style={[s.scanLine, { backgroundColor: themeBlue }]} />}
            {isProcessing && (
              <View style={s.processingOverlay}>
                <ActivityIndicator color={WHITE} size="large" />
                <Text style={s.processingText}>Analyzing QR Code...</Text>
              </View>
            )}
          </View>
        </View>

        <View style={s.overlayBottom}>
          <Text style={s.hintText}>Align QR code within the frame to scan</Text>
          <View style={s.bottomActions}>
            <TouchableOpacity style={s.actionIcon} onPress={handlePickImage} disabled={isProcessing}>
              <ImageIcon color={WHITE} size={28} />
              <Text style={s.actionLabel}>Gallery</Text>
            </TouchableOpacity>
            <TouchableOpacity style={s.actionIcon} onPress={() => Alert.alert('Camera', 'You are already using the camera scanner.')}>
              <CameraIcon color={WHITE} size={28} />
              <Text style={s.actionLabel}>Camera</Text>
            </TouchableOpacity>
          </View>

          {/* Security Footer */}
          <View style={s.footer}>
            <ShieldCheck color={SUCCESS_GREEN} size={20} />
            <Text style={s.footerText}>Securely protected by Paytm VoiceGuard AI</Text>
          </View>
        </View>
      </View>
    </View>
  );
};

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  overlay: { flex: 1, justifyContent: 'space-between', backgroundColor: 'transparent' },
  overlayTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: Platform.OS === 'ios' ? 60 : 40, backgroundColor: 'rgba(0,0,0,0.6)', paddingBottom: 20 },
  backBtn: { padding: 8 },
  headerTitle: { color: WHITE, fontSize: 18, fontFamily: fonts.bold },
  flashBtn: { padding: 8 },
  scannerFrameContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  scannerFrame: { width: width * 0.7, height: width * 0.7, justifyContent: 'center', alignItems: 'center' },
  corner: { position: 'absolute', width: 40, height: 40, borderColor: WHITE, borderWidth: 4 },
  topLeft: { top: 0, left: 0, borderRightWidth: 0, borderBottomWidth: 0 },
  topRight: { top: 0, right: 0, borderLeftWidth: 0, borderBottomWidth: 0 },
  bottomLeft: { bottom: 0, left: 0, borderRightWidth: 0, borderTopWidth: 0 },
  bottomRight: { bottom: 0, right: 0, borderLeftWidth: 0, borderTopWidth: 0 },
  scanLine: { width: '80%', height: 2, shadowColor: PAYTM_BLUE, shadowOpacity: 1, shadowRadius: 10, elevation: 0 },
  overlayBottom: { alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.6)' },
  hintText: { color: '#CCC', fontSize: 14, fontFamily: fonts.medium, textAlign: 'center', marginTop: 30, marginBottom: 30 },
  bottomActions: { flexDirection: 'row', justifyContent: 'space-around', width: '100%', paddingBottom: 30 },
  actionIcon: { alignItems: 'center' },
  actionLabel: { color: WHITE, fontSize: 12, fontFamily: fonts.medium, marginTop: 8 },
  footer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 16, backgroundColor: WHITE, width: '100%' },
  footerText: { color: '#444', fontSize: 12, fontFamily: fonts.medium, marginLeft: 8 },

  processingOverlay: { alignItems: 'center', justifyContent: 'center' },
  processingText: { color: WHITE, fontSize: 14, fontFamily: fonts.bold, marginTop: 16, textShadowColor: 'rgba(0,0,0,0.5)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 4 },

  permissionContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  permissionText: { fontSize: 16, fontFamily: fonts.medium, textAlign: 'center', marginBottom: 20 },
  permissionBtn: { paddingHorizontal: 24, paddingVertical: 14, borderRadius: 12, marginBottom: 16, width: '100%', alignItems: 'center' },
  permissionBtnText: { color: WHITE, fontSize: 16, fontFamily: fonts.bold },
  cancelBtn: { paddingVertical: 14, width: '100%', alignItems: 'center' },
  cancelBtnText: { color: '#666', fontSize: 16, fontFamily: fonts.semiBold },
});
