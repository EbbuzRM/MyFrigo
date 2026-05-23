// AuthContext.tsx — AuthContext module.
//
// exports: useAuth | AuthProvider
// used_by: app\(tabs)\index.tsx
//         app\complete-profile.tsx
//         app\index.tsx
//         app\profile.tsx
//         components\AppProviders.tsx
//         context\CategoryContext.tsx
//         context\ProductContext.tsx
//         context\SettingsContext.tsx
//         hooks\useDiagnosticTests.ts
//         hooks\useGoogleAuth.ts
// rules:   - All Supabase authentication operations must be handled exclusively through this context to maintain a single source of truth for user session and profile data
//          - Session and user state initialization must occur before any child component mounts; do not modify the auth flow without ensuring the loading state properly gates rendering
// agent:   deepseek/deepseek-chat | deepseek | 2026-05-09 | codedna-cli | initial CodeDNA annotation pass
// message: 

import React, { createContext, useContext, useEffect, useState, useMemo, useCallback } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase, getCachedSession } from '@/services/supabaseClient';
import { LoggingService } from '@/services/LoggingService';
import { useRouter } from 'expo-router';

// Definizione del tipo per il profilo utente
interface UserProfile {
  id: string;
  first_name?: string | null;
  last_name?: string | null;
  // Aggiungi altri campi del profilo se necessario
}

type AuthContextType = {
  session: Session | null;
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  signOut: () => Promise<void>;
  refreshUserProfile: () => Promise<void>;
  updateProfile: (firstName: string, lastName: string) => Promise<void>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<void>;
};

const AuthContext = createContext<AuthContextType>({
  session: null,
  user: null,
  profile: null,
  loading: true,
  signOut: async () => { },
  refreshUserProfile: async () => { },
  updateProfile: async () => { },
  changePassword: async () => { },
});

interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const fetchUserProfile = useCallback(async (user: User | null) => {
    if (!user) {
      setProfile(null);
      return;
    }
    try {
      const { data, error } = await supabase
        .from('users')
        .select<'*', UserProfile>('*')
        .eq('id', user.id)
        .single();

      if (error) {
        LoggingService.error('AuthProvider', 'Error fetching user profile', error);
        setProfile(null);
      } else {
        setProfile(data);
        LoggingService.info('AuthProvider', 'User profile fetched successfully', { userId: user.id });
      }
    } catch (error) {
      LoggingService.error('AuthProvider', 'Unexpected error fetching profile', error);
      setProfile(null);
    }
  }, []);

  const refreshUserProfile = useCallback(async () => {
    await fetchUserProfile(user);
  }, [user, fetchUserProfile]);

  const updateProfile = useCallback(async (firstName: string, lastName: string) => {
    if (!user) {
      throw new Error('User not authenticated');
    }

    try {
      const { error } = await supabase
        .from('users')
        .update({
          first_name: firstName,
          last_name: lastName,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id);

      if (error) {
        LoggingService.error('AuthProvider', 'Error updating user profile', error);
        throw error;
      }

      await refreshUserProfile();
      LoggingService.info('AuthProvider', 'User profile updated successfully');
    } catch (error) {
      LoggingService.error('AuthProvider', 'Unexpected error updating profile', error);
      throw error;
    }
  }, [user, refreshUserProfile]);

  const signOut = useCallback(async () => {
    try {
      LoggingService.info('AuthProvider', 'Signing out user initiated');
      setLoading(true);

      const { error } = await supabase.auth.signOut();

      if (error) {
        LoggingService.error('AuthProvider', 'Error during supabase.auth.signOut', error);
      }

      setSession(null);
      setUser(null);
      setProfile(null);

      LoggingService.info('AuthProvider', 'Local state cleared, redirecting to login');
      router.replace('/login');

    } catch (error) {
      LoggingService.error('AuthProvider', 'Unexpected error during sign out', error);
      router.replace('/login');
    } finally {
      setLoading(false);
    }
  }, [router]);

  const changePassword = useCallback(async (currentPassword: string, newPassword: string) => {
    if (!user || !user.email) {
      LoggingService.error('AuthProvider', 'changePassword called without user or email');
      throw new Error('Utente non autenticato o email mancante');
    }

    try {
      LoggingService.info('AuthProvider', 'Verifying current password', { userId: user.id });
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: currentPassword,
      });

      if (signInError) {
        LoggingService.error('AuthProvider', 'Current password verification failed', signInError);
        throw new Error('Password attuale errata');
      }

      LoggingService.info('AuthProvider', 'Current password verified, updating password');
      const { error: updateError } = await supabase.auth.updateUser({ password: newPassword });

      if (updateError) {
        LoggingService.error('AuthProvider', 'Error updating password', updateError);
        throw updateError;
      }

      LoggingService.info('AuthProvider', 'Password updated successfully', { userId: user.id });
    } catch (error) {
      LoggingService.error('AuthProvider', 'Error during changePassword', error);

      // Se la sessione è invalidata, effettua un logout pulito
      if (error instanceof Error && error.message?.toLowerCase().includes('session')) {
        LoggingService.info('AuthProvider', 'Session invalidated after password change, signing out');
        await signOut();
        throw new Error('Sessione scaduta dopo il cambio password. Effettua nuovamente il login.');
      }

      throw error;
    }
  }, [user, signOut]);

  const contextValue = useMemo(() => ({
    session,
    user,
    profile,
    loading,
    signOut,
    refreshUserProfile,
    updateProfile,
    changePassword,
  }), [session, user, profile, loading, signOut, refreshUserProfile, updateProfile, changePassword]);

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

