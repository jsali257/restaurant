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
  ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 4, '11:00', '23:00'),
  ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 5, '11:00', '23:00'),
  ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 6, '11:00', '21:00');

-- ============================================================
-- MENU CATEGORIES
-- ============================================================
INSERT INTO menu_categories (id, restaurant_id, name, description, sort_order) VALUES
  ('cat-001', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Starters', 'Begin your journey with our crowd favorites', 1),
  ('cat-002', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Wood-fired Pizzas', 'Authentic neapolitan-style, fired at 900°F', 2),
  ('cat-003', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Burgers & Sandwiches', 'Handcrafted with fresh, local ingredients', 3),
  ('cat-004', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Salads & Bowls', 'Fresh and nourishing, never boring', 4),
  ('cat-005', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Mains', 'Chef''s signature wood-fired creations', 5),
  ('cat-006', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Desserts', 'Sweet endings crafted in-house daily', 6),
  ('cat-007', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Beverages', 'Craft cocktails, wines, and house-made drinks', 7);

-- ============================================================
-- MENU ITEMS
-- ============================================================
INSERT INTO menu_items (id, restaurant_id, category_id, name, description, price, image_url,
  is_featured, is_popular, is_vegetarian, spice_level, calories, prep_time_minutes) VALUES

-- STARTERS
('item-001', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'cat-001',
  'Truffle Fries',
  'Crispy hand-cut fries tossed in truffle oil, parmesan, and fresh herbs. Served with house aioli.',
  12.99, 'https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=800', true, true, true, 0, 420, 10),

('item-002', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'cat-001',
  'Buffalo Cauliflower Wings',
  'Crispy cauliflower florets tossed in smoky buffalo sauce. Served with ranch and celery.',
  13.99, 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=800', false, true, true, 2, 310, 12),

('item-003', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'cat-001',
  'Smoked Queso Fundido',
  'Wood-smoked blend of Oaxacan and chihuahua cheeses with chorizo, roasted peppers, and warm tortillas.',
  14.99, 'https://images.unsplash.com/photo-1565299507177-b0ac66763828?w=800', true, true, false, 1, 580, 8),

('item-004', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'cat-001',
  'Crispy Calamari',
  'Lightly breaded calamari rings and tentacles, fried golden. Served with marinara and lemon aioli.',
  15.99, 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800', false, false, false, 0, 390, 10),

-- WOOD-FIRED PIZZAS
('item-005', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'cat-002',
  'Margherita Classica',
  'San Marzano tomato, fresh buffalo mozzarella, basil, extra virgin olive oil. The perfect classic.',
  18.99, 'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=800', true, true, true, 0, 720, 15),

('item-006', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'cat-002',
  'Spicy Calabrese',
  'Calabrian chili oil, spicy soppressata, fresh mozzarella, honey drizzle, arugula.',
  21.99, 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=800', true, true, false, 3, 850, 15),

('item-007', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'cat-002',
  'Wild Mushroom Bianca',
  'Roasted garlic cream, wild mushroom medley, gruyere, thyme, truffle oil.',
  22.99, 'https://images.unsplash.com/photo-1567190872278-8af3b9e00d4a?w=800', false, true, true, 0, 780, 15),

('item-008', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'cat-002',
  'BBQ Brisket',
  'House-smoked brisket, caramelized onions, smoked cheddar, pickled jalapeños, BBQ base.',
  24.99, 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=800', false, false, false, 1, 920, 18),

-- BURGERS & SANDWICHES
('item-009', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'cat-003',
  'The Ember Burger',
  'Double smash patty, aged cheddar, house special sauce, lettuce, tomato, pickles on a brioche bun.',
  16.99, 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=800', true, true, false, 0, 850, 12),

('item-010', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'cat-003',
  'Spicy Chicken Sandwich',
  'Crispy fried chicken thigh, Nashville hot glaze, coleslaw, house pickles, honey butter bun.',
  15.99, 'https://images.unsplash.com/photo-1606755962773-d324e0a13086?w=800', true, true, false, 2, 780, 12),

('item-011', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'cat-003',
  'Black Bean Smash Burger',
  'House-made black bean patty, avocado, pepper jack, pickled onions, chipotle mayo.',
  14.99, 'https://images.unsplash.com/photo-1553979459-d2229ba7433b?w=800', false, false, true, 1, 650, 12),

-- SALADS & BOWLS
('item-012', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'cat-004',
  'Ember Caesar',
  'Grilled romaine, house-made caesar dressing, parmesan crisp, wood-fired croutons, lemon.',
  14.99, 'https://images.unsplash.com/photo-1546793665-c74683f339c1?w=800', false, true, true, 0, 420, 8),

('item-013', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'cat-004',
  'Grain Bowl',
  'Farro, roasted seasonal vegetables, crispy chickpeas, tahini dressing, fresh herbs.',
  15.99, 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=800', false, false, true, 0, 520, 8),

-- MAINS
('item-014', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'cat-005',
  '12oz Ribeye',
  'Wood-fired 12oz prime ribeye, chimichurri, roasted bone marrow butter, seasonal vegetables.',
  48.99, 'https://images.unsplash.com/photo-1529193591184-b1d58069ecdd?w=800', true, true, false, 0, 820, 25),

('item-015', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'cat-005',
  'Cedar Plank Salmon',
  'Wild-caught salmon, miso glaze, forbidden rice, grilled broccolini, ginger vinaigrette.',
  34.99, 'https://images.unsplash.com/photo-1467003909585-2f8a72700288?w=800', false, true, false, 0, 620, 20),

('item-016', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'cat-005',
  'Half Roast Chicken',
  'Brined free-range chicken, roasted over oak, herb jus, smashed potatoes, grilled lemon.',
  28.99, 'https://images.unsplash.com/photo-1598103442097-8b74394b95c8?w=800', false, false, false, 0, 740, 25),

-- DESSERTS
('item-017', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'cat-006',
  'Warm Chocolate Lava Cake',
  'Dark chocolate molten cake, vanilla bean ice cream, salted caramel drizzle.',
  10.99, 'https://images.unsplash.com/photo-1563805042-7684c019e1cb?w=800', true, true, true, 0, 680, 10),

('item-018', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'cat-006',
  'Crème Brûlée',
  'Classic French vanilla custard, torched sugar crust, fresh berries.',
  9.99, 'https://images.unsplash.com/photo-1470124182917-cc6e71b22ecc?w=800', false, false, true, 0, 480, 5),

-- BEVERAGES
('item-019', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'cat-007',
  'House Lemonade',
  'Fresh-squeezed lemonade with a hint of lavender and mint.',
  4.99, 'https://images.unsplash.com/photo-1621263764928-df1444c5e859?w=800', false, true, true, 0, 180, 2),

('item-020', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'cat-007',
  'Craft Cocktail of the Day',
  'Ask your server about today''s seasonal craft cocktail selection.',
  14.99, 'https://images.unsplash.com/photo-1551024709-8f23befc6f87?w=800', false, false, false, 0, 220, 5);

-- ============================================================
-- MODIFIER GROUPS & MODIFIERS
-- ============================================================

-- Burger patty options
INSERT INTO modifier_groups (id, restaurant_id, menu_item_id, name, min_selections, max_selections, is_required) VALUES
  ('mg-001', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'item-009', 'Doneness', 1, 1, true),
  ('mg-002', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'item-009', 'Add-ons', 0, 5, false),
  ('mg-003', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'item-005', 'Size', 1, 1, true),
  ('mg-004', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'item-005', 'Extra Toppings', 0, 4, false),
  ('mg-005', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'item-014', 'Doneness', 1, 1, true),
  ('mg-006', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'item-014', 'Sides', 1, 2, true);

INSERT INTO modifiers (group_id, name, price_delta, is_default) VALUES
  -- Burger doneness
  ('mg-001', 'Medium Rare', 0, false),
  ('mg-001', 'Medium', 0, true),
  ('mg-001', 'Medium Well', 0, false),
  ('mg-001', 'Well Done', 0, false),
  -- Burger add-ons
  ('mg-002', 'Extra Cheese', 1.50, false),
  ('mg-002', 'Avocado', 2.00, false),
  ('mg-002', 'Bacon', 2.50, false),
  ('mg-002', 'Fried Egg', 1.50, false),
  ('mg-002', 'Caramelized Onions', 1.00, false),
  -- Pizza sizes
  ('mg-003', '10" Personal', -3.00, false),
  ('mg-003', '12" Regular', 0, true),
  ('mg-003', '16" Large', 5.00, false),
  -- Pizza toppings
  ('mg-004', 'Extra Mozzarella', 2.00, false),
  ('mg-004', 'Prosciutto', 3.50, false),
  ('mg-004', 'Roasted Garlic', 1.50, false),
  ('mg-004', 'Fresh Basil', 1.00, false),
  -- Steak doneness
  ('mg-005', 'Rare', 0, false),
  ('mg-005', 'Medium Rare', 0, true),
  ('mg-005', 'Medium', 0, false),
  ('mg-005', 'Medium Well', 0, false),
  ('mg-005', 'Well Done', 0, false),
  -- Steak sides
  ('mg-006', 'Garlic Mashed Potatoes', 0, true),
  ('mg-006', 'Grilled Asparagus', 0, false),
  ('mg-006', 'Roasted Mushrooms', 0, false),
  ('mg-006', 'Mac & Cheese', 3.00, false);

-- ============================================================
-- COUPONS
-- ============================================================
INSERT INTO coupons (restaurant_id, code, description, discount_type, discount_value, min_order_amount, max_uses) VALUES
  ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'WELCOME20', '20% off your first order', 'percentage', 20, 25, 1000),
  ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'EMBER10', '$10 off orders over $50', 'fixed', 10, 50, 500),
  ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'FREESHIP', 'Free delivery on your order', 'fixed', 3.99, 20, 200);
