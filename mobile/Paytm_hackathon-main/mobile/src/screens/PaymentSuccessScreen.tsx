import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, TouchableOpacity, Image, Dimensions, StatusBar } from 'react-native';
import { Check, ShieldCheck, Zap } from 'lucide-react-native';
import { WHITE, SUCCESS_GREEN, fonts } from '../styles/theme';

const { width, height } = Dimensions.get('window');

interface PaymentSuccessScreenProps {
  amount: number;
  recipientName: string;
  duration: number; // In seconds
  onDone: () => void;
}

export const PaymentSuccessScreen: React.FC<PaymentSuccessScreenProps> = ({ amount, recipientName, duration, onDone }) => {
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      })
    ]).start();
  }, []);

  return (
    <View style={s.container}>
      <StatusBar barStyle="light-content" backgroundColor={SUCCESS_GREEN} />
      
      {/* Top Bar Logo */}
      <View style={s.header}>
        <Image 
          source={require('../../assets/images/paytm_logo.png')} 
          style={s.paytmLogo} 
          tintColor={WHITE}
        />
      </View>

      <View style={s.content}>
        <Text style={s.paidTo}>Paid to {recipientName}</Text>
        <Text style={s.amount}>₹{amount}</Text>
        
        <View style={s.speedRow}>
          <Text style={s.speedText}>Payment completed in {duration.toFixed(2)} Sec </Text>
          <Zap size={14} color={WHITE} fill={WHITE} />
        </View>

        {/* Animated Checkmark Central Graphic */}
        <Animated.View style={[s.graphicContainer, { transform: [{ scale: scaleAnim }], opacity: opacityAnim }]}>
           {/* Flower/Concentric Circles Mockup */}
           <View style={[s.circle, s.outerCircle]} />
           <View style={[s.circle, s.midCircle]} />
           <View style={[s.circle, s.innerCircle]}>
              <Check size={48} color={SUCCESS_GREEN} strokeWidth={4} />
           </View>
        </Animated.View>

        <View style={{ flex: 1 }} />

        {/* Action Button */}
        <TouchableOpacity style={s.doneBtn} onPress={onDone}>
          <Text style={s.doneBtnText}>DONE</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: SUCCESS_GREEN },
  header: { alignItems: 'center', paddingTop: 60, marginBottom: 40 },
  paytmLogo: { width: 80, height: 26, resizeMode: 'contain' },
  
  content: { flex: 1, alignItems: 'center', paddingHorizontal: 20 },
  paidTo: { color: WHITE, fontSize: 18, fontFamily: fonts.bold, marginBottom: 16, textAlign: 'center' },
  amount: { color: WHITE, fontSize: 56, fontFamily: fonts.extraBold, marginBottom: 12 },
  
  speedRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 60, opacity: 0.9 },
  speedText: { color: WHITE, fontSize: 13, fontFamily: fonts.medium },
  
  graphicContainer: { width: 240, height: 240, justifyContent: 'center', alignItems: 'center', position: 'relative' },
  circle: { position: 'absolute', borderRadius: 120 },
  outerCircle: { width: 240, height: 240, backgroundColor: 'rgba(255,255,255,0.15)' },
  midCircle: { width: 170, height: 170, backgroundColor: 'rgba(255,255,255,0.25)' },
  innerCircle: { width: 100, height: 100, backgroundColor: WHITE, justifyContent: 'center', alignItems: 'center', elevation: 4 },

  doneBtn: { marginBottom: 50, paddingHorizontal: 60, paddingVertical: 14, borderRadius: 28, borderWidth: 1.5, borderColor: WHITE },
  doneBtnText: { color: WHITE, fontSize: 16, fontFamily: fonts.bold, letterSpacing: 1.5 },
});
