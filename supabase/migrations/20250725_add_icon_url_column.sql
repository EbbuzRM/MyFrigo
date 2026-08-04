-- Verifica se la colonna icon_url esiste già nella tabella categories
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'categories' AND column_name = 'icon_url'
    ) THEN
        -- Aggiungi la colonna icon_url se non esiste
        ALTER TABLE categories ADD COLUMN icon_url TEXT;
    END IF;
END $$;

-- Commento per spiegare lo scopo della migrazione
COMMENT ON COLUMN categories.icon_url IS 'URL dell''icona della categoria, separato dal campo icon che contiene un singolo carattere';