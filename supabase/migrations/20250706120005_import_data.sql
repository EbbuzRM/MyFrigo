
-- Import data for app_settings
-- Note: The table is designed for a single row, so we update the existing one.
UPDATE app_settings
SET 
    notification_days = 1,
    notifications_enabled = true,
    theme = 'dark'
WHERE id = 1;

-- Import data for barcode_templates
INSERT INTO barcode_templates (barcode, brand, category, image_url, name) VALUES
('4099200866376', 'Cucina Nobili', 'biscuits', 'https://images.openfoodfacts.org/images/products/409/920/086/6376/front_it.3.400.jpg', 'Canestrelli'),
('5449000237132', 'Fuze Tea', 'beverages', 'https://images.openfoodfacts.org/images/products/544/900/023/7132/front_en.28.400.jpg', 'Fuze Tea Pesca'),
('8000226001203', 'Caber', 'condiments', 'https://images.openfoodfacts.org/images/products/800/022/600/1203/front_fr.4.400.jpg', 'Salamoia Bolognese')
ON CONFLICT (barcode) DO NOTHING;

-- Import data for products (from both products and productHistory collections)
INSERT INTO products (id, added_method, barcode, brand, category, consumed_date, expiration_date, image_url, name, notes, purchase_date, quantity, status, unit) VALUES
('1750799910107', 'barcode', '4099200866376', 'Cucina Nobili', 'vegetables', '2025-07-02T22:33:32.828Z', '2025-07-06', 'https://images.openfoodfacts.org/images/products/409/920/086/6376/front_it.3.400.jpg', 'Canestrelli', '', '2025-06-24', 250, 'consumed', 'g'),
('1750800355179', 'barcode', '8000226001203', 'Caber', 'condiments', '2025-06-29T22:40:23.846Z', '2030-01-28', 'https://images.openfoodfacts.org/images/products/800/022/600/1203/front_fr.4.400.jpg', 'Salamoia Bolognese', '', '2025-06-24', 1, 'consumed', 'pz'),
('afHSgjNTeqptfKER0dwI', 'barcode', '8000226001203', 'Caber', 'condiments', '2025-06-29T22:40:23.846Z', '2030-01-28', 'https://images.openfoodfacts.org/images/products/800/022/600/1203/front_fr.4.400.jpg', 'Salamoia Bolognese', '', '2025-06-24', 1, 'consumed', 'pz')
ON CONFLICT (id) DO NOTHING;

