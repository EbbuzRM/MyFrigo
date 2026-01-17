import React, { createContext, useContext, useEffect, useState, useMemo } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/services/supabaseClient';
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
};

const AuthContext = createContext<AuthContextType>({
  session: null,
  user: null,
  profile: null,
  loading: true,
  signOut: async () => { },
  refreshUserProfile: async () => { },
  updateProfile: async () => { },
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

  const updateProfile = async (firstName: string, lastName: string) => {
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

      // Refresh the profile in state
      await refreshUserProfile();
      LoggingService.info('AuthProvider', 'User profile updated successfully');
    } catch (error) {
      LoggingService.error('AuthProvider', 'Unexpected error updating profile', error);
      throw error;
    }
  };

  useEffect(() => {
    const initializeAuth = async () => {
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
        const isResetting = currentSession?.user.user_metadata?.is_resetting_password;
        if (isResetting) {
          LoggingService.info('AuthProvider', 'User signed in for reset. Skipping profile fetch.');
          router.replace('/password-reset-form');
        } else {
          await fetchUserProfile(currentSession?.user ?? null);
          router.replace('/(tabs)');
        }
      } else if (event === 'SIGNED_OUT') {
        setProfile(null);
        router.replace('/login');
      } else if (event === 'PASSWORD_RECOVERY') {
        LoggingService.info('AuthProvider', 'PASSWORD_RECOVERY event received, redirecting to password reset form');
        router.replace('/password-reset-form');
      } else if (event === 'USER_UPDATED') {
        setSession(currentSession);
        const isResetting = currentSession?.user.user_metadata?.is_resetting_password;
        LoggingService.info('AuthProvider', 'USER_UPDATED event received', { isResetting });

        if (isResetting) {
          LoggingService.info('AuthProvider', 'User is resetting password. Skipping profile fetch and redirect.');
        } else {
          await fetchUserProfile(currentSession?.user ?? null);
        }
      }
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, [router]);

  const signOut = async () => {
    try {
      LoggingService.info('AuthProvider', 'Signing out user initiated');
      setLoading(true);

      const { error } = await supabase.auth.signOut();

      if (error) {
        LoggingService.error('AuthProvider', 'Error during supabase.auth.signOut', error);
        // We continue anyway to clear local state
      }

      // Explicitly clear local state
      setSession(null);
      setUser(null);
      setProfile(null);

      LoggingService.info('AuthProvider', 'Local state cleared, redirecting to login');
      router.replace('/login');

    } catch (error) {
      LoggingService.error('AuthProvider', 'Unexpected error during sign out', error);
      // Force redirect anyway
      router.replace('/login');
    } finally {
      setLoading(false);
    }
  };

  const contextValue = useMemo(() => ({
    session,
    user,
    profile,
    loading,
    signOut,
    refreshUserProfile,
    updateProfile
  }), [session, user, profile, loading]);

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

