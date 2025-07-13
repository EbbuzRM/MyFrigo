
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    one_signal_player_id TEXT,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

COMMENT ON TABLE public.users IS 'Stores user information, including their OneSignal Player ID for push notifications.';
