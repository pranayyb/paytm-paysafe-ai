import React, { useRef, useEffect, useState } from 'react';
import {
  StyleSheet,
  View,
  ScrollView,
  Dimensions,
  TouchableOpacity,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { Colors, Spacing } from '@theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const BANNER_WIDTH = SCREEN_WIDTH - Spacing.base * 2;

const BANNERS = [
  { id: '1', colors: ['#00BAF2', '#002970'] as string[] },
  { id: '2', colors: ['#FF6B35', '#F7931E'] as string[] },
  { id: '3', colors: ['#00C853', '#1B5E20'] as string[] },
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
          <LinearGradient
            key={banner.id}
            colors={banner.colors}
            style={styles.banner}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          />
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
