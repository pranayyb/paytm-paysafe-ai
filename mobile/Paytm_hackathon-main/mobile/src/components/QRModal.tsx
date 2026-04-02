import React from 'react';
import { View, Text, StyleSheet, Image, Modal, Dimensions, TouchableOpacity, ScrollView, Switch } from 'react-native';
import { ArrowLeft, Bell, Copy, BadgeCheck, Landmark, Share, Plus, Settings2, Moon, Sun, Store } from 'lucide-react-native';
import { PAYTM_BLUE, PAYTM_LIGHT_BLUE, PAYTM_DARK_THEME_LIGHT_BLUE, WHITE, fonts, DARK_BACKGROUND, DARK_SURFACE, DARK_TEXT, DARK_TEXT_MUTED, DARK_BORDER } from '../styles/theme';

const { width } = Dimensions.get('window');

interface QRModalProps {
  visible: boolean;
  onClose: () => void;
  profile: any;
  isDarkMode: boolean;
  setIsDarkMode: (val: boolean) => void;
}

export const QRModal: React.FC<QRModalProps> = ({ visible, onClose, profile, isDarkMode, setIsDarkMode }) => {
  if (!profile) return null;

  const qrUrl = profile.qr_url || `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=upi://pay?pa=${profile.upi_id || ''}`;
  const mockPhone = profile.upi_id?.split('@')[0] || '9485793073';

  // Dynamic Theme Colors
  const bg = isDarkMode ? DARK_BACKGROUND : '#F5F7FA';
  const surface = isDarkMode ? DARK_SURFACE : WHITE;
  const text = isDarkMode ? DARK_TEXT : '#111';
  const textMuted = isDarkMode ? DARK_TEXT_MUTED : '#666';
  const border = isDarkMode ? DARK_BORDER : '#EEE';
  const headerText = isDarkMode ? WHITE : '#111';
  const themeBlue = isDarkMode ? PAYTM_LIGHT_BLUE : PAYTM_BLUE;

  return (
    <Modal visible={visible} animationType="slide" transparent={false}>
      <View style={[s.screen, { backgroundColor: bg }]}>

        {/* Header matching screenshot */}
        <View style={[s.header, { backgroundColor: bg }]}>
          <TouchableOpacity onPress={onClose} style={s.iconBtn}>
            <ArrowLeft size={24} color={headerText} />
          </TouchableOpacity>
          <View style={s.logoContainer}>
            <Image source={{ uri: 'https://res.cloudinary.com/da2imhgtf/image/upload/v1774718149/paytm_logo_zjwmb5.png' }} resizeMode="contain" style={s.paytmLogo} onError={(e) => console.log('❌ QR logo load error:', e.nativeEvent.error)} />
            <Text style={[s.logoSubtitle, { color: headerText }]}>Accepted Here</Text>
          </View>
          <TouchableOpacity style={s.iconBtn}>
            <Bell size={24} color={headerText} />
          </TouchableOpacity>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.scrollContent}>

          {/* Main QR Card */}
          <View style={[s.card, { backgroundColor: surface, shadowColor: isDarkMode ? '#000' : '#AAA' }]}>

            {/* User Info Row */}
            <View style={s.userInfoRow}>
              <View style={s.avatarContainer}>
                <View style={s.avatar}>
                  {profile.role === 'merchant' ? (
                    <Store size={24} color={isDarkMode ? PAYTM_DARK_THEME_LIGHT_BLUE : PAYTM_LIGHT_BLUE} />
                  ) : (
                    <Text style={[s.avatarText, { color: isDarkMode ? PAYTM_DARK_THEME_LIGHT_BLUE : PAYTM_LIGHT_BLUE }]}>{(profile.name || 'U')[0].toUpperCase()}</Text>
                  )}
                </View>
              </View>
              <View style={s.userDetails}>
                <View style={s.nameRow}>
                  <Text style={[s.name, { color: text }]}>{profile.name || 'User'}</Text>
                  <BadgeCheck size={18} color={PAYTM_LIGHT_BLUE} style={{ marginLeft: 6, marginTop: 2 }} />
                </View>
                <View style={s.upiRow}>
                  <Text style={[s.upiId, { color: textMuted }]}>UPI ID: {profile.upi_id}</Text>
                  <TouchableOpacity style={s.copyBtn}>
                    <Copy size={14} color={PAYTM_LIGHT_BLUE} />
                  </TouchableOpacity>
                </View>
              </View>
            </View>

            {/* Receive Money Info Banner */}
            {/* <View style={[s.infoBanner, { backgroundColor: isDarkMode ? '#332910' : '#FFF9E6' }]}>
              <Text style={[s.infoText, { color: isDarkMode ? '#E6B800' : '#B8860B' }]}>
                receive money on {mockPhone} from any UPI app
              </Text>
              <TouchableOpacity style={s.allowBtn}>
                <Text style={s.allowText}>Allow</Text>
              </TouchableOpacity>
            </View> */}

            {/* SPLIT COLOR QR CODE FRAME */}
            <View style={s.qrWrapper}>
              <View style={s.qrSplitFrame}>
                <View style={[s.qrHalf, { backgroundColor: PAYTM_LIGHT_BLUE }]} />
                <View style={[s.qrHalf, { backgroundColor: themeBlue }]} />

                <View style={s.qrInnerBg}>
                  <Image source={{ uri: qrUrl }} style={s.qrImg} />
                </View>
              </View>
            </View>

          </View>

          {/* Under QR Actions */}

          {/* Bank Info Pill */}
          {/* <View style={[s.bankPill, { backgroundColor: surface, borderColor: border }]}>
            <View style={s.bankLeft}>
              <View style={s.bankIconBg}>
                <Landmark size={16} color={themeBlue} />
              </View>
              <Text style={[s.bankName, { color: text }]}>State Bank of India - 5152</Text>
            </View>
            <TouchableOpacity>
              <Text style={s.changeBankText}>Change Bank</Text>
            </TouchableOpacity>
          </View> */}

          {/* Action Buttons Row */}
          <View style={s.actionRow}>
            <TouchableOpacity style={[s.actionPill, { backgroundColor: surface, borderColor: border }]}>
              <Share size={16} color={textMuted} />
              <Text style={[s.actionText, { color: text }]}>Share</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[s.actionPill, { backgroundColor: surface, borderColor: border }]}>
              <Plus size={16} color={textMuted} />
              <Text style={[s.actionText, { color: text }]}>Add QR to Home</Text>
            </TouchableOpacity>
          </View>

          {/* Gold Banner Ad */}
          {/* <View style={s.adBanner}>
            <View style={s.adTextCol}>
              <Text style={s.adTextMain}>Earn Paytm Gold Coins</Text>
              <Text style={s.adTextSub}>on every payment</Text>
            </View>
            <TouchableOpacity style={s.adBtn}>
              <Text style={s.adBtnText}>Start Earning Now →</Text>
            </TouchableOpacity>
          </View> */}

          {/* Settings / Appearance Section */}
          <View style={[s.settingsBlock, { backgroundColor: surface, borderColor: border }]}>
            <View style={s.settingsHeader}>
              <Text style={[s.settingsTitle, { color: text }]}>Settings</Text>
              <Settings2 size={24} color={textMuted} />
            </View>

            {/* Dark Mode Toggle Item */}
            <View style={[s.settingItem, { borderTopColor: border, borderTopWidth: 1 }]}>
              <View style={s.settingIconBox}>
                {isDarkMode ? <Moon size={20} color={themeBlue} /> : <Sun size={20} color="#FF9800" />}
              </View>
              <View style={s.settingTextCol}>
                <Text style={[s.settingItemTitle, { color: text }]}>Appearance</Text>
                <Text style={[s.settingItemSub, { color: textMuted }]}>{isDarkMode ? 'Dark Mode' : 'Light Mode'} Active</Text>
              </View>
              <Switch
                value={isDarkMode}
                onValueChange={setIsDarkMode}
                trackColor={{ false: '#D9D9D9', true: PAYTM_LIGHT_BLUE }}
                thumbColor={WHITE}
              />
            </View>

          </View>

          <View style={{ height: 60 }} />
        </ScrollView>
      </View>
    </Modal>
  );
};

const s = StyleSheet.create({
  screen: { flex: 1, paddingTop: 50 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingBottom: 16 },
  iconBtn: { padding: 8 },
  logoContainer: { alignItems: 'center' },
  paytmLogo: { width: 80, height: 36 },
  logoSubtitle: { fontSize: 11, fontFamily: fonts.bold, marginTop: -4 },

  scrollContent: { paddingHorizontal: 16, paddingBottom: 40 },

  card: { borderRadius: 24, paddingHorizontal: 16, paddingTop: 20, paddingBottom: 30, elevation: 0, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 10, marginBottom: 16 },

  userInfoRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  avatarContainer: { marginRight: 14 },
  avatar: { width: 48, height: 48, borderRadius: 24, backgroundColor: '#E0F2FE', justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: '#BAE6FD' },
  avatarText: { fontSize: 20, fontFamily: fonts.bold, color: PAYTM_LIGHT_BLUE },
  userDetails: { flex: 1, justifyContent: 'center' },
  nameRow: { flexDirection: 'row', alignItems: 'center' },
  name: { fontSize: 16, fontFamily: fonts.bold },
  upiRow: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
  upiId: { fontSize: 12, fontFamily: fonts.medium },
  copyBtn: { padding: 4, marginLeft: 4 },

  infoBanner: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, borderRadius: 12, marginBottom: 24 },
  infoText: { flex: 1, fontSize: 12, fontFamily: fonts.medium, marginRight: 12 },
  allowBtn: { backgroundColor: '#111', paddingHorizontal: 16, paddingVertical: 6, borderRadius: 20 },
  allowText: { color: WHITE, fontSize: 12, fontFamily: fonts.bold },

  qrWrapper: { alignItems: 'center' },
  qrSplitFrame: { width: width * 0.75, height: width * 0.75, borderRadius: 24, overflow: 'hidden', justifyContent: 'center', alignItems: 'center' },
  qrHalf: { position: 'absolute', width: '100%', height: '50%', left: 0 },
  qrInnerBg: { width: '92%', height: '92%', backgroundColor: WHITE, borderRadius: 18, justifyContent: 'center', alignItems: 'center', padding: 8 },
  qrImg: { width: '100%', height: '100%' },

  bankPill: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, borderRadius: 40, borderWidth: 1, marginBottom: 16 },
  bankLeft: { flexDirection: 'row', alignItems: 'center' },
  bankIconBg: { width: 28, height: 28, borderRadius: 14, backgroundColor: '#EFF6FF', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  bankName: { fontSize: 13, fontFamily: fonts.semiBold },
  changeBankText: { fontSize: 13, fontFamily: fonts.bold, color: PAYTM_BLUE },

  actionRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 },
  actionPill: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 14, borderRadius: 40, borderWidth: 1, marginHorizontal: 4 },
  actionText: { fontSize: 13, fontFamily: fonts.bold, marginLeft: 8 },

  adBanner: { backgroundColor: '#1E293B', borderRadius: 16, padding: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 },
  adTextCol: { flex: 1 },
  adTextMain: { color: WHITE, fontSize: 14, fontFamily: fonts.bold },
  adTextSub: { color: PAYTM_LIGHT_BLUE, fontSize: 12, fontFamily: fonts.medium },
  adBtn: { backgroundColor: '#FCD34D', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  adBtnText: { color: '#92400E', fontSize: 11, fontFamily: fonts.bold },

  settingsBlock: { borderRadius: 20, borderWidth: 1, padding: 20 },
  settingsHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  settingsTitle: { fontSize: 16, fontFamily: fonts.bold },

  settingItem: { flexDirection: 'row', alignItems: 'center', paddingTop: 20 },
  settingIconBox: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#EFF6FF', justifyContent: 'center', alignItems: 'center', marginRight: 16 },
  settingTextCol: { flex: 1 },
  settingItemTitle: { fontSize: 14, fontFamily: fonts.bold },
  settingItemSub: { fontSize: 11, fontFamily: fonts.medium, marginTop: 2 },
});
