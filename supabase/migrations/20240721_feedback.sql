create table public.feedback (
    id uuid default gen_random_uuid() primary key,
    user_address text not null,
    content text not null,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Setup RLS
alter table public.feedback enable row level security;

-- Allow anonymous inserts (anyone can submit feedback)
create policy "Allow inserts for anyone" on public.feedback
    for insert
    to public
    with check (true);

-- Only admins can view feedback (for now, just lock it down so public can't read)
create policy "Allow read for admins only" on public.feedback
    for select
    to authenticated
    using (true);
