-- Create a table for storing purchase records
create table if not exists purchases (
    id uuid default uuid_generate_v4() primary key,
    user_id uuid references auth.users(id),
    item_name text not null,
    item_price numeric(10,2) not null,
    quantity integer not null,
    category text,
    shipping_address text,
    payment_method text,
    total_amount numeric(10,2) not null,
    discounted_amount numeric(10,2),
    discount_percentage numeric(5,2),
    status text default 'pending',
    created_at timestamp with time zone default timezone('utc'::text, now()),
    customer_name text,
    customer_email text
);

-- Create an RLS policy to allow users to see only their own purchases
alter table purchases enable row level security;

create policy "Users can view their own purchases"
    on purchases for select
    using (auth.uid() = user_id);

create policy "Users can insert their own purchases"
    on purchases for insert
    with check (auth.uid() = user_id);

-- Create an index for faster queries
create index purchases_user_id_idx on purchases(user_id);
create index purchases_created_at_idx on purchases(created_at); 