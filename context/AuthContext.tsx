import React, { createContext, useState, useEffect, useContext, useCallback } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/services/supabaseClient';
import { NotificationService } from '@/services/NotificationService';
import { OneSignal } from 'react-native-onesignal';

// --- TYPES ---
export type UserProfile = {
  first_name: string | null;
  last_name: string | null;
};

type AuthContextType = {
  session: Session | null;
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  updateProfile: (firstName: string, lastName: string) => Promise<void>;
  refreshUserProfile: () => Promise<void>; // Aggiunta
  setProfile: React.Dispatch<React.SetStateAction<UserProfile | null>>;
};

// --- CONTEXT ---
const AuthContext = createContext<AuthContextType>({
  session: null,
  user: null,
  profile: null,
  loading: true,
  updateProfile: async () => {},
  refreshUserProfile: async () => {}, // Aggiunta
  setProfile: () => {},
});

// --- PROVIDER ---
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  // Inizializza OneSignal una sola volta quando il provider viene montato
  useEffect(() => {
    NotificationService.initialize();
  }, []);

  const refreshUserProfile = useCallback(async (userId?: string) => {
    const id = userId || user?.id;
    if (!id) {
      console.log("[AuthContext] refreshUserProfile skipped: no user id.");
      setProfile(null);
      return;
    }
    console.log(`[AuthContext] Refreshing profile for user ${id}`);
    const { data, error } = await supabase
      .from('users')
      .select('first_name, last_name')
      .eq('id', id)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('[AuthContext] Error refreshing profile:', error.message);
      setProfile(null);
    } else {
      console.log('[AuthContext] Profile refreshed successfully:', data);
      setProfile(data as UserProfile);
    }
  }, [user?.id]);

  const updateProfile = async (firstName: string, lastName: string) => {
    if (!user) throw new Error("Nessun utente loggato.");

    const { error } = await supabase
      .from('users')
      .update({
        first_name: firstName,
        last_name: lastName,
        updated_at: new Date().toISOString(),
      })
      .eq('id', user.id);

    if (error) throw error;

    // Dopo l'aggiornamento, ricarica il profilo per aggiornare lo stato locale.
    await refreshUserProfile();
  };

  useEffect(() => {
    let mounted = true;
    setLoading(true);

    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (_event, currentSession) => {
        if (!mounted) return;

        const currentUser = currentSession?.user ?? null;

        if (currentUser) {
          // Utente loggato. Ora dobbiamo essere sicuri di ottenere il suo profilo.
          let profileData: UserProfile | null = null;
          
          // 1. Tenta di caricare il profilo esistente
          const { data: existingProfile } = await supabase
            .from('users')
            .select('first_name, last_name')
            .eq('id', currentUser.id)
            .single();

          // 2. Controlla se il profilo è completo.
          if (existingProfile && existingProfile.first_name) {
            console.log('[AuthContext] Profilo completo trovato:', existingProfile);
            profileData = existingProfile;
          } else {
            // 3. Se il profilo è incompleto o mancante, lo popoliamo.
            console.warn('[AuthContext] Profilo incompleto o mancante. Tentativo di aggiornamento forzato...');
            
            const fullName = currentUser.user_metadata?.full_name || '';
            const firstName = currentUser.user_metadata?.name || fullName.split(' ')[0] || '';
            const lastName = currentUser.user_metadata?.family_name || fullName.split(' ').slice(1).join(' ') || '';

            const { data: upsertedProfile, error: upsertError } = await supabase
              .from('users')
              .upsert({
                id: currentUser.id,
                first_name: firstName,
                last_name: lastName,
                updated_at: new Date().toISOString(),
              })
              .select('first_name, last_name')
              .single();

            if (upsertError) {
              console.error('[AuthContext] Errore durante l\'upsert del profilo:', upsertError.message);
            } else {
              console.log('[AuthContext] Upsert del profilo riuscito. Profilo aggiornato:', upsertedProfile);
              profileData = upsertedProfile;
            }
          }

          // Aggiorna tutto lo stato INSIEME
          setSession(currentSession);
          setUser(currentUser);
          setProfile(profileData);
          
          // Imposta l'ID utente esterno e invia i dati a OneSignal.
          console.log(`[AuthContext] Logging user ${currentUser.id} into OneSignal.`);
          OneSignal.login(currentUser.id);
          
          const userFullName = profileData?.first_name && profileData?.last_name 
            ? `${profileData.first_name} ${profileData.last_name}`
            : 'Utente';
            
          console.log(`[AuthContext] Sending tags to OneSignal:`, { user_name: userFullName, email: currentUser.email });
          OneSignal.User.addTags({ 
            user_name: userFullName,
            email: currentUser.email
          });

        } else {
          // Nessun utente, resetta tutto
          console.log('[AuthContext] User logged out. Logging out from OneSignal.');
          OneSignal.logout();
          setSession(null);
          setUser(null);
          setProfile(null);
        }
        
        // Solo alla fine di tutto, sblocca l'app
        setLoading(false);
      }
    );

    return () => {
      mounted = false;
      authListener.subscription.unsubscribe();
    };
  }, []);

  return (
    <AuthContext.Provider
      value={{
        session,
        user,
        profile,
        loading,
        updateProfile,
        refreshUserProfile, // Aggiunta
        setProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// --- HOOKS ---
export const useAuth = () => useContext(AuthContext);
