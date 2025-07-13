
CREATE TABLE barcode_templates (
    barcode TEXT PRIMARY KEY,
    brand TEXT,
    category TEXT,
    image_url TEXT,
    name TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

COMMENT ON TABLE public.barcode_templates IS 'Stores pre-filled product information based on barcodes.';
