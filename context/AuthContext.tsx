import React, { createContext, useContext, useEffect, useState, useMemo } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/services/supabaseClient';
import { LoggingService } from '@/services/LoggingService';
import { useRouter } from 'expo-router';
import { isTestMode } from '@/services/test-env';

// Definizione del tipo per il profilo utente
interface UserProfile {
  id: string;
  first_name?: string;
  last_name?: string;
  // Aggiungi altri campi del profilo se necessario
}

type AuthContextType = {
  session: Session | null;
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  signOut: () => Promise<void>;
  refreshUserProfile: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType>({
  session: null,
  user: null,
  profile: null,
  loading: true,
  signOut: async () => {},
  refreshUserProfile: async () => {},
});

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const fetchUserProfile = async (user: User | null) => {
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
  };

  const refreshUserProfile = async () => {
    await fetchUserProfile(user);
  };

  useEffect(() => {
    const initializeAuth = async () => {
      // In modalità test, bypassiamo l'inizializzazione automatica della sessione
      // per garantire un avvio pulito sulla schermata di login.
      if (isTestMode) {
        LoggingService.info('AuthProvider', 'Test mode detected, skipping session restore.');
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        LoggingService.info('AuthProvider', 'Attempting to get session...');
        const { data: { session: currentSession }, error } = await supabase.auth.getSession();
        LoggingService.info('AuthProvider', 'Finished getSession call.');

        if (error) {
          LoggingService.error('AuthProvider', 'Error getting session', error);
        } else if (currentSession) {
          LoggingService.info('AuthProvider', 'Session found, processing...');
          setUser(currentSession.user);
          await fetchUserProfile(currentSession.user);
          setSession(currentSession);
          LoggingService.info('AuthProvider', 'Session restored', { userId: currentSession.user.id });
        } else {
          LoggingService.info('AuthProvider', 'No active session found.');
        }
      } catch (error) {
        LoggingService.error('AuthProvider', 'Unexpected error during auth initialization', error);
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();

    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, currentSession) => {
      LoggingService.info('AuthProvider', 'Auth state changed', { event });
      
      setUser(currentSession?.user ?? null);
      setSession(currentSession);

      if (event === 'SIGNED_IN') {
        await fetchUserProfile(currentSession?.user ?? null);
        const isResetting = currentSession?.user.user_metadata?.is_resetting_password;
        if (isResetting) {
          router.replace('/password-reset-form');
        } else {
          router.replace('/(tabs)');
        }
      } else if (event === 'SIGNED_OUT') {
        setProfile(null);
        router.replace('/login');
      } else if (event === 'USER_UPDATED') {
        await fetchUserProfile(currentSession?.user ?? null);
      }
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, [router]);

  const signOut = async () => {
    try {
      LoggingService.info('AuthProvider', 'Signing out user');
      await supabase.auth.signOut();
    } catch (error) {
      LoggingService.error('AuthProvider', 'Unexpected error during sign out', error);
    }
  };

  const contextValue = useMemo(() => ({
    session,
    user,
    profile,
    loading,
    signOut,
    refreshUserProfile
  }), [session, user, profile, loading]);

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

