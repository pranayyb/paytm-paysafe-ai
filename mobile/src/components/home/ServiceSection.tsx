import React from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity } from 'react-native';
import ServiceCard from './ServiceCard';
import { Colors, Typography, Spacing } from '@theme';

interface ServiceItem {
  id: string;
  iconName: string;
  label: string;
  iconColor?: string;
  onPress?: () => void;
}

interface Props {
  title: string;
  services: ServiceItem[];
  onViewAll?: () => void;
}

export default function ServiceSection({ title, services, onViewAll }: Props) {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{title}</Text>
        {onViewAll && (
          <TouchableOpacity onPress={onViewAll}>
            <Text style={styles.viewAll}>View all &gt;</Text>
          </TouchableOpacity>
        )}
      </View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scroll}>
        {services.map((item) => (
          <ServiceCard
            key={item.id}
            iconName={item.iconName}
            label={item.label}
            iconColor={item.iconColor}
            onPress={item.onPress}
          />
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.white,
    marginTop: Spacing.sm,
    paddingVertical: Spacing.base,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.base,
    marginBottom: Spacing.md,
  },
  title: {
    fontSize: Typography.size.base,
    fontWeight: Typography.weight.bold,
    color: Colors.textPrimary,
  },
  viewAll: {
    fontSize: Typography.size.sm,
    color: Colors.primary,
    fontWeight: Typography.weight.medium,
  },
  scroll: { paddingHorizontal: Spacing.base },
});
