-- Create order history table
CREATE TABLE order_history (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id),
    order_date TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    customer_name TEXT NOT NULL,
    customer_email TEXT NOT NULL,
    shipping_address TEXT NOT NULL,
    
    -- Item details
    item_name TEXT NOT NULL,
    quantity INTEGER NOT NULL,
    unit_price DECIMAL(10,2) NOT NULL,
    image_url TEXT,
    
    -- Price calculations
    subtotal DECIMAL(10,2) NOT NULL,
    tax DECIMAL(10,2) NOT NULL,
    total DECIMAL(10,2) NOT NULL,
    
    -- Additional info
    payment_method TEXT NOT NULL,
    order_status TEXT DEFAULT 'completed',
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Create a trigger to automatically update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_order_history_updated_at
    BEFORE UPDATE ON order_history
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Create an index on user_id for faster queries
CREATE INDEX idx_order_history_user_id ON order_history(user_id);

-- Enable Row Level Security (RLS)
ALTER TABLE order_history ENABLE ROW LEVEL SECURITY;

-- Create policy to allow users to only see their own orders
CREATE POLICY "Users can view their own orders"
    ON order_history
    FOR SELECT
    USING (auth.uid() = user_id);

-- Create policy to allow users to insert their own orders
CREATE POLICY "Users can insert their own orders"
    ON order_history
    FOR INSERT
    WITH CHECK (auth.uid() = user_id); 