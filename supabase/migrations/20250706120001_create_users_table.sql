CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    one_signal_player_id TEXT,
    push_token TEXT,
    first_name TEXT,
    last_name TEXT,
    email TEXT,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

COMMENT ON TABLE public.users IS 'Stores user information, including their OneSignal Player ID for push notifications.';
