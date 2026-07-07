-- ZestChat Initial Database Schema Migration
-- Created at 2026-07-06

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- ==========================================
-- 1. AUTH AND PROFILE TABLES
-- ==========================================

-- Profiles table
create table public.profiles (
    id uuid references auth.users on delete cascade primary key,
    full_name text not null,
    username text not null unique,
    email text not null unique,
    mobile_number text,
    country_code text,
    profile_photo_url text,
    bio text,
    verification_status text default 'unverified', -- verified, unverified, partner
    account_status text not null default 'active', -- active, suspended, restricted, banned
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    last_seen_at timestamptz not null default now()
);

-- Profile privacy settings
create table public.profile_privacy_settings (
    user_id uuid references public.profiles on delete cascade primary key,
    who_can_find_by_name text not null default 'everyone', -- everyone, friends_of_friends, friends, nobody
    who_can_find_by_username text not null default 'everyone',
    who_can_find_by_email text not null default 'friends',
    who_can_find_by_mobile text not null default 'friends',
    who_can_send_friend_request text not null default 'everyone',
    who_can_see_profile_photo text not null default 'everyone',
    who_can_see_last_seen text not null default 'friends',
    who_can_see_online_status text not null default 'friends',
    read_receipts_enabled boolean not null default true,
    group_invite_permission text not null default 'friends',
    updated_at timestamptz not null default now()
);

-- User devices (for FCM tokens)
create table public.user_devices (
    id uuid default uuid_generate_v4() primary key,
    user_id uuid references public.profiles on delete cascade not null,
    fcm_token text not null unique,
    device_type text, -- web_chrome, web_firefox, web_safari, mobile_web
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

-- User presence (real-time online status)
create table public.user_presence (
    user_id uuid references public.profiles on delete cascade primary key,
    is_online boolean not null default false,
    last_active_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

-- Blocked users
create table public.blocked_users (
    id uuid default uuid_generate_v4() primary key,
    blocker_id uuid references public.profiles on delete cascade not null,
    blocked_id uuid references public.profiles on delete cascade not null,
    created_at timestamptz not null default now(),
    unique(blocker_id, blocked_id)
);

-- ==========================================
-- 2. FRIENDS SYSTEM
-- ==========================================

-- Friend requests
create table public.friend_requests (
    id uuid default uuid_generate_v4() primary key,
    sender_id uuid references public.profiles on delete cascade not null,
    receiver_id uuid references public.profiles on delete cascade not null,
    status text not null default 'pending', -- pending, accepted, declined, cancelled, blocked, expired
    request_message text,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    check (sender_id <> receiver_id),
    unique(sender_id, receiver_id)
);

-- Friendships
create table public.friendships (
    id uuid default uuid_generate_v4() primary key,
    user_id_1 uuid references public.profiles on delete cascade not null,
    user_id_2 uuid references public.profiles on delete cascade not null,
    created_at timestamptz not null default now(),
    check (user_id_1 < user_id_2), -- ensure unique pairing (canonical order)
    unique(user_id_1, user_id_2)
);

-- Friendship activity (logs of friendship changes)
create table public.friendship_activity (
    id uuid default uuid_generate_v4() primary key,
    user_id uuid references public.profiles on delete cascade not null,
    target_user_id uuid references public.profiles on delete cascade not null,
    action_type text not null, -- requested, accepted, declined, blocked, removed
    created_at timestamptz not null default now()
);

-- ==========================================
-- 3. CHAT SYSTEM
-- ==========================================

-- Chats (direct and group/community channels)
create table public.chats (
    id uuid default uuid_generate_v4() primary key,
    type text not null, -- direct, group, community_channel
    title text, -- null for direct chats (computed from partner profile)
    description text,
    cover_photo_url text,
    created_by uuid references public.profiles on delete set null,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

-- Chat members
create table public.chat_members (
    id uuid default uuid_generate_v4() primary key,
    chat_id uuid references public.chats on delete cascade not null,
    user_id uuid references public.profiles on delete cascade not null,
    joined_at timestamptz not null default now(),
    role text not null default 'member', -- member, moderator, admin, owner
    unique(chat_id, user_id)
);

-- Messages
create table public.messages (
    id uuid default uuid_generate_v4() primary key,
    chat_id uuid references public.chats on delete cascade not null,
    sender_id uuid references public.profiles on delete cascade not null,
    content text,
    message_type text not null default 'text', -- text, image, video, voice_note, document, reply, forwarded, system, call_event, friend_accepted
    reply_to_message_id uuid references public.messages on delete set null,
    forwarded_from_message_id uuid references public.messages on delete set null,
    media_file_id uuid, -- linked to media_files table (added later to avoid circular references)
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    deleted_at timestamptz, -- soft delete timestamp
    deleted_for_everyone boolean default false
);

-- Message reactions
create table public.message_reactions (
    id uuid default uuid_generate_v4() primary key,
    message_id uuid references public.messages on delete cascade not null,
    user_id uuid references public.profiles on delete cascade not null,
    reaction text not null, -- emoji character
    created_at timestamptz not null default now(),
    unique(message_id, user_id)
);

-- Message receipts
create table public.message_receipts (
    id uuid default uuid_generate_v4() primary key,
    message_id uuid references public.messages on delete cascade not null,
    user_id uuid references public.profiles on delete cascade not null,
    status text not null default 'sent', -- sent, delivered, read
    updated_at timestamptz not null default now(),
    unique(message_id, user_id)
);

-- Pinned chats
create table public.pinned_chats (
    user_id uuid references public.profiles on delete cascade not null,
    chat_id uuid references public.chats on delete cascade not null,
    created_at timestamptz not null default now(),
    primary key(user_id, chat_id)
);

-- Archived chats
create table public.archived_chats (
    user_id uuid references public.profiles on delete cascade not null,
    chat_id uuid references public.chats on delete cascade not null,
    created_at timestamptz not null default now(),
    primary key(user_id, chat_id)
);

-- Muted chats
create table public.muted_chats (
    user_id uuid references public.profiles on delete cascade not null,
    chat_id uuid references public.chats on delete cascade not null,
    mute_until timestamptz, -- null means forever
    created_at timestamptz not null default now(),
    primary key(user_id, chat_id)
);

-- ==========================================
-- 4. GROUPS
-- ==========================================

-- Groups table
create table public.groups (
    chat_id uuid references public.chats on delete cascade primary key,
    name text not null,
    description text,
    group_image_url text,
    owner_id uuid references public.profiles on delete set null not null,
    invite_token uuid default uuid_generate_v4() unique not null,
    max_members integer not null default 500,
    created_at timestamptz not null default now()
);

-- Group invites
create table public.group_invites (
    id uuid default uuid_generate_v4() primary key,
    group_id uuid references public.groups on delete cascade not null,
    inviter_id uuid references public.profiles on delete cascade not null,
    invitee_id uuid references public.profiles on delete cascade not null,
    status text not null default 'pending', -- pending, accepted, declined, expired
    created_at timestamptz not null default now(),
    expires_at timestamptz not null,
    unique(group_id, invitee_id)
);

-- ==========================================
-- 5. COMMUNITIES
-- ==========================================

-- Communities table
create table public.communities (
    id uuid default uuid_generate_v4() primary key,
    name text not null,
    description text,
    cover_image_url text,
    owner_id uuid references public.profiles on delete set null not null,
    invite_token uuid default uuid_generate_v4() unique not null,
    announcement_chat_id uuid references public.chats on delete set null,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

-- Community members
create table public.community_members (
    id uuid default uuid_generate_v4() primary key,
    community_id uuid references public.communities on delete cascade not null,
    user_id uuid references public.profiles on delete cascade not null,
    role text not null default 'member', -- member, moderator, admin, owner
    joined_at timestamptz not null default now(),
    unique(community_id, user_id)
);

-- Community linked groups
create table public.community_groups (
    community_id uuid references public.communities on delete cascade not null,
    group_chat_id uuid references public.chats on delete cascade not null,
    linked_at timestamptz not null default now(),
    primary key(community_id, group_chat_id)
);

-- Community invites
create table public.community_invites (
    id uuid default uuid_generate_v4() primary key,
    community_id uuid references public.communities on delete cascade not null,
    inviter_id uuid references public.profiles on delete cascade not null,
    invitee_id uuid references public.profiles on delete cascade not null,
    status text not null default 'pending', -- pending, accepted, declined
    created_at timestamptz not null default now(),
    expires_at timestamptz not null,
    unique(community_id, invitee_id)
);

-- ==========================================
-- 6. CALLS SYSTEM
-- ==========================================

-- Calls table
create table public.calls (
    id uuid default uuid_generate_v4() primary key,
    channel_name text not null unique, -- Agora channel name
    type text not null, -- audio, video, group_room
    status text not null default 'ringing', -- ringing, connected, completed, missed, declined
    host_id uuid references public.profiles on delete cascade not null,
    chat_id uuid references public.chats on delete cascade,
    created_at timestamptz not null default now(),
    ended_at timestamptz
);

-- Call participants
create table public.call_participants (
    id uuid default uuid_generate_v4() primary key,
    call_id uuid references public.calls on delete cascade not null,
    user_id uuid references public.profiles on delete cascade not null,
    joined_at timestamptz,
    left_at timestamptz,
    status text not null default 'invited', -- invited, ringing, accepted, declined, left
    unique(call_id, user_id)
);

-- Call events (state history logs)
create table public.call_events (
    id uuid default uuid_generate_v4() primary key,
    call_id uuid references public.calls on delete cascade not null,
    user_id uuid references public.profiles on delete cascade,
    event_type text not null, -- ringing, accepted, declined, muted, camera_off, left, ended
    created_at timestamptz not null default now()
);

-- ==========================================
-- 7. MEDIA FILES
-- ==========================================

-- Media Files (Cloudflare R2 metadata)
create table public.media_files (
    id uuid default uuid_generate_v4() primary key,
    uploader_id uuid references public.profiles on delete cascade not null,
    r2_key text not null unique, -- key in Cloudflare R2 bucket
    file_name text not null,
    file_size integer not null, -- in bytes
    mime_type text not null,
    created_at timestamptz not null default now()
);

-- Alter messages to link to media_files now that it is created
alter table public.messages add constraint fk_media_file foreign key (media_file_id) references public.media_files(id) on delete set null;

-- Media uploads tracking
create table public.media_uploads (
    id uuid default uuid_generate_v4() primary key,
    uploader_id uuid references public.profiles on delete cascade not null,
    r2_key text not null unique,
    status text not null default 'pending', -- pending, uploaded, orphaned, cleaned
    expires_at timestamptz not null, -- expiry for cleanup
    created_at timestamptz not null default now()
);

-- Media downloads logs
create table public.media_downloads (
    id uuid default uuid_generate_v4() primary key,
    user_id uuid references public.profiles on delete cascade not null,
    media_file_id uuid references public.media_files on delete cascade not null,
    created_at timestamptz not null default now()
);

-- Media audit trail
create table public.media_audit (
    id uuid default uuid_generate_v4() primary key,
    action_type text not null, -- uploaded, downloaded, deleted_by_admin, cleaned_orphan
    actor_id uuid references public.profiles on delete set null,
    r2_key text not null,
    file_name text,
    created_at timestamptz not null default now()
);

-- ==========================================
-- 8. NOTIFICATIONS SYSTEM
-- ==========================================

-- Notifications
create table public.notifications (
    id uuid default uuid_generate_v4() primary key,
    user_id uuid references public.profiles on delete cascade not null,
    sender_id uuid references public.profiles on delete cascade,
    type text not null, -- friend_request, friend_accepted, direct_message, group_message, announcement, incoming_call, mention, admin_warning
    title text not null,
    body text not null,
    chat_id uuid references public.chats on delete cascade,
    source_id uuid, -- reference to friend_request_id, message_id, call_id, etc.
    is_read boolean not null default false,
    created_at timestamptz not null default now()
);

-- Notification preferences per user
create table public.notification_preferences (
    user_id uuid references public.profiles on delete cascade primary key,
    global_enabled boolean not null default true,
    friend_requests_enabled boolean not null default true,
    direct_chats_enabled boolean not null default true,
    groups_enabled boolean not null default true,
    communities_enabled boolean not null default true,
    calls_enabled boolean not null default true,
    announcements_enabled boolean not null default true,
    notification_sound text not null default 'default.mp3',
    updated_at timestamptz not null default now()
);

-- Announcement deliveries
create table public.announcement_deliveries (
    id uuid default uuid_generate_v4() primary key,
    announcement_id uuid not null, -- references admin_announcements (defined below)
    user_id uuid references public.profiles on delete cascade not null,
    delivered_at timestamptz not null default now(),
    read_at timestamptz,
    unique(announcement_id, user_id)
);

-- ==========================================
-- 9. MODERATION
-- ==========================================

-- Reports table
create table public.reports (
    id uuid default uuid_generate_v4() primary key,
    reporter_id uuid references public.profiles on delete cascade not null,
    reported_user_id uuid references public.profiles on delete cascade not null,
    category text not null, -- spam, harassment, scam, fake_account, inappropriate_media, hate_abuse, other
    description text,
    target_type text not null, -- user, message, group, community, media
    target_id uuid not null, -- ID of message, group, community, or profile
    status text not null default 'pending', -- pending, under_review, resolved, dismissed
    resolved_by uuid references public.profiles on delete set null,
    resolved_at timestamptz,
    internal_notes text,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

-- User bans
create table public.user_bans (
    id uuid default uuid_generate_v4() primary key,
    user_id uuid references public.profiles on delete cascade not null,
    banned_by uuid references public.profiles on delete set null not null,
    reason text not null,
    banned_at timestamptz not null default now(),
    expires_at timestamptz, -- null means permanent
    is_active boolean not null default true
);

-- User restrictions (feature-level suspension)
create table public.user_restrictions (
    id uuid default uuid_generate_v4() primary key,
    user_id uuid references public.profiles on delete cascade not null,
    restricted_by uuid references public.profiles on delete set null not null,
    restriction_type text not null, -- friend_requests, messages, audio_calls, video_calls, media_uploads
    reason text not null,
    restricted_at timestamptz not null default now(),
    expires_at timestamptz, -- null means permanent
    is_active boolean not null default true
);

-- Warnings
create table public.warnings (
    id uuid default uuid_generate_v4() primary key,
    user_id uuid references public.profiles on delete cascade not null,
    warned_by uuid references public.profiles on delete set null not null,
    reason text not null,
    warned_at timestamptz not null default now()
);

-- Moderation actions history
create table public.moderation_actions (
    id uuid default uuid_generate_v4() primary key,
    moderator_id uuid references public.profiles on delete set null not null,
    target_user_id uuid references public.profiles on delete cascade not null,
    action_type text not null, -- warn, restrict, ban, unban, delete_message, disable_group
    reason text not null,
    action_metadata jsonb,
    created_at timestamptz not null default now()
);

-- Audit logs
create table public.audit_logs (
    id uuid default uuid_generate_v4() primary key,
    actor_id uuid references public.profiles on delete set null,
    actor_role text not null, -- super_admin, admin, moderator, support_agent
    action text not null,
    ip_address text,
    user_agent text,
    created_at timestamptz not null default now()
);

-- ==========================================
-- 10. ADMIN ROLES AND SETTINGS
-- ==========================================

-- Admin users role mappings
create table public.admin_users (
    user_id uuid references public.profiles on delete cascade primary key,
    role text not null default 'support_agent', -- super_admin, admin, moderator, support_agent
    assigned_by uuid references public.profiles on delete set null,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

-- Platform settings
create table public.platform_settings (
    key text primary key,
    value jsonb not null,
    updated_at timestamptz not null default now()
);

-- Admin announcements
create table public.admin_announcements (
    id uuid default uuid_generate_v4() primary key,
    title text not null,
    content text not null,
    banner_url text,
    audience_type text not null default 'all', -- all, verified, specific_group, specific_community
    audience_target_id uuid, -- target ID if group or community
    push_notification_enabled boolean not null default true,
    scheduled_for timestamptz, -- null means send immediately
    sent_at timestamptz,
    created_by uuid references public.profiles on delete set null not null,
    created_at timestamptz not null default now()
);

-- Announcement deliveries link to admin_announcements
alter table public.announcement_deliveries add constraint fk_announcement foreign key (announcement_id) references public.admin_announcements(id) on delete cascade;

-- Support tickets
create table public.support_tickets (
    id uuid default uuid_generate_v4() primary key,
    user_id uuid references public.profiles on delete cascade not null,
    subject text not null,
    description text not null,
    status text not null default 'open', -- open, in_progress, resolved, closed
    assigned_to uuid references public.admin_users(user_id) on delete set null,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

-- Support ticket messages
create table public.support_ticket_messages (
    id uuid default uuid_generate_v4() primary key,
    ticket_id uuid references public.support_tickets on delete cascade not null,
    sender_id uuid references public.profiles on delete cascade not null,
    message text not null,
    created_at timestamptz not null default now()
);

-- ==========================================
-- 11. PASSWORD RESET OTPs
-- ==========================================

create table public.password_reset_otps (
    id uuid default uuid_generate_v4() primary key,
    email text not null,
    otp_hash text not null,
    expires_at timestamptz not null,
    resend_cooldown_ends_at timestamptz not null,
    attempt_count integer not null default 0,
    max_attempts integer not null default 3,
    is_used boolean not null default false,
    created_at timestamptz not null default now()
);

create table public.password_reset_attempts (
    id uuid default uuid_generate_v4() primary key,
    email text not null,
    ip_address text,
    user_agent text,
    success boolean not null,
    created_at timestamptz not null default now()
);


-- ==========================================
-- INDEXES FOR PERFORMANCE
-- ==========================================
create index idx_profiles_username on public.profiles (username);
create index idx_profiles_email on public.profiles (email);
create index idx_profiles_mobile on public.profiles (mobile_number);
create index idx_messages_chat_id on public.messages (chat_id);
create index idx_messages_sender_id on public.messages (sender_id);
create index idx_messages_created_at on public.messages (created_at desc);
create index idx_chat_members_chat_user on public.chat_members (chat_id, user_id);
create index idx_friendships_users on public.friendships (user_id_1, user_id_2);
create index idx_friend_requests_users on public.friend_requests (sender_id, receiver_id);
create index idx_reports_status on public.reports (status);
create index idx_user_bans_active on public.user_bans (user_id) where is_active = true;
create index idx_user_restrictions_active on public.user_restrictions (user_id) where is_active = true;


-- ==========================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ==========================================

-- Enable RLS on every table
alter table public.profiles enable row level security;
alter table public.profile_privacy_settings enable row level security;
alter table public.user_devices enable row level security;
alter table public.user_presence enable row level security;
alter table public.blocked_users enable row level security;
alter table public.friend_requests enable row level security;
alter table public.friendships enable row level security;
alter table public.friendship_activity enable row level security;
alter table public.chats enable row level security;
alter table public.chat_members enable row level security;
alter table public.messages enable row level security;
alter table public.message_reactions enable row level security;
alter table public.message_receipts enable row level security;
alter table public.pinned_chats enable row level security;
alter table public.archived_chats enable row level security;
alter table public.muted_chats enable row level security;
alter table public.groups enable row level security;
alter table public.group_invites enable row level security;
alter table public.communities enable row level security;
alter table public.community_members enable row level security;
alter table public.community_groups enable row level security;
alter table public.community_invites enable row level security;
alter table public.calls enable row level security;
alter table public.call_participants enable row level security;
alter table public.call_events enable row level security;
alter table public.media_files enable row level security;
alter table public.media_uploads enable row level security;
alter table public.media_downloads enable row level security;
alter table public.notifications enable row level security;
alter table public.notification_preferences enable row level security;
alter table public.announcement_deliveries enable row level security;
alter table public.reports enable row level security;
alter table public.user_bans enable row level security;
alter table public.user_restrictions enable row level security;
alter table public.warnings enable row level security;
alter table public.admin_users enable row level security;
alter table public.platform_settings enable row level security;
alter table public.admin_announcements enable row level security;
alter table public.support_tickets enable row level security;
alter table public.support_ticket_messages enable row level security;


-- 1. Profiles Policies
create policy "Allow public read of profiles based on privacy settings" 
    on public.profiles for select 
    using (
        id = auth.uid() or
        exists (
            select 1 from public.profile_privacy_settings pps 
            where pps.user_id = profiles.id and (
                pps.who_can_see_profile_photo = 'everyone' or
                (pps.who_can_see_profile_photo = 'friends' and exists (
                    select 1 from public.friendships f 
                    where (f.user_id_1 = auth.uid() and f.user_id_2 = profiles.id) or (f.user_id_2 = auth.uid() and f.user_id_1 = profiles.id)
                ))
            )
        )
    );

create policy "Allow users to update own profile" 
    on public.profiles for update 
    using (auth.uid() = id);

-- 2. Privacy Settings Policies
create policy "Allow users to read own privacy settings" 
    on public.profile_privacy_settings for select 
    using (auth.uid() = user_id);

create policy "Allow users to update own privacy settings" 
    on public.profile_privacy_settings for update 
    using (auth.uid() = user_id);

-- 3. Friend Requests Policies
create policy "Allow users to read their own sent/received friend requests" 
    on public.friend_requests for select 
    using (auth.uid() = sender_id or auth.uid() = receiver_id);

create policy "Allow users to insert friend requests as sender" 
    on public.friend_requests for insert 
    with check (auth.uid() = sender_id);

create policy "Allow users to update their own received requests" 
    on public.friend_requests for update 
    using (auth.uid() = receiver_id or auth.uid() = sender_id);

-- 4. Friendships Policies
create policy "Allow users to read friendships they are part of" 
    on public.friendships for select 
    using (auth.uid() = user_id_1 or auth.uid() = user_id_2);

-- 5. Chats Policies
create policy "Allow users to select chats they are member of" 
    on public.chats for select 
    using (
        exists (
            select 1 from public.chat_members cm 
            where cm.chat_id = chats.id and cm.user_id = auth.uid()
        )
    );

-- 6. Chat Members Policies
create policy "Allow chat members to read member list" 
    on public.chat_members for select 
    using (
        exists (
            select 1 from public.chat_members cm 
            where cm.chat_id = chat_members.chat_id and cm.user_id = auth.uid()
        )
    );

create policy "Allow owners/admins of groups to manage members" 
    on public.chat_members for insert 
    with check (
        exists (
            select 1 from public.chat_members cm 
            where cm.chat_id = chat_members.chat_id and cm.user_id = auth.uid() and cm.role in ('owner', 'admin')
        )
    );

-- 7. Messages Policies
create policy "Allow chat members to read messages" 
    on public.messages for select 
    using (
        exists (
            select 1 from public.chat_members cm 
            where cm.chat_id = messages.chat_id and cm.user_id = auth.uid()
        )
    );

create policy "Allow chat members to insert messages" 
    on public.messages for insert 
    with check (
        exists (
            select 1 from public.chat_members cm 
            where cm.chat_id = messages.chat_id and cm.user_id = auth.uid()
        ) and not exists (
            select 1 from public.user_restrictions ur
            where ur.user_id = auth.uid() and ur.restriction_type = 'messages' and ur.is_active = true
        )
    );

create policy "Allow sender to update own messages" 
    on public.messages for update 
    using (auth.uid() = sender_id);

-- 8. Admin Policies (Super Admin, Admin, Moderator, Support Agent roles restriction)
create policy "Restrict admin tables to verified admin users"
    on public.admin_users for select
    using (
        exists (
            select 1 from public.admin_users au 
            where au.user_id = auth.uid() and au.role in ('super_admin', 'admin')
        )
    );


-- ==========================================
-- TRIGGERS AND FUNCTIONS
-- ==========================================

-- Automatically create profile and privacy settings when a user signs up
create or replace function public.handle_new_user()
returns trigger as $$
declare
    v_username text;
    v_full_name text;
begin
    -- Generate unique username from email if not provided in metadata
    v_username := coalesce(new.raw_user_meta_data->>'username', split_part(new.email, '@', 1) || '_' || substring(md5(random()::text) from 1 for 5));
    v_full_name := coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1));

    -- Insert into profiles
    insert into public.profiles (id, full_name, username, email, account_status)
    values (new.id, v_full_name, v_username, new.email, 'active');

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

create trigger on_auth_user_created
    after insert on auth.users
    for each row execute procedure public.handle_new_user();

-- Trigger to update updated_at timestamp
create or replace function public.trigger_set_timestamp()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger set_profiles_timestamp before update on public.profiles for each row execute procedure public.trigger_set_timestamp();
create trigger set_privacy_timestamp before update on public.profile_privacy_settings for each row execute procedure public.trigger_set_timestamp();
create trigger set_chats_timestamp before update on public.chats for each row execute procedure public.trigger_set_timestamp();
create trigger set_messages_timestamp before update on public.messages for each row execute procedure public.trigger_set_timestamp();
