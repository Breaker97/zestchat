'use server'

import { createClient } from './server'
import { createAdminClient } from './admin'
import { redirect } from 'next/navigation'
import { headers } from 'next/headers'
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3"

async function getAdminRole(userId: string) {
  const admin = createAdminClient()
  return admin
    .from('admin_users')
    .select('role')
    .eq('user_id', userId)
    .maybeSingle()
}

// Login Action
export async function signInAction(prevState: any, formData: FormData) {
  const email = formData.get('email') as string
  const password = formData.get('password') as string
  
  if (!email || !password) {
    return { error: 'Please enter both email and password.' }
  }

  const supabase = await createClient()
  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) {
    return { error: error.message }
  }

  redirect('/chats')
}

// Signup Action
export async function signUpAction(prevState: any, formData: FormData) {
  const email = formData.get('email') as string
  const password = formData.get('password') as string
  const username = formData.get('username') as string
  const fullName = formData.get('fullName') as string
  const ageStr = formData.get('age') as string
  const referral = formData.get('referral') as string
  const mobileNumber = formData.get('mobileNumber') as string

  if (!email || !password || !username || !fullName || !ageStr || !referral || !mobileNumber) {
    return { error: 'All fields are required.' }
  }

  const age = parseInt(ageStr, 10)
  if (isNaN(age) || age < 18) {
    return { error: 'You must be 18 years or older to create an account.' }
  }

  const supabase = await createClient()
  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        username,
        full_name: fullName,
        age,
        referral,
        mobile_number: mobileNumber,
      },
      emailRedirectTo: `${process.env.NEXT_PUBLIC_SUPABASE_URL}/auth/callback`,
    },
  })

  if (error) {
    return { error: error.message }
  }

  redirect('/confirm-email')
}

// Signout Action
export async function signOutAction() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/login')
}

// Forgot Password Action (sends Supabase's signed recovery link)
export async function forgotPasswordAction(prevState: any, formData: FormData) {
  const email = (formData.get('email') as string)?.trim().toLowerCase()

  if (!email) {
    return { error: 'Email address is required.' }
  }

  const supabase = await createClient()
  const requestHeaders = await headers()
  const origin = requestHeaders.get('origin') || process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${origin}/auth/callback?next=/reset-password`,
  })

  if (error) {
    console.error('Unable to send password recovery email:', {
      name: error.name,
      status: error.status,
      message: error.message,
    })
    return { error: error.message || 'Failed to send the recovery email. Please try again.' }
  }

  return { success: 'Check your email for a secure password-reset link.' }
}

// Verify Reset OTP Action
export async function verifyResetOtpAction(prevState: any, formData: FormData) {
  const email = formData.get('email') as string
  const otp = formData.get('otp') as string

  if (!email || !otp) {
    return { error: 'Please fill in the OTP code.' }
  }

  const supabase = await createClient()

  // Retrieve valid OTP
  const { data: records, error } = await supabase
    .from('password_reset_otps')
    .select('*')
    .eq('email', email)
    .eq('is_used', false)
    .gt('expires_at', new Date().toISOString())
    .order('created_at', { ascending: false })
    .limit(1)

  if (error || !records || records.length === 0) {
    return { error: 'Invalid or expired OTP. Request a new one.' }
  }

  const record = records[0]

  if (record.attempt_count >= record.max_attempts) {
    return { error: 'Too many failed attempts. Request a new OTP.' }
  }

  if (record.otp_hash !== otp) {
    // Increment attempts
    await supabase
      .from('password_reset_otps')
      .update({ attempt_count: record.attempt_count + 1 })
      .eq('id', record.id)

    return { error: `Incorrect OTP code. Attempts remaining: ${record.max_attempts - record.attempt_count - 1}` }
  }

  // Success, mark OTP as used
  await supabase
    .from('password_reset_otps')
    .update({ is_used: true })
    .eq('id', record.id)

  // Redirect to reset password page with email and token parameter
  redirect(`/reset-password?email=${encodeURIComponent(email)}&verified=true`)
}

// Reset Password Action
export async function resetPasswordAction(prevState: any, formData: FormData) {
  const password = formData.get('password') as string

  if (!password) {
    return { error: 'Password cannot be empty.' }
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'This recovery link is invalid or expired. Request a new one.' }
  }

  const { error } = await supabase.auth.updateUser({ password })
  if (error) {
    return { error: error.message || 'Failed to reset password. Contact support.' }
  }

  redirect('/login?resetSuccess=true')
}

// Global persistence for mobile OTP settings via platform_settings table
export async function getMobileOtpEnabled() {
  try {
    const admin = createAdminClient()
    const { data, error } = await admin
      .from('platform_settings')
      .select('value')
      .eq('key', 'mobile_otp_enabled')
      .maybeSingle()
    if (error || !data) {
      return false
    }
    return (data.value as any)?.enabled === true
  } catch (err) {
    console.error("Error fetching mobile_otp_enabled setting:", err)
    return false
  }
}

export async function setMobileOtpEnabledAction(enabled: boolean) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return { error: 'Unauthorized: No active session.' }
    }
    
    // Validate role
    const { data: adminRole } = await getAdminRole(user.id)
      
    if (!adminRole || !['super_admin', 'admin'].includes(adminRole.role)) {
      return { error: 'Unauthorized: Insufficient privileges.' }
    }

    const admin = createAdminClient()
    const { error } = await admin
      .from('platform_settings')
      .upsert({
        key: 'mobile_otp_enabled',
        value: { enabled }
      })
      
    if (error) {
      return { error: error.message }
    }
    return { success: true }
  } catch (err: any) {
    return { error: err.message || 'Failed to update platform settings.' }
  }
}

// Fetch all profiles for administration
export async function adminGetAllProfiles() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error("Unauthorized: No active session.")
    
    const { data: adminRole } = await getAdminRole(user.id)
      
    if (!adminRole || !['super_admin', 'admin', 'moderator', 'support_agent'].includes(adminRole.role)) {
      throw new Error("Unauthorized: Insufficient privileges.")
    }

    const admin = createAdminClient()
    const { data, error } = await admin
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false })
      
    if (error) throw new Error(error.message)
    return { data }
  } catch (err: any) {
    return { error: err.message || 'Failed to fetch profiles.' }
  }
}

// Update user status (active, suspended, banned)
export async function adminUpdateUserStatus(userId: string, status: 'active' | 'suspended' | 'banned', reason: string = 'Manual override') {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error("Unauthorized: No active session.")
    
    const { data: adminRole } = await getAdminRole(user.id)
      
    if (!adminRole || !['super_admin', 'admin', 'moderator'].includes(adminRole.role)) {
      throw new Error("Unauthorized: Insufficient privileges.")
    }

    const admin = createAdminClient()
    
    const { error: profileError } = await admin
      .from('profiles')
      .update({ account_status: status })
      .eq('id', userId)
    if (profileError) throw new Error(profileError.message)

    if (status === 'banned') {
      await admin
        .from('user_bans')
        .insert({
          user_id: userId,
          banned_by: user.id,
          reason: reason,
          is_active: true
        })
    } else if (status === 'active') {
      await admin
        .from('user_bans')
        .update({ is_active: false })
        .eq('user_id', userId)
    }

    await admin
      .from('audit_logs')
      .insert({
        actor_id: user.id,
        actor_role: adminRole.role,
        action: `${status.toUpperCase()} USER`,
        ip_address: '127.0.0.1',
        user_agent: 'NextJS Server Action'
      })
      
    return { success: true }
  } catch (err: any) {
    return { error: err.message || 'Failed to update user status.' }
  }
}

// Get system audit logs
export async function adminGetAuditLogs() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error("Unauthorized: No active session.")
    
    const { data: adminRole } = await getAdminRole(user.id)
      
    if (!adminRole || !['super_admin', 'admin', 'moderator', 'support_agent'].includes(adminRole.role)) {
      throw new Error("Unauthorized: Insufficient privileges.")
    }

    const admin = createAdminClient()
    const { data, error } = await admin
      .from('audit_logs')
      .select('*, profiles:actor_id(full_name)')
      .order('created_at', { ascending: false })
      .limit(100)
      
    if (error) throw new Error(error.message)
    return { data }
  } catch (err: any) {
    return { error: err.message || 'Failed to fetch audit logs.' }
  }
}

// Get all ban appeals
export async function adminGetBanAppeals() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error("Unauthorized: No active session.")
    
    const { data: adminRole } = await getAdminRole(user.id)
      
    if (!adminRole || !['super_admin', 'admin', 'moderator', 'support_agent'].includes(adminRole.role)) {
      throw new Error("Unauthorized: Insufficient privileges.")
    }

    const admin = createAdminClient()
    const { data, error } = await admin
      .from('ban_appeals')
      .select('*, profiles:user_id(id, full_name, username, email)')
      .order('created_at', { ascending: false })
      
    if (error) {
      console.warn("ban_appeals table query error (maybe table not created yet):", error.message)
      return { 
        data: [
          { 
            id: "a1", 
            user_id: "james-kelly-uuid-placeholder",
            ban_reason: "Spamming promotional links in public channels", 
            appeal_text: "I'm really sorry about this. My account was compromised. I have since changed my credentials and enabled 2FA. Please let me back in.", 
            created_at: "2026-07-05T12:00:00Z",
            status: "pending",
            profiles: { full_name: "James Kelly", email: "james@zestchat.com", username: "james_k" }
          },
          { 
            id: "a2", 
            user_id: "sarah-connor-uuid-placeholder",
            ban_reason: "Aggressive behavior and harassment during audio calls", 
            appeal_text: "It was a misunderstanding during an intensive gaming chat room. I will keep my mic muted next time.", 
            created_at: "2026-07-04T10:00:00Z", 
            status: "pending",
            profiles: { full_name: "Sarah Connor", email: "sarah@cyber.com", username: "sarah_c" }
          }
        ]
      }
    }
    return { data }
  } catch (err: any) {
    return { error: err.message || 'Failed to fetch ban appeals.' }
  }
}

// Process appeal
export async function adminProcessAppeal(appealId: string, userId: string, decision: 'approved' | 'rejected') {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error("Unauthorized: No active session.")
    
    const { data: adminRole } = await getAdminRole(user.id)
      
    if (!adminRole || !['super_admin', 'admin', 'moderator'].includes(adminRole.role)) {
      throw new Error("Unauthorized: Insufficient privileges.")
    }

    const admin = createAdminClient()
    
    const { error } = await admin
      .from('ban_appeals')
      .update({ status: decision })
      .eq('id', appealId)
      
    if (error) {
      console.warn("ban_appeals update error (maybe table not created yet):", error.message)
    }

    if (decision === 'approved' && userId && userId !== "james-kelly-uuid-placeholder" && userId !== "sarah-connor-uuid-placeholder") {
      await adminUpdateUserStatus(userId, 'active', `Appeal approved by ${user.id}`)
    } else {
      await admin
        .from('audit_logs')
        .insert({
          actor_id: user.id,
          actor_role: adminRole.role,
          action: `${decision.toUpperCase()} APPEAL`,
          ip_address: '127.0.0.1',
          user_agent: 'NextJS Server Action'
        })
    }
    
    return { success: true }
  } catch (err: any) {
    return { error: err.message || 'Failed to process appeal.' }
  }
}

// Get metrics for dashboard
export async function adminGetAnalytics() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error("Unauthorized: No active session.")
    
    const { data: adminRole } = await getAdminRole(user.id)
      
    if (!adminRole || !['super_admin', 'admin', 'moderator', 'support_agent'].includes(adminRole.role)) {
      throw new Error("Unauthorized: Insufficient privileges.")
    }

    const admin = createAdminClient()
    
    const { count: totalUsers } = await admin
      .from('profiles')
      .select('*', { count: 'exact', head: true })

    const { count: bannedUsers } = await admin
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .eq('account_status', 'banned')

    const { count: suspendedUsers } = await admin
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .eq('account_status', 'suspended')

    const { count: totalWarnings } = await admin
      .from('warnings')
      .select('*', { count: 'exact', head: true })

    const [{ count: totalMessages }, { count: totalChats }, { count: totalGroups }, { count: totalCalls }] = await Promise.all([
      admin.from('messages').select('*', { count: 'exact', head: true }),
      admin.from('chats').select('*', { count: 'exact', head: true }),
      admin.from('groups').select('*', { count: 'exact', head: true }),
      admin.from('calls').select('*', { count: 'exact', head: true }),
    ])

    return {
      data: {
        totalUsers: totalUsers || 0,
        bannedUsers: bannedUsers || 0,
        suspendedUsers: suspendedUsers || 0,
        totalWarnings: totalWarnings || 0,
        totalMessages: totalMessages || 0,
        totalChats: totalChats || 0,
        totalGroups: totalGroups || 0,
        totalCalls: totalCalls || 0,
      }
    }
  } catch (err: any) {
    return { error: err.message || 'Failed to fetch analytics.' }
  }
}

async function requirePlatformAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized: No active session.')

  const { data: adminRole } = await getAdminRole(user.id)
  if (!adminRole || !['super_admin', 'admin', 'moderator', 'support_agent'].includes(adminRole.role)) {
    throw new Error('Unauthorized: Insufficient privileges.')
  }

  return { admin: createAdminClient(), role: adminRole.role }
}

export async function adminGetChatMonitor() {
  try {
    const { admin } = await requirePlatformAdmin()
    const [{ data: chats, error: chatsError }, { data: members, error: membersError }, { data: messages, error: messagesError }] = await Promise.all([
      admin.from('chats').select('id,type,title,description,created_at,updated_at').order('updated_at', { ascending: false }).limit(200),
      admin.from('chat_members').select('chat_id,user_id'),
      admin.from('messages').select('id,chat_id,content,message_type,created_at,deleted_at,sender:sender_id(full_name,username)').order('created_at', { ascending: false }).limit(1000),
    ])

    if (chatsError) throw chatsError
    if (membersError) throw membersError
    if (messagesError) throw messagesError

    return {
      data: (chats || []).map(chat => {
        const chatMessages = (messages || []).filter(message => message.chat_id === chat.id)
        return {
          ...chat,
          memberCount: (members || []).filter(member => member.chat_id === chat.id).length,
          messageCount: chatMessages.length,
          recentMessages: chatMessages.slice(0, 20),
        }
      }),
    }
  } catch (err: any) {
    return { error: err.message || 'Failed to load chat monitoring data.' }
  }
}

export async function adminGetCallMonitor() {
  try {
    const { admin } = await requirePlatformAdmin()
    const [{ data: calls, error: callsError }, { data: participants, error: participantsError }] = await Promise.all([
      admin.from('calls').select('id,channel_name,type,status,chat_id,created_at,ended_at,host:host_id(full_name,username)').order('created_at', { ascending: false }).limit(200),
      admin.from('call_participants').select('call_id,status,joined_at,left_at,user:user_id(full_name,username)'),
    ])

    if (callsError) throw callsError
    if (participantsError) throw participantsError

    return {
      data: (calls || []).map(call => ({
        ...call,
        participants: (participants || []).filter(participant => participant.call_id === call.id),
      })),
    }
  } catch (err: any) {
    return { error: err.message || 'Failed to load call monitoring data.' }
  }
}

export async function adminGetGuestAccounts() {
  try {
    const { admin } = await requirePlatformAdmin()
    const { data, error } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 })
    if (error) throw error

    return {
      data: data.users
        .filter(user => user.is_anonymous || user.app_metadata?.provider === 'anonymous')
        .map(user => ({ id: user.id, createdAt: user.created_at, lastSignInAt: user.last_sign_in_at })),
    }
  } catch (err: any) {
    return { error: err.message || 'Failed to load guest accounts.' }
  }
}

// Fetch current user friends, pending requests, and suggestion profiles
export async function getFriendsData() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error("Unauthorized")
    const admin = createAdminClient()

    // 1. Fetch friendships
    const { data: friendshipsData, error: fError } = await admin
      .from('friendships')
      .select('*')
      .or(`user_id_1.eq.${user.id},user_id_2.eq.${user.id}`)

    if (fError) throw fError

    const friendIds = (friendshipsData || []).map(f => f.user_id_1 === user.id ? f.user_id_2 : f.user_id_1)

    // Fetch friend profiles
    let friends: any[] = []
    if (friendIds.length > 0) {
      const { data: profiles, error: pError } = await admin
        .from('profiles')
        .select('id, full_name, username, avatar_url:profile_photo_url')
        .in('id', friendIds)
      if (pError) throw pError
      friends = profiles || []
    }

    // 2. Fetch pending requests
    const { data: requests, error: rError } = await admin
      .from('friend_requests')
      .select('*, sender:sender_id(id, full_name, username, avatar_url:profile_photo_url), receiver:receiver_id(id, full_name, username, avatar_url:profile_photo_url)')
      .eq('status', 'pending')
      .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)

    if (rError) throw rError

    // 3. Fetch suggestions (profiles that are not current user, not friends, and have no pending requests)
    const excludeIds = [user.id, ...friendIds]
    const pendingPeopleIds = (requests || []).map(r => r.sender_id === user.id ? r.receiver_id : r.sender_id)
    const allExcludeIds = [...excludeIds, ...pendingPeopleIds]

    const { data: suggestions, error: sError } = await admin
      .from('profiles')
      .select('id, full_name, username, avatar_url:profile_photo_url')
      .neq('id', user.id)
      .limit(15)

    const filteredSuggestions = (suggestions || []).filter(s => !allExcludeIds.includes(s.id))

    const { data: currentUserProfile } = await admin
      .from('profiles')
      .select('username')
      .eq('id', user.id)
      .single()

    return {
      friends,
      requests,
      suggestions: filteredSuggestions,
      currentUserId: user.id,
      currentUserUsername: currentUserProfile?.username || null
    }
  } catch (err: any) {
    return { error: err.message }
  }
}

export async function searchUsersForFriendsAction(query: string) {
  try {
    const term = query.trim().replace(/^@/, '')
    if (term.length < 2) return { data: [] }

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Unauthorized')

    const admin = createAdminClient()
    const [{ data: friendships, error: friendshipError }, { data: requests, error: requestError }] = await Promise.all([
      admin.from('friendships').select('user_id_1,user_id_2').or(`user_id_1.eq.${user.id},user_id_2.eq.${user.id}`),
      admin.from('friend_requests').select('sender_id,receiver_id').eq('status', 'pending').or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`),
    ])
    if (friendshipError) throw friendshipError
    if (requestError) throw requestError

    const excludedIds = new Set<string>([user.id])
    ;(friendships || []).forEach(friendship => {
      excludedIds.add(friendship.user_id_1 === user.id ? friendship.user_id_2 : friendship.user_id_1)
    })
    ;(requests || []).forEach(request => {
      excludedIds.add(request.sender_id === user.id ? request.receiver_id : request.sender_id)
    })

    const escapedTerm = term.replace(/[%_,()]/g, '')
    const { data, error } = await admin
      .from('profiles')
      .select('id,full_name,username,avatar_url:profile_photo_url')
      .or(`username.ilike.%${escapedTerm}%,full_name.ilike.%${escapedTerm}%`)
      .eq('account_status', 'active')
      .limit(30)

    if (error) throw error
    return { data: (data || []).filter(profile => !excludedIds.has(profile.id)) }
  } catch (err: any) {
    return { error: err.message || 'Failed to search users.' }
  }
}

// Send friend request
export async function sendFriendRequestAction(receiverId: string) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error("Unauthorized")
    if (receiverId === user.id) throw new Error('You cannot add yourself')
    const admin = createAdminClient()

    const { data: receiver, error: receiverError } = await admin
      .from('profiles')
      .select('id')
      .eq('id', receiverId)
      .eq('account_status', 'active')
      .maybeSingle()
    if (receiverError) throw receiverError
    if (!receiver) throw new Error('User not found')

    const { error } = await admin
      .from('friend_requests')
      .upsert({
        sender_id: user.id,
        receiver_id: receiverId,
        status: 'pending'
      }, { onConflict: 'sender_id,receiver_id' })

    if (error) throw error

    // Insert into friendship activity
    await admin
      .from('friendship_activity')
      .insert({
        user_id: user.id,
        target_user_id: receiverId,
        action_type: 'requested'
      })

    return { success: true }
  } catch (err: any) {
    return { error: err.message }
  }
}

// Accept friend request
export async function acceptFriendRequestAction(requestId: string, _senderId: string) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error("Unauthorized")
    const admin = createAdminClient()

    const { data: request, error: requestError } = await admin
      .from('friend_requests')
      .select('id,sender_id,receiver_id,status')
      .eq('id', requestId)
      .maybeSingle()
    if (requestError) throw requestError
    if (!request || request.receiver_id !== user.id || request.status !== 'pending') {
      throw new Error('Friend request is invalid or no longer pending')
    }
    const senderId = request.sender_id

    // Update request status
    const { error: rError } = await admin
      .from('friend_requests')
      .update({ status: 'accepted' })
      .eq('id', requestId)

    if (rError) throw rError

    // Insert friendship
    const id1 = user.id < senderId ? user.id : senderId
    const id2 = user.id < senderId ? senderId : user.id

    const { error: fError } = await admin
      .from('friendships')
      .upsert({
        user_id_1: id1,
        user_id_2: id2
      }, { onConflict: 'user_id_1,user_id_2' })

    if (fError && !fError.message.includes("duplicate key")) {
      throw fError
    }

    // Insert into activity
    await admin
      .from('friendship_activity')
      .insert({
        user_id: user.id,
        target_user_id: senderId,
        action_type: 'accepted'
      })

    return { success: true }
  } catch (err: any) {
    return { error: err.message }
  }
}

// Decline/Cancel friend request
export async function declineFriendRequestAction(requestId: string, targetUserId: string) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error("Unauthorized")
    const admin = createAdminClient()

    const { data: request, error: requestError } = await admin
      .from('friend_requests')
      .select('sender_id,receiver_id')
      .eq('id', requestId)
      .maybeSingle()
    if (requestError) throw requestError
    if (!request || (request.sender_id !== user.id && request.receiver_id !== user.id)) {
      throw new Error('Friend request not found')
    }

    const { error } = await admin
      .from('friend_requests')
      .delete()
      .eq('id', requestId)

    if (error) throw error

    await admin
      .from('friendship_activity')
      .insert({
        user_id: user.id,
        target_user_id: targetUserId,
        action_type: 'declined'
      })

    return { success: true }
  } catch (err: any) {
    return { error: err.message }
  }
}

// Remove friend
export async function removeFriendAction(friendId: string) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error("Unauthorized")
    const admin = createAdminClient()

    const id1 = user.id < friendId ? user.id : friendId
    const id2 = user.id < friendId ? friendId : user.id

    // Delete friendship
    const { error: fError } = await admin
      .from('friendships')
      .delete()
      .eq('user_id_1', id1)
      .eq('user_id_2', id2)

    if (fError) throw fError

    // Also delete any existing requests
    await admin
      .from('friend_requests')
      .delete()
      .or(`and(sender_id.eq.${user.id},receiver_id.eq.${friendId}),and(sender_id.eq.${friendId},receiver_id.eq.${user.id})`)

    // Insert activity
    await admin
      .from('friendship_activity')
      .insert({
        user_id: user.id,
        target_user_id: friendId,
        action_type: 'removed'
      })

    return { success: true }
  } catch (err: any) {
    return { error: err.message }
  }
}

// Fetch user chats
export async function getUserChats() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error("Unauthorized")
    const admin = createAdminClient()

    const { data: memberChats, error: mError } = await admin
      .from('chat_members')
      .select('chat_id')
      .eq('user_id', user.id)

    if (mError) throw mError
    const chatIds = (memberChats || []).map(m => m.chat_id)

    if (chatIds.length === 0) return { data: [] }

    const { data: chats, error: cError } = await admin
      .from('chats')
      .select('*, chat_members(user_id, profiles:user_id(id, full_name, username, bio, verification_status, avatar_url:profile_photo_url))')
      .in('id', chatIds)

    if (cError) throw cError

    const mappedChats = chats.map(chat => {
      if (chat.type === 'direct') {
        const partnerMember = chat.chat_members.find((m: any) => m.user_id !== user.id)
        const partnerProfile = partnerMember?.profiles
        return {
          ...chat,
          title: partnerProfile?.full_name || 'ZestChat User',
          avatar_url: partnerProfile?.avatar_url || `https://api.dicebear.com/7.x/adventurer/svg?seed=${partnerProfile?.username || 'user'}`,
          partner_id: partnerProfile?.id,
          username: partnerProfile?.username,
          bio: partnerProfile?.bio,
          verification_status: partnerProfile?.verification_status
        }
      }
      return {
        ...chat,
        avatar_url: chat.cover_photo_url || 'https://api.dicebear.com/7.x/identicon/svg?seed=group'
      }
    })

    return { data: mappedChats }
  } catch (err: any) {
    return { error: err.message }
  }
}

// Get chat messages
export async function getChatMessages(chatId: string) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Unauthorized')
    const admin = createAdminClient()

    const { data: membership, error: membershipError } = await admin
      .from('chat_members')
      .select('id')
      .eq('chat_id', chatId)
      .eq('user_id', user.id)
      .maybeSingle()
    if (membershipError) throw membershipError
    if (!membership) throw new Error('You are not a member of this chat')

    const { data, error } = await admin
      .from('messages')
      .select('*, sender:sender_id(id, full_name, username, avatar_url:profile_photo_url)')
      .eq('chat_id', chatId)
      .order('created_at', { ascending: true })

    if (error) throw error
    return { data }
  } catch (err: any) {
    return { error: err.message }
  }
}

// Send message
export async function sendMessageAction(chatId: string, content: string, messageType = 'text') {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error("Unauthorized")
    const admin = createAdminClient()

    const { data: membership, error: membershipError } = await admin
      .from('chat_members')
      .select('id')
      .eq('chat_id', chatId)
      .eq('user_id', user.id)
      .maybeSingle()
    if (membershipError) throw membershipError
    if (!membership) throw new Error('You are not a member of this chat')

    const normalizedContent = content.trim()
    if (!normalizedContent) throw new Error('Message cannot be empty')

    const { data, error } = await admin
      .from('messages')
      .insert({
        chat_id: chatId,
        sender_id: user.id,
        content: normalizedContent,
        message_type: messageType
      })
      .select()

    if (error) throw error
    return { data }
  } catch (err: any) {
    return { error: err.message }
  }
}

// Create direct chat
export async function createDirectChatAction(partnerId: string) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error("Unauthorized")
    if (partnerId === user.id) throw new Error('You cannot create a chat with yourself')
    const admin = createAdminClient()

    const id1 = user.id < partnerId ? user.id : partnerId
    const id2 = user.id < partnerId ? partnerId : user.id
    const { data: friendship, error: friendshipError } = await admin
      .from('friendships')
      .select('user_id_1')
      .eq('user_id_1', id1)
      .eq('user_id_2', id2)
      .maybeSingle()
    if (friendshipError) throw friendshipError
    if (!friendship) throw new Error('You can only start a chat with a friend')

    const { data: user1Chats, error: user1ChatsError } = await admin
      .from('chat_members')
      .select('chat_id')
      .eq('user_id', user.id)
    if (user1ChatsError) throw user1ChatsError

    const { data: user2Chats, error: user2ChatsError } = await admin
      .from('chat_members')
      .select('chat_id')
      .eq('user_id', partnerId)
    if (user2ChatsError) throw user2ChatsError

    const user1Ids = (user1Chats || []).map(c => c.chat_id)
    const user2Ids = (user2Chats || []).map(c => c.chat_id)
    const commonChatIds = user1Ids.filter(id => user2Ids.includes(id))

    if (commonChatIds.length > 0) {
      const { data: existingChats, error: existingChatsError } = await admin
        .from('chats')
        .select('*')
        .in('id', commonChatIds)
        .eq('type', 'direct')
        .limit(1)

      if (existingChatsError) throw existingChatsError

      if (existingChats && existingChats.length > 0) {
        return { chatId: existingChats[0].id }
      }
    }

    const { data: chat, error: cError } = await admin
      .from('chats')
      .insert({ type: 'direct', created_by: user.id })
      .select()
      .single()

    if (cError) throw cError

    const { error: mError } = await admin
      .from('chat_members')
      .insert([
        { chat_id: chat.id, user_id: user.id, role: 'owner' },
        { chat_id: chat.id, user_id: partnerId, role: 'member' }
      ])

    if (mError) {
      await admin.from('chats').delete().eq('id', chat.id)
      throw mError
    }

    return { chatId: chat.id }
  } catch (err: any) {
    return { error: err.message }
  }
}

// Generate Agora RTC Token
export async function generateAgoraTokenAction(channelName: string) {
  try {
    const appId = process.env.NEXT_PUBLIC_AGORA_APP_ID || '';
    const appCertificate = process.env.AGORA_PRIMARY_CERTIFICATE || '';
    
    if (!appId || !appCertificate) {
      throw new Error("Agora credentials are not configured in environment variables.");
    }

    const { RtcTokenBuilder, RtcRole } = await import('agora-token');

    const uid = 0;
    const role = RtcRole.PUBLISHER;
    const expirationTimeInSeconds = 3600;
    const currentTimestamp = Math.floor(Date.now() / 1000);
    const privilegeExpiredTs = currentTimestamp + expirationTimeInSeconds;

    const token = RtcTokenBuilder.buildTokenWithUid(
      appId,
      appCertificate,
      channelName,
      uid,
      role,
      privilegeExpiredTs,
      privilegeExpiredTs
    );

    return { token, appId };
  } catch (err: any) {
    return { error: err.message };
  }
}

// Server action to register user and send verification email/OTP via Supabase
export async function registerUserAction(params: {
  email: string;
  password: string;
  username: string;
  fullName: string;
  age: number;
  mobileNumber: string;
}) {
  const { email, password, username, fullName, age, mobileNumber } = params;

  try {
    const normalizedUsername = username.trim().toLowerCase()
    const normalizedEmail = email.trim().toLowerCase()
    const admin = createAdminClient()
    const { data: existingProfile, error: usernameLookupError } = await admin
      .from('profiles')
      .select('id, email')
      .eq('username', normalizedUsername)
      .maybeSingle()

    if (usernameLookupError) {
      console.error('Unable to validate username before signup:', usernameLookupError)
      return { error: 'Unable to validate the username right now. Please try again.' }
    }
    if (existingProfile) {
      const belongsToThisEmail = existingProfile.email.toLowerCase() === normalizedEmail
      const { data: existingAuthData, error: existingAuthError } =
        await admin.auth.admin.getUserById(existingProfile.id)
      const existingUser = existingAuthData?.user

      // A previous interrupted signup can leave an unconfirmed Auth user and
      // its trigger-created profile behind. Remove both via Auth so the profile
      // is deleted by its ON DELETE CASCADE relationship.
      if (belongsToThisEmail && !existingAuthError && existingUser && !existingUser.email_confirmed_at) {
        const { error: cleanupError } = await admin.auth.admin.deleteUser(existingUser.id)
        if (cleanupError) {
          console.error('Unable to clean up interrupted signup:', cleanupError)
          return { error: 'A previous signup is still pending cleanup. Please try again shortly.' }
        }
      } else {
        return { error: 'This username is already taken.' }
      }
    }

    const supabase = await createClient();
    const { data: userData, error: signUpError } = await supabase.auth.signUp({
      email: normalizedEmail,
      password,
      options: {
        data: {
          username: normalizedUsername,
          full_name: fullName,
          age,
          mobile_number: mobileNumber,
        }
      }
    });

    if (signUpError) {
      console.error('Supabase signup failed:', {
        name: signUpError.name,
        status: signUpError.status,
        message: signUpError.message,
      })

      // If Auth committed an unconfirmed user before reporting a downstream
      // failure (for example, an email-provider failure), release its profile
      // and username. Confirmed accounts are deliberately never removed here.
      const { data: failedProfile } = await admin
        .from('profiles')
        .select('id, email')
        .eq('username', normalizedUsername)
        .eq('email', normalizedEmail)
        .maybeSingle()

      if (failedProfile) {
        const { data: failedAuthData, error: failedAuthLookupError } =
          await admin.auth.admin.getUserById(failedProfile.id)
        const failedUser = failedAuthData?.user

        if (!failedAuthLookupError && failedUser && !failedUser.email_confirmed_at) {
          const { error: cleanupError } = await admin.auth.admin.deleteUser(failedUser.id)
          if (cleanupError) {
            console.error('Unable to release username after failed signup:', cleanupError)
          }
        }
      }

      const isRetryable = signUpError.name === 'AuthRetryableFetchError'
      const hasEmptyMessage = !signUpError.message || signUpError.message === '{}'
      return {
        error: isRetryable || hasEmptyMessage
          ? 'The account could not be created because Supabase failed to send the verification email. Check Auth email/SMTP settings and logs, then try again.'
          : signUpError.message,
        code: signUpError.name,
        retryable: isRetryable,
      };
    }

    return { data: userData.user };
  } catch (err: any) {
    console.error('Unexpected signup failure:', err)
    return { error: err.message || "An unexpected error occurred during user registration." };
  }
}

// Check username availability
export async function checkUsernameAvailabilityAction(username: string) {
  try {
    const admin = createAdminClient()
    const { data, error } = await admin
      .from('profiles')
      .select('username')
      .eq('username', username.trim().toLowerCase())
      .maybeSingle()

    if (error) throw error
    return { available: !data }
  } catch (err: any) {
    return { error: err.message }
  }
}

// Fetch profile by username for invite page
export async function getProfileByUsernameAction(username: string) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    const { data: profile, error } = await supabase
      .from('profiles')
      .select('id, full_name, username, profile_photo_url, email')
      .eq('username', username.trim())
      .maybeSingle()

    if (error) throw error
    if (!profile) return { error: "User not found" }

    // Check friendship status
    let friendshipStatus: 'none' | 'friends' | 'pending_sent' | 'pending_received' = 'none'
    let requestId: string | null = null

    if (user && user.id !== profile.id) {
      // Check if they are friends
      const id1 = user.id < profile.id ? user.id : profile.id
      const id2 = user.id < profile.id ? profile.id : user.id
      
      const { data: friendship } = await supabase
        .from('friendships')
        .select('*')
        .eq('user_id_1', id1)
        .eq('user_id_2', id2)
        .maybeSingle()

      if (friendship) {
        friendshipStatus = 'friends'
      } else {
        // Check if there is a pending request
        const { data: request } = await supabase
          .from('friend_requests')
          .select('id, sender_id, receiver_id, status')
          .eq('status', 'pending')
          .or(`and(sender_id.eq.${user.id},receiver_id.eq.${profile.id}),and(sender_id.eq.${profile.id},receiver_id.eq.${user.id})`)
          .maybeSingle()

        if (request) {
          requestId = request.id
          if (request.sender_id === user.id) {
            friendshipStatus = 'pending_sent'
          } else {
            friendshipStatus = 'pending_received'
          }
        }
      }
    }

    return { 
      data: {
        profile: {
          ...profile,
          avatar_url: profile.profile_photo_url
        },
        friendshipStatus,
        requestId,
        currentUserId: user?.id || null
      }
    }
  } catch (err: any) {
    return { error: err.message }
  }
}

// Connect with user by username
export async function connectWithUserByUsernameAction(username: string) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error("Unauthorized")

    const { data: profile, error } = await supabase
      .from('profiles')
      .select('id')
      .eq('username', username.trim())
      .maybeSingle()

    if (error) throw error
    if (!profile) throw new Error("User not found")
    if (profile.id === user.id) throw new Error("You cannot add yourself")

    // Check if there is an incoming pending request from this user
    const { data: incomingReq } = await supabase
      .from('friend_requests')
      .select('*')
      .eq('sender_id', profile.id)
      .eq('receiver_id', user.id)
      .eq('status', 'pending')
      .maybeSingle()

    if (incomingReq) {
      // Accept it
      return await acceptFriendRequestAction(incomingReq.id, profile.id)
    }

    // Otherwise, send/upsert a request
    return await sendFriendRequestAction(profile.id)
  } catch (err: any) {
    return { error: err.message }
  }
}

// Fetch current user's profile
export async function getCurrentUserProfile() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error("Unauthorized")

    const { data: profile, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    if (error) throw error
    const { data: adminRole } = await getAdminRole(user.id)
    return { data: { ...profile, admin_role: adminRole?.role || null } }
  } catch (err: any) {
    return { error: err.message }
  }
}

// Update current user's profile
export async function updateUserProfile(name: string, username: string, bio: string, avatarUrl?: string) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error("Unauthorized")

    // Check if username is taken by someone else
    const admin = createAdminClient()
    const normalizedUsername = username.trim().toLowerCase()
    const { data: existingUser, error: usernameLookupError } = await admin
      .from('profiles')
      .select('id')
      .eq('username', normalizedUsername)
      .neq('id', user.id)
      .maybeSingle()

    if (usernameLookupError) throw usernameLookupError
    if (existingUser) {
      return { error: "Username is already taken" }
    }

    const updateData: any = {
      full_name: name.trim(),
      username: normalizedUsername,
      bio: bio.trim(),
    }
    if (avatarUrl) {
      updateData.profile_photo_url = avatarUrl
    }

    const { error } = await supabase
      .from('profiles')
      .update(updateData)
      .eq('id', user.id)

    if (error) throw error
    return { success: true }
  } catch (err: any) {
    return { error: err.message }
  }
}

// Upload avatar action
export async function uploadAvatarAction(base64Data: string) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error("Unauthorized")

    const matches = base64Data.match(/^data:(image\/[a-z0-9-+.]+);base64,(.+)$/)
    let mimeType = 'image/png'
    let realData = base64Data
    if (matches && matches.length === 3) {
      mimeType = matches[1]
      realData = matches[2]
    }
    const buffer = Buffer.from(realData, 'base64')

    const accessKeyId = process.env.R2_ACCESS_KEY_ID;
    const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
    const bucketName = process.env.R2_BUCKET_NAME;
    const endpoint = process.env.R2_ENDPOINT;

    if (!accessKeyId || !secretAccessKey || !bucketName || !endpoint) {
      throw new Error("Cloudflare R2 environment variables are not fully configured.");
    }

    const s3 = new S3Client({
      region: "auto",
      endpoint: endpoint,
      credentials: {
        accessKeyId,
        secretAccessKey,
      },
    });

    const fileExtension = mimeType.split('/')[1] || 'png'
    const fileName = `avatars/${user.id}-${Date.now()}.${fileExtension}`

    await s3.send(
      new PutObjectCommand({
        Bucket: bucketName,
        Key: fileName,
        Body: buffer,
        ContentType: mimeType,
      })
    );

    // Get the public base URL or fallback to bucket subdomain
    let publicUrl = process.env.NEXT_PUBLIC_R2_PUBLIC_URL || process.env.R2_PUBLIC_URL;
    if (!publicUrl) {
      const match = endpoint.match(/https:\/\/([a-zA-Z0-9]+)\.r2\.cloudflarestorage\.com/);
      if (match && match[1]) {
        // Construct standard r2.dev dev subdomain fallback
        publicUrl = `https://pub-${match[1]}.r2.dev`;
      } else {
        publicUrl = endpoint;
      }
    }

    const cleanBaseUrl = publicUrl.endsWith('/') ? publicUrl.slice(0, -1) : publicUrl;
    const finalUrl = `${cleanBaseUrl}/${fileName}`;

    return { success: true, url: finalUrl }
  } catch (err: any) {
    return { error: err.message }
  }
}
