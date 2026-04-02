import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Dimensions } from 'react-native';
import { QrCode, Smartphone, Landmark, Send, Zap, Tv, Car, ShieldCheck, ShieldAlert, ScrollText, CreditCard, Ticket, Plane, Banknote, Umbrella, History, Wallet, PiggyBank, Briefcase } from 'lucide-react-native';
import { PAYTM_BLUE, PAYTM_LIGHT_BLUE, PAYTM_DARK_THEME_LIGHT_BLUE, WHITE, fonts, DARK_BACKGROUND, DARK_SURFACE, DARK_TEXT, DARK_TEXT_MUTED } from '../styles/theme';

const { width } = Dimensions.get('window');

interface HomeScreenProps {
  balance: any;
  transactions: any[];
  onAction: (type: string) => void;
  setSubScreen: (screen: string) => void;
  isDarkMode?: boolean;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({ balance, transactions, onAction, setSubScreen, isDarkMode = false }) => {
  const upiActions = [
    { id: 'scan', icon: QrCode, label: 'Scan any QR', sub: 'scan', bg: '#002E6E' },
    { id: 'mobile', icon: Smartphone, label: 'To Mobile or \nContact', sub: 'transfer', bg: '#002E6E' },
    { id: 'upi', icon: Send, label: 'To UPI ID \nor App', sub: 'transfer', bg: '#002E6E' },
    { id: 'bank', icon: Landmark, label: 'To Bank or \nSelf A/c', bg: '#002E6E' },
  ];

  const rechargeActions = [
    { id: 'mob', icon: Smartphone, label: 'Mobile\nRecharge', sub: 'recharge', color: PAYTM_BLUE },
    { id: 'elec', icon: Zap, label: 'Electricity', color: '#FF9800' },
    { id: 'dth', icon: Tv, label: 'DTH\nRecharge', color: '#9C27B0' },
    { id: 'fast', icon: Car, label: 'FASTag\nRecharge', color: '#21C17C' },
  ];

  const loanActions = [
    { id: 'cscore', icon: SpeedometerIcon, label: 'Free Credit\nScore' },
    { id: 'ploan', icon: Banknote, label: 'Personal\nLoan' },
    { id: 'ccard', icon: CreditCard, label: 'Paytm SBI\nCard' },
  ];

  const travelActions = [
    { id: 'flight', icon: Plane, label: 'Flight\nTickets' },
    { id: 'bus', icon: Briefcase, label: 'Bus\nTickets' },
    { id: 'train', icon: Ticket, label: 'Train\nTickets' },
    { id: 'fastag', icon: Car, label: 'Buy\nFASTag' },
  ];

  const getCategoryIcon = (cat: string) => {
    switch (cat) {
      case 'Transfer': return <Send size={24} color={PAYTM_LIGHT_BLUE} />;
      case 'Cashback': return <GiftIcon color="#21C17C" />;
      case 'Recharge': return <Smartphone size={24} color="#FF9800" />;
      case 'Bill Payment': return <ScrollText size={24} color="#9C27B0" />;
      default: return <CreditCard size={24} color="#555" />;
    }
  };

  const bgStyle = { backgroundColor: isDarkMode ? '#121212' : '#F0F3F8' };
  const cardStyle = { backgroundColor: isDarkMode ? '#1E1E1E' : WHITE };
  const textStyle = { color: isDarkMode ? DARK_TEXT : '#1A202C' };
  const subTextStyle = { color: isDarkMode ? DARK_TEXT_MUTED : '#718096' };
  const dividerStyle = { backgroundColor: isDarkMode ? '#2D3748' : '#EDF2F7' };

  return (
    <ScrollView style={[s.screen, bgStyle]} showsVerticalScrollIndicator={false} bounces={false}>
      {/* Background Banner extending from Header */}
      <View style={[s.blueBanner, { backgroundColor: isDarkMode ? PAYTM_LIGHT_BLUE : PAYTM_BLUE }]} />

      <View style={s.homeContent}>
        {/* UPI MONEY TRANSFER CARD */}
        <View style={[s.sectionBlock, cardStyle, { marginTop: 4 }]}>
          <Text style={[s.sectionHeader, textStyle, { paddingHorizontal: 16 }]}>UPI Money Transfer</Text>
          <View style={s.actionGrid}>
            {upiActions.map((a, i) => (
              <TouchableOpacity key={i} style={s.actionItem} onPress={() => a.sub ? setSubScreen(a.sub) : onAction(a.id)}>
                <View style={[s.actionIconDark, { backgroundColor: isDarkMode ? '#2369B0' : a.bg }]}>
                  <a.icon size={28} color={isDarkMode ? '#FFFFFF' : WHITE} />
                </View>
                <Text style={[s.actionLabel, textStyle]}>{a.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <View style={[s.upiIdStrip, { backgroundColor: isDarkMode ? '#333333' : '#EBF8FF' }]}>
            <Text style={[s.upiIdText, { color: isDarkMode ? WHITE : PAYTM_BLUE }]}>Your UPI ID: {balance?.upi_id || 'Not Set'}</Text>
            <TouchableOpacity><Text style={[s.upiIdCopy, { color: isDarkMode ? PAYTM_DARK_THEME_LIGHT_BLUE : PAYTM_BLUE }]}>Copy</Text></TouchableOpacity>
          </View>
        </View>

        {/* MY PAYTM (Balance & Passbook) */}
        <View style={[s.sectionBlock, cardStyle, { paddingVertical: 12 }]}>
          <View style={s.actionGrid}>
            <TouchableOpacity style={s.myPaytmItem} onPress={() => setSubScreen('history')}>
              <View style={[s.actionIconLight, { backgroundColor: isDarkMode ? '#2369B0' : '#EBF8FF' }]}><History size={24} color={isDarkMode ? WHITE : PAYTM_BLUE} /></View>
              <Text style={[s.actionLabel, textStyle]}>{'Balance &\nHistory'}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={s.myPaytmItem}>
              <View style={[s.actionIconLight, { backgroundColor: isDarkMode ? '#2369B0' : '#EBF8FF' }]}><Wallet size={24} color={isDarkMode ? '#FFFFFF' : PAYTM_BLUE} /></View>
              <Text style={[s.actionLabel, textStyle]}>{'Paytm\nWallet'}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={s.myPaytmItem}>
              <View style={[s.actionIconLight, { backgroundColor: isDarkMode ? '#2369B0' : '#EBF8FF' }]}><Landmark size={24} color={isDarkMode ? '#FFFFFF' : PAYTM_BLUE} /></View>
              <Text style={[s.actionLabel, textStyle]}>{'Paytm Bank\nA/c'}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={s.myPaytmItem}>
              <View style={[s.actionIconLight, { backgroundColor: isDarkMode ? '#2A1A3E' : '#F3E8FF' }]}><PiggyBank size={24} color={isDarkMode ? '#C77DFF' : '#9C27B0'} /></View>
              <Text style={[s.actionLabel, textStyle]}>{'Personal\nLoan'}</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* PAYTM AI VOICEGUARD SHIELD */}
        <TouchableOpacity style={isDarkMode ? s.aiProtectionCard : s.aiProtectionCardLight} onPress={() => onAction('voiceguard')} activeOpacity={0.9}>
          <View style={s.aiProtectionInner}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <View style={[s.aiShieldIcon, { backgroundColor: balance?.voice_enrolled ? '#E8F5E9' : '#FFF3E0' }]}>
                {balance?.voice_enrolled ? <ShieldCheck size={26} color="#21C17C" /> : <ShieldAlert size={26} color="#FF9800" />}
              </View>
              <View style={{ marginLeft: 14 }}>
                <Text style={[s.aiText, { color: isDarkMode ? WHITE : '#111' }]}>Paytm VoiceGuard AI</Text>
                <Text style={[s.aiSubText, { color: isDarkMode ? '#AAA' : '#555' }]}>{balance?.voice_enrolled ? 'Active • 100% Secured' : 'Tap to enable Voice Biometrics'}</Text>
              </View>
            </View>
            <ChevronRightIcon color={isDarkMode ? "#FFF" : "#888"} />
          </View>
        </TouchableOpacity>

        {/* RECHARGE & BILL PAYMENTS */}
        <View style={[s.sectionBlock, cardStyle]}>
          <View style={s.sectionHeaderRow}>
            <Text style={[s.sectionHeader, textStyle]}>Recharge & Bill Payments</Text>
          </View>
          <View style={s.actionGrid}>
            {rechargeActions.map((a, i) => (
              <TouchableOpacity key={i} style={s.actionItem} onPress={() => a.sub ? setSubScreen(a.sub) : onAction(a.id)}>
                <View style={[s.actionIconLight, { backgroundColor: isDarkMode ? '#2369B0' : '#F5F7FA' }]}>
                  <a.icon size={26} color={isDarkMode ? '#FFFFFF' : a.color} />
                </View>
                <Text style={[s.actionLabel, textStyle]}>{a.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* PROMO BANNERS */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.promoScroll} contentContainerStyle={s.promoContent}>
          <View style={[s.promoBanner, { backgroundColor: isDarkMode ? '#1e3035' : '#E0F7FA', borderColor: isDarkMode ? 'rgba(0, 186, 242, 0.3)' : 'transparent', borderWidth: isDarkMode ? 1 : 0 }]}>
            <View style={s.promoTextWrap}>
              <Text style={[s.promoTitle, { color: isDarkMode ? '#4DD0E1' : '#006064' }]}>Get ₹100 Cashback</Text>
              <Text style={[s.promoSub, { color: isDarkMode ? '#B2EBF2' : '#00838F' }]}>On your next Mobile Recharge</Text>
            </View>
            <View style={[s.promoDecor, { backgroundColor: isDarkMode ? 'rgba(77, 208, 225, 0.15)' : '#B2EBF2' }]} />
          </View>
          <View style={[s.promoBanner, { backgroundColor: isDarkMode ? '#3b1e3f' : '#FCE4EC', borderColor: isDarkMode ? 'rgba(240, 98, 146, 0.3)' : 'transparent', borderWidth: isDarkMode ? 1 : 0 }]}>
            <View style={s.promoTextWrap}>
              <Text style={[s.promoTitle, { color: isDarkMode ? '#F06292' : '#880E4F' }]}>Paytm Postpaid</Text>
              <Text style={[s.promoSub, { color: isDarkMode ? '#F8BBD0' : '#AD1457' }]}>Buy now, Pay next month</Text>
            </View>
            <View style={[s.promoDecor, { backgroundColor: isDarkMode ? 'rgba(240, 98, 146, 0.15)' : '#F8BBD0' }]} />
          </View>
        </ScrollView>

        {/* LOANS & CREDIT CARDS */}
        <View style={[s.sectionBlock, cardStyle]}>
          <Text style={[s.sectionHeader, textStyle, { paddingHorizontal: 16 }]}>Loans & Credit Cards</Text>
          <View style={s.actionGrid}>
            {loanActions.map((a, i) => (
              <TouchableOpacity key={i} style={s.actionItem} onPress={() => onAction(a.id)}>
                <View style={[s.actionIconLight, { backgroundColor: isDarkMode ? '#2369B0' : '#F5F7FA' }]}>
                  <a.icon size={26} color={isDarkMode ? '#FFFFFF' : "#00BAF2"} />
                </View>
                <Text style={[s.actionLabel, textStyle]}>{a.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* TICKET BOOKING */}
        <View style={[s.sectionBlock, cardStyle]}>
          <Text style={[s.sectionHeader, textStyle, { paddingHorizontal: 16 }]}>Ticket Booking</Text>
          <View style={s.actionGrid}>
            {travelActions.map((a, i) => (
              <TouchableOpacity key={i} style={s.actionItem} onPress={() => onAction(a.id)}>
                <View style={[s.actionIconLight, { backgroundColor: isDarkMode ? '#2369B0' : '#F5F7FA' }]}>
                  <a.icon size={26} color={isDarkMode ? '#FFFFFF' : "#FF9800"} />
                </View>
                <Text style={[s.actionLabel, textStyle]}>{a.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* RECENT TRANSACTIONS (Small preview) */}
        {transactions.length > 0 && (
          <View style={[s.sectionBlock, cardStyle, { paddingHorizontal: 16, paddingBottom: 16 }]}>
            <Text style={[s.sectionHeader, textStyle, { marginTop: 12, marginBottom: 12 }]}>Recent Transactions</Text>
            {transactions.slice(0, 3).map((t, i) => (
              <View key={i} style={[s.txCard, { borderBottomColor: dividerStyle.backgroundColor, borderBottomWidth: i === 2 ? 0 : 1 }]}>
                <View style={[s.txIconWrapper, { backgroundColor: isDarkMode ? '#333' : '#F5F7FA' }]}>{getCategoryIcon(t.category)}</View>
                <View style={s.txInfo}>
                  <Text style={[s.txRecipient, textStyle]}>{t.recipient}</Text>
                  <Text style={[s.txTime, subTextStyle]}>{t.timestamp}</Text>
                </View>
                <Text style={[s.txAmount, { color: t.type === 'received' ? '#21C17C' : textStyle.color }]}>
                  {t.type === 'received' ? '+' : '-'}₹{t.amount}
                </Text>
              </View>
            ))}
          </View>
        )}

        <View style={{ height: 120 }} />
      </View>
    </ScrollView>
  );
};

// Helper Mock Icons to save import space
const SpeedometerIcon = ({ color }: { color: string }) => <Zap size={26} color={color} />; // Mock
const GiftIcon = ({ color }: { color: string }) => <Zap size={24} color={color} />; // Mock
const ChevronRightIcon = ({ color }: { color: string }) => <Text style={{ color, fontSize: 20 }}>›</Text>;

const s = StyleSheet.create({
  screen: { flex: 1 },
  blueBanner: { height: 140, width: '100%', position: 'absolute', top: 0, borderBottomLeftRadius: 16, borderBottomRightRadius: 16 },
  homeContent: { flex: 1, paddingHorizontal: 12, paddingTop: 16 },

  sectionBlock: { borderRadius: 16, marginBottom: 16, elevation: 0, overflow: 'hidden' },
  sectionHeader: { fontSize: 16, fontFamily: fonts.bold, marginTop: 16, marginBottom: 12 },
  sectionHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16 },

  actionGrid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 4, paddingBottom: 8 },
  actionItem: { width: '25%', alignItems: 'center', marginBottom: 16, paddingHorizontal: 4 },
  myPaytmItem: { width: '25%', alignItems: 'center' },
  actionIconDark: { width: 48, height: 48, borderRadius: 16, justifyContent: 'center', alignItems: 'center', marginBottom: 8 },
  actionIconLight: { width: 44, height: 44, borderRadius: 14, justifyContent: 'center', alignItems: 'center', marginBottom: 8 },
  actionLabel: { fontSize: 11, fontFamily: fonts.semiBold, textAlign: 'center', lineHeight: 14 },

  upiIdStrip: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', paddingVertical: 10, marginHorizontal: 16, marginBottom: 16, borderRadius: 8 },
  upiIdText: { fontSize: 12, fontFamily: fonts.semiBold, marginRight: 8 },
  upiIdCopy: { fontSize: 12, fontFamily: fonts.bold },

  aiProtectionCard: { backgroundColor: '#111', borderRadius: 16, marginBottom: 16, elevation: 0, overflow: 'hidden' },
  aiProtectionCardLight: { backgroundColor: WHITE, borderRadius: 16, marginBottom: 16, elevation: 0, overflow: 'hidden' },
  aiProtectionInner: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 18 },
  aiShieldIcon: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center' },
  aiText: { color: WHITE, fontFamily: fonts.bold, fontSize: 15 },
  aiSubText: { color: '#AAA', fontSize: 12, fontFamily: fonts.medium, marginTop: 2 },

  promoScroll: { marginBottom: 16 },
  promoContent: { paddingRight: 12 },
  promoBanner: { width: width * 0.75, height: 80, borderRadius: 16, marginRight: 12, padding: 16, justifyContent: 'center', overflow: 'hidden', elevation: 0 },
  promoTextWrap: { zIndex: 2 },
  promoTitle: { fontSize: 16, fontFamily: fonts.bold },
  promoSub: { fontSize: 12, fontFamily: fonts.medium, marginTop: 2 },
  promoDecor: { position: 'absolute', right: -30, bottom: -30, width: 100, height: 100, borderRadius: 50, zIndex: 1 },

  txCard: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14 },
  txIconWrapper: { width: 44, height: 44, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginRight: 14 },
  txInfo: { flex: 1 },
  txRecipient: { fontSize: 14, fontFamily: fonts.bold },
  txTime: { fontSize: 11, fontFamily: fonts.regular, marginTop: 4 },
  txAmount: { fontSize: 14, fontFamily: fonts.bold },
});
