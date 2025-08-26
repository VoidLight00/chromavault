-- ChromaVault Sample Data
-- Created: 2025-01-23
-- Purpose: Development and testing data
-- Version: 1.0.0

-- ==================== USERS ====================

-- Test users with different roles
INSERT INTO users (id, email, password, name, role, is_verified) VALUES
('11111111-1111-1111-1111-111111111111', 'admin@chromavault.com', '$2b$10$YourHashedPasswordHere', 'Admin User', 'ADMIN', true),
('22222222-2222-2222-2222-222222222222', 'pro@chromavault.com', '$2b$10$YourHashedPasswordHere', 'Pro Designer', 'PRO', true),
('33333333-3333-3333-3333-333333333333', 'user@chromavault.com', '$2b$10$YourHashedPasswordHere', 'John Doe', 'USER', true),
('44444444-4444-4444-4444-444444444444', 'jane@chromavault.com', '$2b$10$YourHashedPasswordHere', 'Jane Smith', 'USER', true),
('55555555-5555-5555-5555-555555555555', 'designer@chromavault.com', '$2b$10$YourHashedPasswordHere', 'Alex Designer', 'PRO', true);

-- ==================== PALETTES ====================

-- Popular color palettes
INSERT INTO palettes (id, name, description, slug, is_public, is_featured, user_id, view_count, download_count) VALUES
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Ocean Breeze', 'Calming blues and aquas inspired by the sea', 'ocean-breeze', true, true, '22222222-2222-2222-2222-222222222222', 1250, 340),
('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'Sunset Glow', 'Warm oranges and pinks from golden hour', 'sunset-glow', true, true, '22222222-2222-2222-2222-222222222222', 980, 210),
('cccccccc-cccc-cccc-cccc-cccccccccccc', 'Forest Depths', 'Deep greens and earth tones', 'forest-depths', true, false, '33333333-3333-3333-3333-333333333333', 650, 120),
('dddddddd-dddd-dddd-dddd-dddddddddddd', 'Minimal Black', 'Monochromatic elegance', 'minimal-black', true, true, '55555555-5555-5555-5555-555555555555', 2100, 560),
('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', 'Neon Dreams', 'Vibrant cyberpunk colors', 'neon-dreams', true, false, '44444444-4444-4444-4444-444444444444', 430, 85),
('ffffffff-ffff-ffff-ffff-ffffffffffff', 'Pastel Paradise', 'Soft and dreamy pastels', 'pastel-paradise', true, true, '22222222-2222-2222-2222-222222222222', 1560, 420),
('aaaaaaa1-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Corporate Blue', 'Professional business colors', 'corporate-blue', false, false, '33333333-3333-3333-3333-333333333333', 120, 30),
('aaaaaaa2-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Vintage Film', 'Retro analog photography tones', 'vintage-film', true, false, '55555555-5555-5555-5555-555555555555', 780, 190);

-- ==================== COLORS ====================

-- Ocean Breeze palette colors
INSERT INTO colors (id, hex, rgb, hsl, lab, name, position, palette_id) VALUES
('c1111111-1111-1111-1111-111111111111', '#0077BE', '{"r":0,"g":119,"b":190}', '{"h":202,"s":100,"l":37}', '{"l":48,"a":-12,"b":-42}', 'Ocean Blue', 0, 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'),
('c2222222-2222-2222-2222-222222222222', '#40E0D0', '{"r":64,"g":224,"b":208}', '{"h":174,"s":71,"l":56}', '{"l":83,"a":-38,"b":-7}', 'Turquoise', 1, 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'),
('c3333333-3333-3333-3333-333333333333', '#89CFF0', '{"r":137,"g":207,"b":240}', '{"h":199,"s":77,"l":74}', '{"l":80,"a":-20,"b":-23}', 'Baby Blue', 2, 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'),
('c4444444-4444-4444-4444-444444444444', '#F0F8FF', '{"r":240,"g":248,"b":255}', '{"h":208,"s":100,"l":97}', '{"l":98,"a":-3,"b":-5}', 'Alice Blue', 3, 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'),
('c5555555-5555-5555-5555-555555555555', '#004C6D', '{"r":0,"g":76,"b":109}', '{"h":198,"s":100,"l":21}', '{"l":30,"a":-8,"b":-25}', 'Deep Sea', 4, 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa');

-- Sunset Glow palette colors
INSERT INTO colors (id, hex, rgb, hsl, lab, name, position, palette_id) VALUES
('c6666666-6666-6666-6666-666666666666', '#FF6B6B', '{"r":255,"g":107,"b":107}', '{"h":0,"s":100,"l":71}', '{"l":61,"a":52,"b":32}', 'Coral', 0, 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'),
('c7777777-7777-7777-7777-777777777777', '#FFE66D', '{"r":255,"g":230,"b":109}', '{"h":50,"s":100,"l":71}', '{"l":91,"a":-2,"b":64}', 'Golden', 1, 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'),
('c8888888-8888-8888-8888-888888888888', '#FF8C42', '{"r":255,"g":140,"b":66}', '{"h":23,"s":100,"l":63}', '{"l":67,"a":37,"b":52}', 'Orange', 2, 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'),
('c9999999-9999-9999-9999-999999999999', '#FFA5A5', '{"r":255,"g":165,"b":165}', '{"h":0,"s":100,"l":82}', '{"l":74,"a":32,"b":18}', 'Light Pink', 3, 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'),
('caaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '#C73E1D', '{"r":199,"g":62,"b":29}', '{"h":12,"s":75,"l":45}', '{"l":42,"a":45,"b":45}', 'Burnt Orange', 4, 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb');

-- Minimal Black palette colors
INSERT INTO colors (id, hex, rgb, hsl, lab, name, position, palette_id) VALUES
('cbbbbbb1-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '#000000', '{"r":0,"g":0,"b":0}', '{"h":0,"s":0,"l":0}', '{"l":0,"a":0,"b":0}', 'Pure Black', 0, 'dddddddd-dddd-dddd-dddd-dddddddddddd'),
('cbbbbbb2-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '#2B2B2B', '{"r":43,"g":43,"b":43}', '{"h":0,"s":0,"l":17}', '{"l":18,"a":0,"b":0}', 'Charcoal', 1, 'dddddddd-dddd-dddd-dddd-dddddddddddd'),
('cbbbbbb3-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '#555555', '{"r":85,"g":85,"b":85}', '{"h":0,"s":0,"l":33}', '{"l":36,"a":0,"b":0}', 'Dark Gray', 2, 'dddddddd-dddd-dddd-dddd-dddddddddddd'),
('cbbbbbb4-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '#808080', '{"r":128,"g":128,"b":128}', '{"h":0,"s":0,"l":50}', '{"l":54,"a":0,"b":0}', 'Gray', 3, 'dddddddd-dddd-dddd-dddd-dddddddddddd'),
('cbbbbbb5-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '#FFFFFF', '{"r":255,"g":255,"b":255}', '{"h":0,"s":0,"l":100}', '{"l":100,"a":0,"b":0}', 'White', 4, 'dddddddd-dddd-dddd-dddd-dddddddddddd');

-- ==================== TAGS ====================

INSERT INTO tags (id, name, slug, description, usage_count) VALUES
('t1111111-1111-1111-1111-111111111111', 'minimalist', 'minimalist', 'Clean and simple color schemes', 142),
('t2222222-2222-2222-2222-222222222222', 'vibrant', 'vibrant', 'Bold and energetic colors', 98),
('t3333333-3333-3333-3333-333333333333', 'nature', 'nature', 'Colors from the natural world', 234),
('t4444444-4444-4444-4444-444444444444', 'retro', 'retro', 'Vintage and nostalgic palettes', 76),
('t5555555-5555-5555-5555-555555555555', 'professional', 'professional', 'Business and corporate colors', 189);

-- ==================== PALETTE TAGS ====================

INSERT INTO palette_tags (palette_id, tag_id) VALUES
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 't3333333-3333-3333-3333-333333333333'),
('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 't3333333-3333-3333-3333-333333333333'),
('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 't2222222-2222-2222-2222-222222222222'),
('cccccccc-cccc-cccc-cccc-cccccccccccc', 't3333333-3333-3333-3333-333333333333'),
('dddddddd-dddd-dddd-dddd-dddddddddddd', 't1111111-1111-1111-1111-111111111111'),
('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', 't2222222-2222-2222-2222-222222222222'),
('aaaaaaa1-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 't5555555-5555-5555-5555-555555555555'),
('aaaaaaa2-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 't4444444-4444-4444-4444-444444444444');

-- ==================== FAVORITES ====================

INSERT INTO favorites (id, user_id, palette_id) VALUES
('f1111111-1111-1111-1111-111111111111', '33333333-3333-3333-3333-333333333333', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'),
('f2222222-2222-2222-2222-222222222222', '33333333-3333-3333-3333-333333333333', 'dddddddd-dddd-dddd-dddd-dddddddddddd'),
('f3333333-3333-3333-3333-333333333333', '44444444-4444-4444-4444-444444444444', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'),
('f4444444-4444-4444-4444-444444444444', '55555555-5555-5555-5555-555555555555', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa');

-- ==================== RATINGS ====================

INSERT INTO ratings (id, score, user_id, palette_id) VALUES
('r1111111-1111-1111-1111-111111111111', 5, '33333333-3333-3333-3333-333333333333', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'),
('r2222222-2222-2222-2222-222222222222', 4, '44444444-4444-4444-4444-444444444444', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'),
('r3333333-3333-3333-3333-333333333333', 5, '55555555-5555-5555-5555-555555555555', 'dddddddd-dddd-dddd-dddd-dddddddddddd'),
('r4444444-4444-4444-4444-444444444444', 3, '33333333-3333-3333-3333-333333333333', 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee');

-- ==================== COMMENTS ====================

INSERT INTO comments (id, content, user_id, palette_id) VALUES
('cm111111-1111-1111-1111-111111111111', 'Love these ocean colors! Perfect for my beach-themed website.', '33333333-3333-3333-3333-333333333333', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'),
('cm222222-2222-2222-2222-222222222222', 'The minimalist approach is exactly what I was looking for.', '44444444-4444-4444-4444-444444444444', 'dddddddd-dddd-dddd-dddd-dddddddddddd'),
('cm333333-3333-3333-3333-333333333333', 'These sunset colors are absolutely stunning!', '55555555-5555-5555-5555-555555555555', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb');

-- ==================== COLLECTIONS ====================

INSERT INTO collections (id, name, description, is_public, user_id) VALUES
('col11111-1111-1111-1111-111111111111', 'My Favorites', 'Personal collection of favorite palettes', false, '33333333-3333-3333-3333-333333333333'),
('col22222-2222-2222-2222-222222222222', 'Brand Colors', 'Color schemes for branding projects', true, '22222222-2222-2222-2222-222222222222'),
('col33333-3333-3333-3333-333333333333', 'Web Design', 'Palettes for web projects', true, '55555555-5555-5555-5555-555555555555');

-- ==================== COLLECTION PALETTES ====================

INSERT INTO collection_palettes (collection_id, palette_id, position) VALUES
('col11111-1111-1111-1111-111111111111', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 0),
('col11111-1111-1111-1111-111111111111', 'dddddddd-dddd-dddd-dddd-dddddddddddd', 1),
('col22222-2222-2222-2222-222222222222', 'aaaaaaa1-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 0),
('col33333-3333-3333-3333-333333333333', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 0),
('col33333-3333-3333-3333-333333333333', 'ffffffff-ffff-ffff-ffff-ffffffffffff', 1);

-- ==================== TEAMS ====================

INSERT INTO teams (id, name, slug, description) VALUES
('team1111-1111-1111-1111-111111111111', 'Design Studio', 'design-studio', 'Creative design team'),
('team2222-2222-2222-2222-222222222222', 'Marketing Team', 'marketing-team', 'Brand and marketing department');

-- ==================== TEAM MEMBERS ====================

INSERT INTO team_members (id, user_id, team_id, role) VALUES
('tm111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222', 'team1111-1111-1111-1111-111111111111', 'OWNER'),
('tm222222-2222-2222-2222-222222222222', '55555555-5555-5555-5555-555555555555', 'team1111-1111-1111-1111-111111111111', 'MEMBER'),
('tm333333-3333-3333-3333-333333333333', '44444444-4444-4444-4444-444444444444', 'team2222-2222-2222-2222-222222222222', 'ADMIN');

-- ==================== ACTIVITIES ====================

INSERT INTO activities (id, type, user_id, palette_id, metadata) VALUES
('act11111-1111-1111-1111-111111111111', 'PALETTE_CREATED', '22222222-2222-2222-2222-222222222222', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '{"action": "created new palette"}'),
('act22222-2222-2222-2222-222222222222', 'PALETTE_LIKED', '33333333-3333-3333-3333-333333333333', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '{"action": "liked palette"}'),
('act33333-3333-3333-3333-333333333333', 'COLLECTION_CREATED', '33333333-3333-3333-3333-333333333333', NULL, '{"collection": "My Favorites"}');

-- ==================== NOTIFICATIONS ====================

INSERT INTO notifications (id, type, title, message, user_id, is_read) VALUES
('not11111-1111-1111-1111-111111111111', 'PALETTE_LIKED', 'Your palette was liked!', 'John Doe liked your Ocean Breeze palette', '22222222-2222-2222-2222-222222222222', false),
('not22222-2222-2222-2222-222222222222', 'COMMENT_RECEIVED', 'New comment', 'Someone commented on your palette', '22222222-2222-2222-2222-222222222222', true),
('not33333-3333-3333-3333-333333333333', 'SYSTEM', 'Welcome to ChromaVault!', 'Start creating beautiful color palettes', '33333333-3333-3333-3333-333333333333', true);

-- ==================== STATISTICS ====================

-- Update palette statistics based on inserted data
UPDATE palettes SET view_count = view_count + FLOOR(RANDOM() * 100) WHERE is_public = true;
UPDATE tags SET usage_count = usage_count + FLOOR(RANDOM() * 20);

-- ==================== INDEXES REFRESH ====================
-- Refresh any materialized views or search indexes if needed
-- REFRESH MATERIALIZED VIEW CONCURRENTLY palette_search_index;