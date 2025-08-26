-- ChromaVault Initial Database Migration
-- Created: 2025-01-23
-- Version: 1.0.0
-- Database: PostgreSQL 15

-- ==================== EXTENSIONS ====================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm"; -- For text search

-- ==================== HELPER FUNCTIONS ====================

-- Update timestamp function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- ==================== TABLES ====================

-- Users table
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    name VARCHAR(255),
    avatar TEXT,
    bio TEXT,
    role VARCHAR(50) DEFAULT 'USER' CHECK (role IN ('USER', 'PRO', 'ADMIN', 'MODERATOR')),
    is_verified BOOLEAN DEFAULT false,
    verification_token VARCHAR(255),
    reset_token VARCHAR(255),
    reset_expires TIMESTAMP,
    last_login TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP
);

-- Palettes table
CREATE TABLE palettes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    slug VARCHAR(255) UNIQUE NOT NULL,
    is_public BOOLEAN DEFAULT false,
    is_featured BOOLEAN DEFAULT false,
    view_count INTEGER DEFAULT 0,
    download_count INTEGER DEFAULT 0,
    user_id UUID NOT NULL REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP,
    version INTEGER DEFAULT 1
);

-- Colors table
CREATE TABLE colors (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    hex VARCHAR(7) NOT NULL,
    rgb JSONB NOT NULL,
    hsl JSONB NOT NULL,
    lab JSONB NOT NULL,
    name VARCHAR(255),
    position INTEGER NOT NULL,
    palette_id UUID NOT NULL REFERENCES palettes(id) ON DELETE CASCADE,
    UNIQUE(palette_id, position)
);

-- Tags table
CREATE TABLE tags (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) UNIQUE NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    usage_count INTEGER DEFAULT 0
);

-- Palette-Tags junction table
CREATE TABLE palette_tags (
    palette_id UUID REFERENCES palettes(id) ON DELETE CASCADE,
    tag_id UUID REFERENCES tags(id),
    PRIMARY KEY (palette_id, tag_id)
);

-- Categories table
CREATE TABLE categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) UNIQUE NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    icon VARCHAR(255),
    parent_id UUID REFERENCES categories(id)
);

-- Palette-Categories junction table
CREATE TABLE palette_categories (
    palette_id UUID REFERENCES palettes(id) ON DELETE CASCADE,
    category_id UUID REFERENCES categories(id),
    PRIMARY KEY (palette_id, category_id)
);

-- Favorites table
CREATE TABLE favorites (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id),
    palette_id UUID NOT NULL REFERENCES palettes(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, palette_id)
);

-- Comments table
CREATE TABLE comments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    content TEXT NOT NULL,
    user_id UUID NOT NULL REFERENCES users(id),
    palette_id UUID NOT NULL REFERENCES palettes(id) ON DELETE CASCADE,
    parent_id UUID REFERENCES comments(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Ratings table
CREATE TABLE ratings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    score INTEGER NOT NULL CHECK (score >= 1 AND score <= 5),
    user_id UUID NOT NULL REFERENCES users(id),
    palette_id UUID NOT NULL REFERENCES palettes(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, palette_id)
);

-- Collections table
CREATE TABLE collections (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    is_public BOOLEAN DEFAULT false,
    user_id UUID NOT NULL REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Collection-Palettes junction table
CREATE TABLE collection_palettes (
    collection_id UUID REFERENCES collections(id) ON DELETE CASCADE,
    palette_id UUID REFERENCES palettes(id) ON DELETE CASCADE,
    position INTEGER NOT NULL,
    added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (collection_id, palette_id),
    UNIQUE(collection_id, position)
);

-- Teams table
CREATE TABLE teams (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL,
    description TEXT,
    logo TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Team Members table
CREATE TABLE team_members (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id),
    team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
    role VARCHAR(50) DEFAULT 'MEMBER' CHECK (role IN ('OWNER', 'ADMIN', 'MEMBER', 'VIEWER')),
    joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, team_id)
);

-- Projects table
CREATE TABLE projects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    status VARCHAR(50) DEFAULT 'ACTIVE' CHECK (status IN ('DRAFT', 'ACTIVE', 'ARCHIVED', 'COMPLETED')),
    team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Activities table
CREATE TABLE activities (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    type VARCHAR(50) NOT NULL,
    metadata JSONB,
    user_id UUID NOT NULL REFERENCES users(id),
    palette_id UUID REFERENCES palettes(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Notifications table
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    type VARCHAR(50) NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT false,
    metadata JSONB,
    user_id UUID NOT NULL REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ==================== INDEXES ====================

-- Users indexes
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);

-- Palettes indexes
CREATE INDEX idx_palettes_user_id ON palettes(user_id);
CREATE INDEX idx_palettes_slug ON palettes(slug);
CREATE INDEX idx_palettes_is_public ON palettes(is_public);
CREATE INDEX idx_palettes_created_at ON palettes(created_at DESC);

-- Colors indexes
CREATE INDEX idx_colors_palette_id ON colors(palette_id);
CREATE INDEX idx_colors_hex ON colors(hex);

-- Tags indexes
CREATE INDEX idx_tags_slug ON tags(slug);

-- Categories indexes
CREATE INDEX idx_categories_slug ON categories(slug);
CREATE INDEX idx_categories_parent_id ON categories(parent_id);

-- Favorites indexes
CREATE INDEX idx_favorites_user_id ON favorites(user_id);
CREATE INDEX idx_favorites_palette_id ON favorites(palette_id);

-- Comments indexes
CREATE INDEX idx_comments_user_id ON comments(user_id);
CREATE INDEX idx_comments_palette_id ON comments(palette_id);
CREATE INDEX idx_comments_parent_id ON comments(parent_id);

-- Ratings indexes
CREATE INDEX idx_ratings_user_id ON ratings(user_id);
CREATE INDEX idx_ratings_palette_id ON ratings(palette_id);

-- Collections indexes
CREATE INDEX idx_collections_user_id ON collections(user_id);

-- Teams indexes
CREATE INDEX idx_teams_slug ON teams(slug);

-- Team Members indexes
CREATE INDEX idx_team_members_user_id ON team_members(user_id);
CREATE INDEX idx_team_members_team_id ON team_members(team_id);

-- Projects indexes
CREATE INDEX idx_projects_team_id ON projects(team_id);

-- Activities indexes
CREATE INDEX idx_activities_user_id ON activities(user_id);
CREATE INDEX idx_activities_palette_id ON activities(palette_id);
CREATE INDEX idx_activities_created_at ON activities(created_at DESC);

-- Notifications indexes
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_is_read ON notifications(is_read);
CREATE INDEX idx_notifications_created_at ON notifications(created_at DESC);

-- Full text search indexes
CREATE INDEX idx_palettes_name_trgm ON palettes USING gin (name gin_trgm_ops);
CREATE INDEX idx_palettes_description_trgm ON palettes USING gin (description gin_trgm_ops);
CREATE INDEX idx_tags_name_trgm ON tags USING gin (name gin_trgm_ops);

-- ==================== TRIGGERS ====================

-- Auto-update timestamps
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_palettes_updated_at BEFORE UPDATE ON palettes
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_comments_updated_at BEFORE UPDATE ON comments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_collections_updated_at BEFORE UPDATE ON collections
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_teams_updated_at BEFORE UPDATE ON teams
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON projects
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ==================== SAMPLE DATA (Optional) ====================

-- Insert sample categories
INSERT INTO categories (name, slug, description) VALUES
    ('Nature', 'nature', 'Colors inspired by natural landscapes'),
    ('Technology', 'technology', 'Modern tech-inspired color schemes'),
    ('Vintage', 'vintage', 'Retro and vintage color palettes'),
    ('Minimalist', 'minimalist', 'Simple and clean color combinations'),
    ('Bold', 'bold', 'Vibrant and striking color schemes');

-- Insert sample tags
INSERT INTO tags (name, slug, description) VALUES
    ('pastel', 'pastel', 'Soft and muted colors'),
    ('neon', 'neon', 'Bright fluorescent colors'),
    ('monochrome', 'monochrome', 'Single color variations'),
    ('gradient', 'gradient', 'Smooth color transitions'),
    ('earth-tones', 'earth-tones', 'Natural earthy colors');

-- ==================== PERMISSIONS ====================

-- Grant permissions to application user (replace 'app_user' with actual username)
-- GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO app_user;
-- GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO app_user;
-- GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO app_user;