-- Update handle_new_user trigger function to copy dob from metadata to profiles table
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
    v_dob text;
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
    v_dob := nullif(trim(new.raw_user_meta_data->>'dob'), '');

    insert into public.profiles (id, full_name, username, email, mobile_number, dob, account_status)
    values (new.id, v_full_name, v_username, new.email, v_mobile_number, v_dob, 'active');

    insert into public.profile_privacy_settings (user_id) values (new.id);
    insert into public.notification_preferences (user_id) values (new.id);
    insert into public.user_presence (user_id, is_online) values (new.id, false);

    return new;
end;
$$;
