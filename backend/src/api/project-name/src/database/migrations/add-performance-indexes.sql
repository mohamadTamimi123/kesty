-- Performance optimization indexes
-- This migration adds indexes to frequently queried fields to improve query performance

-- Projects table indexes
CREATE INDEX IF NOT EXISTS idx_projects_city_id ON projects(city_id);
CREATE INDEX IF NOT EXISTS idx_projects_category_id ON projects(category_id);
CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(status);
CREATE INDEX IF NOT EXISTS idx_projects_is_public ON projects(is_public);
CREATE INDEX IF NOT EXISTS idx_projects_customer_id ON projects(customer_id);
CREATE INDEX IF NOT EXISTS idx_projects_created_at ON projects(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_projects_status_public ON projects(status, is_public) WHERE is_public = true;

-- Quotes table indexes
CREATE INDEX IF NOT EXISTS idx_quotes_project_id ON quotes(project_id);
CREATE INDEX IF NOT EXISTS idx_quotes_supplier_id ON quotes(supplier_id);
CREATE INDEX IF NOT EXISTS idx_quotes_status ON quotes(status);
CREATE INDEX IF NOT EXISTS idx_quotes_created_at ON quotes(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_quotes_project_status ON quotes(project_id, status);

-- Portfolio table indexes
CREATE INDEX IF NOT EXISTS idx_portfolio_supplier_id ON portfolio(supplier_id);
CREATE INDEX IF NOT EXISTS idx_portfolio_status ON portfolio(status);
CREATE INDEX IF NOT EXISTS idx_portfolio_is_verified ON portfolio(is_verified);
CREATE INDEX IF NOT EXISTS idx_portfolio_created_at ON portfolio(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_portfolio_supplier_status ON portfolio(supplier_id, status);

-- Reviews table indexes
CREATE INDEX IF NOT EXISTS idx_reviews_portfolio_id ON reviews(portfolio_id);
CREATE INDEX IF NOT EXISTS idx_reviews_supplier_id ON reviews(supplier_id);
CREATE INDEX IF NOT EXISTS idx_reviews_created_at ON reviews(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_reviews_portfolio_supplier ON reviews(portfolio_id, supplier_id);

-- Review requests table indexes
CREATE INDEX IF NOT EXISTS idx_review_requests_portfolio_id ON review_requests(portfolio_id);
CREATE INDEX IF NOT EXISTS idx_review_requests_customer_id ON review_requests(customer_id);
CREATE INDEX IF NOT EXISTS idx_review_requests_status ON review_requests(status);
CREATE INDEX IF NOT EXISTS idx_review_requests_token ON review_requests(token);
CREATE INDEX IF NOT EXISTS idx_review_requests_created_at ON review_requests(created_at DESC);

-- Messages table indexes
CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_sender_id ON messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_conversation_created ON messages(conversation_id, created_at DESC);

-- Conversations table indexes
CREATE INDEX IF NOT EXISTS idx_conversations_customer_id ON conversations(customer_id);
CREATE INDEX IF NOT EXISTS idx_conversations_supplier_id ON conversations(supplier_id);
CREATE INDEX IF NOT EXISTS idx_conversations_project_id ON conversations(project_id);
CREATE INDEX IF NOT EXISTS idx_conversations_updated_at ON conversations(updated_at DESC);

-- Machine listings table indexes
CREATE INDEX IF NOT EXISTS idx_machine_listings_city_id ON machine_listings(city_id);
CREATE INDEX IF NOT EXISTS idx_machine_listings_category_id ON machine_listings(category_id);
CREATE INDEX IF NOT EXISTS idx_machine_listings_machine_id ON machine_listings(machine_id);
CREATE INDEX IF NOT EXISTS idx_machine_listings_is_active ON machine_listings(is_active);
CREATE INDEX IF NOT EXISTS idx_machine_listings_slug ON machine_listings(slug);
CREATE INDEX IF NOT EXISTS idx_machine_listings_created_at ON machine_listings(created_at DESC);

-- Educational articles table indexes (if not already created)
CREATE INDEX IF NOT EXISTS idx_educational_articles_category_id ON educational_articles(category_id);
CREATE INDEX IF NOT EXISTS idx_educational_articles_is_published ON educational_articles(is_published);
CREATE INDEX IF NOT EXISTS idx_educational_articles_published_at ON educational_articles(published_at DESC) WHERE is_published = true;

-- Users table indexes for supplier queries
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_is_active ON users(is_active);
CREATE INDEX IF NOT EXISTS idx_users_role_active ON users(role, is_active) WHERE role = 'SUPPLIER';

-- Category-Supplier junction table indexes
CREATE INDEX IF NOT EXISTS idx_category_supplier_category_id ON category_supplier(category_id);
CREATE INDEX IF NOT EXISTS idx_category_supplier_supplier_id ON category_supplier(supplier_id);

-- City-Supplier junction table indexes
CREATE INDEX IF NOT EXISTS idx_city_supplier_city_id ON city_supplier(city_id);
CREATE INDEX IF NOT EXISTS idx_city_supplier_supplier_id ON city_supplier(supplier_id);

-- Supplier rating indexes
CREATE INDEX IF NOT EXISTS idx_supplier_rating_supplier_id ON supplier_rating(supplier_id);
CREATE INDEX IF NOT EXISTS idx_supplier_rating_average_score ON supplier_rating(average_score DESC);

