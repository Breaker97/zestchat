"use client";

import { useState, useEffect } from "react";
import { 
  Phone, 
  PhoneCall, 
  PhoneIncoming, 
  PhoneOutgoing, 
  PhoneMissed, 
  Video, 
  VideoOff, 
  Search, 
  Trash2,
  Volume2
} from "lucide-react";
import { getUserCallHistoryAction } from "@/lib/supabase/actions";
import { createClient } from "@/lib/supabase/browser";

interface CallLog {
  id: string;
  name: string;
  avatar: string;
  type: "audio" | "video";
  direction: "incoming" | "outgoing" | "missed";
  timestamp: string;
  duration?: string;
}

export default function CallsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [callLogs, setCallLogs] = useState<CallLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadCallHistory() {
      try {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          setLoading(false);
          return;
        }

        const res = await getUserCallHistoryAction();
        if (res.error) {
          console.error("Error fetching call history:", res.error);
          setLoading(false);
          return;
        }

        if (res.data) {
          const formatted: CallLog[] = res.data.map((call: any) => {
            const isHost = call.host_id === user.id;
            
            // Find the other user's profile
            let otherUser: any = null;
            if (isHost) {
              const otherParticipant = (call.participants || []).find((p: any) => p.user_id !== user.id);
              otherUser = otherParticipant?.profile;
            } else {
              otherUser = call.host;
            }

            const name = otherUser?.full_name || otherUser?.username || "ZestChat User";
            const avatar = otherUser?.avatar_url || `https://api.dicebear.com/7.x/adventurer/svg?seed=${otherUser?.username || 'user'}`;
            
            // Direction
            let direction: "incoming" | "outgoing" | "missed" = "incoming";
            if (isHost) {
              direction = "outgoing";
            } else if (call.status === "missed" || call.status === "declined") {
              direction = "missed";
            }

            // Duration calculation
            let duration = "";
            if (call.ended_at && call.created_at) {
              const diffMs = new Date(call.ended_at).getTime() - new Date(call.created_at).getTime();
              const seconds = Math.floor(diffMs / 1000);
              if (seconds > 0) {
                if (seconds < 60) {
                  duration = `${seconds}s`;
                } else {
                  duration = `${Math.floor(seconds / 60)}m ${seconds % 60}s`;
                }
              }
            } else if (!call.ended_at) {
              duration = call.status === "connected" ? "active" : "ringing";
            }

            // Timestamp formatting
            const timestamp = new Date(call.created_at).toLocaleString([], {
              month: "short",
              day: "numeric",
              hour: "2-digit",
              minute: "2-digit"
            });

            return {
              id: call.id,
              name,
              avatar,
              type: (call.type === "video" ? "video" : "audio") as "audio" | "video",
              direction,
              timestamp,
              duration: duration || undefined
            };
          });

          setCallLogs(formatted);
        }
      } catch (err) {
        console.error("Failed to load call history:", err);
      } finally {
        setLoading(false);
      }
    }

    loadCallHistory();
  }, []);

  const deleteLog = async (id: string) => {
    // Optimistic UI update
    setCallLogs(prev => prev.filter((log) => log.id !== id));
    
    // Also delete from Supabase calls table
    try {
      const supabase = createClient();
      await supabase.from("calls").delete().eq("id", id);
    } catch (err) {
      console.error("Failed to delete call log from DB:", err);
    }
  };

  const filteredLogs = callLogs.filter((log) =>
    log.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex-1 flex flex-col h-full bg-surface-container-lowest">
      
      {/* Top Header */}
      <header className="p-8 pb-4 shrink-0 flex items-center justify-between">
        <div>
          <h1 className="font-plus-jakarta font-extrabold text-3xl text-on-surface">Calls History</h1>
          <p className="text-on-surface-variant text-sm mt-1">Review active, incoming, and missed audio/video calls.</p>
        </div>
      </header>

      {/* Filter and Search */}
      <section className="px-8 pb-6 shrink-0">
        <div className="relative group max-w-md">
          <Search className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-outline group-focus-within:text-primary transition-colors" />
          <input 
            type="text"
            placeholder="Search call logs by contact name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-surface border border-outline-variant/20 rounded-xl pl-12 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all placeholder:text-outline-variant"
          />
        </div>
      </section>

      {/* Call History list */}
      <main className="flex-1 overflow-y-auto px-8 pb-8 scrollbar-hide">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 text-center animate-pulse">
            <span className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4" />
            <p className="text-on-surface-variant text-sm">Loading your call history...</p>
          </div>
        ) : filteredLogs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-16 h-16 bg-surface-container rounded-3xl flex items-center justify-center text-outline mb-4">
              <PhoneCall className="w-8 h-8" />
            </div>
            <h3 className="font-plus-jakarta font-bold text-lg">No call logs</h3>
            <p className="text-on-surface-variant text-sm mt-1">Your calling history is empty</p>
          </div>
        ) : (
          <div className="max-w-4xl bg-white dark:bg-surface-container-lowest border border-outline-variant/30 rounded-3xl p-6 shadow-sm divide-y divide-outline-variant/15">
            {filteredLogs.map((log) => (
              <div key={log.id} className="py-4 first:pt-0 last:pb-0 flex items-center justify-between gap-4">
                
                <div className="flex items-center gap-4">
                  <img 
                    src={log.avatar} 
                    alt={log.name}
                    className="w-12 h-12 rounded-2xl object-cover border border-outline-variant/10 shrink-0"
                  />
                  <div>
                    <h3 className="font-plus-jakarta font-semibold text-sm text-on-surface">{log.name}</h3>
                    <div className="flex items-center gap-2 mt-1">
                      {log.direction === "incoming" && <PhoneIncoming className="w-3.5 h-3.5 text-primary" />}
                      {log.direction === "outgoing" && <PhoneOutgoing className="w-3.5 h-3.5 text-primary" />}
                      {log.direction === "missed" && <PhoneMissed className="w-3.5 h-3.5 text-error" />}
                      <span className="text-xs text-on-surface-variant">{log.timestamp}</span>
                      {log.duration && (
                        <>
                          <span className="text-[10px] text-outline">•</span>
                          <span className="text-xs text-outline">{log.duration}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <span className="w-10 h-10 bg-primary-container/15 rounded-xl flex items-center justify-center text-primary">
                    {log.type === "video" ? <Video className="w-4.5 h-4.5" /> : <Phone className="w-4.5 h-4.5" />}
                  </span>
                  <button 
                    onClick={() => deleteLog(log.id)}
                    className="w-10 h-10 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-xl flex items-center justify-center text-red-600 border border-outline-variant/10 hover:border-red-600/20 transition-all"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

              </div>
            ))}
          </div>
        )}
      </main>

    </div>
  );
}
