"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { 
  ShieldAlert, 
  Users, 
  MessageSquare, 
  Volume2, 
  FileText, 
  Search, 
  Trash2, 
  UserMinus, 
  AlertTriangle, 
  CheckCircle, 
  XCircle,
  FileCheck,
  TrendingUp,
  Activity,
  ArrowLeft,
  Settings,
  Menu,
  X
} from "lucide-react";
import { 
  getMobileOtpEnabled, 
  setMobileOtpEnabledAction,
  adminGetAllProfiles,
  adminUpdateUserStatus,
  adminGetAuditLogs,
  adminGetBanAppeals,
  adminProcessAppeal,
  adminGetAnalytics,
  adminGetChatMonitor,
  adminGetCallMonitor,
  adminGetGuestAccounts,
} from "@/lib/supabase/actions";

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState<"analytics" | "users" | "chats" | "calls" | "guests" | "appeals" | "logs">("analytics");
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // System Config State
  const [mobileOtpEnabled, setMobileOtpEnabled] = useState(false);

  // Live Database states
  const [analytics, setAnalytics] = useState({ totalUsers: 0, bannedUsers: 0, suspendedUsers: 0, totalWarnings: 0 });
  const [users, setUsers] = useState<any[]>([]);
  const [appeals, setAppeals] = useState<any[]>([]);
  const [logs, setLogs] = useState<any[]>([]);
  const [monitoredChats, setMonitoredChats] = useState<any[]>([]);
  const [monitoredCalls, setMonitoredCalls] = useState<any[]>([]);
  const [guestAccounts, setGuestAccounts] = useState<any[]>([]);
  const [liveMonitorConnected, setLiveMonitorConnected] = useState(false);
  const [lastLiveUpdate, setLastLiveUpdate] = useState<Date | null>(null);

  useEffect(() => {
    async function loadSettings() {
      const enabled = await getMobileOtpEnabled();
      setMobileOtpEnabled(enabled);
    }
    loadSettings();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const analyticsRes = await adminGetAnalytics();
      if (analyticsRes.data) setAnalytics(analyticsRes.data);

      const profilesRes = await adminGetAllProfiles();
      if (profilesRes.data) setUsers(profilesRes.data);

      const appealsRes = await adminGetBanAppeals();
      if (appealsRes.data) setAppeals(appealsRes.data);

      const logsRes = await adminGetAuditLogs();
      if (logsRes.data) setLogs(logsRes.data);

      const [chatsRes, callsRes, guestsRes] = await Promise.all([
        adminGetChatMonitor(),
        adminGetCallMonitor(),
        adminGetGuestAccounts(),
      ]);
      if (chatsRes.data) setMonitoredChats(chatsRes.data);
      if (callsRes.data) setMonitoredCalls(callsRes.data);
      if (guestsRes.data) setGuestAccounts(guestsRes.data);
    } catch (error) {
      console.error("Error loading admin data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [activeTab]);

  useEffect(() => {
    if (activeTab !== "chats" && activeTab !== "calls") {
      setLiveMonitorConnected(false);
      return;
    }

    let cancelled = false;
    const refreshLiveMonitor = async () => {
      try {
        if (activeTab === "chats") {
          const result = await adminGetChatMonitor();
          if (!cancelled && result.data) setMonitoredChats(result.data);
          if (result.error) throw new Error(result.error);
        } else {
          const result = await adminGetCallMonitor();
          if (!cancelled && result.data) setMonitoredCalls(result.data);
          if (result.error) throw new Error(result.error);
        }

        if (!cancelled) {
          setLiveMonitorConnected(true);
          setLastLiveUpdate(new Date());
        }
      } catch (error) {
        console.error("Live admin monitor refresh failed:", error);
        if (!cancelled) setLiveMonitorConnected(false);
      }
    };

    refreshLiveMonitor();
    const interval = window.setInterval(refreshLiveMonitor, 3000);
    return () => {
      cancelled = true;
      window.clearInterval(interval);
    };
  }, [activeTab]);

  const toggleMobileOtp = async () => {
    const nextVal = !mobileOtpEnabled;
    setMobileOtpEnabled(nextVal);
    const res = await setMobileOtpEnabledAction(nextVal);
    if (res.error) {
      alert(res.error);
      setMobileOtpEnabled(!nextVal);
    }
  };

  const updateUserStatus = async (id: string, newStatus: "active" | "suspended" | "banned") => {
    const res = await adminUpdateUserStatus(id, newStatus, `Manual override to ${newStatus}`);
    if (res.success) {
      loadData();
    } else {
      alert(res.error);
    }
  };

  const processAppeal = async (appealId: string, userId: string, decision: "approved" | "rejected") => {
    const res = await adminProcessAppeal(appealId, userId, decision);
    if (res.success) {
      loadData();
    } else {
      alert(res.error);
    }
  };

  return (
    <div className="h-screen w-screen flex bg-surface-container-low text-on-surface overflow-hidden font-sans relative">
      
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black/45 backdrop-blur-sm md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar: Admin Options */}
      <aside className={`
        fixed inset-y-0 left-0 z-50 w-64 h-full bg-white dark:bg-surface-container-lowest border-r border-outline-variant/30 flex flex-col p-6 gap-8 shrink-0 transition-transform duration-300 ease-in-out
        md:relative md:translate-x-0 md:flex
        ${sidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}
      `}>
        {/* Close button for mobile */}
        <div className="flex md:hidden justify-end -mb-8">
          <button 
            onClick={() => setSidebarOpen(false)}
            className="p-1.5 hover:bg-surface-container-high rounded-full text-on-surface-variant transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-error/10 text-error rounded-xl flex items-center justify-center shadow-md">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <div>
            <h2 className="font-plus-jakarta font-extrabold text-base leading-none">Mod Control</h2>
            <span className="text-[10px] uppercase tracking-widest text-outline font-bold">ZestChat Console</span>
          </div>
        </div>

        <nav className="flex flex-col gap-1.5 flex-1">
          <button 
            onClick={() => { setActiveTab("analytics"); setSidebarOpen(false); }}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all ${activeTab === "analytics" ? "bg-error/10 text-error" : "hover:bg-surface-container-high text-on-surface-variant"}`}
          >
            <Activity className="w-4 h-4" />
            <span>Dashboard</span>
          </button>
          <button 
            onClick={() => { setActiveTab("users"); setSidebarOpen(false); }}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all ${activeTab === "users" ? "bg-error/10 text-error" : "hover:bg-surface-container-high text-on-surface-variant"}`}
          >
            <Users className="w-4 h-4" />
            <span>User Management</span>
          </button>
          <button
            onClick={() => { setActiveTab("chats"); setSidebarOpen(false); }}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all ${activeTab === "chats" ? "bg-error/10 text-error" : "hover:bg-surface-container-high text-on-surface-variant"}`}
          >
            <MessageSquare className="w-4 h-4" />
            <span>Chat & Groups</span>
          </button>
          <button
            onClick={() => { setActiveTab("calls"); setSidebarOpen(false); }}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all ${activeTab === "calls" ? "bg-error/10 text-error" : "hover:bg-surface-container-high text-on-surface-variant"}`}
          >
            <Volume2 className="w-4 h-4" />
            <span>Call Monitor</span>
          </button>
          <button
            onClick={() => { setActiveTab("guests"); setSidebarOpen(false); }}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all ${activeTab === "guests" ? "bg-error/10 text-error" : "hover:bg-surface-container-high text-on-surface-variant"}`}
          >
            <Users className="w-4 h-4" />
            <span>Guest Sessions</span>
          </button>
          <button 
            onClick={() => { setActiveTab("appeals"); setSidebarOpen(false); }}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all ${activeTab === "appeals" ? "bg-error/10 text-error" : "hover:bg-surface-container-high text-on-surface-variant"}`}
          >
            <FileCheck className="w-4 h-4" />
            <span>Ban Appeals ({appeals.filter(a => a.status === "pending").length})</span>
          </button>
          <button 
            onClick={() => { setActiveTab("logs"); setSidebarOpen(false); }}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all ${activeTab === "logs" ? "bg-error/10 text-error" : "hover:bg-surface-container-high text-on-surface-variant"}`}
          >
            <FileText className="w-4 h-4" />
            <span>Audit Logs</span>
          </button>
        </nav>

        <div className="mt-auto">
          <Link href="/chats" className="flex items-center gap-2 text-sm font-semibold text-primary hover:underline">
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Chats</span>
          </Link>
        </div>
      </aside>

      {/* Admin Content Workspace */}
      <main className="flex-1 h-full flex flex-col overflow-hidden">
        
        {/* Header */}
        <header className="h-20 bg-white dark:bg-surface-container-lowest border-b border-outline-variant/30 px-6 md:px-8 flex items-center justify-between shrink-0 gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <button 
              onClick={() => setSidebarOpen(true)}
              className="p-2 -ml-2 hover:bg-surface-container-high rounded-lg text-on-surface md:hidden transition-all shrink-0"
            >
              <Menu className="w-6 h-6" />
            </button>
            <h1 className="font-plus-jakarta font-extrabold text-base md:text-2xl truncate">
              {activeTab === "analytics" && "Platform Operations & Metrics"}
              {activeTab === "users" && "User Accounts Database"}
              {activeTab === "chats" && "Chat & Group Monitoring"}
              {activeTab === "calls" && "Audio / Video Call Monitoring"}
              {activeTab === "guests" && "Guest Account Sessions"}
              {activeTab === "appeals" && "Moderation Ban Appeals"}
              {activeTab === "logs" && "System Audit Records"}
            </h1>
          </div>
          
          <div className="flex items-center gap-2 shrink-0">
            {(activeTab === "chats" || activeTab === "calls") && (
              <span className={`px-2 md:px-3 py-1 rounded-full text-[9px] md:text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 ${liveMonitorConnected ? "bg-emerald-500/10 text-emerald-600" : "bg-amber-500/10 text-amber-600"}`}>
                <span className={`w-1.5 h-1.5 md:w-2 md:h-2 rounded-full ${liveMonitorConnected ? "bg-emerald-500 animate-pulse" : "bg-amber-500"}`} />
                <span className="hidden sm:inline">{liveMonitorConnected ? "Live" : "Connecting"}</span>
                {lastLiveUpdate && <span className="font-normal normal-case opacity-75 hidden md:inline">· {lastLiveUpdate.toLocaleTimeString()}</span>}
              </span>
            )}
            <span className="px-2 md:px-3 py-1 rounded-full bg-error/10 text-error text-[9px] md:text-xs font-bold uppercase tracking-wider">
              Service Role
            </span>
          </div>
        </header>

        {/* Dynamic Views */}
        <div className="flex-1 overflow-y-auto p-4 md:p-8 scrollbar-hide">
          {loading ? (
            <div className="flex items-center justify-center py-20 text-on-surface-variant font-semibold text-sm">
              Connecting to Supabase Live Database...
            </div>
          ) : (
            <>
              {/* Subview: Analytics Dashboard */}
              {activeTab === "analytics" && (
                <div className="space-y-8">
                  {/* Stat Cards */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
                    <div className="bg-white dark:bg-surface-container-lowest border border-outline-variant/30 rounded-3xl p-6 shadow-sm flex items-center justify-between">
                      <div>
                        <span className="text-xs text-on-surface-variant uppercase tracking-wider font-semibold">Total Accounts</span>
                        <h3 className="font-plus-jakarta font-extrabold text-3xl mt-1">{analytics.totalUsers}</h3>
                        <p className="text-[10px] text-primary font-bold flex items-center gap-1 mt-2">
                          <TrendingUp className="w-3.5 h-3.5" />
                          <span>Active users database</span>
                        </p>
                      </div>
                      <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center text-primary shrink-0">
                        <Users className="w-6 h-6" />
                      </div>
                    </div>

                    <div className="bg-white dark:bg-surface-container-lowest border border-outline-variant/30 rounded-3xl p-6 shadow-sm flex items-center justify-between">
                      <div>
                        <span className="text-xs text-on-surface-variant uppercase tracking-wider font-semibold">Flagged Content</span>
                        <h3 className="font-plus-jakarta font-extrabold text-3xl mt-1">{analytics.totalWarnings}</h3>
                        <p className="text-[10px] text-error font-bold flex items-center gap-1 mt-2">
                          <AlertTriangle className="w-3.5 h-3.5" />
                          <span>Warnings issued</span>
                        </p>
                      </div>
                      <div className="w-12 h-12 bg-error/10 rounded-2xl flex items-center justify-center text-error shrink-0">
                        <AlertTriangle className="w-6 h-6" />
                      </div>
                    </div>

                    <div className="bg-white dark:bg-surface-container-lowest border border-outline-variant/30 rounded-3xl p-6 shadow-sm flex items-center justify-between">
                      <div>
                        <span className="text-xs text-on-surface-variant uppercase tracking-wider font-semibold">Suspended / Banned</span>
                        <h3 className="font-plus-jakarta font-extrabold text-3xl mt-1">{analytics.bannedUsers + analytics.suspendedUsers}</h3>
                        <p className="text-[10px] text-error font-bold mt-2">Restricted profiles</p>
                      </div>
                      <div className="w-12 h-12 bg-secondary-container/20 rounded-2xl flex items-center justify-center text-secondary shrink-0">
                        <Volume2 className="w-6 h-6" />
                      </div>
                    </div>

                    <div className="bg-white dark:bg-surface-container-lowest border border-outline-variant/30 rounded-3xl p-6 shadow-sm flex items-center justify-between">
                      <div>
                        <span className="text-xs text-on-surface-variant uppercase tracking-wider font-semibold">Pending Appeals</span>
                        <h3 className="font-plus-jakarta font-extrabold text-3xl mt-1">
                          {appeals.filter(a => a.status === "pending").length}
                        </h3>
                        <p className="text-[10px] text-on-surface-variant mt-2">Ban dispute queue</p>
                      </div>
                      <div className="w-12 h-12 bg-tertiary/10 rounded-2xl flex items-center justify-center text-tertiary shrink-0">
                        <FileCheck className="w-6 h-6" />
                      </div>
                    </div>
                  </div>

                  {/* System Configuration Controls */}
                  <div className="bg-white dark:bg-surface-container-lowest border border-outline-variant/30 rounded-3xl p-6 md:p-8 shadow-sm">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
                        <Settings className="w-4 h-4" />
                      </div>
                      <h3 className="font-plus-jakarta font-bold text-lg">System Configuration & Security</h3>
                    </div>
                    <p className="text-sm text-on-surface-variant mb-6">Manage global registration flows, authentication rules, and API triggers.</p>
                    
                    <div className="space-y-4">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between p-5 bg-surface-container-low rounded-2xl border border-outline-variant/10 gap-4">
                        <div className="space-y-1 sm:pr-6">
                          <span className="font-bold text-sm block text-slate-800 dark:text-slate-100">Mobile SMS OTP Verification</span>
                          <span className="text-xs text-on-surface-variant block leading-relaxed">
                            Toggle whether users must verify their phone number via SMS OTP during signup. When disabled, the signup form still captures the mobile number, but skips SMS verification.
                          </span>
                        </div>
                        
                        <button
                          type="button"
                          onClick={toggleMobileOtp}
                          className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out outline-none focus:ring-2 focus:ring-primary/20 self-start sm:self-auto ${
                            mobileOtpEnabled ? "bg-primary" : "bg-slate-300"
                          }`}
                        >
                          <span
                            className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                              mobileOtpEnabled ? "translate-x-5" : "translate-x-0"
                            }`}
                          />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Server Engine Indicators */}
                  <div className="bg-white dark:bg-surface-container-lowest border border-outline-variant/30 rounded-3xl p-6 md:p-8 shadow-sm">
                    <h3 className="font-plus-jakarta font-bold text-lg mb-6">Database Triggers & Webhooks status</h3>
                    <div className="space-y-4">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-surface-container-low rounded-2xl border border-outline-variant/10 gap-2">
                        <div className="flex items-center gap-3">
                          <div className="w-2.5 h-2.5 bg-primary-container rounded-full animate-ping"></div>
                          <span className="font-semibold text-sm">on_auth_user_created</span>
                        </div>
                        <span className="text-xs text-on-surface-variant">Profile initialization trigger active</span>
                      </div>
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-surface-container-low rounded-2xl border border-outline-variant/10 gap-2">
                        <div className="flex items-center gap-3">
                          <div className="w-2.5 h-2.5 bg-primary-container rounded-full animate-ping"></div>
                          <span className="font-semibold text-sm">handle_friendship_status_update</span>
                        </div>
                        <span className="text-xs text-on-surface-variant">Mutual log sync trigger active</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Subview: User list Moderation */}
              {activeTab === "users" && (
                <div className="bg-white dark:bg-surface-container-lowest border border-outline-variant/30 rounded-3xl p-4 md:p-6 shadow-sm space-y-6">
                  
                  <div className="relative group max-w-md">
                    <Search className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-outline" />
                    <input 
                      type="text"
                      placeholder="Search user profile records..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full bg-surface border border-outline-variant/20 rounded-xl pl-12 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                    />
                  </div>

                  <div className="overflow-x-auto border border-outline-variant/20 rounded-2xl">
                    <table className="w-full min-w-[800px] text-left border-collapse text-sm">
                      <thead>
                        <tr className="border-b border-outline-variant/20 text-xs font-bold uppercase tracking-wider text-outline bg-surface-container-low">
                          <th className="py-4 px-4">Name</th>
                          <th className="py-4 px-4">Email</th>
                          <th className="py-4 px-4">Mobile Number</th>
                          <th className="py-4 px-4">Status</th>
                          <th className="py-4 px-4">Warning Flags</th>
                          <th className="py-4 px-4">Joined Date</th>
                          <th className="py-4 px-4 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {users.filter(u => 
                          (u.full_name || '').toLowerCase().includes(searchQuery.toLowerCase()) || 
                          (u.username || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                          (u.email || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                          (u.mobile_number || '').toLowerCase().includes(searchQuery.toLowerCase())
                        ).map((user) => (
                          <tr key={user.id} className="border-b border-outline-variant/10 hover:bg-surface-container-low transition-colors">
                            <td className="py-4 px-4 font-semibold">{user.full_name} (@{user.username})</td>
                            <td className="py-4 px-4 text-on-surface-variant">{user.email}</td>
                            <td className="py-4 px-4 text-on-surface-variant">{user.mobile_number || 'N/A'}</td>
                            <td className="py-4 px-4">
                              <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase ${
                                user.account_status === "active" ? "bg-primary/10 text-primary" : 
                                user.account_status === "suspended" ? "bg-amber-500/10 text-amber-600" : "bg-red-500/10 text-red-600"
                              }`}>
                                {user.account_status}
                              </span>
                            </td>
                            <td className="py-4 px-4 font-mono font-semibold">0</td>
                            <td className="py-4 px-4 text-on-surface-variant">{new Date(user.created_at).toLocaleDateString()}</td>
                            <td className="py-4 px-4 text-right flex justify-end gap-2">
                              {user.account_status !== "active" && (
                                <button 
                                  onClick={() => updateUserStatus(user.id, "active")}
                                  className="px-3 py-1.5 bg-primary/15 text-primary text-xs font-bold rounded-lg hover:bg-primary/20 transition-all"
                                >
                                  Unban
                                </button>
                              )}
                              {user.account_status === "active" && (
                                <>
                                  <button 
                                    onClick={() => updateUserStatus(user.id, "suspended")}
                                    className="px-3 py-1.5 bg-amber-500/15 text-amber-600 text-xs font-bold rounded-lg hover:bg-amber-500/20 transition-all"
                                  >
                                    Suspend
                                  </button>
                                  <button 
                                    onClick={() => updateUserStatus(user.id, "banned")}
                                    className="px-3 py-1.5 bg-red-500/15 text-red-600 text-xs font-bold rounded-lg hover:bg-red-500/20 transition-all"
                                  >
                                    Ban
                                  </button>
                                </>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {activeTab === "chats" && (
                <div className="space-y-5">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="bg-white dark:bg-surface-container-lowest border border-outline-variant/30 rounded-2xl p-5">
                      <p className="text-xs uppercase tracking-wider text-outline font-bold">Chats</p>
                      <p className="text-3xl font-extrabold mt-1">{monitoredChats.length}</p>
                    </div>
                    <div className="bg-white dark:bg-surface-container-lowest border border-outline-variant/30 rounded-2xl p-5">
                      <p className="text-xs uppercase tracking-wider text-outline font-bold">Groups</p>
                      <p className="text-3xl font-extrabold mt-1">{monitoredChats.filter(chat => chat.type !== "direct").length}</p>
                    </div>
                    <div className="bg-white dark:bg-surface-container-lowest border border-outline-variant/30 rounded-2xl p-5">
                      <p className="text-xs uppercase tracking-wider text-outline font-bold">Loaded Messages</p>
                      <p className="text-3xl font-extrabold mt-1">{monitoredChats.reduce((sum, chat) => sum + chat.messageCount, 0)}</p>
                    </div>
                  </div>

                  {monitoredChats.length === 0 ? (
                    <div className="bg-white dark:bg-surface-container-lowest border border-outline-variant/30 rounded-3xl p-10 text-center text-on-surface-variant">No chats have been created.</div>
                  ) : monitoredChats.map(chat => (
                    <section key={chat.id} className="bg-white dark:bg-surface-container-lowest border border-outline-variant/30 rounded-3xl p-6 shadow-sm">
                      <div className="flex flex-wrap items-start justify-between gap-3 mb-5">
                        <div>
                          <h3 className="font-bold text-lg">{chat.title || (chat.type === "direct" ? "Direct conversation" : "Untitled chat")}</h3>
                          <p className="text-xs text-on-surface-variant mt-1">{chat.type} · {chat.memberCount} members · {chat.messageCount} messages</p>
                        </div>
                        <span className="text-xs text-outline">Updated {new Date(chat.updated_at).toLocaleString()}</span>
                      </div>
                      <div className="space-y-2">
                        {chat.recentMessages.length === 0 ? (
                          <p className="text-sm text-on-surface-variant">No messages in this chat.</p>
                        ) : chat.recentMessages.slice(0, 5).map((message: any) => (
                          <div key={message.id} className="rounded-xl bg-surface-container-low border border-outline-variant/10 p-3">
                            <div className="flex justify-between gap-3 text-[10px] text-outline mb-1">
                              <span className="font-bold">{message.sender?.full_name || message.sender?.username || "Unknown user"} · {message.message_type}</span>
                              <span>{new Date(message.created_at).toLocaleString()}</span>
                            </div>
                            <p className="text-sm break-words">{message.deleted_at ? "[Deleted message]" : (message.content || `[${message.message_type}]`)}</p>
                          </div>
                        ))}
                      </div>
                    </section>
                  ))}
                </div>
              )}

              {activeTab === "calls" && (
                <div className="bg-white dark:bg-surface-container-lowest border border-outline-variant/30 rounded-3xl p-4 md:p-6 shadow-sm overflow-x-auto">
                  <table className="w-full min-w-[700px] text-left text-sm">
                    <thead>
                      <tr className="border-b border-outline-variant/20 text-xs uppercase tracking-wider text-outline bg-surface-container-low">
                        <th className="p-3">Type / Channel</th>
                        <th className="p-3">Host</th>
                        <th className="p-3">Status</th>
                        <th className="p-3">Participants</th>
                        <th className="p-3">Started</th>
                        <th className="p-3">Duration</th>
                      </tr>
                    </thead>
                    <tbody>
                      {monitoredCalls.map(call => {
                        const end = call.ended_at ? new Date(call.ended_at).getTime() : Date.now();
                        const seconds = Math.max(0, Math.floor((end - new Date(call.created_at).getTime()) / 1000));
                        return (
                          <tr key={call.id} className="border-b border-outline-variant/10 hover:bg-surface-container-low transition-colors">
                            <td className="p-3"><strong>{call.type}</strong><p className="text-xs text-outline">{call.channel_name}</p></td>
                            <td className="p-3">{call.host?.full_name || call.host?.username || "Unknown"}</td>
                            <td className="p-3"><span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase ${call.status === "connected" ? "bg-emerald-500/10 text-emerald-600" : "bg-surface-container-high text-on-surface-variant"}`}>{call.status}</span></td>
                            <td className="p-3">{call.participants?.length || 0}</td>
                            <td className="p-3 text-xs">{new Date(call.created_at).toLocaleString()}</td>
                            <td className="p-3">{Math.floor(seconds / 60)}m {seconds % 60}s</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                  {monitoredCalls.length === 0 && <p className="py-10 text-center text-on-surface-variant">No call records available.</p>}
                </div>
              )}

              {activeTab === "guests" && (
                <div className="space-y-5">
                  <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-5 text-sm text-amber-800 dark:text-amber-200">
                    Guest monitoring lists Supabase anonymous Auth sessions. Anonymous sign-in is currently disabled in this project, so this list will remain empty until that Auth feature is enabled and a guest-login UI is added.
                  </div>
                  <div className="bg-white dark:bg-surface-container-lowest border border-outline-variant/30 rounded-3xl p-6">
                    <h3 className="font-bold mb-4">Guest sessions ({guestAccounts.length})</h3>
                    {guestAccounts.length === 0 ? <p className="text-sm text-on-surface-variant">No guest accounts found.</p> : guestAccounts.map(guest => (
                      <div key={guest.id} className="flex justify-between gap-4 border-b border-outline-variant/10 py-3 text-sm">
                        <span className="font-mono text-xs">{guest.id}</span>
                        <span>Created {new Date(guest.createdAt).toLocaleString()}</span>
                        <span>Last active {guest.lastSignInAt ? new Date(guest.lastSignInAt).toLocaleString() : "Never"}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Subview: Appeals Review */}
              {activeTab === "appeals" && (
                <div className="space-y-6">
                  {appeals.length === 0 ? (
                    <div className="bg-white dark:bg-surface-container-lowest border border-outline-variant/30 rounded-3xl p-8 text-center text-on-surface-variant text-sm font-semibold">
                      No active ban appeals in the queue.
                    </div>
                  ) : (
                    appeals.map((appeal) => (
                      <div 
                        key={appeal.id}
                        className="bg-white dark:bg-surface-container-lowest border border-outline-variant/30 rounded-3xl p-6 md:p-8 shadow-sm flex flex-col gap-4 relative overflow-hidden"
                      >
                        <div className="flex flex-col sm:flex-row justify-between items-start gap-2">
                          <div>
                            <h3 className="font-plus-jakarta font-bold text-lg">{appeal.profiles?.full_name || 'Anonymous User'}</h3>
                            <p className="text-xs text-on-surface-variant mt-0.5">{appeal.profiles?.email || ''} • Submitted: {new Date(appeal.created_at).toLocaleDateString()}</p>
                          </div>
                          <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase self-start ${
                            appeal.status === "pending" ? "bg-amber-500/10 text-amber-600" : 
                            appeal.status === "approved" ? "bg-primary/10 text-primary" : "bg-red-500/10 text-red-600"
                          }`}>
                            {appeal.status}
                          </span>
                        </div>

                        <div className="bg-surface-container-low p-4 rounded-2xl border border-outline-variant/10 text-sm">
                          <p className="font-semibold text-xs text-outline uppercase tracking-wider mb-1.5">Original Ban Reason:</p>
                          <p className="text-on-surface-variant">{appeal.ban_reason}</p>
                        </div>

                        <div className="bg-primary/5 p-4 rounded-2xl border border-primary/10 text-sm">
                          <p className="font-semibold text-xs text-primary uppercase tracking-wider mb-1.5">Appeal Description:</p>
                          <p className="text-on-surface leading-relaxed italic">&quot;{appeal.appeal_text}&quot;</p>
                        </div>

                        {appeal.status === "pending" && (
                          <div className="flex flex-wrap gap-3 justify-end mt-2">
                            <button 
                              onClick={() => processAppeal(appeal.id, appeal.user_id, "approved")}
                              className="px-5 py-2.5 bg-primary text-white font-semibold text-xs rounded-xl flex items-center gap-1.5 hover:bg-primary/95 transition-all shadow-sm active:scale-95"
                            >
                              <CheckCircle className="w-4 h-4" />
                              <span>Accept Appeal & Reactivate</span>
                            </button>
                            <button 
                              onClick={() => processAppeal(appeal.id, appeal.user_id, "rejected")}
                              className="px-5 py-2.5 bg-red-600 text-white font-semibold text-xs rounded-xl flex items-center gap-1.5 hover:bg-red-700 transition-all shadow-sm active:scale-95"
                            >
                              <XCircle className="w-4 h-4" />
                              <span>Deny Appeal</span>
                            </button>
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              )}

              {/* Subview: Audit Logs */}
              {activeTab === "logs" && (
                <div className="bg-white dark:bg-surface-container-lowest border border-outline-variant/30 rounded-3xl p-4 md:p-6 shadow-sm space-y-4">
                  <div className="flex items-center justify-between pb-4 border-b border-outline-variant/20">
                    <h3 className="font-plus-jakarta font-bold text-base">Mod Action Log Feed</h3>
                    <span className="text-xs text-outline">Realtime activity sync</span>
                  </div>
                  <div className="space-y-4">
                    {logs.length === 0 ? (
                      <div className="text-center py-8 text-on-surface-variant text-sm">
                        No audit logs available.
                      </div>
                    ) : (
                      logs.map((log) => (
                        <div key={log.id} className="flex gap-4 items-start p-4 rounded-2xl hover:bg-surface-container-low transition-colors">
                          <div className="w-10 h-10 bg-error/5 border border-error/15 rounded-xl flex items-center justify-center text-error shrink-0">
                            <ShieldAlert className="w-5 h-5" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-baseline gap-1">
                              <p className="text-sm font-semibold text-on-surface">
                                {log.profiles?.full_name || 'System Admin'} <span className="font-normal text-on-surface-variant">performed action</span> {log.action}
                              </p>
                              <span className="text-[10px] text-outline shrink-0">{new Date(log.created_at).toLocaleString()}</span>
                            </div>
                            <p className="text-xs text-on-surface-variant mt-1">Role: {log.actor_role} • IP: {log.ip_address}</p>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </main>
    </div>
  );
}
