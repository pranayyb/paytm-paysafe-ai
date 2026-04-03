import type { NavigatorScreenParams } from '@react-navigation/native';
import type { QRScanResponse } from '@services/api';
import type { UserMode } from '@store/authStore';

export type AuthStackParamList = {
  Splash: undefined;
  ModeSelect: undefined;
  Login: { mode: UserMode };
  OTP: { phone: string; mode: UserMode };
};

export type PaymentSuccessParams = {
  amount: number;
  recipient: string;
  type: 'sent' | 'recharge' | 'bill' | 'addMoney' | 'voice';
  status: 'success' | 'failed';
  reference: string;
  upiId?: string;
};

export type HomeStackParamList = {
  Home: undefined;
  SendMoney: { prefillUpi?: string };
  QRScanner: { returnTo: 'SendMoney' | 'Home' };
  QRSafetyResult: {
    upiId: string;
    recipientName: string;
    analysisResult: QRScanResponse;
  };
  UPIPin: {
    amount: number;
    recipient: string;
    upiId: string;
    type: 'sent' | 'recharge' | 'bill';
  };
  PaymentSuccess: PaymentSuccessParams;
  MobileRecharge: undefined;
  BillPayment: { billType: 'electricity' | 'gas' | 'water' | 'broadband' };
  Wallet: undefined;
  ScamChecker: undefined;
  VoicePayment: undefined;
};

export type MainTabParamList = {
  HomeTab: NavigatorScreenParams<HomeStackParamList>;
  ScanTab: undefined;
  HistoryTab: undefined;
  ProfileTab: undefined;
};

export type MerchantStackParamList = {
  MerchantDashboard: undefined;
  MerchantVoiceQuery: undefined;
};

export type MerchantTabParamList = {
  DashboardTab: NavigatorScreenParams<MerchantStackParamList>;
  ScanTab: undefined;
  HistoryTab: undefined;
  ProfileTab: undefined;
};
