import React from 'react';
import {
  StyleSheet, Text, View, TouchableOpacity,
  StatusBar, ScrollView, Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import Avatar from '@components/common/Avatar';
import { Colors, Typography, Spacing } from '@theme';
import { useAuthStore } from '@store/authStore';
import { useUserStore } from '@store/userStore';

const MENU_ROWS = [
  { id: 'kyc', icon: 'shield-check', label: 'KYC Status', sub: 'Verified', iconColor: Colors.success },
  { id: 'accounts', icon: 'bank-outline', label: 'Linked Accounts', sub: '2 accounts', iconColor: Colors.primaryMid },
  { id: 'notifications', icon: 'bell-outline', label: 'Notifications', sub: 'All enabled', iconColor: Colors.warning },
  { id: 'language', icon: 'translate', label: 'Language', sub: 'English', iconColor: Colors.primary },
  { id: 'help', icon: 'help-circle-outline', label: 'Help & Support', sub: null, iconColor: Colors.textSecondary },
  { id: 'about', icon: 'information-outline', label: 'About Paytm', sub: null, iconColor: Colors.textSecondary },
];

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const { logout } = useAuthStore();
  const { name, email, avatarUri, kycStatus } = useUserStore();
  const phone = useAuthStore((s) => s.phone);

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to log out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Logout', style: 'destructive', onPress: logout },
    ]);
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.white} />

      <View style={styles.header}>
        <Text style={styles.title}>Profile</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Profile card */}
        <View style={styles.profileCard}>
          <Avatar name={name} uri={avatarUri} size={72} />
          <View style={styles.profileInfo}>
            <Text style={styles.profileName}>{name}</Text>
            <Text style={styles.profilePhone}>+91 {phone ?? '9876543210'}</Text>
            {email && <Text style={styles.profileEmail}>{email}</Text>}
          </View>
          <TouchableOpacity style={styles.editBtn}>
            <Icon name="pencil" size={18} color={Colors.primary} />
          </TouchableOpacity>
        </View>

        {/* KYC banner */}
        {kycStatus === 'verified' && (
          <View style={styles.kycBanner}>
            <Icon name="shield-check" size={18} color={Colors.success} />
            <Text style={styles.kycBannerText}>Full KYC Complete — ₹1,00,000 wallet limit</Text>
          </View>
        )}

        {/* Menu rows */}
        <View style={styles.menuSection}>
          {MENU_ROWS.map((row, idx) => (
            <View key={row.id}>
              <TouchableOpacity style={styles.menuRow} activeOpacity={0.7}>
                <View style={[styles.menuIcon, { backgroundColor: row.iconColor + '15' }]}>
                  <Icon name={row.icon} size={20} color={row.iconColor} />
                </View>
                <View style={styles.menuText}>
                  <Text style={styles.menuLabel}>{row.label}</Text>
                  {row.sub && <Text style={styles.menuSub}>{row.sub}</Text>}
                </View>
                <Icon name="chevron-right" size={18} color={Colors.textLight} />
              </TouchableOpacity>
              {idx < MENU_ROWS.length - 1 && <View style={styles.divider} />}
            </View>
          ))}
        </View>

        {/* Logout */}
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout} activeOpacity={0.8}>
          <Icon name="logout" size={20} color={Colors.error} />
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>

        <Text style={styles.versionText}>Version 12.4.0</Text>
        <View style={{ height: Spacing.xl }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.offWhite },
  header: {
    backgroundColor: Colors.white, paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.base, borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  title: { fontSize: Typography.size.xl, fontWeight: Typography.weight.bold, color: Colors.textPrimary },
  profileCard: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.white,
    margin: Spacing.base, borderRadius: 16, padding: Spacing.base, gap: Spacing.base,
    elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.07, shadowRadius: 4,
  },
  profileInfo: { flex: 1 },
  profileName: { fontSize: Typography.size.lg, fontWeight: Typography.weight.bold, color: Colors.textPrimary },
  profilePhone: { fontSize: Typography.size.sm, color: Colors.textSecondary, marginTop: 2 },
  profileEmail: { fontSize: Typography.size.sm, color: Colors.textSecondary, marginTop: 1 },
  editBtn: {
    width: 36, height: 36, borderRadius: 18, borderWidth: 1.5, borderColor: Colors.primary,
    alignItems: 'center', justifyContent: 'center',
  },
  kycBanner: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.sm,
    backgroundColor: Colors.success + '15', marginHorizontal: Spacing.base,
    borderRadius: 10, padding: Spacing.md, marginBottom: Spacing.sm,
    borderWidth: 1, borderColor: Colors.success + '40',
  },
  kycBannerText: { fontSize: Typography.size.sm, color: Colors.success, fontWeight: Typography.weight.medium, flex: 1 },
  menuSection: {
    backgroundColor: Colors.white, marginHorizontal: Spacing.base,
    borderRadius: 16, overflow: 'hidden',
    elevation: 1, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2,
  },
  menuRow: { flexDirection: 'row', alignItems: 'center', padding: Spacing.base },
  menuIcon: { width: 38, height: 38, borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginRight: Spacing.md },
  menuText: { flex: 1 },
  menuLabel: { fontSize: Typography.size.md, fontWeight: Typography.weight.medium, color: Colors.textPrimary },
  menuSub: { fontSize: Typography.size.xs, color: Colors.textSecondary, marginTop: 2 },
  divider: { height: 1, backgroundColor: Colors.border, marginLeft: Spacing.base + 38 + Spacing.md },
  logoutBtn: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.md,
    margin: Spacing.base, backgroundColor: Colors.error + '10',
    borderRadius: 12, padding: Spacing.base, borderWidth: 1, borderColor: Colors.error + '30',
  },
  logoutText: { fontSize: Typography.size.base, fontWeight: Typography.weight.semibold, color: Colors.error },
  versionText: { textAlign: 'center', fontSize: Typography.size.xs, color: Colors.textLight },
});
