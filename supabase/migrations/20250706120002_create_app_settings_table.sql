
CREATE TABLE app_settings (
    id INT PRIMARY KEY DEFAULT 1,
    notification_days INT DEFAULT 1,
    notifications_enabled BOOLEAN DEFAULT true,
    theme TEXT DEFAULT 'dark',
    CONSTRAINT single_row_check CHECK (id = 1)
);

-- Insert the single row of settings
INSERT INTO app_settings (id, notification_days, notifications_enabled, theme)
VALUES (1, 1, true, 'dark');

COMMENT ON TABLE public.app_settings IS 'Stores global application settings.';
