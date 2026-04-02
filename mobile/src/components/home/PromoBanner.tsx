import React, { useRef, useEffect, useState } from 'react';
import {
  StyleSheet,
  View,
  ScrollView,
  Dimensions,
  TouchableOpacity,
  Text,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { Colors, Spacing, Typography } from '@theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const BANNER_WIDTH = SCREEN_WIDTH - Spacing.base * 2;

const BANNERS = [
  {
    id: '1',
    colors: ['#00BAF2', '#002970'] as string[],
    tag: 'LIMITED OFFER',
    title: 'Scan & Pay — Win ₹500',
    subtitle: 'Use QR scanner 5 times this week',
    cta: 'Scan Now',
    icon: 'qrcode-scan' as const,
  },
  {
    id: '2',
    colors: ['#FF6B35', '#F7931E'] as string[],
    tag: '5% CASHBACK',
    title: 'Recharge & Save',
    subtitle: 'Get cashback on mobile & DTH recharges',
    cta: 'Recharge Now',
    icon: 'cellphone-wireless' as const,
  },
  {
    id: '3',
    colors: ['#00C853', '#1B5E20'] as string[],
    tag: 'ZERO FEES',
    title: 'Send Money Free',
    subtitle: 'No charges on UPI transfers up to ₹1 lakh',
    cta: 'Send Money',
    icon: 'send' as const,
  },
];

export default function PromoBanner() {
  const scrollRef = useRef<ScrollView>(null);
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    const id = setInterval(() => {
      setActiveIndex((prev) => {
        const next = (prev + 1) % BANNERS.length;
        scrollRef.current?.scrollTo({ x: next * (BANNER_WIDTH + Spacing.sm), animated: true });
        return next;
      });
    }, 3000);
    return () => clearInterval(id);
  }, []);

  return (
    <View style={styles.container}>
      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        snapToInterval={BANNER_WIDTH + Spacing.sm}
        decelerationRate="fast"
        contentContainerStyle={styles.scrollContent}
        onMomentumScrollEnd={(e) => {
          const newIndex = Math.round(
            e.nativeEvent.contentOffset.x / (BANNER_WIDTH + Spacing.sm),
          );
          setActiveIndex(newIndex);
        }}>
        {BANNERS.map((banner) => (
          <TouchableOpacity key={banner.id} activeOpacity={0.9}>
            <LinearGradient
              colors={banner.colors}
              style={styles.banner}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}>
              {/* Left: text content */}
              <View style={styles.textContent}>
                <View style={styles.tagBadge}>
                  <Text style={styles.tagText}>{banner.tag}</Text>
                </View>
                <Text style={styles.title}>{banner.title}</Text>
                <Text style={styles.subtitle}>{banner.subtitle}</Text>
                <View style={styles.ctaRow}>
                  <Text style={styles.ctaText}>{banner.cta}</Text>
                  <Icon name="arrow-right" size={14} color={Colors.white} />
                </View>
              </View>

              {/* Right: decorative icon */}
              <View style={styles.iconWrap} pointerEvents="none">
                <Icon name={banner.icon} size={80} color="rgba(255,255,255,0.15)" />
              </View>
            </LinearGradient>
          </TouchableOpacity>
        ))}
      </ScrollView>
      <View style={styles.dots}>
        {BANNERS.map((b, i) => (
          <TouchableOpacity
            key={b.id}
            style={[styles.dot, i === activeIndex && styles.dotActive]}
            onPress={() => {
              scrollRef.current?.scrollTo({ x: i * (BANNER_WIDTH + Spacing.sm), animated: true });
              setActiveIndex(i);
            }}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: Spacing.sm,
    backgroundColor: Colors.white,
    paddingVertical: Spacing.base,
  },
  scrollContent: { paddingHorizontal: Spacing.base, gap: Spacing.sm },
  banner: {
    width: BANNER_WIDTH,
    height: 130,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.base,
    overflow: 'hidden',
  },
  textContent: {
    flex: 1,
    gap: 4,
  },
  tagBadge: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255,255,255,0.25)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 20,
    marginBottom: 2,
  },
  tagText: {
    color: Colors.white,
    fontSize: 9,
    fontWeight: '700' as any,
    letterSpacing: 0.8,
  },
  title: {
    color: Colors.white,
    fontSize: Typography.size.md,
    fontWeight: Typography.weight.bold,
    lineHeight: 20,
  },
  subtitle: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: Typography.size.xs,
    lineHeight: 16,
  },
  ctaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  ctaText: {
    color: Colors.white,
    fontSize: Typography.size.xs,
    fontWeight: '600' as any,
  },
  iconWrap: {
    position: 'absolute',
    right: -10,
    bottom: -10,
  },
  dots: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
    marginTop: Spacing.sm,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.border,
  },
  dotActive: {
    width: 16,
    backgroundColor: Colors.primary,
  },
});
