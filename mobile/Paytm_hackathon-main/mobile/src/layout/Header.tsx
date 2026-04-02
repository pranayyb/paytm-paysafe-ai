import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image, Platform } from 'react-native';
import { Search, Bell, Store } from 'lucide-react-native';
import { PAYTM_BLUE, PAYTM_LIGHT_BLUE, WHITE, fonts, layout } from '../styles/theme';

interface HeaderProps {
    userName: string;
    userRole?: string;
    onProfilePress?: () => void;
    onBellPress?: () => void;
    isDarkMode?: boolean;
}

export const Header: React.FC<HeaderProps> = ({ userName, userRole, onProfilePress, onBellPress, isDarkMode = false }) => {
    const initials = (userName || 'U')[0].toUpperCase();
    const paytmLogo = { uri: 'https://res.cloudinary.com/da2imhgtf/image/upload/v1774718135/app-logo_znnatr.png' };

    return (
        <View style={[s.topBarReal, { backgroundColor: isDarkMode ? PAYTM_LIGHT_BLUE : PAYTM_BLUE, paddingTop: layout.headerPaddingTop, height: layout.headerHeight }]}>
            <View style={s.topBarLeft}>
                <TouchableOpacity style={s.userIconReal} onPress={onProfilePress}>
                    {userRole === 'merchant' ? (
                        <Store size={20} color="#FFF" />
                    ) : (
                        <Text style={s.userIconInit}>{initials}</Text>
                    )}
                </TouchableOpacity>
                <Image
                    source={paytmLogo}
                    resizeMode="contain"
                    style={{ width: 130, height: 40, marginLeft: 12 }}
                    onError={(e) => console.log('❌ Header logo load error:', e.nativeEvent.error)}
                />
            </View>
            <View style={s.topBarRight}>
                <TouchableOpacity style={s.topIconReal}><Search size={22} color="#FFF" /></TouchableOpacity>
                <TouchableOpacity style={s.topIconReal} onPress={onBellPress}><Bell size={22} color="#FFF" /></TouchableOpacity>
            </View>
        </View>
    );
};

const s = StyleSheet.create({
    topBarReal: { backgroundColor: PAYTM_BLUE, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, zIndex: 10 },
    topBarLeft: { flexDirection: 'row', alignItems: 'center' },
    userIconReal: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#1A67B8', justifyContent: 'center', alignItems: 'center' },
    userIconInit: { color: '#FFF', fontFamily: fonts.bold, fontSize: 16 },
    topBarRight: { flexDirection: 'row', gap: 16 },
    topIconReal: { width: 36, height: 36, justifyContent: 'center', alignItems: 'center' },
});
