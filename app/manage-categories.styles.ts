// manage-categories.styles.ts — manage-categories.styles module.
//
// exports: getStyles
// used_by: app\manage-categories.tsx
// rules:   - Style creation must use StyleSheet.create() exclusively
//          - The getStyles function accepts isDarkMode parameter for theme support

import { StyleSheet } from 'react-native';

export const getStyles = (isDarkMode: boolean) => StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 10,
    backgroundColor: isDarkMode ? '#0d1117' : '#ffffff',
  },
  title: {
    fontSize: 24,
    fontFamily: 'Inter-Bold',
    color: isDarkMode ? '#c9d1d9' : '#1e293b',
    marginBottom: 20,
    textAlign: 'center',
  },
  infoText: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: isDarkMode ? '#8b949e' : '#64748B',
    marginBottom: 15,
    textAlign: 'center',
  },
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#10B981',
    padding: 15,
    borderRadius: 8,
    marginBottom: 20,
  },
  createButtonText: {
    color: 'white',
    fontSize: 16,
    fontFamily: 'Inter-Bold',
    marginLeft: 10,
  },
  itemContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    backgroundColor: isDarkMode ? '#161b22' : '#ffffff',
    borderRadius: 8,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: isDarkMode ? '#30363d' : '#e2e8f0',
  },
  categoryInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  categoryIcon: {
    fontSize: 18,
    marginRight: 12,
  },
  categoryImage: {
    width: 24,
    height: 24,
    marginRight: 12,
    borderRadius: 4,
  },
  categoryName: {
    fontSize: 18,
    fontFamily: 'Inter-Regular',
    color: isDarkMode ? '#c9d1d9' : '#1e293b',
  },
  buttonsContainer: {
    flexDirection: 'row',
  },
   button: {
     marginLeft: 10,
     padding: 12,
     minWidth: 44,
     minHeight: 44,
     justifyContent: 'center',
     alignItems: 'center',
   },
  emptyText: {
    textAlign: 'center',
    marginTop: 20,
    color: isDarkMode ? '#8b949e' : '#64748B',
    fontFamily: 'Inter-Regular',
  },
  backButton: {
    marginTop: 20,
    padding: 15,
    backgroundColor: isDarkMode ? '#21262d' : '#ffffff',
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: isDarkMode ? '#30363d' : '#e2e8f0',
  },
  backButtonText: {
    color: isDarkMode ? '#c9d1d9' : '#2563EB',
    fontSize: 16,
    fontFamily: 'Inter-Bold',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    backgroundColor: isDarkMode ? '#161b22' : '#ffffff',
    padding: 20,
    borderRadius: 10,
    width: '80%',
    alignItems: 'stretch',
    borderColor: isDarkMode ? '#30363d' : '#e2e8f0',
    borderWidth: 1,
  },
  modalTitle: {
    fontSize: 18,
    fontFamily: 'Inter-Bold',
    marginBottom: 15,
    textAlign: 'center',
    color: isDarkMode ? '#c9d1d9' : '#1e293b',
  },
  modalInput: {
    borderWidth: 1,
    borderColor: isDarkMode ? '#30363d' : '#cbd5e1',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    marginBottom: 20,
    color: isDarkMode ? '#c9d1d9' : '#1e293b',
    backgroundColor: isDarkMode ? '#0d1117' : '#ffffff',
  },
  modalButtonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  modalButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    flex: 1,
    alignItems: 'center',
  },
  modalButtonCancel: {
    backgroundColor: isDarkMode ? '#30363d' : '#ffffff',
    marginRight: 10,
    borderWidth: 1,
    borderColor: isDarkMode ? '#30363d' : '#e2e8f0',
  },
  modalButtonConfirm: {
    backgroundColor: '#10B981',
    marginLeft: 10,
  },
  modalButtonTextCancel: {
    color: isDarkMode ? '#c9d1d9' : '#1e293b',
    fontFamily: 'Inter-SemiBold',
    fontSize: 16,
  },
  modalButtonTextConfirm: {
    color: 'white',
    fontFamily: 'Inter-SemiBold',
    fontSize: 16,
  },
});
