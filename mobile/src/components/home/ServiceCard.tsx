import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { Colors, Typography, Spacing } from '@theme';

interface Props {
  iconName: string;
  label: string;
  iconColor?: string;
  onPress?: () => void;
}

export default function ServiceCard({ iconName, label, iconColor = Colors.primary, onPress }: Props) {
  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.75}>
      <View style={[styles.iconBox, { backgroundColor: iconColor + '1A' }]}>
        <Icon name={iconName} size={26} color={iconColor} />
      </View>
      <Text style={styles.label} numberOfLines={2}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    width: 80,
    alignItems: 'center',
    marginRight: Spacing.sm,
  },
  iconBox: {
    width: 56,
    height: 56,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.xs,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
  },
  label: {
    fontSize: Typography.size.xs,
    color: Colors.textPrimary,
    textAlign: 'center',
    fontWeight: Typography.weight.medium,
    lineHeight: 14,
  },
});
