// ProductFormHeader.styles.ts — ProductFormHeader.styles module.
//
// exports: getHeaderStyles | getInputStyles | getButtonStyles | getPhotoCaptureStyles
// used_by: components\BrandInput.tsx
//         components\PhotoCaptureButton.tsx
//         components\ProductFormHeader.tsx
//         components\ProductNameInput.tsx
// rules:   - Theme support must be passed as a boolean parameter (`isDarkMode`) to all style factory functions; do not use global theme context or hooks inside style definitions
//          - All exported style factories (`getHeaderStyles`, `getInputStyles`, `getButtonStyles`) must accept `isDarkMode` as the sole parameter and use `StyleSheet.create()` for returning styles
// agent:   deepseek/deepseek-chat | deepseek | 2026-05-09 | codedna-cli | initial CodeDNA annotation pass
// message: 

import { StyleSheet } from 'react-native';

/**
 * Shared styles for ProductFormHeader and related components
 * Supports both light and dark themes
 */

export const getHeaderStyles = (isDarkMode: boolean) => StyleSheet.create({
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
    color: isDarkMode ? '#c9d1d9' : '#1e293b',
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 8,
    color: isDarkMode ? '#c9d1d9' : '#1e293b',
  },
  switchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: isDarkMode ? '#21262d' : '#f8fafc',
    borderWidth: 1,
    borderColor: isDarkMode ? '#30363d' : '#e2e8f0',
    marginBottom: 16,
  },
});

export const getInputStyles = (isDarkMode: boolean) => StyleSheet.create({
  input: {
    borderWidth: 1,
    borderColor: isDarkMode ? '#30363d' : '#cbd5e1',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    fontSize: 16,
    backgroundColor: isDarkMode ? '#21262d' : '#ffffff',
    color: isDarkMode ? '#c9d1d9' : '#1e293b',
  },
  disabledInput: {
    backgroundColor: isDarkMode ? '#161b22' : '#f1f5f9',
    color: isDarkMode ? '#8b949e' : '#64748b',
  },
  placeholder: {
    color: isDarkMode ? '#8b949e' : '#64748b',
  },
});

export const getButtonStyles = (isDarkMode: boolean) => StyleSheet.create({
  photoButton: {
    backgroundColor: isDarkMode ? '#21262d' : '#e2e8f0',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: isDarkMode ? '#30363d' : '#cbd5e1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoButtonText: {
    textAlign: 'center',
    color: isDarkMode ? '#58a6ff' : '#3b82f6',
    fontWeight: '500',
    fontSize: 14,
  },
  productImagePreview: {
    width: '100%',
    height: 200,
    borderRadius: 8,
    marginBottom: 16,
    resizeMode: 'contain',
  },
  imageLabel: {
    fontSize: 14,
    fontWeight: '400',
    marginBottom: 8,
    color: isDarkMode ? '#8b949e' : '#64748b',
    fontStyle: 'italic',
  },
});

export const getPhotoCaptureStyles = (isDarkMode: boolean) => StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  noImageButton: {
    backgroundColor: isDarkMode ? '#21262d' : '#e2e8f0',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: isDarkMode ? '#30363d' : '#cbd5e1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  noImageButtonText: {
    textAlign: 'center',
    color: isDarkMode ? '#58a6ff' : '#3b82f6',
    fontWeight: '500',
    fontSize: 14,
  },
  imageTouchable: {
    width: '100%',
  },
  imageLabel: {
    fontSize: 14,
    fontWeight: '400',
    marginBottom: 8,
    color: isDarkMode ? '#8b949e' : '#64748b',
    fontStyle: 'italic',
  },
  productImage: {
    width: '100%',
    height: 200,
    borderRadius: 8,
    resizeMode: 'contain',
  },
});
