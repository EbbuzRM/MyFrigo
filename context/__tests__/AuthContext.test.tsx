import React from 'react';
import { render, act, waitFor } from '@testing-library/react-native';
import { Text, View } from 'react-native';
import { AuthProvider, useAuth } from '../AuthContext';
import { supabase } from '@/services/supabaseClient';

// --- Mocks ---

// Mock del LoggingService
jest.mock('@/services/LoggingService', () => ({
  LoggingService: {
    info: jest.fn(),
    error: jest.fn(),
    warning: jest.fn(),
  },
}));

// Mock di expo-router
const mockRouter = {
  replace: jest.fn(),
};

jest.mock('expo-router', () => ({
  useRouter: () => mockRouter,
}));

// Mock del Supabase client
const mockGetSession = jest.fn();
const mockOnAuthStateChange = jest.fn();
const mockSignOut = jest.fn();
const mockFrom = jest.fn();

jest.mock('@/services/supabaseClient', () => ({
  supabase: {
    auth: {
      getSession: () => mockGetSession(),
      onAuthStateChange: (callback: Function) => mockOnAuthStateChange(callback),
      signOut: () => mockSignOut(),
    },
    from: (table: string) => mockFrom(table),
  },
}));

// --- Componente di Test ---
const TestComponent = () => {
  const { session, user, profile, loading, signOut, refreshUserProfile, updateProfile } = useAuth();
  
  return (
    <View>
      <Text testID="loading">{loading ? 'true' : 'false'}</Text>
      <Text testID="user-id">{user?.id ?? 'null'}</Text>
      <Text testID="profile-name">{profile?.first_name ?? 'null'}</Text>
      <Text testID="session">{session ? 'exists' : 'null'}</Text>
      <Text testID="actions" onPress={() => signOut()}>signOut</Text>
      <Text testID="refresh" onPress={() => refreshUserProfile()}>refresh</Text>
      <Text testID="update" onPress={() => updateProfile('John', 'Doe')}>update</Text>
    </View>
  );
};

// Helper per renderizzare il provider
const renderAuthProvider = () => {
  return render(
    <AuthProvider>
      <TestComponent />
    </AuthProvider>
  );
};

// Mock User type helper
const createMockUser = (id: string, metadata?: Record<string, unknown>) => ({
  id,
  email: `${id}@test.com`,
  app_metadata: {},
  user_metadata: metadata || {},
  aud: 'authenticated',
  created_at: '2024-01-01T00:00:00Z',
  role: 'authenticated',
});

// Mock Session type helper
const createMockSession = (user: ReturnType<typeof createMockUser>) => ({
  access_token: 'mock-token',
  refresh_token: 'mock-refresh-token',
  expires_in: 3600,
  expires_at: Date.now() + 3600,
  token_type: 'bearer',
  user,
});

// --- Test Suite ---
describe('AuthContext', () => {
  
  let authCallback: Function | null = null;

  beforeEach(() => {
    jest.clearAllMocks();
    authCallback = null;
    
    // Setup default mock implementations
    mockGetSession.mockResolvedValue({ data: { session: null }, error: null });
    mockOnAuthStateChange.mockImplementation((callback: Function) => {
      authCallback = callback;
      return {
        data: {
          subscription: {
            unsubscribe: jest.fn(),
          },
        },
      };
    });
    mockSignOut.mockResolvedValue({ error: null });
    mockFrom.mockReturnValue({
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({ data: null, error: null }),
      update: jest.fn().mockReturnThis(),
    });
  });

  describe('Stato iniziale', () => {
    
    it('dovrebbe iniziare con loading true', async () => {
      const { getByTestId } = renderAuthProvider();
      
      expect(getByTestId('loading').props.children).toBe('true');
    });

    it('dovrebbe avere session, user e profile null all\'inizio', async () => {
      const { getByTestId } = renderAuthProvider();
      
      expect(getByTestId('session').props.children).toBe('null');
      expect(getByTestId('user-id').props.children).toBe('null');
      expect(getByTestId('profile-name').props.children).toBe('null');
    });

    it('dovrebbe chiamare getSession all\'inizializzazione', async () => {
      renderAuthProvider();
      
      expect(mockGetSession).toHaveBeenCalledTimes(1);
    });

    it('dovrebbe impostare loading false dopo l\'inizializzazione', async () => {
      const { getByTestId } = renderAuthProvider();
      
      await waitFor(() => {
        expect(getByTestId('loading').props.children).toBe('false');
      });
    });
  });

  describe('Sessione esistente', () => {
    
    it('dovrebbe ripristinare una sessione esistente', async () => {
      const mockUser = createMockUser('user-123');
      const mockSession = createMockSession(mockUser);
      
      mockGetSession.mockResolvedValue({ 
        data: { session: mockSession }, 
        error: null 
      });

      const mockProfileData = { id: 'user-123', first_name: 'Test', last_name: 'User' };
      mockFrom.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: mockProfileData, error: null }),
      });

      const { getByTestId } = renderAuthProvider();
      
      await waitFor(() => {
        expect(getByTestId('user-id').props.children).toBe('user-123');
        expect(getByTestId('session').props.children).toBe('exists');
      });
    });

    it('dovrebbe recuperare il profilo utente se la sessione esiste', async () => {
      const mockUser = createMockUser('user-123');
      const mockSession = createMockSession(mockUser);
      
      mockGetSession.mockResolvedValue({ 
        data: { session: mockSession }, 
        error: null 
      });

      const mockProfileData = { id: 'user-123', first_name: 'Mario', last_name: 'Rossi' };
      mockFrom.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: mockProfileData, error: null }),
      });

      const { getByTestId } = renderAuthProvider();
      
      await waitFor(() => {
        expect(getByTestId('profile-name').props.children).toBe('Mario');
      });
      
      expect(mockFrom).toHaveBeenCalledWith('users');
    });

    it('dovrebbe gestire errori nel recupero del profilo', async () => {
      const mockUser = createMockUser('user-123');
      const mockSession = createMockSession(mockUser);
      
      mockGetSession.mockResolvedValue({ 
        data: { session: mockSession }, 
        error: null 
      });

      mockFrom.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: null, error: new Error('DB Error') }),
      });

      const { getByTestId } = renderAuthProvider();
      
      await waitFor(() => {
        expect(getByTestId('user-id').props.children).toBe('user-123');
        expect(getByTestId('profile-name').props.children).toBe('null');
      });
    });
  });

  describe('signOut', () => {
    
    it('dovrebbe chiamare supabase.auth.signOut', async () => {
      const { getByTestId } = renderAuthProvider();
      
      await waitFor(() => {
        expect(getByTestId('loading').props.children).toBe('false');
      });

      await act(async () => {
        getByTestId('actions').props.onPress();
      });

      expect(mockSignOut).toHaveBeenCalledTimes(1);
    });

    it('dovrebbe resettare session, user e profile', async () => {
      const mockUser = createMockUser('user-123');
      const mockSession = createMockSession(mockUser);
      
      mockGetSession.mockResolvedValue({ 
        data: { session: mockSession }, 
        error: null 
      });

      mockFrom.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ 
          data: { id: 'user-123', first_name: 'Test' }, 
          error: null 
        }),
      });

      const { getByTestId } = renderAuthProvider();
      
      await waitFor(() => {
        expect(getByTestId('user-id').props.children).toBe('user-123');
      });

      await act(async () => {
        getByTestId('actions').props.onPress();
      });

      expect(getByTestId('user-id').props.children).toBe('null');
      expect(getByTestId('profile-name').props.children).toBe('null');
      expect(getByTestId('session').props.children).toBe('null');
    });

    it('dovrebbe reindirizzare a /login dopo signOut', async () => {
      const { getByTestId } = renderAuthProvider();
      
      await waitFor(() => {
        expect(getByTestId('loading').props.children).toBe('false');
      });

      await act(async () => {
        getByTestId('actions').props.onPress();
      });

      expect(mockRouter.replace).toHaveBeenCalledWith('/login');
    });

    it('dovrebbe gestire errori durante signOut', async () => {
      mockSignOut.mockResolvedValue({ error: new Error('SignOut failed') });

      const { getByTestId } = renderAuthProvider();
      
      await waitFor(() => {
        expect(getByTestId('loading').props.children).toBe('false');
      });

      await act(async () => {
        getByTestId('actions').props.onPress();
      });

      expect(mockRouter.replace).toHaveBeenCalledWith('/login');
    });
  });

  describe('refreshUserProfile', () => {
    
    it('non dovrebbe fare nulla se non c\'è un utente', async () => {
      const { getByTestId } = renderAuthProvider();
      
      await waitFor(() => {
        expect(getByTestId('loading').props.children).toBe('false');
      });

      await act(async () => {
        getByTestId('refresh').props.onPress();
      });

      expect(mockFrom).not.toHaveBeenCalled();
    });

    it('dovrebbe recuperare il profilo se c\'è un utente', async () => {
      const mockUser = createMockUser('user-123');
      const mockSession = createMockSession(mockUser);
      
      mockGetSession.mockResolvedValue({ 
        data: { session: mockSession }, 
        error: null 
      });

      const mockProfileData = { id: 'user-123', first_name: 'Updated', last_name: 'Name' };
      mockFrom.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: mockProfileData, error: null }),
      });

      const { getByTestId } = renderAuthProvider();
      
      await waitFor(() => {
        expect(getByTestId('user-id').props.children).toBe('user-123');
      });

      await act(async () => {
        getByTestId('refresh').props.onPress();
      });

      await waitFor(() => {
        expect(getByTestId('profile-name').props.children).toBe('Updated');
      });
    });
  });

  describe('updateProfile', () => {
    
    it('dovrebbe lanciare errore se non c\'è un utente autenticato', async () => {
      const { getByTestId } = renderAuthProvider();
      
      await waitFor(() => {
        expect(getByTestId('loading').props.children).toBe('false');
      });

      await act(async () => {
        await expect(getByTestId('update').props.onPress()).rejects.toThrow('User not authenticated');
      });
    });

    it('dovrebbe aggiornare il profilo utente', async () => {
      const mockUser = createMockUser('user-123');
      const mockSession = createMockSession(mockUser);
      
      mockGetSession.mockResolvedValue({ 
        data: { session: mockSession }, 
        error: null 
      });

      const mockUpdateFn = jest.fn().mockReturnThis();
      const mockEqFn = jest.fn().mockResolvedValue({ error: null });
      
      mockFrom.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ 
          data: { id: 'user-123', first_name: 'John', last_name: 'Doe' }, 
          error: null 
        }),
        update: mockUpdateFn,
      });
      
      mockUpdateFn.mockReturnValue({
        eq: mockEqFn,
      });

      const { getByTestId } = renderAuthProvider();
      
      await waitFor(() => {
        expect(getByTestId('user-id').props.children).toBe('user-123');
      });

      await act(async () => {
        getByTestId('update').props.onPress();
      });

      expect(mockFrom).toHaveBeenCalledWith('users');
    });

    it('dovrebbe gestire errori durante l\'aggiornamento', async () => {
      const mockUser = createMockUser('user-123');
      const mockSession = createMockSession(mockUser);
      
      mockGetSession.mockResolvedValue({ 
        data: { session: mockSession }, 
        error: null 
      });

      const mockUpdateFn = jest.fn().mockReturnThis();
      const mockEqFn = jest.fn().mockResolvedValue({ error: new Error('Update failed') });
      
      mockFrom.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: null, error: null }),
        update: mockUpdateFn,
      });
      
      mockUpdateFn.mockReturnValue({
        eq: mockEqFn,
      });

      const { getByTestId } = renderAuthProvider();
      
      await waitFor(() => {
        expect(getByTestId('user-id').props.children).toBe('user-123');
      });

      await act(async () => {
        await expect(getByTestId('update').props.onPress()).rejects.toThrow('Update failed');
      });
    });
  });

  describe('Auth state change events', () => {
    
    it('dovrebbe gestire SIGNED_IN event', async () => {
      const { getByTestId } = renderAuthProvider();
      
      await waitFor(() => {
        expect(getByTestId('loading').props.children).toBe('false');
      });

      const mockUser = createMockUser('new-user');
      const mockSession = createMockSession(mockUser);

      mockFrom.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ 
          data: { id: 'new-user', first_name: 'New' }, 
          error: null 
        }),
      });

      await act(async () => {
        if (authCallback) {
          await authCallback('SIGNED_IN', mockSession);
        }
      });

      await waitFor(() => {
        expect(getByTestId('user-id').props.children).toBe('new-user');
      });
      
      expect(mockRouter.replace).toHaveBeenCalledWith('/(tabs)');
    });

    it('dovrebbe gestire SIGNED_IN con password reset', async () => {
      const { getByTestId } = renderAuthProvider();
      
      await waitFor(() => {
        expect(getByTestId('loading').props.children).toBe('false');
      });

      const mockUser = createMockUser('reset-user', { is_resetting_password: true });
      const mockSession = createMockSession(mockUser);

      await act(async () => {
        if (authCallback) {
          await authCallback('SIGNED_IN', mockSession);
        }
      });

      expect(mockRouter.replace).toHaveBeenCalledWith('/password-reset-form');
    });

    it('dovrebbe gestire SIGNED_OUT event', async () => {
      const { getByTestId } = renderAuthProvider();
      
      await waitFor(() => {
        expect(getByTestId('loading').props.children).toBe('false');
      });

      await act(async () => {
        if (authCallback) {
          await authCallback('SIGNED_OUT', null);
        }
      });

      expect(getByTestId('user-id').props.children).toBe('null');
      expect(getByTestId('profile-name').props.children).toBe('null');
      expect(getByTestId('session').props.children).toBe('null');
      expect(mockRouter.replace).toHaveBeenCalledWith('/login');
    });

    it('dovrebbe gestire PASSWORD_RECOVERY event', async () => {
      const { getByTestId } = renderAuthProvider();
      
      await waitFor(() => {
        expect(getByTestId('loading').props.children).toBe('false');
      });

      await act(async () => {
        if (authCallback) {
          await authCallback('PASSWORD_RECOVERY', null);
        }
      });

      expect(mockRouter.replace).toHaveBeenCalledWith('/password-reset-form');
    });

    it('dovrebbe gestire USER_UPDATED event', async () => {
      const { getByTestId } = renderAuthProvider();
      
      await waitFor(() => {
        expect(getByTestId('loading').props.children).toBe('false');
      });

      const mockUser = createMockUser('updated-user');
      const mockSession = createMockSession(mockUser);

      mockFrom.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ 
          data: { id: 'updated-user', first_name: 'Updated' }, 
          error: null 
        }),
      });

      await act(async () => {
        if (authCallback) {
          await authCallback('USER_UPDATED', mockSession);
        }
      });

      await waitFor(() => {
        expect(getByTestId('user-id').props.children).toBe('updated-user');
      });
    });

    it('dovrebbe gestire USER_UPDATED durante password reset', async () => {
      const { getByTestId } = renderAuthProvider();
      
      await waitFor(() => {
        expect(getByTestId('loading').props.children).toBe('false');
      });

      const mockUser = createMockUser('reset-user', { is_resetting_password: true });
      const mockSession = createMockSession(mockUser);

      mockFrom.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: null, error: null }),
      });

      await act(async () => {
        if (authCallback) {
          await authCallback('USER_UPDATED', mockSession);
        }
      });

      expect(mockRouter.replace).not.toHaveBeenCalled();
    });
  });

  describe('useAuth hook', () => {
    
    it('il context dovrebbe avere valori di default', async () => {
      const { getByTestId } = renderAuthProvider();
      
      await waitFor(() => {
        expect(getByTestId('loading').props.children).toBe('false');
        expect(getByTestId('user-id').props.children).toBe('null');
        expect(getByTestId('profile-name').props.children).toBe('null');
        expect(getByTestId('session').props.children).toBe('null');
      });
    });
  });

  describe('Cleanup', () => {
    
    it('dovrebbe fare unsubscribe del listener al dismount', async () => {
      const mockUnsubscribe = jest.fn();
      mockOnAuthStateChange.mockReturnValue({
        data: {
          subscription: {
            unsubscribe: mockUnsubscribe,
          },
        },
      });

      const { unmount } = renderAuthProvider();
      
      await waitFor(() => {
        expect(mockOnAuthStateChange).toHaveBeenCalled();
      });

      unmount();
      
      expect(mockUnsubscribe).toHaveBeenCalledTimes(1);
    });
  });
});
