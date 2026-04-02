import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, ScrollView, Image, useColorScheme } from 'react-native';
import { ChevronLeft, Search, Phone, ShieldCheck } from 'lucide-react-native';
import { PAYTM_BLUE, PAYTM_LIGHT_BLUE, PAYTM_DARK_THEME_LIGHT_BLUE, SUCCESS_GREEN, WHITE, BACKGROUND_COLOR, fonts } from '../styles/theme';

interface RechargeScreenProps {
  onBack: () => void;
  onRecharge: (number: string, amount: number) => void;
  isDarkMode?: boolean;
}

const MOCK_PLANS = [
  { id: 1, price: 299, validity: '28 Days', data: '1.5 GB/Day', desc: 'Truly Unlimited Calls + 100 SMS/Day' },
  { id: 2, price: 666, validity: '84 Days', data: '1.5 GB/Day', desc: 'Best Seller! Unlimited Calls + 100 SMS/Day' },
  { id: 3, price: 749, validity: '90 Days', data: '2 GB/Day', desc: 'Unlimited Calls + Disney+ Hotstar Mobile (3 Months)' },
  { id: 4, price: 155, validity: '24 Days', data: '2 GB Total', desc: 'Unlimited Calls + 300 SMS' },
];

export const RechargeScreen: React.FC<RechargeScreenProps> = ({ onBack, onRecharge, isDarkMode = false }) => {
  const [number, setNumber] = useState('');
  const [selectedPlan, setSelectedPlan] = useState<any>(null);

  const bg = isDarkMode ? '#121212' : BACKGROUND_COLOR;
  const cardBg = isDarkMode ? '#1E1E1E' : WHITE;
  const textClr = isDarkMode ? '#FFFFFF' : '#111';
  const textMuted = isDarkMode ? '#AAAAAA' : '#666';

  return (
    <View style={[s.container, { backgroundColor: bg }]}>
      {/* Header */}
      <View style={[s.header, { backgroundColor: isDarkMode ? PAYTM_LIGHT_BLUE : PAYTM_BLUE }]}>
        <TouchableOpacity onPress={onBack} style={s.backBtn}>
          <ChevronLeft color={WHITE} size={28} />
        </TouchableOpacity>
        <Text style={s.headerTitle}>Mobile Recharge</Text>
      </View>

      <ScrollView contentContainerStyle={s.content}>
        {/* Number Input */}
        <View style={[s.card, { backgroundColor: cardBg }]}>
          <Text style={[s.label, { color: textMuted }]}>Enter Mobile Number</Text>
          <View style={[s.inputWrapper, { backgroundColor: isDarkMode ? '#333' : '#F5F7FA' }]}>
            <Phone color={isDarkMode ? '#FFFFFF' : PAYTM_LIGHT_BLUE} size={20} />
            <TextInput
              style={[s.input, { color: textClr }]}
              placeholder="Ex: 98765 43210"
              keyboardType="phone-pad"
              maxLength={10}
              value={number}
              onChangeText={setNumber}
            />
          </View>
        </View>

        {/* Plan Selection */}
        {number.length === 10 && (
          <>
            <View style={s.operatorRow}>
              <View style={s.operatorCircle}>
                <Text style={s.opText}>Jio</Text>
              </View>
              <View style={{ marginLeft: 12 }}>
                <Text style={[s.opName, { color: textClr }]}>Reliance Jio - Pre-paid</Text>
                <Text style={[s.opCircleLoc, { color: textMuted }]}>Uttar Pradesh (East)</Text>
              </View>
              <TouchableOpacity style={s.changeBtn}>
                <Text style={[s.changeText, { color: isDarkMode ? PAYTM_DARK_THEME_LIGHT_BLUE : PAYTM_LIGHT_BLUE }]}>Change</Text>
              </TouchableOpacity>
            </View>

            <Text style={[s.sectionTitle, { color: textClr }]}>Popular Plans</Text>
            {MOCK_PLANS.map((plan) => (
              <TouchableOpacity
                key={plan.id}
                style={[s.planCard, { backgroundColor: cardBg, borderColor: isDarkMode ? '#333' : '#EEE' }, selectedPlan?.id === plan.id && [s.selectedPlanCard, { borderColor: isDarkMode ? '#1A67B8' : PAYTM_LIGHT_BLUE, backgroundColor: isDarkMode ? '#1A67B822' : '#F0F9FF' }]]}
                onPress={() => setSelectedPlan(plan)}
              >
                <View style={s.planHeader}>
                  <Text style={[s.planPrice, { color: textClr }]}>₹{plan.price}</Text>
                  <View style={[s.planTag, { backgroundColor: isDarkMode ? '#333' : '#F0F0F0' }]}><Text style={[s.planTagText, { color: textMuted }]}>Validity: {plan.validity}</Text></View>
                </View>
                <Text style={[s.planData, { color: isDarkMode ? PAYTM_DARK_THEME_LIGHT_BLUE : PAYTM_LIGHT_BLUE }]}>{plan.data}</Text>
                <Text style={[s.planDesc, { color: textMuted }]}>{plan.desc}</Text>
              </TouchableOpacity>
            ))}
          </>
        )}
      </ScrollView>

      {/* Footer Payment */}
      {selectedPlan && (
        <View style={[s.footer, { backgroundColor: cardBg, borderTopColor: isDarkMode ? '#333' : '#EEE' }]}>
          <View style={s.secureRow}>
            <ShieldCheck color={isDarkMode ? '#FFFFFF' : SUCCESS_GREEN} size={16} />
            <Text style={[s.secureText, { color: isDarkMode ? '#AAA' : SUCCESS_GREEN }]}>Guaranteed secure by Paytm AI</Text>
          </View>
          <TouchableOpacity
            style={[s.payBtn, { backgroundColor: isDarkMode ? '#1A67B8' : PAYTM_LIGHT_BLUE }]}
            onPress={() => onRecharge(number, selectedPlan.price)}
          >
            <Text style={s.payBtnText}>Pay ₹{selectedPlan.price} ExpressLY</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: BACKGROUND_COLOR },
  header: { backgroundColor: PAYTM_BLUE, height: 100, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingTop: 40 },
  backBtn: { padding: 8, marginLeft: -10 },
  headerTitle: { color: WHITE, fontSize: 18, fontFamily: fonts.bold, marginLeft: 10 },
  content: { padding: 16 },
  card: { backgroundColor: WHITE, borderRadius: 16, padding: 16, marginBottom: 16, elevation: 0, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 5 },
  label: { fontSize: 12, fontFamily: fonts.semiBold, color: '#666', marginBottom: 12 },
  inputWrapper: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F5F7FA', borderRadius: 12, paddingHorizontal: 15, paddingVertical: 12 },
  input: { flex: 1, marginLeft: 10, fontSize: 15, fontFamily: fonts.medium, color: '#111' },
  operatorRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 20, paddingHorizontal: 4 },
  operatorCircle: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#E30613', justifyContent: 'center', alignItems: 'center' },
  opText: { color: WHITE, fontSize: 14, fontFamily: fonts.bold },
  opName: { fontSize: 14, fontFamily: fonts.bold, color: '#333' },
  opCircleLoc: { fontSize: 11, fontFamily: fonts.medium, color: '#888' },
  changeBtn: { marginLeft: 'auto', padding: 8 },
  changeText: { color: PAYTM_LIGHT_BLUE, fontSize: 12, fontFamily: fonts.bold },
  sectionTitle: { fontSize: 14, fontFamily: fonts.bold, color: '#444', marginBottom: 16, marginLeft: 4 },
  planCard: { backgroundColor: WHITE, borderRadius: 16, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: '#EEE' },
  selectedPlanCard: { borderColor: PAYTM_LIGHT_BLUE, backgroundColor: '#F0F9FF' },
  planHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  planPrice: { fontSize: 22, fontFamily: fonts.bold, color: '#222' },
  planTag: { backgroundColor: '#F0F0F0', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  planTagText: { fontSize: 10, fontFamily: fonts.semiBold, color: '#666' },
  planData: { fontSize: 14, fontFamily: fonts.bold, color: PAYTM_LIGHT_BLUE, marginBottom: 4 },
  planDesc: { fontSize: 12, fontFamily: fonts.regular, color: '#777', lineHeight: 18 },
  footer: { padding: 16, backgroundColor: WHITE, borderTopWidth: 1, borderTopColor: '#EEE' },
  secureRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  secureText: { fontSize: 11, fontFamily: fonts.medium, color: SUCCESS_GREEN, marginLeft: 6 },
  payBtn: { backgroundColor: PAYTM_LIGHT_BLUE, borderRadius: 14, padding: 18, alignItems: 'center' },
  payBtnText: { color: WHITE, fontSize: 16, fontFamily: fonts.bold },
});
