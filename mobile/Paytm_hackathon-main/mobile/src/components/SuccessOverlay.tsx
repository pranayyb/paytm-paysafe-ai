import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Platform, Easing } from 'react-native';
import { Check, ShieldCheck } from 'lucide-react-native';
import { SUCCESS_GREEN, WHITE, fonts } from '../styles/theme';

interface SuccessOverlayProps {
  visible: boolean;
  message: string;
  submessage?: string;
  onFinish: () => void;
}

export const SuccessOverlay: React.FC<SuccessOverlayProps> = ({ visible, message, submessage, onFinish }) => {
  const transY = useRef(new Animated.Value(-150)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(transY, { toValue: Platform.OS === 'ios' ? 60 : 40, friction: 8, tension: 40, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 1, duration: 250, useNativeDriver: true })
      ]).start();

      const timer = setTimeout(() => {
        Animated.parallel([
          Animated.timing(transY, { toValue: -150, duration: 400, easing: Easing.in(Easing.ease), useNativeDriver: true }),
          Animated.timing(opacity, { toValue: 0, duration: 400, useNativeDriver: true })
        ]).start(() => onFinish());
      }, 3500);

      return () => clearTimeout(timer);
    } else {
      transY.setValue(-150);
      opacity.setValue(0);
    }
  }, [visible]);

  if (!visible) return null;

  return (
    <Animated.View style={[s.toastContainer, { transform: [{ translateY: transY }], opacity }]} pointerEvents="none">
      <View style={s.toastContent}>
        <View style={s.iconWrapper}>
          <ShieldCheck size={24} color={WHITE} strokeWidth={2.5} />
        </View>
        <View style={s.textWrapper}>
          <Text style={s.title}>{message}</Text>
          {submessage && <Text style={s.sub} numberOfLines={2}>{submessage}</Text>}
        </View>
      </View>
    </Animated.View>
  );
};

const s = StyleSheet.create({
  toastContainer: {
    position: 'absolute',
    top: 0,
    left: 20,
    right: 20,
    alignItems: 'center',
    zIndex: 9999,
  },
  toastContent: {
    backgroundColor: '#1E1E24',
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 24,
    width: '100%',
    shadowColor: '#000', 
    shadowOffset: { width: 0, height: 10 }, 
    shadowOpacity: 0.3, 
    shadowRadius: 20, 
    elevation: 15,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)'
  },
  iconWrapper: {
    backgroundColor: SUCCESS_GREEN,
    width: 48, 
    height: 48,
    borderRadius: 24,
    justifyContent: 'center', 
    alignItems: 'center',
    marginRight: 16,
    shadowColor: SUCCESS_GREEN,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
  },
  textWrapper: {
    flex: 1,
    justifyContent: 'center',
  },
  title: { fontSize: 16, fontFamily: fonts.bold, color: WHITE, letterSpacing: 0.2 },
  sub: { fontSize: 13, fontFamily: fonts.medium, color: '#A0A0A0', marginTop: 3, lineHeight: 18 }
});
