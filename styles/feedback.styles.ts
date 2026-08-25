// feedback.styles.ts — feedback.styles module.
//
// exports: getStyles
// used_by: app\feedback.tsx
// rules:   - Style creation must use StyleSheet.create() exclusively
//          - The getStyles function accepts isDarkMode parameter for theme support

import { StyleSheet } from 'react-native';

export const getStyles = (isDarkMode: boolean) => StyleSheet.create({
  keyboardAvoidingView: {
    flex: 1,
    backgroundColor: isDarkMode ? '#0d1117' : '#f8f9fa',
  },
  container: {
    flex: 1,
  },
  scrollViewContent: {
    flexGrow: 1,
    padding: 20,
  },
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  backButton: {
    marginRight: 10,
    padding: 4,
  },
  title: {
    fontSize: 28,
    fontFamily: 'Inter-Bold',
    color: isDarkMode ? '#c9d1d9' : '#1e293b',
    flex: 1,
  },
  instructions: {
    fontSize: 15,
    fontFamily: 'Inter-Regular',
    color: isDarkMode ? '#8b949e' : '#64748B',
    lineHeight: 22,
    marginBottom: 24,
  },
  feedbackInput: {
    backgroundColor: isDarkMode ? '#161b22' : '#ffffff',
    borderWidth: 1,
    borderColor: isDarkMode ? '#30363d' : '#cbd5e1',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: isDarkMode ? '#c9d1d9' : '#1e293b',
    minHeight: 150,
    textAlignVertical: 'top',
  },
  screenshotSection: {
    marginTop: 20,
    marginBottom: 20,
  },
  screenshotLabel: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: isDarkMode ? '#c9d1d9' : '#1e293b',
    marginBottom: 12,
  },
  screenshotButtonsContainer: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 12,
  },
  screenshotButton: {
    backgroundColor: '#10b981',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    flex: 1,
    alignItems: 'center',
  },
  screenshotButtonDisabled: {
    backgroundColor: '#6b7280',
  },
  screenshotButtonText: {
    color: 'white',
    fontFamily: 'Inter-SemiBold',
    fontSize: 14,
  },
  removeScreenshotButton: {
    backgroundColor: '#ef4444',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  removeScreenshotButtonText: {
    color: 'white',
    fontFamily: 'Inter-SemiBold',
    fontSize: 14,
  },
  screenshotPreview: {
    borderWidth: 1,
    borderColor: isDarkMode ? '#30363d' : '#cbd5e1',
    borderRadius: 8,
    padding: 8,
    backgroundColor: isDarkMode ? '#161b22' : '#ffffff',
  },
  screenshotImage: {
    width: '100%',
    height: 150,
    borderRadius: 4,
  },
  feedbackButton: {
    backgroundColor: '#4f46e5',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 24,
  },
  feedbackButtonDisabled: {
    backgroundColor: '#a5b4fc',
  },
  feedbackButtonText: {
    color: 'white',
    fontFamily: 'Inter-SemiBold',
    fontSize: 16,
  },
});
