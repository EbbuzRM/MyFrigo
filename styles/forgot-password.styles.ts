// forgot-password.styles.ts — forgot-password.styles module.
//
// exports: styles
// used_by: app\forgot-password.tsx
// rules:   - Style creation must use StyleSheet.create() exclusively
//          - All styles are static (no theme dependency)

import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, justifyContent: 'center' },
  title: { fontSize: 24, marginBottom: 16, fontWeight: 'bold', textAlign: 'center' },
  input: { borderWidth: 1, borderColor: '#ccc', borderRadius: 8, padding: 12, marginBottom: 16 },
  loader: { marginTop: 20 },
  infoText: { fontSize: 16, color: '#666', textAlign: 'center', marginBottom: 20, lineHeight: 22 },
  switchContainer: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: 16, marginBottom: 8 },
  switchText: { fontSize: 14, color: '#666', marginRight: 8 },
  switchLinkText: { fontSize: 14, fontWeight: 'bold' },
  otpSection: { marginTop: 20 },
  otpSectionTitle: { fontSize: 18, fontWeight: 'bold', textAlign: 'center', marginBottom: 8 },
  otpInfoText: { fontSize: 14, color: '#666', textAlign: 'center', marginBottom: 16 },
  passwordResetSection: { marginTop: 20 },
  passwordResetTitle: { fontSize: 18, fontWeight: 'bold', textAlign: 'center', marginBottom: 8 },
  passwordInfoText: { fontSize: 14, color: '#666', textAlign: 'center', marginBottom: 16 },
  errorText: { color: 'red', textAlign: 'center', marginTop: 8 },
  backToEmailButton: { marginTop: 20 },
});
