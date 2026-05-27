// QuickActions.tsx — QuickActions module.
//
// exports: QuickActions
// used_by: app\(tabs)\index.tsx
// rules:   - Must maintain consistent routing paths (`/add`, `/scanner`) and accessibility labels (`accessibilityLabel`, `accessibilityRole`) across all quick action buttons.
//          - Quick action buttons must strictly follow the two-button layout (primary/secondary) with color contrast rules defined by `useTheme()` and the design system.
// agent:   deepseek/deepseek-chat | deepseek | 2026-05-09 | codedna-cli | initial CodeDNA annotation pass
// message: 

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Plus, ScanBarcode } from 'lucide-react-native';
import { router } from 'expo-router';
import { useTheme } from '@/context/ThemeContext';

import { DASHBOARD_CONTENT } from '@/constants/content';

export const QuickActions = React.memo(function QuickActions() {
    const { isDarkMode } = useTheme();
    const styles = getStyles(isDarkMode);

    return (
        <View style={styles.ctaContainer}>
            <TouchableOpacity 
                testID="add-product-button"
                accessibilityLabel="Aggiungi prodotto" 
                accessibilityRole="button" 
                style={styles.ctaButton} 
                onPress={() => router.push('/add')}
            >
                <Plus size={20} color="#ffffff" />
                <Text style={styles.ctaButtonText}>{DASHBOARD_CONTENT.BTN_ADD}</Text>
            </TouchableOpacity>

            <TouchableOpacity
                testID="scan-barcode-button"
                accessibilityLabel="Scansiona codice a barre"
                accessibilityRole="button"
                style={[styles.ctaButton, styles.ctaSecondaryButton]}
                onPress={() => router.push('/scanner')}
            >
                <ScanBarcode size={20} color={isDarkMode ? '#ffffff' : '#3b82f6'} />
                <Text style={[styles.ctaButtonText, styles.ctaSecondaryButtonText]}>{DASHBOARD_CONTENT.BTN_SCAN}</Text>
            </TouchableOpacity>
        </View>
    );
});

const getStyles = (isDarkMode: boolean) => StyleSheet.create({
    ctaContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        marginBottom: 24,
    },
    ctaButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#2563EB',
        paddingVertical: 12,
        borderRadius: 12,
        marginRight: 8,
    },
    ctaSecondaryButton: {
        backgroundColor: isDarkMode ? '#161b22' : '#ffffff',
        borderWidth: 1,
        borderColor: isDarkMode ? '#30363d' : '#e2e8f0',
        marginLeft: 8,
        marginRight: 0,
    },
    ctaButtonText: {
        color: '#ffffff',
        fontSize: 16,
        fontFamily: 'Inter-SemiBold',
        marginLeft: 8,
    },
    ctaSecondaryButtonText: {
        color: isDarkMode ? '#ffffff' : '#3b82f6',
    },
});
