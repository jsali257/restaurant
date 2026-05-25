-- ============================================================
-- Ember & Oak - Seed Data
-- ============================================================

-- Insert restaurant
INSERT INTO restaurants (id, name, slug, description, phone, email, address, city, state, zip,
  latitude, longitude, tax_rate, delivery_fee, delivery_min_order, accepts_delivery, accepts_pickup)
VALUES (
  'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  'Ember & Oak',
  'ember-oak',
  'Wood-fired flavors crafted with passion. Modern American cuisine rooted in tradition.',
  '(512) 555-0123',
  'hello@emberandoak.com',
  '1234 Main Street',
  'Austin',
  'TX',
  '78701',
  30.2672,
  -97.7431,
  0.0825,
  3.99,
  15.00,
  true,
  true
);

-- Business hours (0=Sunday)
INSERT INTO business_hours (restaurant_id, day_of_week, open_time, close_time) VALUES
  ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 0, '11:00', '21:00'),
  ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 1, '11:00', '22:00'),
  ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 2, '11:00', '22:00'),
  ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 3, '11:00', '22:00'),
  ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 4, '11:00', '22:00'),
  ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 5, '11:00', '23:00'),
  ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 6, '11:00', '23:00');

-- ============================================================
-- MENU CATEGORIES
-- ============================================================
INSERT INTO menu_categories (id, restaurant_id, name, description, sort_order) VALUES
  ('c1000000-0000-0000-0000-000000000001', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Starters',              'Begin your journey with our crowd favorites',          1),
  ('c2000000-0000-0000-0000-000000000002', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Wood-fired Pizzas',     'Authentic neapolitan-style, fired at 900°F',            2),
  ('c3000000-0000-0000-0000-000000000003', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Burgers & Sandwiches',  'Handcrafted with fresh, local ingredients',             3),
  ('c4000000-0000-0000-0000-000000000004', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Salads & Bowls',        'Fresh and nourishing, never boring',                    4),
  ('c5000000-0000-0000-0000-000000000005', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Mains',                 'Chef''s signature wood-fired creations',                5),
  ('c6000000-0000-0000-0000-000000000006', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Desserts',              'Sweet endings crafted in-house daily',                  6),
  ('c7000000-0000-0000-0000-000000000007', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Beverages',             'Craft cocktails, wines, and house-made drinks',         7);

-- ============================================================
-- MENU ITEMS
-- Item IDs use 'e' prefix (valid hex). Category IDs use 'c' prefix (valid hex).
-- ============================================================
INSERT INTO menu_items (id, restaurant_id, category_id, name, description, price, image_url,
  is_featured, is_popular, is_vegetarian, spice_level, calories, prep_time_minutes) VALUES

-- STARTERS
('e1000000-0000-0000-0000-000000000001', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'c1000000-0000-0000-0000-000000000001',
  'Truffle Fries',
  'Crispy hand-cut fries tossed in truffle oil, parmesan, and fresh herbs. Served with house aioli.',
  12.99, 'https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=800', true, true, true, 0, 420, 10),

('e2000000-0000-0000-0000-000000000002', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'c1000000-0000-0000-0000-000000000001',
  'Buffalo Cauliflower Wings',
  'Crispy cauliflower florets tossed in smoky buffalo sauce. Served with ranch and celery.',
  13.99, 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=800', false, true, true, 2, 310, 12),

('e3000000-0000-0000-0000-000000000003', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'c1000000-0000-0000-0000-000000000001',
  'Smoked Queso Fundido',
  'Wood-smoked blend of Oaxacan and chihuahua cheeses with chorizo, roasted peppers, and warm tortillas.',
  14.99, 'https://images.unsplash.com/photo-1565299507177-b0ac66763828?w=800', true, true, false, 1, 580, 8),

('e4000000-0000-0000-0000-000000000004', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'c1000000-0000-0000-0000-000000000001',
  'Crispy Calamari',
  'Lightly breaded calamari rings and tentacles, fried golden. Served with marinara and lemon aioli.',
  15.99, 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800', false, false, false, 0, 390, 10),

-- WOOD-FIRED PIZZAS
('e5000000-0000-0000-0000-000000000005', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'c2000000-0000-0000-0000-000000000002',
  'Margherita Classica',
  'San Marzano tomato, fresh buffalo mozzarella, basil, extra virgin olive oil. The perfect classic.',
  18.99, 'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=800', true, true, true, 0, 720, 15),

('e6000000-0000-0000-0000-000000000006', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'c2000000-0000-0000-0000-000000000002',
  'Spicy Calabrese',
  'Calabrian chili oil, spicy soppressata, fresh mozzarella, honey drizzle, arugula.',
  21.99, 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=800', true, true, false, 3, 850, 15),

('e7000000-0000-0000-0000-000000000007', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'c2000000-0000-0000-0000-000000000002',
  'Wild Mushroom Bianca',
  'Roasted garlic cream, wild mushroom medley, gruyere, thyme, truffle oil.',
  22.99, 'https://images.unsplash.com/photo-1567190872278-8af3b9e00d4a?w=800', false, true, true, 0, 780, 15),

('e8000000-0000-0000-0000-000000000008', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'c2000000-0000-0000-0000-000000000002',
  'BBQ Brisket',
  'House-smoked brisket, caramelized onions, smoked cheddar, pickled jalapeños, BBQ base.',
  24.99, 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=800', false, false, false, 1, 920, 18),

-- BURGERS & SANDWICHES
('e9000000-0000-0000-0000-000000000009', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'c3000000-0000-0000-0000-000000000003',
  'The Ember Burger',
  'Double smash patty, aged cheddar, house special sauce, lettuce, tomato, pickles on a brioche bun.',
  16.99, 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=800', true, true, false, 0, 850, 12),

('ea000000-0000-0000-0000-00000000000a', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'c3000000-0000-0000-0000-000000000003',
  'Spicy Chicken Sandwich',
  'Crispy fried chicken thigh, Nashville hot glaze, coleslaw, house pickles, honey butter bun.',
  15.99, 'https://images.unsplash.com/photo-1606755962773-d324e0a13086?w=800', true, true, false, 2, 780, 12),

('eb000000-0000-0000-0000-00000000000b', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'c3000000-0000-0000-0000-000000000003',
  'Black Bean Smash Burger',
  'House-made black bean patty, avocado, pepper jack, pickled onions, chipotle mayo.',
  14.99, 'https://images.unsplash.com/photo-1553979459-d2229ba7433b?w=800', false, false, true, 1, 650, 12),

-- SALADS & BOWLS
('ec000000-0000-0000-0000-00000000000c', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'c4000000-0000-0000-0000-000000000004',
  'Ember Caesar',
  'Grilled romaine, house-made caesar dressing, parmesan crisp, wood-fired croutons, lemon.',
  14.99, 'https://images.unsplash.com/photo-1546793665-c74683f339c1?w=800', false, true, true, 0, 420, 8),

('ed000000-0000-0000-0000-00000000000d', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'c4000000-0000-0000-0000-000000000004',
  'Grain Bowl',
  'Farro, roasted seasonal vegetables, crispy chickpeas, tahini dressing, fresh herbs.',
  15.99, 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=800', false, false, true, 0, 520, 8),

-- MAINS
('ee000000-0000-0000-0000-00000000000e', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'c5000000-0000-0000-0000-000000000005',
  '12oz Ribeye',
  'Wood-fired 12oz prime ribeye, chimichurri, roasted bone marrow butter, seasonal vegetables.',
  48.99, 'https://images.unsplash.com/photo-1529193591184-b1d58069ecdd?w=800', true, true, false, 0, 820, 25),

('ef000000-0000-0000-0000-00000000000f', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'c5000000-0000-0000-0000-000000000005',
  'Cedar Plank Salmon',
  'Wild-caught salmon, miso glaze, forbidden rice, grilled broccolini, ginger vinaigrette.',
  34.99, 'https://images.unsplash.com/photo-1467003909585-2f8a72700288?w=800', false, true, false, 0, 620, 20),

('e0100000-0000-0000-0000-000000000010', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'c5000000-0000-0000-0000-000000000005',
  'Half Roast Chicken',
  'Brined free-range chicken, roasted over oak, herb jus, smashed potatoes, grilled lemon.',
  28.99, 'https://images.unsplash.com/photo-1598103442097-8b74394b95c8?w=800', false, false, false, 0, 740, 25),

-- DESSERTS
('e0200000-0000-0000-0000-000000000011', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'c6000000-0000-0000-0000-000000000006',
  'Warm Chocolate Lava Cake',
  'Dark chocolate molten cake, vanilla bean ice cream, salted caramel drizzle.',
  10.99, 'https://images.unsplash.com/photo-1563805042-7684c019e1cb?w=800', true, true, true, 0, 680, 10),

('e0300000-0000-0000-0000-000000000012', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'c6000000-0000-0000-0000-000000000006',
  'Crème Brûlée',
  'Classic French vanilla custard, torched sugar crust, fresh berries.',
  9.99, 'https://images.unsplash.com/photo-1470124182917-cc6e71b22ecc?w=800', false, false, true, 0, 480, 5),

-- BEVERAGES
('e0400000-0000-0000-0000-000000000013', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'c7000000-0000-0000-0000-000000000007',
  'House Lemonade',
  'Fresh-squeezed lemonade with a hint of lavender and mint.',
  4.99, 'https://images.unsplash.com/photo-1621263764928-df1444c5e859?w=800', false, true, true, 0, 180, 2),

('e0500000-0000-0000-0000-000000000014', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'c7000000-0000-0000-0000-000000000007',
  'Craft Cocktail of the Day',
  'Ask your server about today''s seasonal craft cocktail selection.',
  14.99, 'https://images.unsplash.com/photo-1551024709-8f23befc6f87?w=800', false, false, false, 0, 220, 5);

-- ============================================================
-- MODIFIER GROUPS & MODIFIERS
-- Group IDs use 'f' prefix (valid hex).
-- ============================================================
INSERT INTO modifier_groups (id, restaurant_id, menu_item_id, name, min_selections, max_selections, is_required) VALUES
  ('f1000000-0000-0000-0000-000000000001', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'e9000000-0000-0000-0000-000000000009', 'Doneness',       1, 1, true),
  ('f2000000-0000-0000-0000-000000000002', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'e9000000-0000-0000-0000-000000000009', 'Add-ons',        0, 5, false),
  ('f3000000-0000-0000-0000-000000000003', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'e5000000-0000-0000-0000-000000000005', 'Size',           1, 1, true),
  ('f4000000-0000-0000-0000-000000000004', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'e5000000-0000-0000-0000-000000000005', 'Extra Toppings', 0, 4, false),
  ('f5000000-0000-0000-0000-000000000005', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'ee000000-0000-0000-0000-00000000000e', 'Doneness',       1, 1, true),
  ('f6000000-0000-0000-0000-000000000006', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'ee000000-0000-0000-0000-00000000000e', 'Sides',          1, 2, true);

INSERT INTO modifiers (group_id, name, price_delta, is_default) VALUES
  -- Burger doneness
  ('f1000000-0000-0000-0000-000000000001', 'Medium Rare',            0,    false),
  ('f1000000-0000-0000-0000-000000000001', 'Medium',                 0,    true),
  ('f1000000-0000-0000-0000-000000000001', 'Medium Well',            0,    false),
  ('f1000000-0000-0000-0000-000000000001', 'Well Done',              0,    false),
  -- Burger add-ons
  ('f2000000-0000-0000-0000-000000000002', 'Extra Cheese',           1.50, false),
  ('f2000000-0000-0000-0000-000000000002', 'Avocado',                2.00, false),
  ('f2000000-0000-0000-0000-000000000002', 'Bacon',                  2.50, false),
  ('f2000000-0000-0000-0000-000000000002', 'Fried Egg',              1.50, false),
  ('f2000000-0000-0000-0000-000000000002', 'Caramelized Onions',     1.00, false),
  -- Pizza sizes
  ('f3000000-0000-0000-0000-000000000003', '10" Personal',          -3.00, false),
  ('f3000000-0000-0000-0000-000000000003', '12" Regular',            0,    true),
  ('f3000000-0000-0000-0000-000000000003', '16" Large',              5.00, false),
  -- Pizza toppings
  ('f4000000-0000-0000-0000-000000000004', 'Extra Mozzarella',       2.00, false),
  ('f4000000-0000-0000-0000-000000000004', 'Prosciutto',             3.50, false),
  ('f4000000-0000-0000-0000-000000000004', 'Roasted Garlic',         1.50, false),
  ('f4000000-0000-0000-0000-000000000004', 'Fresh Basil',            1.00, false),
  -- Steak doneness
  ('f5000000-0000-0000-0000-000000000005', 'Rare',                   0,    false),
  ('f5000000-0000-0000-0000-000000000005', 'Medium Rare',            0,    true),
  ('f5000000-0000-0000-0000-000000000005', 'Medium',                 0,    false),
  ('f5000000-0000-0000-0000-000000000005', 'Medium Well',            0,    false),
  ('f5000000-0000-0000-0000-000000000005', 'Well Done',              0,    false),
  -- Steak sides
  ('f6000000-0000-0000-0000-000000000006', 'Garlic Mashed Potatoes', 0,    true),
  ('f6000000-0000-0000-0000-000000000006', 'Grilled Asparagus',      0,    false),
  ('f6000000-0000-0000-0000-000000000006', 'Roasted Mushrooms',      0,    false),
  ('f6000000-0000-0000-0000-000000000006', 'Mac & Cheese',           3.00, false);

-- ============================================================
-- COUPONS
-- ============================================================
INSERT INTO coupons (restaurant_id, code, description, discount_type, discount_value, min_order_amount, max_uses) VALUES
  ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'WELCOME20', '20% off your first order',    'percentage', 20,   25, 1000),
  ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'EMBER10',   '$10 off orders over $50',     'fixed',       10,   50,  500),
  ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'FREESHIP',  'Free delivery on your order', 'fixed',       3.99, 20,  200);
