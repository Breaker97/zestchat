"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { 
  MessageSquare, 
  Users, 
  Phone, 
  ShieldAlert, 
  Settings, 
  LogOut,
  HelpCircle,
  Sparkles,
  Info
} from "lucide-react";
import { signOutAction, getCurrentUserProfile } from "@/lib/supabase/actions";

interface SidebarTab {
  icon: React.ReactNode;
  label: string;
  href: string;
}

export default function UserLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [profileOpen, setProfileOpen] = useState(false);
  const [profile, setProfile] = useState<any>(null);

  useEffect(() => {
    async function fetchProfile() {
      const res = await getCurrentUserProfile();
      if (res.data) {
        setProfile(res.data);
      }
    }
    fetchProfile();
  }, []);

  const tabs: SidebarTab[] = [
    {
      icon: <MessageSquare className="w-6 h-6" />,
      label: "Chats",
      href: "/chats"
    },
    {
      icon: <Users className="w-6 h-6" />,
      label: "Friends",
      href: "/friends"
    },
    {
      icon: <Phone className="w-6 h-6" />,
      label: "Calls",
      href: "/calls"
    },
    {
      icon: <HelpCircle className="w-6 h-6" />,
      label: "Support",
      href: "/support"
    },
    ...(profile?.admin_role && ['super_admin', 'admin', 'moderator', 'support_agent'].includes(profile.admin_role) ? [{
      icon: <ShieldAlert className="w-6 h-6" />,
      label: "Admin Panel",
      href: "/admin"
    }] : [])
  ];

  return (
    <div className="h-screen w-screen flex bg-background text-on-surface overflow-hidden">
      
      {/* Sidebar: Minimal Vertical Navigation */}
      <aside className="hidden md:flex w-20 lg:w-24 h-full glass border-r border-outline-variant/30 flex-col items-center py-6 gap-8 z-50 shrink-0">
        
        {/* ZestChat Brand Logo */}
        <div className="mb-4">
          <Link href="/" className="w-12 h-12 bg-primary-container rounded-xl flex items-center justify-center text-on-primary-container shadow-md hover:scale-105 transition-all">
            <MessageSquare className="w-6 h-6 text-primary" />
          </Link>
        </div>

        {/* Navigation Tabs */}
        <nav className="flex flex-col gap-6 flex-1 w-full items-center">
          {tabs.map((tab) => {
            const isActive = pathname.startsWith(tab.href);
            return (
              <Link 
                key={tab.label}
                href={tab.href}
                className={`group relative flex items-center justify-center w-12 h-12 rounded-xl transition-all duration-300 ${
                  isActive 
                    ? "bg-primary-container/10 text-primary active-tab-glow" 
                    : "text-on-surface-variant hover:bg-surface-container-high"
                }`}
                title={tab.label}
              >
                {tab.icon}
              </Link>
            );
          })}
        </nav>

        {/* Lower Actions */}
        <div className="mt-auto flex flex-col gap-6 items-center">
          
          {/* Settings */}
          <Link 
            href="/settings"
            className="group flex items-center justify-center w-12 h-12 rounded-xl transition-all duration-300 hover:bg-surface-container-high text-on-surface-variant"
            title="Settings"
          >
            <Settings className="w-6 h-6" />
          </Link>

          {/* Profile Avatar */}
          <div className="relative">
            <button 
              onClick={() => setProfileOpen(!profileOpen)}
              className="w-10 h-10 rounded-full border-2 border-primary ring-2 ring-white dark:ring-surface-container-lowest object-cover overflow-hidden hover:scale-105 transition-all"
            >
              <img 
                src={profile?.profile_photo_url || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&h=100&fit=crop"} 
                alt="Profile Avatar"
                className="w-full h-full object-cover"
              />
            </button>
            <span className="absolute bottom-0 right-0 w-3 h-3 bg-primary-container border-2 border-white dark:border-surface-container-lowest rounded-full"></span>
            
            {/* Popover Menu */}
            {profileOpen && (
              <div className="absolute left-14 bottom-0 bg-white dark:bg-surface-container-lowest border border-outline-variant/30 rounded-2xl p-2 w-48 shadow-xl flex flex-col gap-1 z-50">
                <div className="px-3 py-2 border-b border-outline-variant/10 text-left">
                  <p className="font-bold text-sm truncate">{profile?.full_name || "Zest User"}</p>
                  <p className="text-xs text-on-surface-variant truncate">{profile?.username ? `@${profile.username}` : "No username"}</p>
                </div>
                <Link href="/settings" className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-on-surface-variant hover:bg-surface-container-low transition-colors">
                  My Profile
                </Link>
                <form action={signOutAction} className="w-full">
                  <button type="submit" className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors text-left">
                    <LogOut className="w-4 h-4" />
                    <span>Sign Out</span>
                  </button>
                </form>
              </div>
            )}
          </div>
          
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 h-full relative overflow-hidden flex pb-20 md:pb-0">
        {children}
      </main>

      {/* Bottom Navigation Bar for Mobile Devices */}
      <nav className="fixed bottom-0 left-0 right-0 h-20 bg-surface/90 dark:bg-surface-container-lowest/90 backdrop-blur-xl flex justify-around items-center px-2 z-50 md:hidden pb-safe rounded-t-2xl shadow-[0_-4px_12px_rgba(0,0,0,0.03)]">
        {tabs.map((tab) => {
          const isActive = pathname.startsWith(tab.href);
          return (
            <Link 
              key={tab.label}
              href={tab.href}
                className={`flex flex-col items-center justify-center min-w-14 h-14 px-3 rounded-full transition-all duration-300 ${
                  isActive 
                  ? "bg-primary-container text-on-primary-container" 
                  : "text-on-surface-variant"
              }`}
              title={tab.label}
            >
              {tab.icon}
              <span className="text-[10px] font-semibold leading-none mt-1">{tab.label === 'Admin Panel' ? 'Admin' : tab.label}</span>
            </Link>
          );
        })}
        {/* Mobile Settings Link */}
        <Link 
          href="/settings"
          className={`flex flex-col items-center justify-center min-w-14 h-14 px-3 rounded-full transition-all duration-300 ${
            pathname.startsWith("/settings") ? "bg-primary-container text-on-primary-container" : "text-on-surface-variant"
          }`}
          title="Settings"
        >
          <Settings className="w-6 h-6" />
          <span className="text-[10px] font-semibold leading-none mt-1">Settings</span>
        </Link>
      </nav>

    </div>
  );
}
