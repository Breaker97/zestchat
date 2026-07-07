-- Avoid querying chat_members recursively from chat_members/messages policies.
create or replace function public.is_chat_member(target_chat_id uuid, target_user_id uuid default auth.uid())
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.chat_members
    where chat_id = target_chat_id
      and user_id = target_user_id
  );
$$;

revoke all on function public.is_chat_member(uuid, uuid) from public;
grant execute on function public.is_chat_member(uuid, uuid) to authenticated;

drop policy if exists "Allow users to select chats they are member of" on public.chats;
create policy "Allow users to select chats they are member of"
on public.chats for select to authenticated
using (public.is_chat_member(id));

drop policy if exists "Allow chat members to read member list" on public.chat_members;
create policy "Allow chat members to read member list"
on public.chat_members for select to authenticated
using (public.is_chat_member(chat_id));

drop policy if exists "Allow chat members to read messages" on public.messages;
create policy "Allow chat members to read messages"
on public.messages for select to authenticated
using (public.is_chat_member(chat_id));

drop policy if exists "Allow chat members to insert messages" on public.messages;
create policy "Allow chat members to insert messages"
on public.messages for insert to authenticated
with check (
  sender_id = auth.uid()
  and public.is_chat_member(chat_id)
  and not exists (
    select 1 from public.user_restrictions
    where user_id = auth.uid()
      and restriction_type = 'messages'
      and is_active = true
  )
);
