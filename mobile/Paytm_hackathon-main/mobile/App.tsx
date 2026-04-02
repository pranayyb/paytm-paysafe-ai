import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Alert, ActivityIndicator, StatusBar, Animated, Platform } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { useFonts } from 'expo-font';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AudioModule, InterruptionMode, useAudioPlayer } from 'expo-audio';

// Modular Components
import { PAYTM_BLUE, PAYTM_LIGHT_BLUE, WHITE, BACKGROUND_COLOR } from './src/styles/theme';
import { Header } from './src/layout/Header';
import { Navbar } from './src/layout/Navbar';
import { AuthScreen } from './src/screens/AuthScreen';
import { HomeScreen } from './src/screens/HomeScreen';
import { HistoryScreen } from './src/screens/HistoryScreen';
import { AlertsScreen } from './src/screens/AlertsScreen';
import { ProfileScreen } from './src/screens/ProfileScreen';
import { ScanScreen } from './src/screens/ScanScreen';
import { TransferScreen } from './src/screens/TransferScreen';
import { RechargeScreen } from './src/screens/RechargeScreen';
import { VoiceEnrollScreen } from './src/screens/VoiceEnrollScreen';
import { VoicePayModal } from './src/components/VoicePayModal';
import { SuccessOverlay } from './src/components/SuccessOverlay';
import { QRModal } from './src/components/QRModal';
import { MockService } from './src/services/MockService';
import { MerchantDashboard } from './src/screens/MerchantDashboard';
import { PaymentSuccessScreen } from './src/screens/PaymentSuccessScreen';

// ⚠️ IMPORTANT: After restarting `python main.py`, copy the ngrok URL printed in the terminal and paste it below.
// Use the public tunnel unconditionally for off-network friends.
const BACKEND_LOCAL = 'http://192.168.1.6:8000';
const BACKEND_TUNNEL = 'https://paytm-voice-api-98342.loca.lt'; // tunnel URL for universal global access
const BACKEND = BACKEND_TUNNEL;
const PAYTM_SUCCESS_SOUND = 'https://res.cloudinary.com/da2imhgtf/video/upload/v1774766529/New_Project_5_w3uzoe.mp3';

const safeJson = async (res: Response) => {
  const txt = await res.text();
  try { return JSON.parse(txt); } catch { return { detail: 'Invalid server response' }; }
};

export default function App() {
  const [fontsLoaded, fontError] = useFonts({
    'Inter-Regular': 'https://cdn.jsdelivr.net/gh/rsms/inter@v3.19/docs/font-files/Inter-Regular.ttf',
    'Inter-Medium': 'https://cdn.jsdelivr.net/gh/rsms/inter@v3.19/docs/font-files/Inter-Medium.ttf',
    'Inter-SemiBold': 'https://cdn.jsdelivr.net/gh/rsms/inter@v3.19/docs/font-files/Inter-SemiBold.ttf',
    'Inter-Bold': 'https://cdn.jsdelivr.net/gh/rsms/inter@v3.19/docs/font-files/Inter-Bold.ttf',
    'Inter-ExtraBold': 'https://cdn.jsdelivr.net/gh/rsms/inter@v3.19/docs/font-files/Inter-ExtraBold.ttf',
  });

  const successPlayer = useAudioPlayer(PAYTM_SUCCESS_SOUND);

  useEffect(() => {
    if (fontError) console.log('❌ Font Loading Error:', fontError);
    if (fontsLoaded) console.log('✅ Fonts Loaded Successfully');
  }, [fontsLoaded, fontError]);

  const [bootstrapped, setBootstrapped] = useState(false);

  useEffect(() => {
    // Hide loader if fonts take too long (fallback to system fonts)
    const timer = setTimeout(() => setBootstrapped(true), 3500);
    if (fontsLoaded || fontError) setBootstrapped(true);
    return () => clearTimeout(timer);
  }, [fontsLoaded, fontError]);

  const [token, setToken] = useState<string | null>(null);
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('signup');
  const [authEmail, setAuthEmail] = useState('');
  const [authName, setAuthName] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authOtp, setAuthOtp] = useState('');
  const [showOtpField, setShowOtpField] = useState(false);
  const [authLoading, setAuthLoading] = useState(false);

  const [activeTab, setActiveTab] = useState('home');
  const [subScreen, setSubScreen] = useState<string | null>(null);
  const [profile, setProfile] = useState<any>(null);
  const [balance, setBalance] = useState<any>(null);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [showUserQR, setShowUserQR] = useState(false);
  const [scannedRecipient, setScannedRecipient] = useState<{ id: string, name: string } | null>(null);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [showVoicePay, setShowVoicePay] = useState(false);
  const [voicePayPreload, setVoicePayPreload] = useState<{ amt: string, upi: string } | null>(null);
  const [successMsg, setSuccessMsg] = useState({ visible: false, title: '', sub: '' });
  const [successData, setSuccessData] = useState<{ amount: number, name: string, duration: number } | null>(null);

  useEffect(() => {
    const checkLogin = async () => {
      try {
        const savedToken = await AsyncStorage.getItem('authToken');
        const authTime = await AsyncStorage.getItem('authTime');
        if (savedToken && authTime) {
          // 24 hours in milliseconds = 86400000
          if (Date.now() - parseInt(authTime) < 86400000) {
            setToken(savedToken);
          } else {
            await AsyncStorage.removeItem('authToken');
            await AsyncStorage.removeItem('authTime');
          }
        }
      } catch (e) {
        console.error('Failed to load storage', e);
      }
    };
    checkLogin();

    // 🔊 Global Audio Session Setup for iOS Biometrics
    (async () => {
      try {
        if (Platform.OS === 'ios') {
          await AudioModule.setAudioModeAsync({
            allowsRecording: true,
            playsInSilentMode: true,
          });
          console.log("✅ Global iOS Audio Session Activated");
        }
      } catch (e) {
        console.error("❌ Failed to set global audio mode:", e);
      }
    })();
  }, []);

  const authFetch = async (endpoint: string, tkn?: string) => {
    const t = tkn || token;
    const res = await fetch(`${BACKEND}${endpoint}`, {
      headers: {
        'Authorization': `Bearer ${t}`,
        'Content-Type': 'application/json',
        'Bypass-Tunnel-Reminder': 'true'
      }
    });

    if (res.status === 401) {
      await AsyncStorage.removeItem('authToken');
      await AsyncStorage.removeItem('authTime');
      setToken(null);
      throw new Error('Session expired');
    }

    const text = await res.text();
    try {
      return JSON.parse(text);
    } catch {
      if (text.includes('localtunnel.me') || text.includes('loca.lt')) {
        throw new Error('Tunnel is blocked by your network provider or ISP.');
      }
      throw new Error('Invalid response from server');
    }
  };

  const globalFetch = async (url: string, options: any = {}) => {
    const headers = {
      ...(options.headers || {}),
      'Bypass-Tunnel-Reminder': 'true',
    };

    if (token && !headers['Authorization']) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    if (options.body && !headers['Content-Type'] && !(options.body instanceof FormData)) {
      headers['Content-Type'] = 'application/json';
    }

    return fetch(url, { ...options, headers });
  };

  const loadAllData = async () => {
    try {
      const p = await authFetch('/user/profile');
      setProfile(p);

      const b = await authFetch('/user/balance');
      setBalance(b);

      const t = await authFetch('/user/transactions?limit=20');
      setTransactions(t.transactions || []);

      const n = await authFetch('/user/notifications');
      setNotifications(n.notifications || []);
    } catch (e) { console.log('Load error:', e); }
  };

  useEffect(() => { if (token) loadAllData(); }, [token]);

  const handleAuth = async (extraData: any = {}) => {
    if (!authEmail || !authPassword || (authMode === 'signup' && !authName) || (showOtpField && !authOtp)) {
      Alert.alert('Missing Fields', 'Please fill all required fields');
      return;
    }
    setAuthLoading(true);
    try {
      if (!showOtpField) {
        const res = await globalFetch(`${BACKEND}/auth/send-otp`, {
          method: 'POST',
          body: JSON.stringify({
            email: authEmail.toLowerCase().trim(),
            password: authPassword,
            is_login: authMode === 'login'
          })
        });
        const data = await safeJson(res);
        if (!res.ok) throw new Error(data.detail || 'Failed to send OTP');
        setShowOtpField(true);
        setSuccessMsg({ visible: true, title: 'OTP Sent', sub: data.message || 'Check your email' });
      } else {
        const endpoint = authMode === 'signup' ? '/auth/signup' : '/auth/login';

        let body: any = {
          email: authEmail.toLowerCase().trim(),
          password: authPassword,
          otp: authOtp
        };

        if (authMode === 'signup') {
          body.name = authName;
          body.role = extraData.authRole || 'customer';
          if (body.role === 'merchant') {
            body.business_name = extraData.businessName;
            body.business_category = extraData.businessCategory;
            body.business_address = extraData.businessAddress;
          }
        }

        const res = await globalFetch(`${BACKEND}${endpoint}`, {
          method: 'POST',
          body: JSON.stringify(body)
        });
        const data = await safeJson(res);
        if (!res.ok) throw new Error(data.detail || 'Auth failed');
        setSuccessMsg({ visible: false, title: '', sub: '' });
        setToken(data.token);
        await AsyncStorage.setItem('authToken', data.token);
        await AsyncStorage.setItem('authTime', Date.now().toString());
      }
    } catch (e: any) { Alert.alert('Error', e.message); }
    setAuthLoading(false);
  };

  const handleTransfer = async (amount: number, recipient: string, password: string) => {
    setAuthLoading(true);
    const start = Date.now();
    try {
      const res = await globalFetch(`${BACKEND}/payment/upi`, {
        method: 'POST',
        body: JSON.stringify({ recipient, amount, password })
      });
      const data = await safeJson(res);
      if (!res.ok) throw new Error(data.detail || 'Transfer failed');
      const end = Date.now();

      // Trigger success sound immediately
      if (successPlayer) successPlayer.play();

      setSuccessData({
        amount,
        name: data.recipient || recipient,
        duration: (end - start) / 1000
      });
      setSubScreen('payment_success');
      loadAllData();
    } catch (e: any) { Alert.alert('Error', e.message); }
    setAuthLoading(false);
  };

  const logout = async () => {
    await AsyncStorage.removeItem('authToken');
    await AsyncStorage.removeItem('authTime');
    setToken(null);
    setAuthEmail(''); setAuthPassword(''); setAuthOtp(''); setAuthName('');
    setShowOtpField(false); setActiveTab('home');
  };

  const processVoicePlay = (preload?: { amt: string, upi: string }) => {
    if (preload) {
      setVoicePayPreload(preload);
    } else {
      setVoicePayPreload(null);
    }
    setShowVoicePay(true);
  };


  const handleRecharge = async (num: string, amt: number) => {
    setAuthLoading(true);
    try {
      const formData = new FormData();
      formData.append('mobile_number', num);
      formData.append('operator', 'Jio');
      formData.append('amount', amt.toString());

      const res = await globalFetch(`${BACKEND}/payment/recharge`, {
        method: 'POST',
        body: formData
      });
      const data = await safeJson(res);
      if (!res.ok) throw new Error(data.detail || 'Recharge failed');
      setSuccessMsg({ visible: true, title: 'Recharge Done', sub: `₹${amt} credited to ${num}` });
      loadAllData();
    } catch (e: any) { Alert.alert('Error', e.message); }
    setAuthLoading(false);
  };

  const handleEnrollVoice = () => {
    setSubScreen('voiceguard');
  };


  if (!bootstrapped && !fontsLoaded) {
    return (
      <SafeAreaProvider>
        <View style={[s.loader, { backgroundColor: isDarkMode ? '#121212' : WHITE }]}>
          <ActivityIndicator size="large" color={isDarkMode ? PAYTM_LIGHT_BLUE : PAYTM_BLUE} />
          <Text style={{ marginTop: 20, color: isDarkMode ? '#AAA' : '#888', fontFamily: 'System' }}>Securing your session...</Text>
        </View>
      </SafeAreaProvider>
    );
  }

  if (!token) {
    return (
      <SafeAreaProvider>
        <AuthScreen
          authMode={authMode} setAuthMode={setAuthMode}
          authEmail={authEmail} setAuthEmail={setAuthEmail}
          authName={authName} setAuthName={setAuthName}
          authPassword={authPassword} setAuthPassword={setAuthPassword}
          authOtp={authOtp} setAuthOtp={setAuthOtp}
          showOtpField={showOtpField} setShowOtpField={setShowOtpField}
          authLoading={authLoading} handleAuth={handleAuth}
        />
      </SafeAreaProvider>
    );
  }

  return (
    <SafeAreaProvider>
      <SafeAreaView style={[s.container, { backgroundColor: isDarkMode ? '#0D0D0D' : BACKGROUND_COLOR }]} edges={['top', 'left', 'right']}>
        <StatusBar barStyle={isDarkMode ? "light-content" : "dark-content"} backgroundColor={isDarkMode ? PAYTM_LIGHT_BLUE : PAYTM_BLUE} />
        {subScreen !== 'scan' && subScreen !== 'payment_success' && (
          <Header
            userName={profile?.name || 'User'}
            userRole={profile?.role}
            onProfilePress={() => setShowUserQR(true)}
            onBellPress={() => setActiveTab('notifs')}
            isDarkMode={isDarkMode}
          />
        )}

        {activeTab === 'home' && (
          subScreen === 'scan' ? <ScanScreen
            onBack={() => setSubScreen(null)}
            onScan={(data) => { setScannedRecipient(data); setSubScreen('transfer'); }}
            token={token}
            backendUrl={BACKEND}
            isDarkMode={isDarkMode}
          /> :
            subScreen === 'transfer' ? <TransferScreen
              onBack={() => { setSubScreen(null); setScannedRecipient(null); }}
              onTransfer={(a, r, p) => { setScannedRecipient(null); handleTransfer(a, r, p); }}
              onVoicePay={(a, r) => { setScannedRecipient(null); setSubScreen(null); processVoicePlay({ amt: a.toString(), upi: r }); }}
              initialRecipient={scannedRecipient || undefined}
              isDarkMode={isDarkMode}
            /> :
              subScreen === 'recharge' ? <RechargeScreen
                onBack={() => setSubScreen(null)}
                onRecharge={(n, a) => { setSubScreen(null); handleRecharge(n, a); }}
                isDarkMode={isDarkMode}
              /> :
                subScreen === 'history' ? <HistoryScreen transactions={transactions} isDarkMode={isDarkMode} onBack={() => setSubScreen(null)} token={token} backendUrl={BACKEND} /> :
                  subScreen === 'merchant_dashboard' ? <MerchantDashboard onBack={() => setSubScreen(null)} token={token} backendUrl={BACKEND} isDarkMode={isDarkMode} /> :
                    subScreen === 'voiceguard' ? <VoiceEnrollScreen
                      onBack={() => setSubScreen(null)}
                      onComplete={() => { setSubScreen(null); loadAllData(); }}
                      token={token}
                      backendUrl={BACKEND}
                      isDarkMode={isDarkMode}
                    /> :
                      subScreen === 'payment_success' ? <PaymentSuccessScreen
                        amount={successData?.amount || 0}
                        recipientName={successData?.name || 'Unknown'}
                        duration={successData?.duration || 0}
                        onDone={() => setSubScreen(null)}
                      /> :
                        <HomeScreen
                          balance={balance}
                          transactions={transactions}
                          setSubScreen={setSubScreen}
                          isDarkMode={isDarkMode}
                          onAction={(type) => {
                            if (type === 'scan' || type === 'upi') {
                              setSubScreen(type === 'scan' ? 'scan' : 'transfer');
                            } else if (type === 'mob') {
                              setSubScreen('recharge');
                            } else if (type === 'voiceguard') {
                              setSubScreen('voiceguard');
                            } else if (type === 'add') {
                              Alert.alert('Add Money', 'Redirecting to secure gateway...');
                            }
                          }}
                        />
        )}
        {activeTab === 'history' && <HistoryScreen transactions={transactions} isDarkMode={isDarkMode} token={token} backendUrl={BACKEND} />}
        {activeTab === 'notifs' && <AlertsScreen notifications={notifications} isDarkMode={isDarkMode} />}
        {activeTab === 'profile' && <ProfileScreen profile={profile} logout={logout} onEnroll={handleEnrollVoice} isDarkMode={isDarkMode} setIsDarkMode={setIsDarkMode} onBack={() => setActiveTab('home')} onMerchantDashboard={() => { setActiveTab('home'); setSubScreen('merchant_dashboard'); }} />}

        <VoicePayModal
          visible={showVoicePay}
          onClose={() => { setShowVoicePay(false); setVoicePayPreload(null); }}
          isDarkMode={isDarkMode}
          token={token}
          backendUrl={BACKEND}
          voiceEnrolled={balance?.voice_enrolled || false}
          initialRecipient={voicePayPreload?.upi}
          initialAmount={voicePayPreload?.amt}
          onPaymentSuccess={(data: any) => {
            setShowVoicePay(false);
            setVoicePayPreload(null);

            // Trigger success sound immediately
            if (successPlayer) successPlayer.play();

            setSuccessData({
              amount: data.amount,
              name: data.recipient || 'Customer',
              duration: data.process_time || 2.45
            });
            setSubScreen('payment_success');
            loadAllData();
          }}
          onEnrollPress={() => setSubScreen('voiceguard')}
        />
        {!subScreen && (
          <Navbar
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            setShowVoicePay={() => processVoicePlay()}
            isDarkMode={isDarkMode}
          />
        )}

        <SuccessOverlay
          visible={successMsg.visible}
          message={successMsg.title}
          submessage={successMsg.sub}
          onFinish={() => setSuccessMsg({ ...successMsg, visible: false })}
        />

        <QRModal
          visible={showUserQR}
          onClose={() => setShowUserQR(false)}
          profile={profile}
          isDarkMode={isDarkMode}
          setIsDarkMode={setIsDarkMode}
        />
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: BACKGROUND_COLOR },
  loader: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: WHITE },
});
