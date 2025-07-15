import React, { createContext, useState, useEffect, useContext, useCallback } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/services/supabaseClient';
import { Linking } from 'react-native';

// Definiamo un tipo per il profilo utente
export type UserProfile = {
  first_name: string | null;
  last_name: string | null;
};

type AuthContextType = {
  session: Session | null;
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  refreshProfile: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType>({
  session: null,
  user: null,
  profile: null,
  loading: true,
  refreshProfile: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchSessionAndProfile = useCallback(async () => {
    setLoading(true);
    try {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError) throw sessionError;
      setSession(session);
      setUser(session?.user ?? null);

      if (session?.user) {
        const { data: profileData, error: profileError } = await supabase
          .from('users')
          .select('first_name, last_name')
          .eq('id', session.user.id)
          .single();
        
        if (profileError && profileError.code !== 'PGRST116') {
          throw profileError;
        }
        setProfile(profileData);
      }
    } catch (error) {
      console.error("Error fetching session and profile:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // Funzione di avvio per caricare la sessione iniziale
    const initializeAuth = async () => {
      setLoading(true);
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        const { data: profileData } = await supabase.from('users').select('first_name, last_name').eq('id', session.user.id).single();
        setProfile(profileData);
        setSession(session);
        setUser(session.user);
      }
      setLoading(false);
    };

    initializeAuth();

    // Listener per SIGNED_OUT e altri eventi (es. password recovery)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (_event === 'SIGNED_OUT') {
        setSession(null);
        setUser(null);
        setProfile(null);
      }
    });

    // Listener per il ritorno da OAuth (Google Login)
    const handleAuthRedirect = async (event: { url: string }) => {
      if (!event.url.includes('#access_token=')) return;

      setLoading(true);
      
      const params = new URLSearchParams(event.url.split('#')[1]);
      const access_token = params.get('access_token');
      const refresh_token = params.get('refresh_token');

      if (access_token && refresh_token) {
        // 1. Imposta la sessione nel client Supabase
        const { data: { session }, error } = await supabase.auth.setSession({ access_token, refresh_token });

        if (error || !session) {
          console.error("Errore impostando la sessione da URL", error);
          setLoading(false);
          return;
        }

        // 2. Controlla se è un utente Google e popola il profilo se necessario
        const isGoogleUser = session.user.app_metadata.provider === 'google';
        if (isGoogleUser) {
          const { data: profileData } = await supabase.from('users').select('first_name').eq('id', session.user.id).single();
          if (!profileData?.first_name) {
            const fullName = session.user.user_metadata.full_name;
            const firstName = fullName.split(' ')[0] || '';
            const lastName = fullName.substring(firstName.length).trim() || '';
            if (firstName) {
              await supabase.from('users').update({ first_name: firstName, last_name: lastName }).eq('id', session.user.id);
            }
          }
        }

        // 3. Ricarica il profilo finale e aggiorna lo stato dell'app
        const { data: finalProfile } = await supabase.from('users').select('first_name, last_name').eq('id', session.user.id).single();
        setProfile(finalProfile);
        setSession(session);
        setUser(session.user);
      }
      
      setLoading(false);
    };
    
    const linkingSubscription = Linking.addEventListener('url', handleAuthRedirect);

    return () => {
      subscription?.unsubscribe();
      linkingSubscription.remove();
    };
  }, []);

  const refreshProfile = async () => {
    if (user) {
      try {
        const { data: profileData, error: profileError } = await supabase
          .from('users')
          .select('first_name, last_name')
          .eq('id', user.id)
          .single();
        
        if (profileError && profileError.code !== 'PGRST116') {
          throw profileError;
        }
        setProfile(profileData);
      } catch (error) {
        console.error("Error refreshing profile:", error);
      }
    }
  };

  return (
    <AuthContext.Provider value={{ session, user, profile, loading, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  return useContext(AuthContext);
};