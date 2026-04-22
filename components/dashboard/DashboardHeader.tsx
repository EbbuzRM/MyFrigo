import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { User, Bell, BellOff } from 'lucide-react-native';
import { useTheme } from '@/context/ThemeContext';
import { DASHBOARD_CONTENT } from '@/constants/content';

interface DashboardHeaderProps {
    permissionStatus: string | null;
    onBellPress: () => void;
    onProfilePress: () => void;
    displayInitials?: string;
}

export const DashboardHeader = React.memo(function DashboardHeader({
    permissionStatus,
    onBellPress,
    onProfilePress,
    displayInitials
}: DashboardHeaderProps) {
    const { isDarkMode } = useTheme();
    const styles = getStyles(isDarkMode);

    return (
        <View style={styles.header}>
            <TouchableOpacity
                accessibilityLabel="Notifiche"
                accessibilityRole="button"
                style={styles.titleContainer}
                onPress={onBellPress}
                disabled={permissionStatus !== 'denied'}
                testID="bell-button"
            >
                <Text style={styles.title}>{DASHBOARD_CONTENT.TITLE}</Text>
                <View style={styles.notificationIconContainer}>
                    {permissionStatus === 'granted'
                        ? <Bell size={18} color={isDarkMode ? '#4ade80' : '#16a34a'} />
                        : <BellOff size={18} color={isDarkMode ? '#f87171' : '#dc2626'} />
                    }
                </View>
            </TouchableOpacity>

            <TouchableOpacity
                accessibilityLabel="Profilo"
                accessibilityRole="button"
                style={styles.profileButton}
                onPress={onProfilePress}
                testID="profile-button"
            >
                {displayInitials ? (
                    <Text style={styles.profileButtonText}>{displayInitials}</Text>
                ) : (
                    <User size={24} color={isDarkMode ? '#c9d1d9' : '#1e293b'} />
                )}
            </TouchableOpacity>
        </View>
    );
});

const getStyles = (isDarkMode: boolean) => StyleSheet.create({
    header: {
        paddingHorizontal: 20,
        paddingTop: 20,
        paddingBottom: 20,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    titleContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    title: {
        fontSize: 28,
        fontFamily: 'Inter-Bold',
        color: isDarkMode ? '#c9d1d9' : '#1e293b',
    },
    notificationIconContainer: {
        marginTop: 4,
    },
    profileButton: {
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: isDarkMode ? '#161b22' : '#e2e8f0',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: isDarkMode ? '#30363d' : '#f1f5f9',
    },
    profileButtonText: {
        fontSize: 28,
        fontWeight: 'bold',
        color: isDarkMode ? '#c9d1d9' : '#1e293b',
    },
});
