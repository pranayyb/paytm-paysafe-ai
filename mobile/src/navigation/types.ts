import type { NavigatorScreenParams } from '@react-navigation/native';

export type AuthStackParamList = {
  Splash: undefined;
  Login: undefined;
  OTP: { phone: string };
};

export type PaymentSuccessParams = {
  amount: number;
  recipient: string;
  type: 'sent' | 'recharge' | 'bill' | 'addMoney';
  status: 'success' | 'failed';
  reference: string;
  upiId?: string;
};

export type HomeStackParamList = {
  Home: undefined;
  SendMoney: { prefillUpi?: string };
  QRScanner: { returnTo: 'SendMoney' | 'Home' };
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
};

export type MainTabParamList = {
  HomeTab: NavigatorScreenParams<HomeStackParamList>;
  ScanTab: undefined;
  HistoryTab: undefined;
  ProfileTab: undefined;
};
