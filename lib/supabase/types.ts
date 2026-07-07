export interface Profile {
  id: string
  full_name: string
  username: string
  email: string
  mobile_number?: string
  country_code?: string
  profile_photo_url?: string
  bio?: string
  verification_status: 'verified' | 'unverified' | 'partner'
  account_status: 'active' | 'suspended' | 'restricted' | 'banned'
  created_at: string
  updated_at: string
  last_seen_at: string
}

export interface ProfilePrivacySettings {
  user_id: string
  who_can_find_by_name: 'everyone' | 'friends_of_friends' | 'friends' | 'nobody'
  who_can_find_by_username: 'everyone' | 'friends_of_friends' | 'friends' | 'nobody'
  who_can_find_by_email: 'everyone' | 'friends_of_friends' | 'friends' | 'nobody'
  who_can_find_by_mobile: 'everyone' | 'friends_of_friends' | 'friends' | 'nobody'
  who_can_send_friend_request: 'everyone' | 'friends_of_friends' | 'friends' | 'nobody'
  who_can_see_profile_photo: 'everyone' | 'friends' | 'nobody'
  who_can_see_last_seen: 'everyone' | 'friends' | 'nobody'
  who_can_see_online_status: 'everyone' | 'friends' | 'nobody'
  read_receipts_enabled: boolean
  group_invite_permission: 'everyone' | 'friends' | 'nobody'
  updated_at: string
}

export interface Chat {
  id: string
  type: 'direct' | 'group' | 'community_channel'
  title?: string
  description?: string
  cover_photo_url?: string
  created_by?: string
  created_at: string
  updated_at: string
  // Computed values
  partner?: Profile
  unread_count?: number
  last_message?: Message
}

export interface ChatMember {
  id: string
  chat_id: string
  user_id: string
  joined_at: string
  role: 'member' | 'moderator' | 'admin' | 'owner'
  profile?: Profile
}

export interface Message {
  id: string
  chat_id: string
  sender_id: string
  content: string
  message_type: 'text' | 'image' | 'video' | 'voice_note' | 'document' | 'reply' | 'forwarded' | 'system' | 'call_event' | 'friend_accepted'
  reply_to_message_id?: string
  forwarded_from_message_id?: string
  media_file_id?: string
  created_at: string
  updated_at: string
  deleted_at?: string
  deleted_for_everyone: boolean
  // Populated values
  sender?: Profile
  media_file?: MediaFile
}

export interface FriendRequest {
  id: string
  sender_id: string
  receiver_id: string
  status: 'pending' | 'accepted' | 'declined' | 'cancelled' | 'blocked' | 'expired'
  request_message?: string
  created_at: string
  updated_at: string
  sender?: Profile
  receiver?: Profile
}

export interface Friendship {
  id: string
  user_id_1: string
  user_id_2: string
  created_at: string
  friend_profile?: Profile
}

export interface Call {
  id: string
  channel_name: string
  type: 'audio' | 'video' | 'group_room'
  status: 'ringing' | 'connected' | 'completed' | 'missed' | 'declined'
  host_id: string
  chat_id?: string
  created_at: string
  ended_at?: string
}

export interface MediaFile {
  id: string
  uploader_id: string
  r2_key: string
  file_name: string
  file_size: number
  mime_type: string
  created_at: string
}

export interface UserPresence {
  user_id: string
  is_online: boolean
  last_active_at: string
  updated_at: string
}

export interface AdminUser {
  user_id: string
  role: 'super_admin' | 'admin' | 'moderator' | 'support_agent'
  assigned_by?: string
  created_at: string
  updated_at: string
}

export interface Report {
  id: string
  reporter_id: string
  reported_user_id: string
  category: 'spam' | 'harassment' | 'scam' | 'fake_account' | 'inappropriate_media' | 'hate_abuse' | 'other'
  description?: string
  target_type: 'user' | 'message' | 'group' | 'community' | 'media'
  target_id: string
  status: 'pending' | 'under_review' | 'resolved' | 'dismissed'
  resolved_by?: string
  resolved_at?: string
  internal_notes?: string
  created_at: string
  updated_at: string
  reporter?: Profile
  reported_user?: Profile
}
