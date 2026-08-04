CREATE TABLE public.user_devices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    device_id TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(user_id, device_id)
);

COMMENT ON TABLE public.user_devices IS 'Stores push notification device IDs for each user.';
COMMENT ON COLUMN public.user_devices.user_id IS 'The user associated with the device.';
COMMENT ON COLUMN public.user_devices.device_id IS 'The push notification token or ID from the provider (e.g., OneSignal).';

ALTER TABLE public.user_devices ENABLE ROW LEVEL SECURITY;

-- Rimuoviamo eventuali policy vecchie per pulizia
DROP POLICY IF EXISTS "Allow users to manage their own devices" ON public.user_devices;

-- Creiamo la policy corretta
CREATE POLICY "Allow users to manage their own devices"
ON public.user_devices
FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Aggiungiamo un indice per migliorare le performance delle query
CREATE INDEX IF NOT EXISTS idx_user_devices_user_id ON public.user_devices(user_id);
