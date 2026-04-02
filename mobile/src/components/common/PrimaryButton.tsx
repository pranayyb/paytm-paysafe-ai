import React from 'react';
import { StyleSheet, Text, TouchableOpacity, ViewStyle } from 'react-native';
import { Colors, Typography, Spacing } from '@theme';

interface Props {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  ghost?: boolean;
  style?: ViewStyle;
  textColor?: string;
}

export default function PrimaryButton({ label, onPress, disabled, ghost, style, textColor }: Props) {
  return (
    <TouchableOpacity
      style={[
        styles.button,
        ghost ? styles.ghost : styles.solid,
        disabled && styles.disabled,
        style,
      ]}
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.8}>
      <Text style={[styles.text, ghost && styles.ghostText, textColor ? { color: textColor } : null]}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    borderRadius: 10,
    paddingVertical: Spacing.sm + 2,
    paddingHorizontal: Spacing.base,
    alignItems: 'center',
    justifyContent: 'center',
  },
  solid: { backgroundColor: Colors.primary },
  ghost: { borderWidth: 1.5, borderColor: Colors.white, backgroundColor: 'transparent' },
  disabled: { opacity: 0.5 },
  text: {
    color: Colors.white,
    fontSize: Typography.size.sm + 1,
    fontWeight: Typography.weight.semibold,
  },
  ghostText: { color: Colors.white },
});
