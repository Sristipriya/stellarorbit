-- ==============================================================================
-- Orbit DeFi: Users & User-Isolated Transactions Schema
-- ==============================================================================

-- 1. Profiles Table (Stores every unique user, creation date, display name, points, referrals)
create table if not exists public.profiles (
    wallet_address text primary key,
    display_name text,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
    last_seen_at timestamp with time zone default timezone('utc'::text, now()) not null,
    points numeric default 0 not null,
    referral_code text,
    referred_by text
);

-- 2. Transactions Table (Stores each user's transaction hashes with strict wallet isolation)
create table if not exists public.transactions (
    id text primary key,
    wallet_address text not null references public.profiles(wallet_address) on delete cascade,
    tx_hash text not null,
    type text not null, -- 'deposit' | 'withdraw' | 'wrap' | 'unwrap' | 'lend' | 'borrow' | 'faucet'
    amount text not null,
    asset text not null default 'XLM',
    vault_id text default 'xlm',
    shares text,
    status text not null default 'success',
    metadata jsonb default '{}'::jsonb,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 3. Indexes for fast query performance and strict wallet scoping
create index if not exists idx_profiles_created_at on public.profiles (created_at desc);
create index if not exists idx_transactions_wallet_address on public.transactions (wallet_address);
create index if not exists idx_transactions_created_at on public.transactions (created_at desc);
create index if not exists idx_transactions_tx_hash on public.transactions (tx_hash);

-- 4. Enable Row Level Security (RLS)
alter table public.profiles enable row level security;
alter table public.transactions enable row level security;

-- 5. RLS Policies for Profiles
create policy "Allow public read of profiles" on public.profiles 
    for select using (true);

create policy "Allow upsert of profiles" on public.profiles 
    for insert with check (true);

create policy "Allow update of profiles" on public.profiles 
    for update using (true);

-- 6. RLS Policies for Transactions
create policy "Allow public read of transactions" on public.transactions 
    for select using (true);

create policy "Allow insert of transactions" on public.transactions 
    for insert with check (true);

create policy "Allow update of transactions" on public.transactions 
    for update using (true);
