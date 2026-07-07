"use client";

import { useState, useEffect } from "react";
import { 
  Settings, 
  User, 
  Lock, 
  Bell, 
  Volume2, 
  Eye, 
  Check, 
  Sparkles,
  Loader2,
  XCircle,
  CheckCircle2
} from "lucide-react";
import { getCurrentUserProfile, updateUserProfile, checkUsernameAvailabilityAction } from "@/lib/supabase/actions";

export default function SettingsPage() {
  const [activeSubTab, setActiveSubTab] = useState<"profile" | "privacy" | "notifications">("profile");
  const [mobileView, setMobileView] = useState<"menu" | "details">("menu");
  
  // Profile settings state
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [originalUsername, setOriginalUsername] = useState("");
  const [bio, setBio] = useState("");
  const [age, setAge] = useState("");
  const [referral, setReferral] = useState("other");
  const [isSaved, setIsSaved] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [loadingProfile, setLoadingProfile] = useState(true);

  // Username validation states
  const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(null);
  const [isCheckingUsername, setIsCheckingUsername] = useState(false);
  const [usernameError, setUsernameError] = useState("");

  // Verification status is displayed when set by the backend/admin workflow.
  const [verificationStatus, setVerificationStatus] = useState<"unverified" | "pending" | "verified">("unverified");

  // Privacy settings state
  const [findByName, setFindByName] = useState("everyone");
  const [seePhoto, setSeePhoto] = useState("friends");
  const [readReceipts, setReadReceipts] = useState(true);

  // Notifications settings state
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [pushEnabled, setPushEnabled] = useState(true);

  // Load current user profile details
  useEffect(() => {
    async function loadProfile() {
      setLoadingProfile(true);
      try {
        const res = await getCurrentUserProfile();
        if (res.data) {
          setName(res.data.full_name || "");
          setUsername(res.data.username || "");
          setOriginalUsername(res.data.username || "");
          setBio(res.data.bio || "");
          setAge(res.data.age ? String(res.data.age) : "");
          setReferral(res.data.referral || "other");
          if (res.data.verification_status) {
            setVerificationStatus(res.data.verification_status);
          }
        }
      } catch (err) {
        console.error("Failed to load profile:", err);
      } finally {
        setLoadingProfile(false);
      }
    }
    loadProfile();
  }, []);

  // Debounced username availability validation on keystroke
  useEffect(() => {
    if (!username) {
      setUsernameAvailable(null);
      setUsernameError("");
      return;
    }

    const cleanUsername = username.trim().toLowerCase();

    // Check formatting
    const isValidFormat = /^[a-zA-Z0-9_]{3,15}$/.test(cleanUsername);
    if (!isValidFormat) {
      setUsernameAvailable(null);
      setUsernameError("Username must be 3-15 alphanumeric characters or underscores.");
      return;
    }

    if (cleanUsername === originalUsername.toLowerCase()) {
      setUsernameAvailable(true);
      setUsernameError("");
      return;
    }

    const delayDebounce = setTimeout(async () => {
      setIsCheckingUsername(true);
      setUsernameError("");
      try {
        const res = await checkUsernameAvailabilityAction(cleanUsername);
        if (res && res.available !== undefined) {
          setUsernameAvailable(res.available);
          if (!res.available) {
            setUsernameError("This username is already taken.");
          }
        } else {
          setUsernameAvailable(null);
        }
      } catch (err) {
        console.error(err);
        setUsernameAvailable(null);
      } finally {
        setIsCheckingUsername(false);
      }
    }, 450);

    return () => clearTimeout(delayDebounce);
  }, [username, originalUsername]);

  const handleProfileSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");
    
    if (usernameError) {
      setErrorMessage(usernameError);
      return;
    }
    if (usernameAvailable === false) {
      setErrorMessage("Please choose a different username.");
      return;
    }

    const res = await updateUserProfile(name, username, bio);
    if (res.success) {
      setIsSaved(true);
      setOriginalUsername(username);
      setTimeout(() => setIsSaved(false), 3000);
    } else {
      setErrorMessage(res.error || "Failed to update profile.");
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-surface-container-lowest overflow-y-auto scrollbar-hide">
      
      {/* Header */}
      <header className="p-8 pb-4 shrink-0">
        <h1 className="font-plus-jakarta font-extrabold text-3xl text-on-surface flex items-center gap-2">
          <span>Account Settings</span>
          {verificationStatus === "verified" && (
            <span className="w-6 h-6 bg-emerald-500 rounded-full flex items-center justify-center text-white shrink-0 shadow-sm" title="Verified Account">
              <Check className="w-4 h-4 stroke-[3]" />
            </span>
          )}
        </h1>
        <p className="text-on-surface-variant text-sm mt-1">Configure your personal profile details, notification feeds, and security options.</p>
      </header>

      {/* Settings Grid */}
      <main className="flex-1 p-8 grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        
        {/* Left Sub-nav */}
        <section className={`bg-white dark:bg-surface-container-lowest border border-outline-variant/30 rounded-3xl p-4 shadow-sm flex flex-col gap-1 ${mobileView === "details" ? "hidden md:flex" : "flex"}`}>
          <button 
            onClick={() => { setActiveSubTab("profile"); setMobileView("details"); }}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold uppercase tracking-wider text-left transition-all ${activeSubTab === "profile" ? "bg-primary-container/10 text-primary" : "hover:bg-surface-container-low text-on-surface-variant"}`}
          >
            <User className="w-4.5 h-4.5" />
            <span>Profile Information</span>
          </button>
          <button 
            onClick={() => { setActiveSubTab("privacy"); setMobileView("details"); }}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold uppercase tracking-wider text-left transition-all ${activeSubTab === "privacy" ? "bg-primary-container/10 text-primary" : "hover:bg-surface-container-low text-on-surface-variant"}`}
          >
            <Eye className="w-4.5 h-4.5" />
            <span>Privacy & RLS Rules</span>
          </button>
          <button 
            onClick={() => { setActiveSubTab("notifications"); setMobileView("details"); }}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold uppercase tracking-wider text-left transition-all ${activeSubTab === "notifications" ? "bg-primary-container/10 text-primary" : "hover:bg-surface-container-low text-on-surface-variant"}`}
          >
            <Bell className="w-4.5 h-4.5" />
            <span>Notifications & Sounds</span>
          </button>
        </section>

        {/* Right Details Panel */}
        <section className={`lg:col-span-2 bg-white dark:bg-surface-container-lowest border border-outline-variant/30 rounded-3xl p-6 shadow-sm ${mobileView === "menu" ? "hidden md:block" : "block"}`}>
          
          {/* Back button for mobile view */}
          <button 
            onClick={() => setMobileView("menu")}
            className="md:hidden flex items-center gap-2 text-primary font-bold text-xs uppercase tracking-wider mb-6 bg-surface-container-low hover:bg-surface-container-high px-4 py-2.5 rounded-xl border border-outline-variant/10 transition-all w-fit"
          >
            ← Back to Categories
          </button>
          
          {isSaved && (
            <div className="bg-primary/10 border border-primary/20 text-primary p-4 rounded-2xl text-xs flex items-center gap-3 mb-6 animate-fadeIn">
              <Check className="w-5 h-5 animate-scaleIn" />
              <span>Settings updated successfully!</span>
            </div>
          )}

          {errorMessage && (
            <div className="bg-rose-50 border border-rose-200 text-rose-600 p-4 rounded-2xl text-xs flex items-center gap-3 mb-6 animate-fadeIn">
              <XCircle className="w-5 h-5 text-rose-500 animate-scaleIn" />
              <span>{errorMessage}</span>
            </div>
          )}

          {loadingProfile ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3 text-on-surface-variant">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
              <p className="text-xs font-semibold animate-pulse">Loading secure profile preferences...</p>
            </div>
          ) : (
            <>
              {activeSubTab === "profile" && (
            <form onSubmit={handleProfileSave} className="space-y-6">
              <div>
                <h3 className="font-plus-jakarta font-bold text-base">Public Profile</h3>
                <p className="text-xs text-on-surface-variant mt-0.5">Customize how other users find and view your profile information.</p>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">Full Name</label>
                <input 
                  type="text" 
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-surface border border-outline-variant/20 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">Username</label>
                <div className="relative">
                  <input 
                    type="text" 
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className={`w-full bg-surface border rounded-xl pl-4 pr-10 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all ${
                      usernameError ? 'border-red-500 focus:ring-red-500/10' :
                      usernameAvailable && username !== originalUsername ? 'border-emerald-500 focus:ring-emerald-500/10' : 'border-outline-variant/20'
                    }`}
                  />
                  <div className="absolute right-3.5 top-1/2 -translate-y-1/2 flex items-center justify-center pointer-events-none">
                    {isCheckingUsername && <Loader2 className="w-4 h-4 animate-spin text-primary" />}
                    {!isCheckingUsername && usernameAvailable === true && username !== originalUsername && <CheckCircle2 className="w-4 h-4 text-emerald-500" />}
                    {!isCheckingUsername && usernameError && <XCircle className="w-4 h-4 text-red-500" />}
                  </div>
                </div>
                {usernameError && (
                  <span className="text-[10px] text-red-500 font-semibold mt-0.5 px-1 block">{usernameError}</span>
                )}
                {!usernameError && usernameAvailable === true && username !== originalUsername && (
                  <span className="text-[10px] text-emerald-600 font-semibold mt-0.5 px-1 block">✓ Username is available!</span>
                )}
                {username === originalUsername && username && (
                  <span className="text-[10px] text-on-surface-variant italic mt-0.5 px-1 block">This is your current username.</span>
                )}
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">Bio Description</label>
                <textarea 
                  rows={3}
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  className="w-full bg-surface border border-outline-variant/20 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all resize-none"
                />
              </div>

              {/* Age and Referral (Read Only / Profile Info display) */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">Age</label>
                  <input 
                    type="number" 
                    value={age}
                    onChange={(e) => setAge(e.target.value)}
                    className="w-full bg-surface border border-outline-variant/20 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">How did you find us?</label>
                  <select 
                    value={referral}
                    onChange={(e) => setReferral(e.target.value)}
                    className="w-full bg-surface border border-outline-variant/20 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all outline-none font-semibold text-on-surface"
                  >
                    <option value="tiktok">TikTok</option>
                    <option value="google">Google Search</option>
                    <option value="ads">Social Media Ads</option>
                    <option value="friends">Friend Referral</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              </div>

              <button 
                type="submit"
                className="px-6 py-3 bg-primary text-white font-semibold text-xs rounded-xl shadow-md hover:bg-primary/95 transition-all animate-pulse"
              >
                Save Profile Changes
              </button>
            </form>
          )}

          {/* Tab: Privacy & RLS */}
          {activeSubTab === "privacy" && (
            <div className="space-y-6">
              <div>
                <h3 className="font-plus-jakarta font-bold text-base">Privacy Settings</h3>
                <p className="text-xs text-on-surface-variant mt-0.5">Control access rules and database RLS filtering constraints.</p>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-surface-container-low rounded-2xl border border-outline-variant/10">
                  <div>
                    <h4 className="font-semibold text-sm">Who can find me by name</h4>
                    <p className="text-[11px] text-on-surface-variant mt-0.5">Applies search filters to profile queries</p>
                  </div>
                  <select 
                    value={findByName} 
                    onChange={(e) => setFindByName(e.target.value)}
                    className="bg-white dark:bg-surface-container-lowest border border-outline-variant/20 rounded-lg text-xs font-semibold p-2 outline-none"
                  >
                    <option value="everyone">Everyone</option>
                    <option value="friends">Friends Only</option>
                    <option value="nobody">Nobody</option>
                  </select>
                </div>

                <div className="flex items-center justify-between p-4 bg-surface-container-low rounded-2xl border border-outline-variant/10">
                  <div>
                    <h4 className="font-semibold text-sm">Who can see my profile photo</h4>
                    <p className="text-[11px] text-on-surface-variant mt-0.5">Excludes media links in profile query responses</p>
                  </div>
                  <select 
                    value={seePhoto} 
                    onChange={(e) => setSeePhoto(e.target.value)}
                    className="bg-white dark:bg-surface-container-lowest border border-outline-variant/20 rounded-lg text-xs font-semibold p-2 outline-none"
                  >
                    <option value="everyone">Everyone</option>
                    <option value="friends">Friends Only</option>
                    <option value="nobody">Nobody</option>
                  </select>
                </div>

                <div className="flex items-center justify-between p-4 bg-surface-container-low rounded-2xl border border-outline-variant/10">
                  <div>
                    <h4 className="font-semibold text-sm">Read Receipts</h4>
                    <p className="text-[11px] text-on-surface-variant mt-0.5">Send message seen hooks to chat partners</p>
                  </div>
                  <button 
                    onClick={() => setReadReceipts(!readReceipts)}
                    className={`w-11 h-6 rounded-full transition-all relative ${readReceipts ? "bg-primary" : "bg-outline-variant"}`}
                  >
                    <span className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${readReceipts ? "left-6" : "left-1"}`}></span>
                  </button>
                </div>
              </div>

              <button 
                onClick={() => setIsSaved(true)}
                className="px-6 py-3 bg-primary text-white font-semibold text-xs rounded-xl shadow-md hover:bg-primary/95 transition-all"
              >
                Save Settings
              </button>
            </div>
          )}

          {/* Tab: Notifications */}
          {activeSubTab === "notifications" && (
            <div className="space-y-6">
              <div>
                <h3 className="font-plus-jakarta font-bold text-base">Alert Configurations</h3>
                <p className="text-xs text-on-surface-variant mt-0.5">Manage sound volumes and web push FCM notifications.</p>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-surface-container-low rounded-2xl border border-outline-variant/10">
                  <div>
                    <h4 className="font-semibold text-sm">Enable Message Sounds</h4>
                    <p className="text-[11px] text-on-surface-variant mt-0.5">Plays audio on incoming chat events</p>
                  </div>
                  <button 
                    onClick={() => setSoundEnabled(!soundEnabled)}
                    className={`w-11 h-6 rounded-full transition-all relative ${soundEnabled ? "bg-primary" : "bg-outline-variant"}`}
                  >
                    <span className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${soundEnabled ? "left-6" : "left-1"}`}></span>
                  </button>
                </div>

                <div className="flex items-center justify-between p-4 bg-surface-container-low rounded-2xl border border-outline-variant/10">
                  <div>
                    <h4 className="font-semibold text-sm">Web Push Notifications</h4>
                    <p className="text-[11px] text-on-surface-variant mt-0.5">Delivers alerts using Firebase FCM workers</p>
                  </div>
                  <button 
                    onClick={() => setPushEnabled(!pushEnabled)}
                    className={`w-11 h-6 rounded-full transition-all relative ${pushEnabled ? "bg-primary" : "bg-outline-variant"}`}
                  >
                    <span className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${pushEnabled ? "left-6" : "left-1"}`}></span>
                  </button>
                </div>
              </div>

              <button 
                onClick={() => setIsSaved(true)}
                className="px-6 py-3 bg-primary text-white font-semibold text-xs rounded-xl shadow-md hover:bg-primary/95 transition-all"
              >
                Save Settings
              </button>
            </div>
          )}
        </>
      )}

        </section>

      </main>

    </div>
  );
}
