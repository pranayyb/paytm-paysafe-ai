import React from 'react';
import { StyleSheet, Text, View, TouchableOpacity } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Avatar from '@components/common/Avatar';
import { Colors, Typography, Spacing } from '@theme';
import { useUserStore } from '@store/userStore';

export default function HomeHeader() {
  const insets = useSafeAreaInsets();
  const { name, avatarUri } = useUserStore();

  return (
    <View style={[styles.container, { paddingTop: insets.top + Spacing.sm }]}>
      {/* Logo */}
      <View style={styles.logoBox}>
        <Text style={styles.logoText}>Paytm</Text>
      </View>

      {/* Search bar */}
      <TouchableOpacity style={styles.searchBar} activeOpacity={0.7}>
        <Icon name="magnify" size={18} color={Colors.placeholder} />
        <Text style={styles.searchPlaceholder}>Search for services</Text>
      </TouchableOpacity>

      {/* Actions */}
      <View style={styles.actions}>
        <TouchableOpacity style={styles.bellBtn} activeOpacity={0.7}>
          <Icon name="bell-outline" size={22} color={Colors.white} />
          <View style={styles.badge} />
        </TouchableOpacity>
        <Avatar name={name} uri={avatarUri} size={32} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primaryDark,
    paddingHorizontal: Spacing.base,
    paddingBottom: Spacing.md,
    gap: Spacing.sm,
  },
  logoBox: {
    backgroundColor: Colors.white,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
    borderRadius: 6,
  },
  logoText: {
    fontSize: Typography.size.md,
    fontWeight: Typography.weight.extrabold,
    color: Colors.primaryDark,
    letterSpacing: -0.3,
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: 8,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 7,
    gap: 6,
  },
  searchPlaceholder: {
    fontSize: Typography.size.sm,
    color: Colors.placeholder,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  bellBtn: { position: 'relative' },
  badge: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.error,
    borderWidth: 1.5,
    borderColor: Colors.primaryDark,
  },
});
