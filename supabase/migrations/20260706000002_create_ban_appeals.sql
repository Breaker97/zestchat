-- Create ban appeals table
create table if not exists public.ban_appeals (
    id uuid default uuid_generate_v4() primary key,
    user_id uuid references public.profiles on delete cascade not null,
    ban_reason text not null,
    appeal_text text not null,
    status text not null default 'pending', -- pending, approved, rejected
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

-- Enable RLS
alter table public.ban_appeals enable row level security;

-- Policies for ban appeals
create policy "Allow users to read their own ban appeals"
    on public.ban_appeals for select
    using (auth.uid() = user_id);

create policy "Allow users to insert their own ban appeals"
    on public.ban_appeals for insert
    with check (auth.uid() = user_id);

create policy "Allow admin users to manage all ban appeals"
    on public.ban_appeals for all
    using (
        exists (
            select 1 from public.admin_users au 
            where au.user_id = auth.uid() and au.role in ('super_admin', 'admin', 'moderator', 'support_agent')
        )
    );

-- Add trigger for updated_at
create trigger set_ban_appeals_timestamp before update on public.ban_appeals for each row execute procedure public.trigger_set_timestamp();
