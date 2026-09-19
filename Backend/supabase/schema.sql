-- Vijay Dairy - Supabase (PostgreSQL) schema
-- Run in the Supabase dashboard: SQL Editor > New query > paste > Run.

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    name TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'admin',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    unit TEXT NOT NULL CHECK (unit IN ('LTR', 'KG', 'PCS')),
    price NUMERIC(12, 2) NOT NULL CHECK (price >= 0),
    stock NUMERIC(12, 2) NOT NULL DEFAULT 0,
    low_stock_threshold NUMERIC(12, 2) NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS ux_products_name_ci ON products (LOWER(name));

CREATE TABLE IF NOT EXISTS invoices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    invoice_number TEXT NOT NULL UNIQUE,
    items JSONB NOT NULL,
    subtotal NUMERIC(12, 2) NOT NULL DEFAULT 0,
    discount NUMERIC(12, 2) NOT NULL DEFAULT 0,
    tax_percent NUMERIC(5, 2) NOT NULL DEFAULT 0,
    tax_amount NUMERIC(12, 2) NOT NULL DEFAULT 0,
    total NUMERIC(12, 2) NOT NULL DEFAULT 0,
    notes TEXT NOT NULL DEFAULT '',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS ix_invoices_created_at ON invoices (created_at DESC);

CREATE TABLE IF NOT EXISTS settings (
    id TEXT PRIMARY KEY DEFAULT 'business',
    shop_name TEXT NOT NULL DEFAULT 'Vijay Dairy',
    address TEXT NOT NULL DEFAULT '',
    phone TEXT NOT NULL DEFAULT '',
    gst_number TEXT NOT NULL DEFAULT '',
    footer_note TEXT NOT NULL DEFAULT 'Thank you for your business!',
    inventory_enabled BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE TABLE IF NOT EXISTS counters (
    id TEXT PRIMARY KEY,
    seq INTEGER NOT NULL DEFAULT 0
);

INSERT INTO settings (id) VALUES ('business') ON CONFLICT (id) DO NOTHING;
INSERT INTO counters (id, seq) VALUES ('invoice', 0) ON CONFLICT (id) DO NOTHING;

-- The Node API is the only client (it connects with the database credentials, which bypass RLS).
-- Enabling RLS with no policies blocks direct access through Supabase's public anon/authenticated API keys.
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE counters ENABLE ROW LEVEL SECURITY;
