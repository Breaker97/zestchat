-- Update handle_new_user trigger function to copy mobile_number from metadata to profiles table
create or replace function public.handle_new_user()
returns trigger as $$
declare
    v_username text;
    v_full_name text;
    v_mobile_number text;
begin
    -- Generate unique username from email if not provided in metadata
    v_username := coalesce(new.raw_user_meta_data->>'username', split_part(new.email, '@', 1) || '_' || substring(md5(random()::text) from 1 for 5));
    v_full_name := coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1));
    v_mobile_number := new.raw_user_meta_data->>'mobile_number';

    -- Insert into profiles
    insert into public.profiles (id, full_name, username, email, mobile_number, account_status)
    values (new.id, v_full_name, v_username, new.email, v_mobile_number, 'active');

    -- Insert into privacy settings
    insert into public.profile_privacy_settings (user_id)
    values (new.id);

    -- Insert into notification preferences
    insert into public.notification_preferences (user_id)
    values (new.id);

    -- Insert into presence
    insert into public.user_presence (user_id, is_online)
    values (new.id, false);

    return new;
end;
$$ language plpgsql security definer;
