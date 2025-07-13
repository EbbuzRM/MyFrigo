
CREATE TABLE products (
    id TEXT PRIMARY KEY,
    added_method TEXT,
    barcode TEXT,
    brand TEXT,
    category TEXT,
    consumed_date TIMESTAMPTZ,
    expiration_date DATE,
    image_url TEXT,
    name TEXT NOT NULL,
    notes TEXT,
    purchase_date DATE,
    quantity NUMERIC,
    status TEXT DEFAULT 'active',
    unit TEXT,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

COMMENT ON TABLE public.products IS 'Stores all products, both active and consumed.';
