"use client";

import { useState, useEffect } from "react";
import { 
  Search, 
  UserPlus, 
  MessageSquare, 
  ShieldCheck, 
  Trash2, 
  Check, 
  X, 
  UserMinus,
  Sparkles,
  Share2
} from "lucide-react";
import { 
  getFriendsData, 
  searchUsersForFriendsAction,
  sendFriendRequestAction, 
  acceptFriendRequestAction, 
  declineFriendRequestAction, 
  removeFriendAction 
} from "@/lib/supabase/actions";

export default function FriendsPage() {
  const [activeTab, setActiveTab] = useState<"all" | "pending" | "suggestions">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);

  const [friends, setFriends] = useState<any[]>([]);
  const [requests, setRequests] = useState<any[]>([]);
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [currentUserUsername, setCurrentUserUsername] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const fetchFriends = async () => {
    setLoading(true);
    try {
      const res = await getFriendsData();
      if (!res.error) {
        setFriends(res.friends || []);
        setRequests(res.requests || []);
        setSuggestions(res.suggestions || []);
        if (res.currentUserId) setCurrentUserId(res.currentUserId);
        if (res.currentUserUsername) setCurrentUserUsername(res.currentUserUsername);
      } else {
        console.error(res.error);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleCopyInviteLink = () => {
    if (!currentUserUsername) return;
    const inviteUrl = `${window.location.origin}/invite?username=${currentUserUsername}`;
    navigator.clipboard.writeText(inviteUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  useEffect(() => {
    fetchFriends();
  }, []);

  useEffect(() => {
    const query = searchQuery.trim();
    if (query.length < 2) {
      setSearchResults([]);
      setSearching(false);
      return;
    }

    const timeout = window.setTimeout(async () => {
      setSearching(true);
      const result = await searchUsersForFriendsAction(query);
      setSearchResults(result.data || []);
      setSearching(false);
      setActiveTab("suggestions");
    }, 350);

    return () => window.clearTimeout(timeout);
  }, [searchQuery]);

  const displayedSuggestions = searchQuery.trim().length >= 2 ? searchResults : suggestions;

  const handleSendRequest = async (receiverId: string) => {
    const res = await sendFriendRequestAction(receiverId);
    if (res.success) {
      fetchFriends();
    } else {
      alert(res.error);
    }
  };

  const handleAcceptRequest = async (requestId: string, senderId: string) => {
    const res = await acceptFriendRequestAction(requestId, senderId);
    if (res.success) {
      fetchFriends();
    } else {
      alert(res.error);
    }
  };

  const handleDeclineRequest = async (requestId: string, targetUserId: string) => {
    const res = await declineFriendRequestAction(requestId, targetUserId);
    if (res.success) {
      fetchFriends();
    } else {
      alert(res.error);
    }
  };

  const handleRemoveFriend = async (friendId: string) => {
    const res = await removeFriendAction(friendId);
    if (res.success) {
      fetchFriends();
    } else {
      alert(res.error);
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-surface-container-lowest">
      
      {/* Top Header */}
      <header className="p-8 pb-4 shrink-0 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="font-plus-jakarta font-extrabold text-3xl text-on-surface">Friends Hub</h1>
          <p className="text-on-surface-variant text-sm mt-1">Manage friendships, respond to invites, and expand your community.</p>
        </div>

        {/* Action Tabs */}
        <div className="bg-surface-container-low p-1 rounded-xl flex gap-1 self-start md:self-auto border border-outline-variant/10">
          <button 
            onClick={() => setActiveTab("all")}
            className={`px-4 py-2 text-xs font-semibold rounded-lg transition-all ${activeTab === "all" ? "bg-white dark:bg-surface-container-lowest text-primary shadow-sm" : "text-on-surface-variant hover:text-foreground"}`}
          >
            All Friends ({friends.length})
          </button>
          <button 
            onClick={() => setActiveTab("pending")}
            className={`px-4 py-2 text-xs font-semibold rounded-lg transition-all ${activeTab === "pending" ? "bg-white dark:bg-surface-container-lowest text-primary shadow-sm" : "text-on-surface-variant hover:text-foreground"}`}
          >
            Pending ({requests.length})
          </button>
          <button 
            onClick={() => setActiveTab("suggestions")}
            className={`px-4 py-2 text-xs font-semibold rounded-lg transition-all ${activeTab === "suggestions" ? "bg-white dark:bg-surface-container-lowest text-primary shadow-sm" : "text-on-surface-variant hover:text-foreground"}`}
          >
            Suggestions ({suggestions.length})
          </button>
        </div>
      </header>

      {/* Filter and Search Bar */}
      <section className="px-8 pb-6 shrink-0">
        <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-2">
          Find New Users
        </label>
        <div className="relative group max-w-md">
          <Search className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-outline group-focus-within:text-primary transition-colors" />
          <input 
            type="text"
            placeholder="Enter a name or username..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-surface border border-outline-variant/20 rounded-xl pl-12 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all placeholder:text-outline-variant"
          />
          {searching && <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-primary font-semibold">Searching...</span>}
        </div>
      </section>

      {/* Friends list Grid */}
      <main className="flex-1 overflow-y-auto px-8 pb-8 scrollbar-hide">
        {loading ? (
          <div className="flex justify-center py-20 text-on-surface-variant font-semibold text-sm">
            Loading friends data...
          </div>
        ) : (
          <>
            {/* Friends Tab */}
            {activeTab === "all" && (
              friends.filter(f => 
                (f.full_name || "").toLowerCase().includes(searchQuery.toLowerCase()) || 
                (f.username || "").toLowerCase().includes(searchQuery.toLowerCase())
              ).length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-center">
                  <div className="w-16 h-16 bg-surface-container rounded-3xl flex items-center justify-center text-outline mb-4">
                    <UserMinus className="w-8 h-8" />
                  </div>
                  <h3 className="font-plus-jakarta font-bold text-lg">No friends yet</h3>
                  <p className="text-on-surface-variant text-sm mt-1">Start adding suggestions to build your friend list!</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {friends.filter(f => 
                    (f.full_name || "").toLowerCase().includes(searchQuery.toLowerCase()) || 
                    (f.username || "").toLowerCase().includes(searchQuery.toLowerCase())
                  ).map((user) => (
                    <div 
                      key={user.id}
                      className="bg-white dark:bg-surface-container-lowest border border-outline-variant/30 rounded-3xl p-6 shadow-sm hover:shadow-md hover:border-primary/20 transition-all flex flex-col justify-between relative overflow-hidden"
                    >
                      <div>
                        <div className="flex items-start gap-4">
                          <div className="relative shrink-0">
                            <img 
                              src={user.avatar_url || `https://api.dicebear.com/7.x/adventurer/svg?seed=${user.username}`} 
                              alt={user.full_name}
                              className="w-14 h-14 rounded-2xl object-cover border border-outline-variant/10"
                            />
                          </div>
                          <div className="min-w-0">
                            <h3 className="font-plus-jakarta font-bold text-base text-on-surface truncate flex items-center gap-1.5">
                              <span>{user.full_name}</span>
                            </h3>
                            <p className="text-xs text-on-surface-variant">@{user.username}</p>
                          </div>
                        </div>
                      </div>

                      <div className="h-px bg-outline-variant/15 my-5"></div>

                      <div className="flex gap-2">
                        <a 
                          href={`/chats?chatId=${user.id}`}
                          className="flex-1 py-2.5 bg-primary-container/10 text-primary hover:bg-primary-container/15 font-semibold text-xs rounded-xl flex items-center justify-center gap-1.5 transition-all"
                        >
                          <MessageSquare className="w-4 h-4" />
                          <span>Chat</span>
                        </a>
                        <button 
                          onClick={() => handleRemoveFriend(user.id)}
                          className="p-2.5 hover:bg-red-50 dark:hover:bg-red-950/20 text-red-600 rounded-xl transition-all border border-outline-variant/15 hover:border-red-600/20"
                          title="Remove Friend"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )
            )}

            {/* Pending Requests Tab */}
            {activeTab === "pending" && (
              requests.filter(r => {
                const person = r.sender_id === currentUserId ? r.receiver : r.sender;
                return (person?.full_name || "").toLowerCase().includes(searchQuery.toLowerCase()) || 
                       (person?.username || "").toLowerCase().includes(searchQuery.toLowerCase());
              }).length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-center">
                  <div className="w-16 h-16 bg-surface-container rounded-3xl flex items-center justify-center text-outline mb-4">
                    <UserMinus className="w-8 h-8" />
                  </div>
                  <h3 className="font-plus-jakarta font-bold text-lg">No pending requests</h3>
                  <p className="text-on-surface-variant text-sm mt-1">Pending incoming and outgoing invitations show up here.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {requests.filter(r => {
                    const person = r.sender_id === currentUserId ? r.receiver : r.sender;
                    return (person?.full_name || "").toLowerCase().includes(searchQuery.toLowerCase()) || 
                           (person?.username || "").toLowerCase().includes(searchQuery.toLowerCase());
                  }).map((req) => {
                    const isOutgoing = req.sender_id === currentUserId;
                    const person = isOutgoing ? req.receiver : req.sender;
                    if (!person) return null;

                    return (
                      <div 
                        key={req.id}
                        className="bg-white dark:bg-surface-container-lowest border border-outline-variant/30 rounded-3xl p-6 shadow-sm hover:shadow-md hover:border-primary/20 transition-all flex flex-col justify-between relative overflow-hidden"
                      >
                        <div>
                          <div className="flex items-start gap-4">
                            <div className="relative shrink-0">
                              <img 
                                src={person.avatar_url || `https://api.dicebear.com/7.x/adventurer/svg?seed=${person.username}`} 
                                alt={person.full_name}
                                className="w-14 h-14 rounded-2xl object-cover border border-outline-variant/10"
                              />
                            </div>
                            <div className="min-w-0">
                              <h3 className="font-plus-jakarta font-bold text-base text-on-surface truncate flex items-center gap-1.5">
                                <span>{person.full_name}</span>
                              </h3>
                              <p className="text-xs text-on-surface-variant">@{person.username}</p>
                              <span className="inline-block mt-2 px-2 py-0.5 rounded text-[10px] font-semibold bg-primary-container/10 text-primary">
                                {isOutgoing ? "Sent Invitation" : "Incoming Request"}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="h-px bg-outline-variant/15 my-5"></div>

                        <div className="flex gap-2">
                          {isOutgoing ? (
                            <button 
                              onClick={() => handleDeclineRequest(req.id, req.receiver_id)}
                              className="w-full py-2.5 border border-outline text-on-surface-variant font-semibold text-xs rounded-xl flex items-center justify-center gap-1.5 transition-all hover:bg-surface-container-low"
                            >
                              <X className="w-4 h-4" />
                              <span>Cancel Request</span>
                            </button>
                          ) : (
                            <>
                              <button 
                                onClick={() => handleAcceptRequest(req.id, req.sender_id)}
                                className="flex-1 py-2.5 bg-primary text-white font-semibold text-xs rounded-xl flex items-center justify-center gap-1.5 transition-all hover:bg-primary/95"
                              >
                                <Check className="w-4 h-4" />
                                <span>Accept</span>
                              </button>
                              <button 
                                onClick={() => handleDeclineRequest(req.id, req.sender_id)}
                                className="p-2.5 hover:bg-red-50 dark:hover:bg-red-950/20 text-red-600 rounded-xl transition-all border border-outline-variant/15"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )
            )}

            {/* Suggestions Tab */}
            {activeTab === "suggestions" && (
              displayedSuggestions.filter(s => 
                (s.full_name || "").toLowerCase().includes(searchQuery.toLowerCase()) || 
                (s.username || "").toLowerCase().includes(searchQuery.toLowerCase())
              ).length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-center">
                  <div className="w-16 h-16 bg-surface-container rounded-3xl flex items-center justify-center text-outline mb-4">
                    <Sparkles className="w-8 h-8" />
                  </div>
                  <h3 className="font-plus-jakarta font-bold text-lg">{searchQuery.trim().length >= 2 ? "No users found" : "No suggestions"}</h3>
                  <p className="text-on-surface-variant text-sm mt-1">{searchQuery.trim().length >= 2 ? "Try another name or username. You do not need to type @." : "There are no new suggestions at this time."}</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {displayedSuggestions.filter(s => 
                    (s.full_name || "").toLowerCase().includes(searchQuery.toLowerCase()) || 
                    (s.username || "").toLowerCase().includes(searchQuery.toLowerCase())
                  ).map((user) => (
                    <div 
                      key={user.id}
                      className="bg-white dark:bg-surface-container-lowest border border-outline-variant/30 rounded-3xl p-6 shadow-sm hover:shadow-md hover:border-primary/20 transition-all flex flex-col justify-between relative overflow-hidden"
                    >
                      <div>
                        <div className="flex items-start gap-4">
                          <div className="relative shrink-0">
                            <img 
                              src={user.avatar_url || `https://api.dicebear.com/7.x/adventurer/svg?seed=${user.username}`} 
                              alt={user.full_name}
                              className="w-14 h-14 rounded-2xl object-cover border border-outline-variant/10"
                            />
                          </div>
                          <div className="min-w-0">
                            <h3 className="font-plus-jakarta font-bold text-base text-on-surface truncate flex items-center gap-1.5">
                              <span>{user.full_name}</span>
                            </h3>
                            <p className="text-xs text-on-surface-variant">@{user.username}</p>
                          </div>
                        </div>
                      </div>

                      <div className="h-px bg-outline-variant/15 my-5"></div>

                      <div className="flex gap-2">
                        <button 
                          onClick={() => handleSendRequest(user.id)}
                          className="w-full py-2.5 bg-primary text-white font-semibold text-xs rounded-xl flex items-center justify-center gap-1.5 transition-all hover:bg-primary/95 shadow-sm"
                        >
                          <UserPlus className="w-4 h-4" />
                          <span>Send Friend Request</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )
            )}
          </>
        )}
      </main>

    </div>
  );
}
