-- Create educational_articles table
CREATE TABLE IF NOT EXISTS educational_articles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL,
    excerpt TEXT,
    content TEXT NOT NULL,
    featured_image VARCHAR(500),
    category_id UUID,
    sub_category_id UUID,
    author_id UUID NOT NULL,
    meta_title VARCHAR(255),
    meta_description TEXT,
    is_published BOOLEAN DEFAULT false,
    published_at TIMESTAMP,
    view_count INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_educational_articles_category FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL,
    CONSTRAINT fk_educational_articles_subcategory FOREIGN KEY (sub_category_id) REFERENCES categories(id) ON DELETE SET NULL,
    CONSTRAINT fk_educational_articles_author FOREIGN KEY (author_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Create index on slug for faster lookups
CREATE INDEX IF NOT EXISTS idx_educational_articles_slug ON educational_articles(slug);
CREATE INDEX IF NOT EXISTS idx_educational_articles_category_id ON educational_articles(category_id);
CREATE INDEX IF NOT EXISTS idx_educational_articles_is_published ON educational_articles(is_published);
CREATE INDEX IF NOT EXISTS idx_educational_articles_published_at ON educational_articles(published_at);

