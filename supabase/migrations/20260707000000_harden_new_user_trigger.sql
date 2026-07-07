-- Keep Auth signups deterministic and prevent object-name hijacking in this
-- security-definer function. Fully qualified names also make failures easier
-- to reason about from Supabase Auth logs.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
    v_username text;
    v_full_name text;
    v_mobile_number text;
begin
    v_username := lower(coalesce(
        nullif(trim(new.raw_user_meta_data->>'username'), ''),
        split_part(new.email, '@', 1) || '_' || substring(md5(random()::text) from 1 for 5)
    ));
    v_full_name := coalesce(
        nullif(trim(new.raw_user_meta_data->>'full_name'), ''),
        split_part(new.email, '@', 1)
    );
    v_mobile_number := nullif(trim(new.raw_user_meta_data->>'mobile_number'), '');

    insert into public.profiles (id, full_name, username, email, mobile_number, account_status)
    values (new.id, v_full_name, v_username, new.email, v_mobile_number, 'active');

    insert into public.profile_privacy_settings (user_id) values (new.id);
    insert into public.notification_preferences (user_id) values (new.id);
    insert into public.user_presence (user_id, is_online) values (new.id, false);

    return new;
end;
$$;
