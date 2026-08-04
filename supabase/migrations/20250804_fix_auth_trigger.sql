-- Disabilita temporaneamente il trigger che potrebbe causare timeout
-- durante la registrazione degli utenti

-- Prima, salva la definizione del trigger esistente per riferimento
-- Il trigger originale inserisce un record nella tabella users quando
-- un nuovo utente viene creato in auth.users

-- Elimina il trigger esistente se esiste
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Ricrea il trigger con una versione ottimizzata che gestisce meglio gli errori
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  -- Aggiungi un timeout per evitare blocchi infiniti
  SET LOCAL statement_timeout = '5s';
  
  -- Verifica se l'utente esiste già per evitare duplicati
  IF EXISTS (SELECT 1 FROM public.users WHERE id = new.id) THEN
    RETURN new;
  END IF;
  
  -- Prova a inserire il nuovo utente con gestione degli errori
  BEGIN
    INSERT INTO public.users (id, email, first_name, last_name, created_at, updated_at)
    VALUES (
      new.id, 
      new.email,
      new.raw_user_meta_data->>'first_name',
      new.raw_user_meta_data->>'last_name',
      NOW(),
      NOW()
    );
  EXCEPTION
    WHEN OTHERS THEN
      -- Log dell'errore ma non bloccare la registrazione
      RAISE WARNING 'Failed to create user profile: %', SQLERRM;
      -- Ritorna comunque new per permettere la registrazione di continuare
      RETURN new;
  END;
  
  RETURN new;
END;
$$;

-- Ricrea il trigger solo se non esiste
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'on_auth_user_created' 
    AND tgrelid = 'auth.users'::regclass
  ) THEN
    CREATE TRIGGER on_auth_user_created
      AFTER INSERT ON auth.users
      FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
  END IF;
END $$;

-- Aggiungi un indice per migliorare le performance
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);
CREATE INDEX IF NOT EXISTS idx_users_created_at ON public.users(created_at);

-- Assicurati che le policy RLS non blocchino l'inserimento
-- Crea una policy che permette l'inserimento durante la registrazione
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'users'
    AND policyname = 'Enable insert for service role during signup'
  ) THEN
    CREATE POLICY "Enable insert for service role during signup"
    ON public.users
    FOR INSERT
    TO service_role
    WITH CHECK (true);
  END IF;
END $$;

-- Commento per documentare le modifiche
COMMENT ON FUNCTION public.handle_new_user() IS 'Gestisce la creazione del profilo utente con timeout e gestione errori migliorata per evitare blocchi durante la registrazione';