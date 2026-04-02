import { Platform } from 'react-native';

export const PAYTM_BLUE = '#002E6E';
export const PAYTM_LIGHT_BLUE = '#145497ff';
export const PAYTM_DARK_THEME_LIGHT_BLUE = '#1A67B8';
export const SUCCESS_GREEN = '#21C17C';
export const ERROR_RED = '#FF4E4E';
export const BACKGROUND_COLOR = '#F5F7FA';
export const WHITE = '#FFF';

// Dark Mode Colors
export const DARK_BACKGROUND = '#121212';
export const DARK_SURFACE = '#1E1E1E';
export const DARK_TEXT = '#FFFFFF';
export const DARK_TEXT_MUTED = '#AAAAAA';
export const DARK_BORDER = '#333333';

export const fonts = {
  regular: 'Inter-Regular',
  medium: 'Inter-Medium',
  semiBold: 'Inter-SemiBold',
  bold: 'Inter-Bold',
  extraBold: 'Inter-ExtraBold',
};

export const shadows = {
  soft: {
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 0,
  },
  medium: {
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 0,
  },
};

export const layout = {
  headerHeight: Platform.OS === 'ios' ? 100 : 88,
  headerPaddingTop: Platform.OS === 'ios' ? 44 : 20,
  screenPadding: 16,
};
