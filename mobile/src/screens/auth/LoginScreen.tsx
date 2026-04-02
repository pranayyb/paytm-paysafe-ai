import React from 'react';
import {
  StyleSheet, Text, View, TextInput, TouchableOpacity,
  KeyboardAvoidingView, Platform, StatusBar, ScrollView,
} from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { AuthStackParamList } from '@navigation/types';
import { Colors, Typography, Spacing } from '@theme';

type Props = NativeStackScreenProps<AuthStackParamList, 'Login'>;

const phoneSchema = z.object({
  phone: z.string().regex(/^[0-9]{10}$/, 'Enter a valid 10-digit number'),
});
type PhoneForm = z.infer<typeof phoneSchema>;

export default function LoginScreen({ navigation }: Props) {
  const { control, handleSubmit, formState: { isValid } } = useForm<PhoneForm>({
    resolver: zodResolver(phoneSchema),
    defaultValues: { phone: '' },
    mode: 'onChange',
  });

  const handleSendOTP = (data: PhoneForm) => {
    navigation.navigate('OTP', { phone: data.phone });
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.white} />
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        {/* Logo */}
        <View style={styles.logoRow}>
          <View style={styles.logoBox}>
            <Text style={styles.logoText}>Paytm</Text>
          </View>
        </View>

        <Text style={styles.title}>Enter Mobile Number</Text>
        <Text style={styles.subtitle}>We'll send an OTP to verify your number</Text>

        {/* Phone Input */}
        <View style={styles.inputRow}>
          <View style={styles.countryCode}>
            <Text style={styles.flagText}>🇮🇳</Text>
            <Text style={styles.dialCode}>+91</Text>
          </View>
          <Controller
            control={control}
            name="phone"
            render={({ field: { onChange, onBlur, value } }) => (
              <TextInput
                style={styles.phoneInput}
                placeholder="10-digit mobile number"
                placeholderTextColor={Colors.placeholder}
                keyboardType="numeric"
                maxLength={10}
                onBlur={onBlur}
                onChangeText={onChange}
                value={value}
                returnKeyType="done"
                onSubmitEditing={handleSubmit(handleSendOTP)}
              />
            )}
          />
        </View>

        <TouchableOpacity
          style={[styles.button, !isValid && styles.buttonDisabled]}
          onPress={handleSubmit(handleSendOTP)}
          disabled={!isValid}
          activeOpacity={0.8}>
          <Text style={styles.buttonText}>Send OTP</Text>
        </TouchableOpacity>

        <Text style={styles.terms}>
          By continuing, you agree to our{' '}
          <Text style={styles.link}>Terms of Service</Text> and{' '}
          <Text style={styles.link}>Privacy Policy</Text>
        </Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.white },
  scroll: { padding: Spacing['2xl'], paddingTop: Spacing['5xl'] },
  logoRow: { alignItems: 'flex-start', marginBottom: Spacing['3xl'] },
  logoBox: {
    backgroundColor: Colors.primaryDark,
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.sm,
    borderRadius: 8,
  },
  logoText: {
    fontSize: Typography.size['2xl'],
    fontWeight: Typography.weight.extrabold,
    color: Colors.white,
    letterSpacing: -0.5,
  },
  title: {
    fontSize: Typography.size['2xl'],
    fontWeight: Typography.weight.bold,
    color: Colors.textPrimary,
    marginBottom: Spacing.sm,
  },
  subtitle: {
    fontSize: Typography.size.md,
    color: Colors.textSecondary,
    marginBottom: Spacing['2xl'],
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderRadius: 12,
    marginBottom: Spacing.lg,
    backgroundColor: Colors.inputBg,
    overflow: 'hidden',
  },
  countryCode: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.base,
    borderRightWidth: 1,
    borderRightColor: Colors.border,
    gap: 4,
  },
  flagText: { fontSize: Typography.size.lg },
  dialCode: {
    fontSize: Typography.size.base,
    fontWeight: Typography.weight.semibold,
    color: Colors.textPrimary,
  },
  phoneInput: {
    flex: 1,
    paddingHorizontal: Spacing.md,
    fontSize: Typography.size.base,
    color: Colors.textPrimary,
    letterSpacing: 1,
  },
  button: {
    backgroundColor: Colors.primary,
    borderRadius: 12,
    paddingVertical: Spacing.base,
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  buttonDisabled: { opacity: 0.5 },
  buttonText: {
    color: Colors.white,
    fontSize: Typography.size.base,
    fontWeight: Typography.weight.bold,
  },
  terms: {
    fontSize: Typography.size.sm,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  link: { color: Colors.primary, fontWeight: Typography.weight.medium },
});
