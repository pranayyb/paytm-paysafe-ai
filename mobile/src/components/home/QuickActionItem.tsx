import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { Colors, Typography, Spacing } from '@theme';

interface Props {
  iconName: string;
  label: string;
  onPress: () => void;
  iconColor?: string;
}

export default function QuickActionItem({ iconName, label, onPress, iconColor = Colors.primaryDark }: Props) {
  return (
    <TouchableOpacity style={styles.container} onPress={onPress} activeOpacity={0.7}>
      <View style={styles.iconCircle}>
        <Icon name={iconName} size={24} color={iconColor} />
      </View>
      <Text style={styles.label} numberOfLines={2}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: Spacing.sm,
  },
  iconCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#EBF7FD',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.xs,
  },
  label: {
    fontSize: Typography.size.xs,
    color: Colors.textPrimary,
    textAlign: 'center',
    fontWeight: Typography.weight.medium,
    lineHeight: 14,
  },
});
