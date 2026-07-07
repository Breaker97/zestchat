"use client";

import { useState } from "react";
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

  const deleteLog = (id: string) => {
    setCallLogs(callLogs.filter((log) => log.id !== id));
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
        {filteredLogs.length === 0 ? (
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
                  <button className="w-10 h-10 bg-primary-container/15 hover:bg-primary-container/20 rounded-xl flex items-center justify-center text-primary transition-all">
                    {log.type === "video" ? <Video className="w-4.5 h-4.5" /> : <Phone className="w-4.5 h-4.5" />}
                  </button>
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
