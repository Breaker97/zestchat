-- Migration: Add missing RLS policies for Calls System

-- 1. Calls Table Policies
create policy "Allow users to select calls they are part of"
    on public.calls for select
    using (
        auth.uid() = host_id or
        exists (
            select 1 from public.call_participants cp
            where cp.call_id = calls.id and cp.user_id = auth.uid()
        ) or
        exists (
            select 1 from public.chat_members cm
            where cm.chat_id = calls.chat_id and cm.user_id = auth.uid()
        )
    );

create policy "Allow authenticated users to insert calls"
    on public.calls for insert
    with check (auth.uid() = host_id);

create policy "Allow host or participants to update calls"
    on public.calls for update
    using (
        auth.uid() = host_id or
        exists (
            select 1 from public.call_participants cp
            where cp.call_id = calls.id and cp.user_id = auth.uid()
        )
    );

create policy "Allow host to delete calls"
    on public.calls for delete
    using (auth.uid() = host_id);


-- 2. Call Participants Table Policies
create policy "Allow users to select participants of their calls"
    on public.call_participants for select
    using (
        auth.uid() = user_id or
        exists (
            select 1 from public.calls c
            where c.id = call_participants.call_id and (c.host_id = auth.uid() or exists (
                select 1 from public.call_participants cp2
                where cp2.call_id = c.id and cp2.user_id = auth.uid()
            ))
        )
    );

create policy "Allow users to insert call participants"
    on public.call_participants for insert
    with check (
        auth.uid() = user_id or
        exists (
            select 1 from public.calls c
            where c.id = call_participants.call_id and c.host_id = auth.uid()
        )
    );

create policy "Allow user or host to update participant status"
    on public.call_participants for update
    using (
        auth.uid() = user_id or
        exists (
            select 1 from public.calls c
            where c.id = call_participants.call_id and c.host_id = auth.uid()
        )
    );

create policy "Allow host to delete participants"
    on public.call_participants for delete
    using (
        exists (
            select 1 from public.calls c
            where c.id = call_participants.call_id and c.host_id = auth.uid()
        )
    );


-- 3. Call Events Table Policies
create policy "Allow users to read call events"
    on public.call_events for select
    using (
        exists (
            select 1 from public.calls c
            where c.id = call_events.call_id and (c.host_id = auth.uid() or exists (
                select 1 from public.call_participants cp
                where cp.call_id = c.id and cp.user_id = auth.uid()
            ))
        )
    );

create policy "Allow users to insert call events"
    on public.call_events for insert
    with check (
        auth.uid() = user_id or
        exists (
            select 1 from public.calls c
            where c.id = call_events.call_id and c.host_id = auth.uid()
        )
    );
