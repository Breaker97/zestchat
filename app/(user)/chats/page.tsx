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

// browser audio synthesis player for calling/ringing sounds
class RingtonePlayer {
  private audioCtx: AudioContext | null = null;
  private intervalId: any = null;

  constructor() {}

  private init() {
    if (typeof window === 'undefined') return;
    if (!this.audioCtx) {
      const AudioCtxClass = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtxClass) {
        this.audioCtx = new AudioCtxClass();
      }
    }
    if (this.audioCtx && this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }
  }

  playIncoming() {
    if (typeof window === 'undefined') return;
    this.stop();
    this.init();
    if (!this.audioCtx) return;

    const playRing = () => {
      if (!this.audioCtx || this.audioCtx.state === 'suspended') return;
      
      try {
        const osc1 = this.audioCtx.createOscillator();
        const osc2 = this.audioCtx.createOscillator();
        const gainNode = this.audioCtx.createGain();

        osc1.frequency.setValueAtTime(440, this.audioCtx.currentTime);
        osc2.frequency.setValueAtTime(480, this.audioCtx.currentTime);

        const tremolo = this.audioCtx.createOscillator();
        const tremoloGain = this.audioCtx.createGain();
        tremolo.frequency.setValueAtTime(20, this.audioCtx.currentTime); 
        tremoloGain.gain.setValueAtTime(10, this.audioCtx.currentTime);

        tremolo.connect(tremoloGain);
        tremoloGain.connect(osc1.frequency);
        tremoloGain.connect(osc2.frequency);

        gainNode.gain.setValueAtTime(0, this.audioCtx.currentTime);
        gainNode.gain.linearRampToValueAtTime(0.2, this.audioCtx.currentTime + 0.1);
        gainNode.gain.setValueAtTime(0.2, this.audioCtx.currentTime + 1.2);
        gainNode.gain.linearRampToValueAtTime(0, this.audioCtx.currentTime + 1.3);

        osc1.connect(gainNode);
        osc2.connect(gainNode);
        gainNode.connect(this.audioCtx.destination);

        osc1.start();
        osc2.start();
        tremolo.start();

        setTimeout(() => {
          try {
            osc1.stop();
            osc2.stop();
            tremolo.stop();
          } catch (e) {}
        }, 1500);
      } catch (e) {
        console.error("Audio error", e);
      }
    };

    playRing();
    this.intervalId = setInterval(playRing, 3000);
  }

  playOutgoing() {
    if (typeof window === 'undefined') return;
    this.stop();
    this.init();
    if (!this.audioCtx) return;

    const playBeep = () => {
      if (!this.audioCtx || this.audioCtx.state === 'suspended') return;

      try {
        const osc = this.audioCtx.createOscillator();
        const gainNode = this.audioCtx.createGain();

        osc.frequency.setValueAtTime(425, this.audioCtx.currentTime); 

        gainNode.gain.setValueAtTime(0, this.audioCtx.currentTime);
        gainNode.gain.linearRampToValueAtTime(0.1, this.audioCtx.currentTime + 0.05);
        gainNode.gain.setValueAtTime(0.1, this.audioCtx.currentTime + 1.0);
        gainNode.gain.linearRampToValueAtTime(0, this.audioCtx.currentTime + 1.1);

        osc.connect(gainNode);
        gainNode.connect(this.audioCtx.destination);

        osc.start();

        setTimeout(() => {
          try {
            osc.stop();
          } catch (e) {}
        }, 1200);
      } catch (e) {
        console.error("Audio error", e);
      }
    };

    playBeep();
    this.intervalId = setInterval(playBeep, 4000);
  }

  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }
}

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

  const activePartner = chats.find(c => c.id === activeChatId) || {
    title: "Select a Chat",
    avatar_url: "",
    description: "",
    username: "",
    bio: "",
    verification_status: "",
    type: "",
    sharedMedia: [],
    sharedDocs: []
  };

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

  // Call Signaling State
  const [incomingCall, setIncomingCall] = useState<{
    type: "audio" | "video";
    chatId: string;
    partnerTitle: string;
    partnerAvatar: string;
  } | null>(null);
  const [outgoingCall, setOutgoingCall] = useState(false);

  const chatEndRef = useRef<HTMLDivElement>(null);
  const ringtoneRef = useRef<RingtonePlayer | null>(null);

  useEffect(() => {
    ringtoneRef.current = new RingtonePlayer();
    return () => {
      ringtoneRef.current?.stop();
    };
  }, []);

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

  // Call Signaling Listener
  useEffect(() => {
    if (messages.length === 0 || !currentUserId) return;
    
    const lastMsg = messages[messages.length - 1];
    const timeDiff = Date.now() - new Date(lastMsg.created_at).getTime();
    
    // Handle signaling events that are very recent (within 20 seconds)
    if (lastMsg.message_type === 'call_event' && timeDiff < 20000) {
      if (lastMsg.sender_id !== currentUserId) {
        if (lastMsg.content.startsWith('CALL_START:')) {
          const type = lastMsg.content.split(':')[1] as 'audio' | 'video';
          if (!callActive && !incomingCall && !outgoingCall) {
            setIncomingCall({
              type,
              chatId: activeChatId!,
              partnerTitle: activePartner.title,
              partnerAvatar: activePartner.avatar_url
            });
            ringtoneRef.current?.playIncoming();
          }
        } else if (lastMsg.content === 'CALL_DECLINE' || lastMsg.content === 'CALL_END') {
          if (incomingCall) {
            setIncomingCall(null);
            ringtoneRef.current?.stop();
          }
          if (callActive) {
            // Stop local stream
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
              agoraClient.leave().catch(console.error);
            }
            setRemoteUsers([]);
            setIsMuted(false);
            setCameraOff(false);
          }
        } else if (lastMsg.content === 'CALL_ACCEPT') {
          // Partner accepted the call
          if (outgoingCall) {
            setOutgoingCall(false);
            ringtoneRef.current?.stop();
          }
        }
      }
    }
  }, [messages, currentUserId, activeChatId, activePartner.title, activePartner.avatar_url, callActive, incomingCall, outgoingCall, localAudioTrack, localVideoTrack, agoraClient]);

  // Call timeouts
  useEffect(() => {
    let timeout: any = null;
    if (outgoingCall) {
      timeout = setTimeout(() => {
        alert("No answer.");
        endCall();
      }, 30000);
    }
    return () => clearTimeout(timeout);
  }, [outgoingCall]);

  useEffect(() => {
    let timeout: any = null;
    if (incomingCall) {
      timeout = setTimeout(() => {
        setIncomingCall(null);
        ringtoneRef.current?.stop();
      }, 30000);
    }
    return () => clearTimeout(timeout);
  }, [incomingCall]);

  const acceptIncomingCall = async () => {
    if (!incomingCall) return;
    const type = incomingCall.type;
    const cid = incomingCall.chatId;
    setIncomingCall(null);
    ringtoneRef.current?.stop();
    
    await sendMessageAction(cid, 'CALL_ACCEPT', 'call_event');
    await startCall(type, true);
  };

  const declineIncomingCall = async () => {
    if (!incomingCall) return;
    const cid = incomingCall.chatId;
    setIncomingCall(null);
    ringtoneRef.current?.stop();
    await sendMessageAction(cid, 'CALL_DECLINE', 'call_event');
  };

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
  const startCall = async (type: "audio" | "video", isJoin = false) => {
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

      // Play ringing sound and send start call event if we are starting the call
      if (!isJoin) {
        setOutgoingCall(true);
        ringtoneRef.current?.playOutgoing();
        await sendMessageAction(activeChatId, `CALL_START:${type}`, 'call_event');
      }

      const channelName = `ZestChat_${activeChatId}`;
      const res = await generateAgoraTokenAction(channelName);
      if (res.error || !res.token || !res.appId) {
        alert("Failed to generate Agora token: " + (res.error || "Missing configuration"));
        setCallActive(false);
        setOutgoingCall(false);
        ringtoneRef.current?.stop();
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
        // Stop outgoing ringtone when user publishes media
        setOutgoingCall(false);
        ringtoneRef.current?.stop();

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
      setOutgoingCall(false);
      ringtoneRef.current?.stop();

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
    setOutgoingCall(false);
    ringtoneRef.current?.stop();
    if (activeChatId) {
      await sendMessageAction(activeChatId, 'CALL_END', 'call_event');
    }
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
      setTimeout(() => {
        const localContainer = document.getElementById("local-video-container");
        if (localContainer) {
          track.play(localContainer);
        }
      }, 200);
    } catch {
      alert('No camera is available. Connect or enable a camera to switch to video.');
    }
  };

  const handleSwitchCamera = async () => {
    if (!localVideoTrack) return;
    try {
      const AgoraRTC = (await import("agora-rtc-sdk-ng")).default;
      const devices = await AgoraRTC.getCameras(true);
      if (devices.length <= 1) {
        alert("Only one camera device detected.");
        return;
      }
      
      const currentTrackInfo = localVideoTrack.getTrackLabel();
      const currentDevice = devices.find(d => d.label === currentTrackInfo);
      const currentId = currentDevice?.deviceId || localVideoTrack.getMediaStreamTrack().getSettings().deviceId;
      
      let nextIndex = 0;
      if (currentId) {
        const currentIndex = devices.findIndex(d => d.deviceId === currentId);
        if (currentIndex !== -1) {
          nextIndex = (currentIndex + 1) % devices.length;
        }
      }
      
      const nextDevice = devices[nextIndex];
      await localVideoTrack.setDevice(nextDevice.deviceId);
      console.log("Switched camera to:", nextDevice.label);
    } catch (err) {
      console.error("Failed to switch camera:", err);
      alert("Failed to switch camera device.");
    }
  };

  const formattedCallTime = outgoingCall 
    ? "Ringing..." 
    : `${String(Math.floor(callSeconds / 60)).padStart(2, '0')}:${String(callSeconds % 60).padStart(2, '0')}`;

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
                      {msg.message_type === 'call_event' ? (
                        <div className={`p-3 text-xs leading-relaxed rounded-2xl flex items-center gap-2 border ${
                          isMe 
                            ? "bg-primary-container/10 text-primary border-primary/20" 
                            : "bg-surface-container/40 text-on-surface-variant border-outline-variant/20"
                        }`}>
                          {msg.content.startsWith('CALL_START:') ? (
                            <>
                              <Phone className="w-3.5 h-3.5 animate-pulse text-primary shrink-0" />
                              <span>Call started ({msg.content.split(':')[1]})</span>
                            </>
                          ) : msg.content === 'CALL_ACCEPT' ? (
                            <>
                              <Phone className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                              <span>Call accepted</span>
                            </>
                          ) : msg.content === 'CALL_DECLINE' ? (
                            <>
                              <PhoneOff className="w-3.5 h-3.5 text-error shrink-0" />
                              <span>Call declined</span>
                            </>
                          ) : (
                            <>
                              <PhoneOff className="w-3.5 h-3.5 text-outline shrink-0" />
                              <span>Call ended</span>
                            </>
                          )}
                        </div>
                      ) : (
                        <div className={`p-4 text-sm md:text-base leading-relaxed shadow-[0_4px_12px_rgba(0,0,0,0.03)] ${
                          isMe 
                            ? "bg-primary-container text-on-primary-container rounded-2xl rounded-br-sm" 
                            : "bg-surface-container-high text-on-surface rounded-2xl rounded-bl-sm"
                        }`}>
                          <p>{msg.content}</p>
                        </div>
                      )}
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
            {activePartner.type === 'direct' ? (
              <>
                {activePartner.username && (
                  <div>
                    <h4 className="text-[10px] font-bold uppercase tracking-wider text-outline mb-1">Username</h4>
                    <p className="text-on-surface-variant font-medium text-sm">@{activePartner.username}</p>
                  </div>
                )}
                <div>
                  <h4 className="text-[10px] font-bold uppercase tracking-wider text-outline mb-1.5">Bio</h4>
                  <p className="text-on-surface-variant leading-relaxed text-sm">
                    {activePartner.bio || "No bio provided."}
                  </p>
                </div>
              </>
            ) : (
              <div>
                <h4 className="text-[10px] font-bold uppercase tracking-wider text-outline mb-1.5">Description</h4>
                <p className="text-on-surface-variant leading-relaxed">
                  {activePartner.description || "Secure messaging channel."}
                </p>
              </div>
            )}
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
                <button onClick={handleSwitchCamera} className="w-11 h-11 rounded-full bg-white/15 backdrop-blur-xl flex items-center justify-center hover:bg-white/25 active:scale-95 transition-all"><Camera className="w-5 h-5" /></button>
              </div>
              <div id="local-video-container" className={`absolute top-24 right-5 md:right-8 w-28 h-40 md:w-40 md:h-56 rounded-2xl border-2 border-white/25 shadow-2xl overflow-hidden z-20 scale-x-[-1] ${cameraOff ? 'invisible' : ''}`} />
              <div className="absolute bottom-8 inset-x-0 px-4 z-20">
                <div className="max-w-md mx-auto rounded-[2rem] bg-white/15 backdrop-blur-2xl border border-white/20 p-4 flex items-center justify-around">
                  <button onClick={toggleCamera} className={`w-12 h-12 rounded-full flex items-center justify-center ${cameraOff ? 'bg-white text-zinc-900' : 'bg-white/10'}`}>{cameraOff ? <VideoOff className="w-5 h-5" /> : <Video className="w-5 h-5" />}</button>
                  <button onClick={toggleMute} className={`w-12 h-12 rounded-full flex items-center justify-center ${isMuted ? 'bg-white text-zinc-900' : 'bg-white/10'}`}>{isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}</button>
                  <button onClick={switchCallMode} className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center"><Phone className="w-5 h-5" /></button>
                  <button onClick={endCall} className="w-16 h-16 rounded-full bg-error text-white flex items-center justify-center shadow-xl active:scale-95 transition-all"><PhoneOff className="w-7 h-7" /></button>
                </div>
                <p className="mt-3 text-center text-xs text-white/75 font-medium">Excellent Quality · Secure connection</p>
              </div>
            </>
          ) : (
            <div className="h-full max-w-md mx-auto px-6 py-6 md:py-16 flex flex-col items-center justify-between text-center overflow-hidden">
              <div className="mt-2 md:mt-6">
                <p className="uppercase tracking-[0.2em] text-[10px] sm:text-xs font-bold text-on-surface-variant flex items-center justify-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-primary" />Secure Connection
                </p>
                <h2 className="font-plus-jakarta text-2xl sm:text-3xl font-bold mt-4 md:mt-8 truncate max-w-xs">{activePartner.title}</h2>
                <p className="text-primary font-bold mt-1 sm:mt-2 text-sm sm:text-base">{formattedCallTime}</p>
              </div>
              
              <div className="relative flex items-center justify-center my-4 shrink">
                <span className="absolute w-48 h-48 sm:w-60 sm:h-60 md:w-72 md:h-72 rounded-full bg-primary/10 animate-ping" />
                <span className="absolute w-40 h-40 sm:w-48 sm:h-48 md:w-60 md:h-60 rounded-full bg-primary/15" />
                <img 
                  src={activePartner.avatar_url} 
                  alt={activePartner.title} 
                  className="relative w-32 h-32 sm:w-40 sm:h-40 md:w-52 md:h-52 rounded-full object-cover border-4 border-primary-container p-1 shadow-xl shrink-0" 
                />
              </div>
              
              <div className="w-full mt-4 md:mt-8 shrink-0">
                <div className="flex items-center justify-center gap-6 sm:gap-8">
                  <button onClick={toggleMute} className={`w-12 h-12 sm:w-14 sm:h-14 rounded-full flex items-center justify-center shadow-sm transition-all ${isMuted ? 'bg-primary-container text-primary' : 'bg-surface-container-high text-on-surface'}`}>{isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}</button>
                  <button onClick={endCall} className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-error text-white flex items-center justify-center shadow-xl active:scale-95 transition-all"><PhoneOff className="w-6 h-6 sm:w-8 sm:h-8" /></button>
                  <button onClick={() => setSpeakerOn(value => !value)} className={`w-12 h-12 sm:w-14 sm:h-14 rounded-full flex items-center justify-center shadow-sm transition-all ${speakerOn ? 'bg-surface-container-high text-on-surface' : 'bg-primary-container text-primary'}`}>{speakerOn ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}</button>
                </div>
                <button onClick={switchCallMode} className="mt-6 sm:mt-10 px-5 py-2.5 sm:px-6 sm:py-3 rounded-full bg-white/45 dark:bg-white/10 border border-white/50 dark:border-white/20 font-semibold inline-flex items-center gap-2 text-xs sm:text-sm active:scale-95 transition-all"><Video className="w-4 h-4 sm:w-5 sm:h-5" />Switch to Video</button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Incoming Call Ringing Overlay */}
      {incomingCall && (
        <div className="fixed inset-0 z-[110] bg-black/60 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-sm bg-white dark:bg-zinc-900 rounded-[2.5rem] border border-outline-variant/20 p-8 shadow-2xl flex flex-col items-center text-center gap-6 animate-in fade-in zoom-in-95 duration-200">
            <div>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 text-primary text-[10px] font-bold uppercase tracking-wider animate-pulse">
                <Phone className="w-3 h-3" /> Incoming {incomingCall.type} Call
              </span>
            </div>
            
            <div className="relative">
              <span className="absolute inset-0 rounded-full bg-primary/15 animate-ping scale-110" />
              <img 
                src={incomingCall.partnerAvatar} 
                alt={incomingCall.partnerTitle} 
                className="relative w-24 h-24 rounded-full object-cover border-4 border-white dark:border-zinc-800 shadow-xl"
              />
            </div>

            <div>
              <h3 className="font-plus-jakarta font-extrabold text-xl text-on-surface">{incomingCall.partnerTitle}</h3>
              <p className="text-sm text-on-surface-variant mt-1">is calling you on ZestChat...</p>
            </div>

            <div className="flex items-center gap-4 w-full mt-2">
              <button 
                onClick={declineIncomingCall}
                className="flex-1 py-3.5 bg-red-50 hover:bg-red-100 dark:bg-red-950/20 dark:hover:bg-red-950/40 text-red-600 hover:text-red-700 font-bold rounded-2xl border border-red-200/30 transition-all flex items-center justify-center gap-2 active:scale-95"
              >
                <PhoneOff className="w-4 h-4" /> Decline
              </button>
              <button 
                onClick={acceptIncomingCall}
                className="flex-1 py-3.5 bg-primary hover:bg-primary/95 text-white font-bold rounded-2xl shadow-lg shadow-primary/25 transition-all flex items-center justify-center gap-2 active:scale-95"
              >
                <Phone className="w-4 h-4 animate-bounce" /> Accept
              </button>
            </div>
          </div>
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
