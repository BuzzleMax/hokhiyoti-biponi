-- ============================================
-- SAMPLE SEED DATA FOR HOKHIYOTI BIPONI
-- Run this AFTER full-setup.sql
-- ============================================

-- ============================================
-- SAMPLE CATEGORIES
-- ============================================
INSERT INTO categories (id, name, slug, description, image_url) VALUES
  ('a1b2c3d4-0001-4000-8000-000000000001', 'Mekhela Chador', 'mekhela-chador', 'Traditional Assamese Mekhela Chadors handwoven by skilled artisans. Features intricate motifs and premium silk blends.', 'https://images.unsplash.com/photo-1617957715614-0c0c2c5b6c5b?w=800'),
  ('a1b2c3d4-0001-4000-8000-000000000002', 'Riha-Mekhela', 'riha-mekhela', 'Classic Riha-Mekhela sets with traditional Assamese designs. Perfect for ceremonial occasions.', 'https://images.unsplash.com/photo-1617957715614-0c0c2c5b6c5b?w=800'),
  ('a1b2c3d4-0001-4000-8000-000000000003', 'Silk Sarees', 'silk-sarees', 'Premium Assamese silk sarees including Muga, Pat, and Eri silk varieties.', 'https://images.unsplash.com/photo-1617957715614-0c0c2c5b6c5b?w=800'),
  ('a1b2c3d4-0001-4000-8000-000000000004', 'Assamese Jewelry', 'assamese-jewelry', 'Traditional Assamese gold and silver jewelry including Dugdugi, Jangphai, and Keru.', 'https://images.unsplash.com/photo-1617957715614-0c0c2c5b6c5b?w=800'),
  ('a1b2c3d4-0001-4000-8000-000000000005', 'Handloom Accessories', 'handloom-accessories', 'Handwoven stoles, scarves, and shawls made from premium Assamese fabrics.', 'https://images.unsplash.com/photo-1617957715614-0c0c2c5b6c5b?w=800'),
  ('a1b2c3d4-0001-4000-8000-000000000006', 'Gamosa & Traditional', 'gamosa-traditional', 'Traditional Assamese Gamosas and ritualistic textiles used in ceremonies and daily life.', 'https://images.unsplash.com/photo-1617957715614-0c0c2c5b6c5b?w=800')
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- SAMPLE COLLECTIONS
-- ============================================
INSERT INTO collections (id, name, slug, description, image_url) VALUES
  ('b2c3d4e5-0002-4000-8000-000000000001', 'Bihu Collection', 'bihu-collection', 'Celebrate Rongali Bihu with our exclusive collection of traditional Assamese attire. Handpicked Mekhela Chadors and Riha sets.', 'https://images.unsplash.com/photo-1617957715614-0c0c2c5b6c5b?w=800'),
  ('b2c3d4e5-0002-4000-8000-000000000002', 'Wedding Edit', 'wedding-edit', 'Curated selection of bridal Mekhela Chadors and jewelry for your special day. Featuring pure Muga silk and gold embroidery.', 'https://images.unsplash.com/photo-1617957715614-0c0c2c5b6c5b?w=800'),
  ('b2c3d4e5-0002-4000-8000-000000000003', 'Festival Special', 'festival-special', 'Exclusive festival collection featuring Durga Puja, Diwali, and Bihu special attire with traditional Assamese motifs.', 'https://images.unsplash.com/photo-1617957715614-0c0c2c5b6c5b?w=800'),
  ('b2c3d4e5-0002-4000-8000-000000000004', 'Modern Twist', 'modern-twist', 'Contemporary fusion wear blending traditional Assamese handloom with modern silhouettes. Perfect for the modern woman.', 'https://images.unsplash.com/photo-1617957715614-0c0c2c5b6c5b?w=800'),
  ('b2c3d4e5-0002-4000-8000-000000000005', 'Gift Sets', 'gift-sets', 'Beautifully packaged gift sets combining Mekhela Chadors with matching jewelry and accessories. Perfect for gifting.', 'https://images.unsplash.com/photo-1617957715614-0c0c2c5b6c5b?w=800'),
  ('b2c3d4e5-0002-4000-8000-000000000006', 'Artisan Series', 'artisan-series', 'Limited edition pieces crafted by master weavers from Sualkuchi and surrounding villages. Each piece tells a story.', 'https://images.unsplash.com/photo-1617957715614-0c0c2c5b6c5b?w=800')
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- SAMPLE PRODUCTS
-- ============================================
INSERT INTO products (id, name, slug, description, price, compare_price, images, category_id, category_slug, category_name, collection_id, collection_slug, collection_name, sizes, colors, fabric, featured, new_arrival, best_seller, stock, rating, currency) VALUES
  -- Mekhela Chador products
  ('c3d4e5f6-0003-4000-8000-000000000001', 'Golden Muga Mekhela Chador', 'golden-muga-mekhela', 'Handwoven pure Muga silk Mekhela Chador with traditional Assamese motifs. Features a rich golden hue with intricate border designs crafted by master weavers from Sualkuchi.', 15999.00, 18999.00, '[{"url": "https://images.unsplash.com/photo-1617957715614-0c0c2c5b6c5b?w=800", "alt": "Golden Muga Mekhela Chador"}, {"url": "https://images.unsplash.com/photo-1617957715614-0c0c2c5b6c5b?w=400", "alt": "Mekhela Detail"}]', 'a1b2c3d4-0001-4000-8000-000000000001', 'mekhela-chador', 'Mekhela Chador', 'b2c3d4e5-0002-4000-8000-000000000001', 'bihu-collection', 'Bihu Collection', ARRAY['Free Size'], ARRAY['Golden', 'Gold'], 'Pure Muga Silk', true, true, true, 15, 4.8, 'INR'),
  
  ('c3d4e5f6-0003-4000-8000-000000000002', 'Pat Silk Mekhela with Golden Border', 'pat-silk-mekhela', 'Elegant white Pat silk Mekhela Chador with golden border. Lightweight and perfect for summer events and ceremonies.', 12999.00, 15999.00, '[{"url": "https://images.unsplash.com/photo-1617957715614-0c0c2c5b6c5b?w=800", "alt": "Pat Silk Mekhela"}]', 'a1b2c3d4-0001-4000-8000-000000000001', 'mekhela-chador', 'Mekhela Chador', 'b2c3d4e5-0002-4000-8000-000000000002', 'wedding-edit', 'Wedding Edit', ARRAY['Free Size'], ARRAY['White', 'Off-White'], 'Pat Silk', true, false, true, 25, 4.6, 'INR'),
  
  ('c3d4e5f6-0003-4000-8000-000000000003', 'Eri Silk Mekhela Chador', 'eri-silk-mekhela', 'Eco-friendly Eri silk Mekhela Chador in natural beige. Hand-spun and handwoven, known for its thermal properties.', 8999.00, NULL, '[{"url": "https://images.unsplash.com/photo-1617957715614-0c0c2c5b6c5b?w=800", "alt": "Eri Silk Mekhela"}]', 'a1b2c3d4-0001-4000-8000-000000000001', 'mekhela-chador', 'Mekhela Chador', 'b2c3d4e5-0002-4000-8000-000000000006', 'artisan-series', 'Artisan Series', ARRAY['Free Size'], ARRAY['Beige', 'Natural', 'Off-White'], 'Eri Silk', false, true, false, 20, 4.5, 'INR'),

  -- Riha-Mekhela products
  ('c3d4e5f6-0003-4000-8000-000000000004', 'Traditional Red Riha-Mekhela Set', 'traditional-red-riha', 'Complete Riha-Mekhela set in vibrant red with gold zari work. Includes blouse piece. Perfect for weddings and religious ceremonies.', 18999.00, 21999.00, '[{"url": "https://images.unsplash.com/photo-1617957715614-0c0c2c5b6c5b?w=800", "alt": "Red Riha-Mekhela Set"}]', 'a1b2c3d4-0001-4000-8000-000000000002', 'riha-mekhela', 'Riha-Mekhela', 'b2c3d4e5-0002-4000-8000-000000000002', 'wedding-edit', 'Wedding Edit', ARRAY['Free Size'], ARRAY['Red', 'Maroon'], 'Muga Silk with Zari', true, true, true, 10, 4.9, 'INR'),
  
  ('c3d4e5f6-0003-4000-8000-000000000005', 'Green Riha-Mekhela with Temple Border', 'green-riha-temple', 'Beautiful green Riha-Mekhela set featuring traditional temple border design. Made from premium Pat silk.', 14999.00, NULL, '[{"url": "https://images.unsplash.com/photo-1617957715614-0c0c2c5b6c5b?w=800", "alt": "Green Riha-Mekhela"}]', 'a1b2c3d4-0001-4000-8000-000000000002', 'riha-mekhela', 'Riha-Mekhela', 'b2c3d4e5-0002-4000-8000-000000000003', 'festival-special', 'Festival Special', ARRAY['Free Size'], ARRAY['Green', 'Emerald'], 'Pat Silk', true, false, false, 18, 4.7, 'INR'),

  -- Silk Saree products
  ('c3d4e5f6-0003-4000-8000-000000000006', 'Pure Muga Silk Saree', 'pure-muga-silk-saree', 'Luxurious pure Muga silk saree in its natural golden-yellow color. Known as the "Golden Silk" of Assam, it gets shinier with every wash.', 24999.00, 29999.00, '[{"url": "https://images.unsplash.com/photo-1617957715614-0c0c2c5b6c5b?w=800", "alt": "Muga Silk Saree"}]', 'a1b2c3d4-0001-4000-8000-000000000003', 'silk-sarees', 'Silk Sarees', 'b2c3d4e5-0002-4000-8000-000000000006', 'artisan-series', 'Artisan Series', ARRAY['Free Size', '6.5 Yards'], ARRAY['Golden Yellow'], 'Pure Muga Silk', true, true, true, 8, 5.0, 'INR'),
  
  ('c3d4e5f6-0003-4000-8000-000000000007', 'Pat Silk Saree with Floral Motif', 'pat-silk-floral-saree', 'Delicate Pat silk saree with hand-painted floral motifs. Lightweight and comfortable for daily wear and special occasions.', 11999.00, 13999.00, '[{"url": "https://images.unsplash.com/photo-1617957715614-0c0c2c5b6c5b?w=800", "alt": "Pat Silk Floral Saree"}]', 'a1b2c3d4-0001-4000-8000-000000000003', 'silk-sarees', 'Silk Sarees', 'b2c3d4e5-0002-4000-8000-000000000004', 'modern-twist', 'Modern Twist', ARRAY['Free Size', '6.5 Yards'], ARRAY['Pink', 'Blue', 'Green'], 'Pat Silk', false, true, false, 30, 4.4, 'INR'),

  -- Jewelry products
  ('c3d4e5f6-0003-4000-8000-000000000008', 'Traditional Dugdugi Earrings', 'traditional-dugdugi-earrings', 'Handcrafted Assamese Dugdugi earrings in 22kt gold with traditional designs. A must-have for every Assamese bride.', 45999.00, 52999.00, '[{"url": "https://images.unsplash.com/photo-1617957715614-0c0c2c5b6c5b?w=800", "alt": "Dugdugi Earrings"}]', 'a1b2c3d4-0001-4000-8000-000000000004', 'assamese-jewelry', 'Assamese Jewelry', 'b2c3d4e5-0002-4000-8000-000000000002', 'wedding-edit', 'Wedding Edit', ARRAY['One Size'], ARRAY['Gold'], '22kt Gold', true, false, true, 5, 4.9, 'INR'),
  
  ('c3d4e5f6-0003-4000-8000-000000000009', 'Jangphai Necklace Set', 'jangphai-necklace-set', 'Traditional Assamese Jangphai necklace set with intricate gold work and precious stones. Includes matching earrings.', 125000.00, 145000.00, '[{"url": "https://images.unsplash.com/photo-1617957715614-0c0c2c5b6c5b?w=800", "alt": "Jangphai Necklace Set"}]', 'a1b2c3d4-0001-4000-8000-000000000004', 'assamese-jewelry', 'Assamese Jewelry', 'b2c3d4e5-0002-4000-8000-000000000002', 'wedding-edit', 'Wedding Edit', ARRAY['One Size'], ARRAY['Gold'], '22kt Gold with Rubies', true, false, false, 3, 5.0, 'INR'),

  -- Accessories
  ('c3d4e5f6-0003-4000-8000-000000000010', 'Handwoven Muga Silk Stole', 'handwoven-muga-stole', 'Elegant handwoven Muga silk stole with traditional border design. Versatile accessory that complements any outfit.', 4999.00, 5999.00, '[{"url": "https://images.unsplash.com/photo-1617957715614-0c0c2c5b6c5b?w=800", "alt": "Muga Silk Stole"}]', 'a1b2c3d4-0001-4000-8000-000000000005', 'handloom-accessories', 'Handloom Accessories', 'b2c3d4e5-0002-4000-8000-000000000005', 'gift-sets', 'Gift Sets', ARRAY['One Size'], ARRAY['Golden', 'Yellow'], 'Muga Silk', false, true, false, 50, 4.3, 'INR'),
  
  ('c3d4e5f6-0003-4000-8000-000000000011', 'Assamese Gamosa Pack of 5', 'assamese-gamosa-pack', 'Set of 5 traditional Assamese Gamosas. Each piece handwoven with traditional motifs. Perfect for rituals, gift-giving, and daily use.', 1499.00, NULL, '[{"url": "https://images.unsplash.com/photo-1617957715614-0c0c2c5b6c5b?w=800", "alt": "Gamosa Pack"}]', 'a1b2c3d4-0001-4000-8000-000000000006', 'gamosa-traditional', 'Gamosa & Traditional', NULL, NULL, NULL, ARRAY['One Size'], ARRAY['Red', 'White', 'Multi'], 'Cotton', false, false, false, 100, 4.2, 'INR'),

  -- More products
  ('c3d4e5f6-0003-4000-8000-000000000012', 'Blue Mekhela Chador with Silver Border', 'blue-mekhela-silver', 'Stunning blue Pat silk Mekhela Chador with intricate silver-colored border. Contemporary design meets traditional craftsmanship.', 13999.00, 16999.00, '[{"url": "https://images.unsplash.com/photo-1617957715614-0c0c2c5b6c5b?w=800", "alt": "Blue Mekhela Silver Border"}]', 'a1b2c3d4-0001-4000-8000-000000000001', 'mekhela-chador', 'Mekhela Chador', 'b2c3d4e5-0002-4000-8000-000000000004', 'modern-twist', 'Modern Twist', ARRAY['Free Size'], ARRAY['Blue', 'Navy'], 'Pat Silk', false, true, true, 22, 4.6, 'INR'),
  
  ('c3d4e5f6-0003-4000-8000-000000000013', 'Pink Pat Silk Riha Set', 'pink-pat-silk-riha', 'Beautiful pink Riha-Mekhela set made from premium Pat silk. Lightweight with delicate floral embroidery.', 12999.00, NULL, '[{"url": "https://images.unsplash.com/photo-1617957715614-0c0c2c5b6c5b?w=800", "alt": "Pink Pat Silk Riha"}]', 'a1b2c3d4-0001-4000-8000-000000000002', 'riha-mekhela', 'Riha-Mekhela', 'b2c3d4e5-0002-4000-8000-000000000001', 'bihu-collection', 'Bihu Collection', ARRAY['Free Size'], ARRAY['Pink', 'Rose'], 'Pat Silk', false, false, false, 15, 4.4, 'INR'),
  
  ('c3d4e5f6-0003-4000-8000-000000000014', 'Eri Silk Stole - Natural Dye', 'eri-silk-stole-natural', 'Handwoven Eri silk stole in earthy tones using natural vegetable dyes. Each piece is uniquely colored and eco-friendly.', 3499.00, 3999.00, '[{"url": "https://images.unsplash.com/photo-1617957715614-0c0c2c5b6c5b?w=800", "alt": "Eri Silk Stole"}]', 'a1b2c3d4-0001-4000-8000-000000000005', 'handloom-accessories', 'Handloom Accessories', 'b2c3d4e5-0002-4000-8000-000000000006', 'artisan-series', 'Artisan Series', ARRAY['One Size'], ARRAY['Brown', 'Beige', 'Rust'], 'Eri Silk', false, false, false, 40, 4.1, 'INR'),
  
  ('c3d4e5f6-0003-4000-8000-000000000015', 'Assamese Gold Necklace - Keru Design', 'assamese-keru-necklace', 'Traditional Keru design gold necklace crafted by Assamese goldsmiths. Features authentic Assamese motifs and filigree work.', 85000.00, 95000.00, '[{"url": "https://images.unsplash.com/photo-1617957715614-0c0c2c5b6c5b?w=800", "alt": "Keru Necklace"}]', 'a1b2c3d4-0001-4000-8000-000000000004', 'assamese-jewelry', 'Assamese Jewelry', 'b2c3d4e5-0002-4000-8000-000000000003', 'festival-special', 'Festival Special', ARRAY['One Size'], ARRAY['Gold'], '22kt Gold', true, false, false, 2, 4.8, 'INR')
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- VERIFICATION QUERIES
-- Run these to verify the data
-- ============================================

-- SELECT 'Categories:' as info, COUNT(*) as count FROM categories;
-- SELECT 'Collections:' as info, COUNT(*) as count FROM collections;
-- SELECT 'Products:' as info, COUNT(*) as count FROM products;

-- View sample data
-- SELECT name, price, category_name, collection_name, featured, new_arrival, best_seller FROM products LIMIT 5;
-- SELECT name, slug FROM categories;
-- SELECT name, slug FROM collections;
