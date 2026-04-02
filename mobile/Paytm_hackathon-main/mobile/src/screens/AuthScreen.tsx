import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, TextInput, ActivityIndicator, StatusBar, Image, useColorScheme } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ShieldCheck, HelpCircle, X } from 'lucide-react-native';
import { PAYTM_BLUE, PAYTM_LIGHT_BLUE, PAYTM_DARK_THEME_LIGHT_BLUE, SUCCESS_GREEN, WHITE, fonts } from '../styles/theme';

interface AuthScreenProps {
  authMode: 'login' | 'signup';
  setAuthMode: (mode: 'login' | 'signup') => void;
  authEmail: string;
  setAuthEmail: (email: string) => void;
  authName: string;
  setAuthName: (name: string) => void;
  authPassword: string;
  setAuthPassword: (pass: string) => void;
  authOtp: string;
  setAuthOtp: (otp: string) => void;
  showOtpField: boolean;
  setShowOtpField: (show: boolean) => void;
  authLoading: boolean;
  handleAuth: (extraData?: any) => void;
}

export const AuthScreen: React.FC<AuthScreenProps> = ({
  authMode, setAuthMode, authEmail, setAuthEmail, authName, setAuthName,
  authPassword, setAuthPassword, authOtp, setAuthOtp, showOtpField, setShowOtpField,
  authLoading, handleAuth
}) => {
  const [authRole, setAuthRole] = React.useState<'customer' | 'merchant'>('customer');
  const [businessName, setBusinessName] = React.useState('');
  const [businessCategory, setBusinessCategory] = React.useState('');
  const [businessAddress, setBusinessAddress] = React.useState('');

  const paytmLogo = { uri: 'https://res.cloudinary.com/da2imhgtf/image/upload/v1774718149/paytm_logo_zjwmb5.png' };
  const colorScheme = useColorScheme();
  const isDarkMode = colorScheme === 'dark';

  const bg = isDarkMode ? '#121212' : WHITE;
  const textClr = isDarkMode ? '#FFFFFF' : '#111';
  const textMuted = isDarkMode ? '#AAAAAA' : '#666';

  const onAuthPress = () => {
    // We intercept the original handleAuth to inject the extra role fields
    handleAuth({ 
      authRole, 
      businessName: authRole === 'merchant' ? businessName : undefined,
      businessCategory: authRole === 'merchant' ? businessCategory : undefined,
      businessAddress: authRole === 'merchant' ? businessAddress : undefined
    });
  };

  return (
    <SafeAreaView style={[s.authSafe, { backgroundColor: bg }]} edges={['top', 'left', 'right']}>
      <StatusBar barStyle={isDarkMode ? "light-content" : "dark-content"} backgroundColor={bg} />

      <View style={s.cleanAuthHeader}>
        <Image
          source={paytmLogo}
          resizeMode="contain"
          style={{ width: 160, height: 80 }}
          onError={(e) => console.log('❌ Auth logo load error:', e.nativeEvent.error)}
        />
      </View>

      <ScrollView contentContainerStyle={s.authScrollContent} bounces={false}>
        <View style={s.authWelcomeBlock}>
          <Text style={[s.authTitle, { color: textClr }]}>{authMode === 'login' ? 'Login' : 'Create Account'}</Text>
          <Text style={[s.authSub, { color: textMuted }]}>Welcome to the future of voice payments</Text>
        </View>

        <View style={s.authFormContainer}>
          {!showOtpField ? (
            <>
              {authMode === 'signup' && (
                <>
                  {/* Role Selector */}
                  <View style={s.roleSelector}>
                    <TouchableOpacity 
                      style={[s.roleOption, authRole === 'customer' && s.roleActive]} 
                      onPress={() => setAuthRole('customer')}
                    >
                      <Text style={[s.roleText, authRole === 'customer' && [s.roleTextActive, { color: isDarkMode ? PAYTM_DARK_THEME_LIGHT_BLUE : PAYTM_BLUE }]]}>Personal</Text>
                    </TouchableOpacity>
                    <TouchableOpacity 
                      style={[s.roleOption, authRole === 'merchant' && s.roleActive]} 
                      onPress={() => setAuthRole('merchant')}
                    >
                      <Text style={[s.roleText, authRole === 'merchant' && [s.roleTextActive, { color: isDarkMode ? PAYTM_DARK_THEME_LIGHT_BLUE : PAYTM_BLUE }]]}>Merchant Business</Text>
                    </TouchableOpacity>
                  </View>

                  <View style={s.inputContainer}>
                    <Text style={[s.inputLabel, { color: textMuted }]}>Full Name</Text>
                    <TextInput style={[s.premiumInput, { backgroundColor: isDarkMode ? '#1E1E1E' : '#F9FAFC', color: textClr, borderColor: isDarkMode ? '#333' : '#EEE' }]} placeholder="Enter your name" placeholderTextColor="#AAA" value={authName} onChangeText={setAuthName} />
                  </View>

                  {authRole === 'merchant' && (
                    <>
                      <View style={s.inputContainer}>
                        <Text style={[s.inputLabel, { color: textMuted }]}>Business Name</Text>
                        <TextInput style={[s.premiumInput, { backgroundColor: isDarkMode ? '#1E1E1E' : '#F9FAFC', color: textClr, borderColor: isDarkMode ? '#333' : '#EEE' }]} placeholder="e.g. Sharma General Store" placeholderTextColor="#AAA" value={businessName} onChangeText={setBusinessName} />
                      </View>
                      <View style={s.inputContainer}>
                        <Text style={[s.inputLabel, { color: textMuted }]}>Business Category</Text>
                        <TextInput style={[s.premiumInput, { backgroundColor: isDarkMode ? '#1E1E1E' : '#F9FAFC', color: textClr, borderColor: isDarkMode ? '#333' : '#EEE' }]} placeholder="e.g. Retail, Food, Services" placeholderTextColor="#AAA" value={businessCategory} onChangeText={setBusinessCategory} />
                      </View>
                      <View style={s.inputContainer}>
                        <Text style={[s.inputLabel, { color: textMuted }]}>Business Address</Text>
                        <TextInput style={[s.premiumInput, { backgroundColor: isDarkMode ? '#1E1E1E' : '#F9FAFC', color: textClr, borderColor: isDarkMode ? '#333' : '#EEE' }]} placeholder="e.g. Sector 9/11, City" placeholderTextColor="#AAA" value={businessAddress} onChangeText={setBusinessAddress} />
                      </View>
                    </>
                  )}
                </>
              )}
              <View style={s.inputContainer}>
                <Text style={[s.inputLabel, { color: textMuted }]}>Email Address</Text>
                <TextInput style={[s.premiumInput, { backgroundColor: isDarkMode ? '#1E1E1E' : '#F9FAFC', color: textClr, borderColor: isDarkMode ? '#333' : '#EEE' }]} placeholder="name@email.com" placeholderTextColor="#AAA" keyboardType="email-address" autoCapitalize="none" value={authEmail} onChangeText={setAuthEmail} />
              </View>
              <View style={s.inputContainer}>
                <Text style={[s.inputLabel, { color: textMuted }]}>Password</Text>
                <TextInput style={[s.premiumInput, { backgroundColor: isDarkMode ? '#1E1E1E' : '#F9FAFC', color: textClr, borderColor: isDarkMode ? '#333' : '#EEE' }]} placeholder="••••••••" placeholderTextColor="#AAA" secureTextEntry value={authPassword} onChangeText={setAuthPassword} />
              </View>
            </>
          ) : (
            <View style={s.otpAuthContainer}>
              <Text style={[s.otpAuthTitle, { color: textClr }]}>Enter 4-digit OTP</Text>
              <Text style={[s.otpAuthSub, { color: textMuted }]}>Sent to {authEmail}</Text>
              <TextInput style={[s.otpAuthInput, { backgroundColor: isDarkMode ? '#1E1E1E' : '#F9FAFC', color: isDarkMode ? PAYTM_DARK_THEME_LIGHT_BLUE : PAYTM_BLUE, borderColor: isDarkMode ? PAYTM_LIGHT_BLUE : '#EEE' }]} placeholder="0 0 0 0" placeholderTextColor="#555" keyboardType="number-pad" value={authOtp} onChangeText={setAuthOtp} maxLength={4} autoFocus />
            </View>
          )}

          <TouchableOpacity style={[s.actionBtnAuth, { backgroundColor: isDarkMode ? '#1A67B8' : PAYTM_LIGHT_BLUE }]} onPress={onAuthPress} activeOpacity={0.8}>
            {authLoading ? <ActivityIndicator color={WHITE} /> : (
              <Text style={s.actionBtnTextAuth}>
                {!showOtpField ? 'Proceed Securely' : (authMode === 'login' ? 'Verify & Login' : 'Verify & Claim ₹1,000')}
              </Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity onPress={() => { setAuthMode(authMode === 'login' ? 'signup' : 'login'); setShowOtpField(false); setAuthOtp(''); }} style={s.switchAuthBtn}>
            <Text style={[s.switchAuthText, { color: isDarkMode ? PAYTM_DARK_THEME_LIGHT_BLUE : PAYTM_BLUE }]}>{authMode === 'login' ? "New to Paytm? Create an account" : "Already have an account? Login"}</Text>
          </TouchableOpacity>
        </View>

        <View style={[s.authTrustBlock, { backgroundColor: isDarkMode ? '#1E1E1E' : '#F0F9F4' }]}>
          <ShieldCheck size={28} color={isDarkMode ? '#FFFFFF' : SUCCESS_GREEN} />
          <View style={{ marginLeft: 12 }}>
            <Text style={[s.trustTitle, { color: isDarkMode ? '#21C17C' : '#1A531B' }]}>100% Secure & AI Protected</Text>
            <Text style={[s.trustSub, { color: isDarkMode ? '#AAA' : '#1A531B' }]}>Your voice is your unique security key.</Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const s = StyleSheet.create({
  authSafe: { flex: 1, backgroundColor: WHITE },
  cleanAuthHeader: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', paddingHorizontal: 20, paddingTop: 24, height: 70 },
  authScrollContent: { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 40 },
  authWelcomeBlock: { marginBottom: 24 },
  authTitle: { fontSize: 20, fontFamily: fonts.bold, color: '#111' },
  authSub: { fontSize: 13, fontFamily: fonts.regular, color: '#666', marginTop: 2 },
  authFormContainer: { marginBottom: 24 },
  inputContainer: { marginBottom: 14 },
  inputLabel: { fontSize: 12, fontFamily: fonts.semiBold, color: '#555', marginBottom: 6, marginLeft: 4 },
  premiumInput: { backgroundColor: '#F9FAFC', borderRadius: 12, padding: 14, fontSize: 14, fontFamily: fonts.medium, color: '#111', borderWidth: 1, borderColor: '#EEE' },
  otpAuthContainer: { alignItems: 'center', marginBottom: 30 },
  otpAuthTitle: { fontSize: 18, fontFamily: fonts.bold, color: '#111' },
  otpAuthSub: { fontSize: 12, fontFamily: fonts.regular, color: '#888', marginTop: 4 },
  otpAuthInput: { backgroundColor: '#F9FAFC', borderRadius: 16, padding: 20, fontSize: 32, fontFamily: fonts.bold, color: PAYTM_BLUE, letterSpacing: 10, textAlign: 'center', width: '90%', marginTop: 20, borderWidth: 2, borderColor: PAYTM_LIGHT_BLUE },
  actionBtnAuth: { backgroundColor: PAYTM_LIGHT_BLUE, borderRadius: 14, padding: 16, alignItems: 'center', elevation: 0, shadowColor: PAYTM_LIGHT_BLUE, shadowOpacity: 0.3, shadowRadius: 10 },
  actionBtnTextAuth: { color: WHITE, fontSize: 15, fontFamily: fonts.bold },
  switchAuthBtn: { marginTop: 16, alignItems: 'center' },
  switchAuthText: { color: PAYTM_BLUE, fontFamily: fonts.semiBold, fontSize: 13 },
  authTrustBlock: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F0F9F4', padding: 16, borderRadius: 16 },
  trustTitle: { fontSize: 14, fontFamily: fonts.bold, color: '#1A531B' },
  trustSub: { fontSize: 11, fontFamily: fonts.regular, color: '#1A531B', opacity: 0.7 },

  roleSelector: { flexDirection: 'row', backgroundColor: '#F0F5FA', borderRadius: 12, padding: 4, marginBottom: 20 },
  roleOption: { flex: 1, paddingVertical: 12, alignItems: 'center', borderRadius: 8 },
  roleActive: { backgroundColor: WHITE, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 4, elevation: 2 },
  roleText: { fontSize: 13, fontFamily: fonts.medium, color: '#666' },
  roleTextActive: { fontFamily: fonts.bold },
});
