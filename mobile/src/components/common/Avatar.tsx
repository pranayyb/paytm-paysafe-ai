import React from 'react';
import { StyleSheet, Text, View, Image } from 'react-native';
import { Colors, Typography } from '@theme';

interface Props {
  name: string;
  uri?: string | null;
  size?: number;
}

export default function Avatar({ name, uri, size = 36 }: Props) {
  const initials = name
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase();

  if (uri) {
    return (
      <Image
        source={{ uri }}
        style={[styles.img, { width: size, height: size, borderRadius: size / 2 }]}
      />
    );
  }

  return (
    <View
      style={[
        styles.circle,
        { width: size, height: size, borderRadius: size / 2 },
      ]}>
      <Text style={[styles.text, { fontSize: size * 0.38 }]}>{initials}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  circle: {
    backgroundColor: Colors.primaryMid,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    color: Colors.white,
    fontWeight: Typography.weight.bold,
  },
  img: { resizeMode: 'cover' },
});
