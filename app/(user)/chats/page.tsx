"use client";

import { useState, useRef, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { 
  Search, 
  Edit, 
  Send, 
  PlusCircle, 
  Smile, 
  Phone, 
  Video, 
  Info, 
  MoreHorizontal, 
  Download, 
  FileText, 
  User, 
  BellOff, 
  X,
  FileCheck,
  ArrowLeft,
  Mic,
  MicOff,
  VolumeX,
  PhoneOff,
  VideoOff,
  Camera,
  ShieldCheck,
  Volume2
} from "lucide-react";
import { 
  getUserChats, 
  getChatMessages, 
  sendMessageAction, 
  createDirectChatAction,
  generateAgoraTokenAction,
  getCurrentUserProfile
} from "@/lib/supabase/actions";
import { createClient } from "@/lib/supabase/browser";

function ChatsContent() {
  const searchParams = useSearchParams();
  const partnerIdParam = searchParams.get("chatId");

  const [rightPanelOpen, setRightPanelOpen] = useState(true);
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [messageText, setMessageText] = useState("");
  const [chats, setChats] = useState<any[]>([]);
  const [messages, setMessages] = useState<any[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<any>(null);
  const [chatSearch, setChatSearch] = useState("");

  // Agora RTC State
  const [callActive, setCallActive] = useState(false);
  const [callType, setCallType] = useState<"audio" | "video">("audio");
  const [agoraClient, setAgoraClient] = useState<any>(null);
  const [localVideoTrack, setLocalVideoTrack] = useState<any>(null);
  const [localAudioTrack, setLocalAudioTrack] = useState<any>(null);
  const [remoteUsers, setRemoteUsers] = useState<any[]>([]);
  const [callSeconds, setCallSeconds] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [speakerOn, setSpeakerOn] = useState(true);
  const [cameraOff, setCameraOff] = useState(false);

  const chatEndRef = useRef<HTMLDivElement>(null);

  // Initialize Agora client
  useEffect(() => {
    if (typeof window !== "undefined") {
      import("agora-rtc-sdk-ng").then((module) => {
        const client = module.default.createClient({ mode: "rtc", codec: "vp8" });
        setAgoraClient(client);
      });
    }
  }, []);

  // Fetch current user ID on mount
  useEffect(() => {
    async function fetchUserId() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setCurrentUserId(user.id);
      }
    }
    fetchUserId();
  }, []);

  const loadChats = async () => {
    setLoading(true);
    const res = await getUserChats();
    if (res.data) {
      setChats(res.data);
      if (res.data.length > 0 && !activeChatId && !partnerIdParam && window.innerWidth >= 768) {
        setActiveChatId(res.data[0].id);
      }
    }
    setLoading(false);
  };

  useEffect(() => {
    loadChats();
    getCurrentUserProfile().then(result => {
      if (result.data) setProfile(result.data);
    });
  }, []);

  // Handle partner ID from URL
  useEffect(() => {
    async function handlePartnerChat() {
      if (partnerIdParam) {
        const res = await createDirectChatAction(partnerIdParam);
        if (res.chatId) {
          setActiveChatId(res.chatId);
          await loadChats();
        } else if (res.error) {
          alert(`Unable to start chat: ${res.error}`);
        }
      }
    }
    handlePartnerChat();
  }, [partnerIdParam]);

  // Load chat messages when active chat changes
  const loadMessages = async () => {
    if (!activeChatId) return;
    const res = await getChatMessages(activeChatId);
    if (res.data) {
      setMessages(res.data);
    }
  };

  useEffect(() => {
    loadMessages();
  }, [activeChatId]);

  // Refresh through the authenticated server action. The current database
  // chat_members RLS policy is recursive, so direct browser Realtime reads
  // cannot safely authorize message payloads.
  useEffect(() => {
    if (!activeChatId) return;
    const interval = window.setInterval(loadMessages, 2000);
    return () => window.clearInterval(interval);
  }, [activeChatId]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (!callActive) {
      setCallSeconds(0);
      return;
    }
    const timer = window.setInterval(() => setCallSeconds(value => value + 1), 1000);
    return () => window.clearInterval(timer);
  }, [callActive]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageText.trim() || !activeChatId) return;

    const text = messageText;
    setMessageText("");

    const res = await sendMessageAction(activeChatId, text);
    if (res.error) {
      alert("Failed to send message: " + res.error);
    } else {
      loadMessages();
    }
  };

  // WebRTC Call Initiation
  const startCall = async (type: "audio" | "video") => {
    if (!agoraClient || !activeChatId) return;
    setCallType(type);

    let createdAudioTrack: any = null;
    let createdVideoTrack: any = null;
    let joinedChannel = false;

    try {
      if (!navigator.mediaDevices?.enumerateDevices) {
        throw new Error("MEDIA_DEVICES_UNAVAILABLE");
      }

      const devices = await navigator.mediaDevices.enumerateDevices();
      const hasMicrophone = devices.some(device => device.kind === "audioinput");
      const hasCamera = devices.some(device => device.kind === "videoinput");

      if (!hasMicrophone) throw new Error("MICROPHONE_NOT_FOUND");
      if (type === "video" && !hasCamera) throw new Error("CAMERA_NOT_FOUND");

      const channelName = `ZestChat_${activeChatId}`;
      const res = await generateAgoraTokenAction(channelName);
      if (res.error || !res.token || !res.appId) {
        alert("Failed to generate Agora token: " + (res.error || "Missing configuration"));
        setCallActive(false);
        return;
      }

      await agoraClient.join(res.appId, channelName, res.token, null);
      joinedChannel = true;

      const AgoraRTC = (await import("agora-rtc-sdk-ng")).default;
      createdAudioTrack = await AgoraRTC.createMicrophoneAudioTrack();
      setLocalAudioTrack(createdAudioTrack);

      if (type === "video") {
        createdVideoTrack = await AgoraRTC.createCameraVideoTrack();
        setLocalVideoTrack(createdVideoTrack);
        await agoraClient.publish([createdAudioTrack, createdVideoTrack]);
        setCallActive(true);
        setTimeout(() => {
          const localContainer = document.getElementById("local-video-container");
          if (localContainer) {
            createdVideoTrack.play(localContainer);
          }
        }, 300);
      } else {
        await agoraClient.publish([createdAudioTrack]);
        setCallActive(true);
      }

      agoraClient.on("user-published", async (user: any, mediaType: string) => {
        await agoraClient.subscribe(user, mediaType);
        if (mediaType === "video") {
          setRemoteUsers((prev) => {
            if (prev.find(u => u.uid === user.uid)) return prev;
            return [...prev, user];
          });
          setTimeout(() => {
            const remoteContainer = document.getElementById(`remote-video-${user.uid}`);
            if (remoteContainer) {
              user.videoTrack.play(remoteContainer);
            }
          }, 300);
        }
        if (mediaType === "audio") {
          user.audioTrack.play();
        }
      });

      agoraClient.on("user-unpublished", (user: any) => {
        setRemoteUsers((prev) => prev.filter(u => u.uid !== user.uid));
      });

      agoraClient.on("user-left", (user: any) => {
        setRemoteUsers((prev) => prev.filter(u => u.uid !== user.uid));
      });

    } catch (err) {
      console.error("Agora join/publish error:", err);
      createdVideoTrack?.close();
      createdAudioTrack?.close();
      if (joinedChannel) {
        try { await agoraClient.leave(); } catch (leaveError) { console.error(leaveError); }
      }
      setLocalVideoTrack(null);
      setLocalAudioTrack(null);
      setCallActive(false);

      const message = err instanceof Error ? err.message : String(err);
      if (message.includes("MICROPHONE_NOT_FOUND") || message.includes("DEVICE_NOT_FOUND")) {
        alert("No microphone was found. Connect or enable a microphone, then try again.");
      } else if (message.includes("CAMERA_NOT_FOUND")) {
        alert("No camera was found. Connect or enable a camera, or start an audio call instead.");
      } else if (message.includes("NotAllowedError") || message.includes("PERMISSION_DENIED")) {
        alert("Camera or microphone access was blocked. Allow permission in your browser settings and try again.");
      } else if (message.includes("MEDIA_DEVICES_UNAVAILABLE")) {
        alert("This browser cannot access media devices. Use a supported browser over HTTPS or localhost.");
      } else {
        alert("Failed to start the call. Check your camera and microphone permissions, then try again.");
      }
    }
  };

  const endCall = async () => {
    setCallActive(false);
    if (localAudioTrack) {
      localAudioTrack.close();
      setLocalAudioTrack(null);
    }
    if (localVideoTrack) {
      localVideoTrack.close();
      setLocalVideoTrack(null);
    }
    if (agoraClient) {
      try {
        await agoraClient.leave();
      } catch (e) {
        console.error(e);
      }
    }
    setRemoteUsers([]);
    setIsMuted(false);
    setCameraOff(false);
  };

  const toggleMute = async () => {
    if (!localAudioTrack) return;
    const next = !isMuted;
    await localAudioTrack.setMuted(next);
    setIsMuted(next);
  };

  const toggleCamera = async () => {
    if (!localVideoTrack) return;
    const next = !cameraOff;
    await localVideoTrack.setMuted(next);
    setCameraOff(next);
  };

  const switchCallMode = async () => {
    if (!agoraClient) return;
    if (callType === 'video') {
      if (localVideoTrack) {
        await agoraClient.unpublish(localVideoTrack);
        localVideoTrack.close();
        setLocalVideoTrack(null);
      }
      setCallType('audio');
      setCameraOff(false);
      return;
    }

    try {
      const AgoraRTC = (await import('agora-rtc-sdk-ng')).default;
      const cameras = await AgoraRTC.getCameras(true);
      if (cameras.length === 0) throw new Error('CAMERA_NOT_FOUND');
      const track = await AgoraRTC.createCameraVideoTrack();
      await agoraClient.publish(track);
      setLocalVideoTrack(track);
      setCallType('video');
      setTimeout(() => track.play('local-video-container'), 200);
    } catch {
      alert('No camera is available. Connect or enable a camera to switch to video.');
    }
  };

  const formattedCallTime = `${String(Math.floor(callSeconds / 60)).padStart(2, '0')}:${String(callSeconds % 60).padStart(2, '0')}`;

  const activePartner = chats.find(c => c.id === activeChatId) || {
    title: "Select a Chat",
    avatar_url: "",
    description: "",
    sharedMedia: [],
    sharedDocs: []
  };
  const filteredChats = chats.filter(chat =>
    (chat.title || "").toLowerCase().includes(chatSearch.trim().toLowerCase())
  );
  const firstName = (profile?.full_name || "there").split(" ")[0];

  return (
    <div className="flex-1 flex h-full w-full min-w-0 bg-surface-container-lowest text-on-surface overflow-hidden relative">
      
      {/* Sidebar: Chat Channels List */}
      <aside className={`${activeChatId ? "hidden md:flex" : "flex"} w-full md:w-80 lg:w-96 h-full bg-white dark:bg-surface-container-lowest border-r border-outline-variant/30 flex-col shrink-0`}>
        <div className="hidden md:flex p-6 pb-4 border-b border-outline-variant/20 flex-col gap-4">
          <div className="flex items-center justify-between">
            <h2 className="font-plus-jakarta font-bold text-xl">Messages</h2>
            <button className="p-2 hover:bg-surface-container-high rounded-full text-primary transition-all">
              <Edit className="w-5 h-5" />
            </button>
          </div>
          
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-outline" />
            <input 
              type="text" 
              value={chatSearch}
              onChange={(event) => setChatSearch(event.target.value)}
              placeholder="Search chats, groups..."
              className="w-full bg-surface-container-low border-0 rounded-xl pl-10 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all placeholder:text-outline-variant"
            />
          </div>
        </div>

        <div className="md:hidden bg-surface px-4 pt-5 pb-4 border-b border-outline-variant/10">
          <div className="flex items-center justify-between mb-5">
            <h1 className="font-plus-jakarta text-3xl font-bold text-primary">Hello, {firstName}</h1>
            <div className="flex items-center gap-4">
              <button type="button" className="text-on-surface-variant" aria-label="Search chats" onClick={() => document.getElementById('mobile-chat-search')?.focus()}>
                <Search className="w-7 h-7" />
              </button>
              <img src={profile?.profile_photo_url || `https://api.dicebear.com/7.x/adventurer/svg?seed=${profile?.username || 'user'}`} alt="Your profile" className="w-11 h-11 rounded-full object-cover border-2 border-primary" />
            </div>
          </div>
          <input
            id="mobile-chat-search"
            value={chatSearch}
            onChange={(event) => setChatSearch(event.target.value)}
            placeholder="Search chats..."
            className="sr-only"
          />
          <div className="flex gap-4 overflow-x-auto scrollbar-hide pb-1">
            <div className="w-16 shrink-0 flex flex-col items-center gap-2">
              <div className="w-14 h-14 rounded-full border-2 border-dashed border-outline-variant flex items-center justify-center text-on-surface-variant">
                <User className="w-6 h-6" />
              </div>
              <span className="text-[10px] font-semibold">Add</span>
            </div>
            {chats.slice(0, 4).map(chat => (
              <button key={chat.id} type="button" onClick={() => setActiveChatId(chat.id)} className="w-16 shrink-0 flex flex-col items-center gap-2">
                <div className="relative rounded-full p-0.5 border-2 border-primary-container">
                  <img src={chat.avatar_url} alt={chat.title} className="w-12 h-12 rounded-full object-cover" />
                  <span className="absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full bg-primary-container border-2 border-surface" />
                </div>
                <span className="w-full truncate text-[10px] font-semibold">{chat.title}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-3 py-4 md:p-3 space-y-1 scrollbar-hide bg-surface md:bg-white">
          {loading ? (
            <div className="text-center py-8 text-xs text-on-surface-variant font-semibold">
              Loading active channels...
            </div>
          ) : filteredChats.length === 0 ? (
            <div className="text-center py-8 text-xs text-on-surface-variant">
              No active chats yet. Go to Friends Hub to start talking!
            </div>
          ) : (
            filteredChats.map((chat) => (
              <div 
                key={chat.id}
                onClick={() => setActiveChatId(chat.id)}
                className={`flex items-center gap-4 px-3 py-4 md:p-3 rounded-2xl md:rounded-r-xl md:rounded-l-none cursor-pointer transition-all border-l-4 ${
                  activeChatId === chat.id 
                    ? "bg-primary-container/10 border-primary shadow-sm" 
                    : "border-transparent bg-surface-container-lowest md:bg-transparent hover:bg-surface-container-low"
                }`}
              >
                <img 
                  src={chat.avatar_url} 
                  alt={chat.title} 
                  className="w-14 h-14 md:w-12 md:h-12 rounded-2xl md:rounded-full object-cover border border-outline-variant/10 shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-baseline mb-1">
                    <h3 className="font-plus-jakarta font-semibold text-base md:text-sm truncate text-on-surface">{chat.title}</h3>
                  </div>
                  <p className="text-sm md:text-xs text-on-surface-variant truncate">
                    {chat.description || "Active messaging channel"}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      </aside>

      {/* Main Messages Workspace */}
      <section className={`${activeChatId ? "flex" : "hidden md:flex"} flex-1 min-w-0 w-full h-full flex-col bg-surface-container-lowest`}>
        {activeChatId ? (
          <>
            {/* Header */}
            <header className="h-16 md:h-20 border-b border-outline-variant/30 px-2 sm:px-4 md:px-6 flex items-center justify-between bg-white dark:bg-surface-container-lowest shrink-0">
              <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                <button
                  type="button"
                  onClick={() => setActiveChatId(null)}
                  className="md:hidden p-2 text-on-surface-variant hover:text-primary rounded-full shrink-0"
                  aria-label="Back to chats"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>
                <img 
                  src={activePartner.avatar_url} 
                  alt={activePartner.title} 
                  className="w-10 h-10 rounded-lg object-cover border border-outline-variant/10"
                />
                <div className="min-w-0">
                  <h3 className="font-plus-jakarta font-bold text-sm text-on-surface truncate">{activePartner.title}</h3>
                  <span className="text-[10px] text-primary font-bold">Secure connection</span>
                </div>
              </div>

              <div className="flex items-center gap-0.5 sm:gap-2 shrink-0">
                <button 
                  onClick={() => startCall("audio")}
                  className="p-2.5 hover:bg-surface-container-high text-on-surface-variant hover:text-primary rounded-xl transition-all"
                  title="Audio Call"
                >
                  <Phone className="w-4 h-4" />
                </button>
                <button 
                  onClick={() => startCall("video")}
                  className="p-2.5 hover:bg-surface-container-high text-on-surface-variant hover:text-primary rounded-xl transition-all"
                  title="Video Call"
                >
                  <Video className="w-4 h-4" />
                </button>
                <button 
                  onClick={() => setRightPanelOpen(!rightPanelOpen)}
                  className={`hidden xl:block p-2.5 rounded-xl transition-all ${rightPanelOpen ? "bg-primary-container/10 text-primary" : "hover:bg-surface-container-high text-on-surface-variant"}`}
                >
                  <Info className="w-4 h-4" />
                </button>
              </div>
            </header>

            {/* Chat Messages Feed */}
            <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-5 scrollbar-hide bg-surface-container-lowest">
              {messages.map((msg) => {
                const isMe = msg.sender_id === currentUserId;
                return (
                  <div key={msg.id} className={`flex ${isMe ? "justify-end" : "justify-start"} items-end gap-3`}>
                    {!isMe && (
                      <img 
                        src={msg.sender?.avatar_url || `https://api.dicebear.com/7.x/adventurer/svg?seed=${msg.sender?.username || 'user'}`} 
                        alt="sender"
                        className="w-8 h-8 rounded-lg object-cover border border-outline-variant/10 shrink-0"
                      />
                    )}
                    <div className="max-w-[82%] sm:max-w-md">
                      <div className={`p-4 text-sm md:text-base leading-relaxed shadow-[0_4px_12px_rgba(0,0,0,0.03)] ${
                        isMe 
                          ? "bg-primary-container text-on-primary-container rounded-2xl rounded-br-sm" 
                          : "bg-surface-container-high text-on-surface rounded-2xl rounded-bl-sm"
                      }`}>
                        <p>{msg.content}</p>
                      </div>
                      <span className="text-[9px] text-outline mt-1.5 block text-right font-medium">
                        {new Date(msg.created_at || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </div>
                );
              })}
              <div ref={chatEndRef} />
            </div>

            {/* Input Footer */}
            <footer className="p-2 sm:p-3 md:p-6 bg-white dark:bg-surface-container-lowest border-t border-outline-variant/30 shrink-0">
              <form onSubmit={handleSendMessage} className="flex items-center gap-2 md:gap-3">
                <button type="button" className="hidden sm:block p-2.5 text-on-surface-variant hover:text-primary rounded-xl transition-all">
                  <Smile className="w-5 h-5" />
                </button>
                <input 
                  type="text" 
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  placeholder={`Write your secure message here...`}
                  className="min-w-0 flex-1 bg-surface-container-low border border-outline-variant/20 rounded-full md:rounded-2xl px-4 md:px-5 py-3 text-xs focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all placeholder:text-outline-variant"
                />
                <button type="submit" className="p-3 bg-primary text-white hover:bg-primary/95 rounded-2xl shadow-md transition-all active:scale-95">
                  <Send className="w-4 h-4" />
                </button>
              </form>
            </footer>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
            <h3 className="font-plus-jakarta font-bold text-lg">No active channel selected</h3>
            <p className="text-on-surface-variant text-sm mt-1">Select a chat from the left sidebar or create one with your friends</p>
          </div>
        )}
      </section>

      {/* Right Sidebar: Active Partner Info */}
      {rightPanelOpen && activeChatId && (
        <aside className="hidden xl:flex w-80 h-full bg-white dark:bg-surface-container-lowest border-l border-outline-variant/30 p-6 flex-col gap-6 overflow-y-auto scrollbar-hide shrink-0">
          <div className="flex justify-between items-center">
            <h3 className="font-bold text-xs uppercase tracking-wider text-outline">Channel Profile</h3>
            <button onClick={() => setRightPanelOpen(false)} className="p-1 hover:bg-surface-container-high rounded-lg text-outline">
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="flex flex-col items-center text-center gap-3 pb-6 border-b border-outline-variant/10">
            <img 
              src={activePartner.avatar_url} 
              alt={activePartner.title} 
              className="w-24 h-24 rounded-3xl object-cover border border-outline-variant/10 shadow-sm"
            />
            <div>
              <h3 className="font-plus-jakarta font-bold text-base text-on-surface">{activePartner.title}</h3>
              <p className="text-xs text-on-surface-variant">Secure Communication Hub</p>
            </div>
          </div>

          <div className="space-y-4 text-xs">
            <div>
              <h4 className="text-[10px] font-bold uppercase tracking-wider text-outline mb-1.5">Description</h4>
              <p className="text-on-surface-variant leading-relaxed">
                {activePartner.description || "End-to-end encrypted messaging channel via Supabase RTC engine."}
              </p>
            </div>
          </div>
        </aside>
      )}

      {/* Stitch-inspired Agora call experience */}
      {callActive && (
        <div className={`fixed inset-0 z-[100] overflow-hidden ${callType === 'video' ? 'bg-black text-white' : 'bg-surface-container text-on-surface'}`}>
          {callType === 'video' ? (
            <>
              <div className="absolute inset-0 bg-zinc-900">
                {remoteUsers.length > 0 ? remoteUsers.map(user => <div key={user.uid} id={`remote-video-${user.uid}`} className="absolute inset-0" />) : <img src={activePartner.avatar_url} alt={activePartner.title} className="w-full h-full object-cover opacity-80 blur-sm scale-105" />}
                <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-black/70" />
              </div>
              <div className="absolute top-0 inset-x-0 p-6 md:p-8 flex justify-between z-20">
                <div><h2 className="font-plus-jakarta text-2xl font-bold">{activePartner.title}</h2><p className="text-white/75 text-sm flex items-center gap-2"><span className="w-2 h-2 bg-primary-container rounded-full animate-pulse" />{formattedCallTime}</p></div>
                <button className="w-11 h-11 rounded-full bg-white/15 backdrop-blur-xl flex items-center justify-center"><Camera className="w-5 h-5" /></button>
              </div>
              <div id="local-video-container" className={`absolute top-24 right-5 md:right-8 w-28 h-40 md:w-40 md:h-56 rounded-2xl border-2 border-white/25 shadow-2xl overflow-hidden z-20 scale-x-[-1] ${cameraOff ? 'invisible' : ''}`} />
              <div className="absolute bottom-8 inset-x-0 px-4 z-20">
                <div className="max-w-md mx-auto rounded-[2rem] bg-white/15 backdrop-blur-2xl border border-white/20 p-4 flex items-center justify-around">
                  <button onClick={toggleCamera} className={`w-12 h-12 rounded-full flex items-center justify-center ${cameraOff ? 'bg-white text-zinc-900' : 'bg-white/10'}`}>{cameraOff ? <VideoOff className="w-5 h-5" /> : <Video className="w-5 h-5" />}</button>
                  <button onClick={toggleMute} className={`w-12 h-12 rounded-full flex items-center justify-center ${isMuted ? 'bg-white text-zinc-900' : 'bg-white/10'}`}>{isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}</button>
                  <button onClick={switchCallMode} className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center"><Phone className="w-5 h-5" /></button>
                  <button onClick={endCall} className="w-16 h-16 rounded-full bg-error text-white flex items-center justify-center shadow-xl"><PhoneOff className="w-7 h-7" /></button>
                </div>
                <p className="mt-3 text-center text-xs text-white/75">Excellent Quality · Secure connection</p>
              </div>
            </>
          ) : (
            <div className="h-full max-w-md mx-auto px-6 py-16 md:py-20 flex flex-col items-center justify-between text-center">
              <div><p className="uppercase tracking-[0.2em] text-xs font-bold text-on-surface-variant flex items-center justify-center gap-2"><ShieldCheck className="w-4 h-4 text-primary" />Secure Connection</p><h2 className="font-plus-jakarta text-3xl font-bold mt-8">{activePartner.title}</h2><p className="text-primary font-bold mt-2">{formattedCallTime}</p></div>
              <div className="relative flex items-center justify-center"><span className="absolute w-72 h-72 rounded-full bg-primary/10 animate-ping" /><span className="absolute w-60 h-60 rounded-full bg-primary/15" /><img src={activePartner.avatar_url} alt={activePartner.title} className="relative w-52 h-52 md:w-60 md:h-60 rounded-full object-cover border-4 border-primary-container p-1 shadow-xl" /></div>
              <div className="w-full"><div className="flex items-center justify-center gap-8"><button onClick={toggleMute} className={`w-14 h-14 rounded-full flex items-center justify-center shadow-sm ${isMuted ? 'bg-primary-container' : 'bg-surface-container-high'}`}>{isMuted ? <MicOff /> : <Mic />}</button><button onClick={endCall} className="w-20 h-20 rounded-full bg-error text-white flex items-center justify-center shadow-xl"><PhoneOff className="w-8 h-8" /></button><button onClick={() => setSpeakerOn(value => !value)} className={`w-14 h-14 rounded-full flex items-center justify-center shadow-sm ${speakerOn ? 'bg-surface-container-high' : 'bg-primary-container'}`}>{speakerOn ? <Volume2 /> : <VolumeX />}</button></div><button onClick={switchCallMode} className="mt-10 px-6 py-3 rounded-full bg-white/45 border border-white/50 font-semibold inline-flex items-center gap-2"><Video className="w-5 h-5" />Switch to Video</button></div>
            </div>
          )}
        </div>
      )}

      {/* Legacy call overlay retained unreachable while migrating */}
      {false && callActive && (
        <div className="fixed inset-0 z-50 bg-black/90 flex flex-col items-center justify-center p-6 text-white">
          <div className="w-full max-w-4xl flex-1 flex flex-col gap-6 relative">
            <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
              
              {/* Local Stream */}
              <div className="bg-zinc-800 rounded-3xl overflow-hidden border border-zinc-700 relative flex items-center justify-center">
                {callType === "video" ? (
                  <div id="local-video-container" className="w-full h-full object-cover scale-x-[-1]" />
                ) : (
                  <div className="flex flex-col items-center gap-3">
                    <div className="w-20 h-20 bg-primary rounded-full flex items-center justify-center text-xl font-bold">
                      Me
                    </div>
                    <span>My Stream (Muted)</span>
                  </div>
                )}
                <div className="absolute bottom-4 left-4 bg-black/60 px-3 py-1 rounded-full text-xs font-semibold">
                  You (Local)
                </div>
              </div>

              {/* Partner Stream */}
              <div className="bg-zinc-800 rounded-3xl overflow-hidden border border-zinc-700 relative flex items-center justify-center">
                {callType === "video" && remoteUsers.length > 0 ? (
                  remoteUsers.map((user) => (
                    <div key={user.uid} id={`remote-video-${user.uid}`} className="w-full h-full object-cover" />
                  ))
                ) : (
                  <div className="flex flex-col items-center gap-3">
                    <img 
                      src={activePartner.avatar_url} 
                      alt={activePartner.title}
                      className="w-20 h-20 rounded-full object-cover border-2 border-primary" 
                    />
                    <span>{activePartner.title}</span>
                  </div>
                )}
                <div className="absolute bottom-4 left-4 bg-black/60 px-3 py-1 rounded-full text-xs font-semibold">
                  {activePartner.title} (Remote)
                </div>
              </div>

            </div>

            {/* Calling Controls */}
            <div className="flex items-center justify-between bg-zinc-900 border border-zinc-800 px-8 py-4 rounded-2xl max-w-xl mx-auto w-full">
              <div className="flex flex-col">
                <span className="text-sm font-semibold">{activePartner.title}</span>
                <span className="text-xs text-zinc-400">Agora RTC Active • Channel: ZestChat_{activeChatId}</span>
              </div>
              <div className="flex items-center gap-4">
                <button 
                  onClick={endCall}
                  className="px-6 py-3 bg-red-600 hover:bg-red-700 active:scale-95 text-white font-semibold rounded-xl shadow-lg transition-all"
                >
                  End Call
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

export default function ChatsPage() {
  return (
    <Suspense fallback={<div className="flex-1 flex items-center justify-center">Loading Content...</div>}>
      <ChatsContent />
    </Suspense>
  );
}
