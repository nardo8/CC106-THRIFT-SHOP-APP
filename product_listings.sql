-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create product listings table
CREATE TABLE product_listings (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    seller_id UUID REFERENCES auth.users(id),
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    price DECIMAL(10,2) NOT NULL,
    category TEXT NOT NULL,
    condition TEXT NOT NULL,
    image_url TEXT,
    status TEXT DEFAULT 'available',
    location TEXT,
    
    -- Contact info
    contact_email TEXT NOT NULL,
    contact_phone TEXT,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Create a trigger to automatically update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_product_listings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_product_listings_updated_at
    BEFORE UPDATE ON product_listings
    FOR EACH ROW
    EXECUTE FUNCTION update_product_listings_updated_at();

-- Create an index on seller_id for faster queries
CREATE INDEX idx_product_listings_seller_id ON product_listings(seller_id);

-- Enable Row Level Security (RLS)
ALTER TABLE product_listings ENABLE ROW LEVEL SECURITY;

-- Create policy to allow anyone to view available listings
CREATE POLICY "Anyone can view available listings"
    ON product_listings
    FOR SELECT
    USING (status = 'available');

-- Create policy to allow sellers to manage their own listings
CREATE POLICY "Sellers can manage their own listings"
    ON product_listings
    FOR ALL
    USING (auth.uid() = seller_id);

-- Create policy to allow sellers to insert new listings
CREATE POLICY "Sellers can insert new listings"
    ON product_listings
    FOR INSERT
    WITH CHECK (auth.uid() = seller_id); 