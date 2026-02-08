import { StyleSheet, Dimensions, ViewStyle, TextStyle } from 'react-native';

const { width: screenWidth } = Dimensions.get('window');

interface Styles {
  modalOverlay: ViewStyle;
  modalContainer: ViewStyle;
  header: ViewStyle;
  iconContainer: ViewStyle;
  closeButton: ViewStyle;
  content: ViewStyle;
  title: TextStyle;
  message: TextStyle;
  progressContainer: ViewStyle;
  progressBackground: ViewStyle;
  progressBar: ViewStyle;
  progressText: TextStyle;
  versionInfo: ViewStyle;
  versionLabel: TextStyle;
  versionText: TextStyle;
  actions: ViewStyle;
  button: ViewStyle;
  laterButton: ViewStyle;
  primaryButton: ViewStyle;
  buttonText: TextStyle;
  primaryButtonText: TextStyle;
}

const colors = {
  dark: { bg: '#161b22', border: '#30363d', text: '#c9d1d9', muted: '#8b949e', secondary: '#21262d', surface: '#1f2937', input: '#0d1117' },
  light: { bg: '#ffffff', border: '#e2e8f0', text: '#1e293b', muted: '#64748b', secondary: '#f9fafb', surface: '#f3f4f6', input: '#f8fafc' },
  primary: '#4f46e5',
};

export const createUpdateModalStyles = (isDarkMode: boolean): Styles => {
  const c = isDarkMode ? colors.dark : colors.light;
  return StyleSheet.create({
    modalOverlay: { 
      position: 'absolute', 
      top: 0, 
      left: 0, 
      right: 0, 
      bottom: 0, 
      backgroundColor: 'rgba(0,0,0,0.7)', 
      justifyContent: 'center', 
      alignItems: 'center', 
      paddingHorizontal: 20,
      zIndex: 999999,
      elevation: 999999,
    },
    modalContainer: { backgroundColor: c.bg, borderRadius: 16, width: Math.min(screenWidth - 40, 400), maxWidth: '100%', borderColor: c.border, borderWidth: 1 },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, borderBottomWidth: 1, borderBottomColor: c.border },
    iconContainer: { width: 48, height: 48, borderRadius: 24, backgroundColor: c.surface, justifyContent: 'center', alignItems: 'center' },
    closeButton: { padding: 8, borderRadius: 20, backgroundColor: c.secondary },
    content: { padding: 20, alignItems: 'center' },
    title: { fontSize: 20, fontFamily: 'Inter-Bold', color: c.text, textAlign: 'center', marginBottom: 12 },
    message: { fontSize: 16, fontFamily: 'Inter-Regular', color: c.muted, textAlign: 'center', lineHeight: 24 },
    progressContainer: { width: '100%', marginTop: 20 },
    progressBackground: { height: 6, backgroundColor: c.border, borderRadius: 3, overflow: 'hidden' },
    progressBar: { height: '100%', backgroundColor: colors.primary, borderRadius: 3 },
    progressText: { fontSize: 14, fontFamily: 'Inter-Medium', color: c.muted, textAlign: 'center', marginTop: 8 },
    versionInfo: { width: '100%', marginTop: 20, backgroundColor: c.input, borderRadius: 8, padding: 16 },
    versionLabel: { fontSize: 12, fontFamily: 'Inter-Regular', color: c.muted, marginBottom: 4 },
    versionText: { fontSize: 14, fontFamily: 'Inter-SemiBold', color: c.text, marginBottom: 12 },
    actions: { flexDirection: 'row', paddingHorizontal: 20, paddingBottom: 20, gap: 12 },
    button: { flex: 1, paddingVertical: 12, paddingHorizontal: 20, borderRadius: 8, alignItems: 'center', justifyContent: 'center', minHeight: 44 },
    laterButton: { backgroundColor: isDarkMode ? '#30363d' : '#e5e7eb' },
    primaryButton: { backgroundColor: colors.primary },
    buttonText: { fontSize: 16, fontFamily: 'Inter-SemiBold', color: c.text },
    primaryButtonText: { fontSize: 16, fontFamily: 'Inter-SemiBold', color: '#ffffff' },
  });
};

export type UpdateModalStyles = ReturnType<typeof createUpdateModalStyles>;
