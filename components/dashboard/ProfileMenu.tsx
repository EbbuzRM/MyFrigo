import React from 'react';
import { View, Text, TouchableOpacity, Modal, Pressable, StyleSheet } from 'react-native';
import { Settings, LogOut } from 'lucide-react-native';
import { router } from 'expo-router';
import { useTheme } from '@/context/ThemeContext';
import { DASHBOARD_CONTENT } from '@/constants/content';

interface ProfileMenuProps {
    isVisible: boolean;
    onClose: () => void;
    onLogout: () => void;
    userName: string;
}

export const ProfileMenu = React.memo(function ProfileMenu({ isVisible, onClose, onLogout, userName }: ProfileMenuProps) {
    const { isDarkMode } = useTheme();
    const styles = getStyles(isDarkMode);

    return (
        <Modal
            animationType="fade"
            transparent={true}
            visible={isVisible}
            onRequestClose={onClose}
            testID="profile-modal"
        >
            <Pressable accessibilityLabel="Chiudi menu" accessibilityRole="button" style={styles.modalOverlay} onPress={onClose}>
                <View style={styles.menuContainer}>
                    <Text style={styles.menuEmail}>{userName}</Text>
                    <View style={styles.menuDivider} />
                    <TouchableOpacity
                        accessibilityLabel="Impostazioni"
                        accessibilityRole="button"
                        style={styles.menuItem}
                        onPress={() => { router.push('/(tabs)/settings'); onClose(); }}
                    >
                        <Settings size={20} color={isDarkMode ? '#c9d1d9' : '#4b5563'} />
                        <Text style={styles.menuItemText}>{DASHBOARD_CONTENT.MENU_SETTINGS}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        accessibilityLabel="Esci"
                        accessibilityRole="button"
                        style={styles.menuItem}
                        onPress={onLogout}
                        testID="logout-button"
                    >
                        <LogOut size={20} color="#EF4444" />
                        <Text style={[styles.menuItemText, { color: '#EF4444' }]}>{DASHBOARD_CONTENT.MENU_LOGOUT}</Text>
                    </TouchableOpacity>
                </View>
            </Pressable>
        </Modal>
    );
});

const getStyles = (isDarkMode: boolean) => StyleSheet.create({
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-start',
        alignItems: 'flex-end',
        paddingTop: 80,
        paddingRight: 20,
    },
    menuContainer: {
        backgroundColor: isDarkMode ? '#1e1e1e' : '#ffffff',
        borderRadius: 12,
        padding: 10,
        width: 250,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        elevation: 5,
    },
    menuEmail: {
        fontSize: 14,
        fontFamily: 'Inter-Medium',
        color: isDarkMode ? '#8b949e' : '#64748B',
        padding: 10,
        textAlign: 'center',
    },
    menuDivider: {
        height: 1,
        backgroundColor: isDarkMode ? '#30363d' : '#e2e8f0',
        marginVertical: 5,
    },
    menuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        paddingHorizontal: 10,
    },
    menuItemText: {
        fontSize: 16,
        fontFamily: 'Inter-Regular',
        color: isDarkMode ? '#c9d1d9' : '#1e293b',
        marginLeft: 15,
    },
});
