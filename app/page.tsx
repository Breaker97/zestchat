"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { User as SupabaseUser } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/browser";
import { motion } from "framer-motion";
import { 
  MessageSquare, 
  Video, 
  Volume2, 
  Lock, 
  Shield, 
  ArrowRight,
  Globe,
  Share2,
  Mail,
  Menu,
  X,
  Sparkles
} from "lucide-react";

export default function Home() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [user, setUser] = useState<SupabaseUser | null>(null);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => setUser(data.user));

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => listener.subscription.unsubscribe();
  }, []);

  const userInitial = (user?.user_metadata?.full_name || user?.email || "U").charAt(0).toUpperCase();

  // Animations configuration
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1, delayChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { y: 25, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: { type: "spring" as const, stiffness: 90, damping: 14 }
    }
  };

  return (
    <div className="min-h-screen bg-white text-slate-900 selection:bg-emerald-100 selection:text-emerald-900 flex flex-col font-sans overflow-x-hidden relative">
      
      {/* Subtle top grid background effect */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#e2e8f0_1px,transparent_1px),linear-gradient(to_bottom,#e2e8f0_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] -z-20 opacity-60"></div>

      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-100 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <motion.div 
            whileHover={{ scale: 1.05 }}
            className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-600 shadow-sm cursor-pointer"
          >
            <MessageSquare className="w-5 h-5 fill-emerald-600 text-emerald-600" />
          </motion.div>
          <span className="font-plus-jakarta font-extrabold text-2xl tracking-tight text-slate-900">
            ZestChat
          </span>
        </div>

        <nav className="hidden md:flex items-center gap-8 font-inter font-semibold text-[13px] text-slate-500">
          <Link href="/chats" className="hover:text-slate-900 transition-colors">Messages</Link>
          <Link href="/friends" className="hover:text-slate-900 transition-colors">Communities</Link>
          <Link href="/friends" className="hover:text-slate-900 transition-colors">Friends</Link>
          <Link href="/settings" className="hover:text-slate-900 transition-colors">Settings</Link>
        </nav>

        <div className="hidden md:flex items-center gap-4">
          {!user ? (
            <>
              <Link href="/login" className="px-4 py-2 text-sm font-bold text-slate-600 hover:text-slate-950 transition-colors">Log In</Link>
              <Link href="/signup" className="px-5 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-bold rounded-full shadow-sm transition-colors">Sign Up</Link>
            </>
          ) : (
            <>
          <button className="p-2 text-slate-400 hover:text-slate-950 transition-colors relative">
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-emerald-500 rounded-full"></span>
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
          </button>
          
          <Link href="/settings" className="w-9 h-9 rounded-full bg-slate-100 overflow-hidden border border-slate-200 block">
            {/* User Profile Avatar Placeholder */}
            <div className="w-full h-full bg-gradient-to-tr from-emerald-400 to-teal-500 flex items-center justify-center text-white font-bold text-xs">
              {userInitial}
            </div>
          </Link>
              <Link href="/chats" className="px-4 py-2.5 bg-emerald-50 text-emerald-700 rounded-full text-xs font-bold">Logged in</Link>
            </>
          )}
        </div>

        {/* Mobile Menu Button */}
        <button 
          className="md:hidden p-2 text-slate-500 hover:text-slate-900 transition-colors"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        >
          {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </header>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="md:hidden fixed inset-x-0 top-[73px] z-40 bg-white border-b border-slate-200 p-6 flex flex-col gap-4 shadow-xl"
        >
          <Link href="/chats" onClick={() => setMobileMenuOpen(false)} className="py-2 font-semibold border-b border-slate-100 text-slate-600">Messages</Link>
          <Link href="/friends" onClick={() => setMobileMenuOpen(false)} className="py-2 font-semibold border-b border-slate-100 text-slate-600">Communities</Link>
          <Link href="/friends" onClick={() => setMobileMenuOpen(false)} className="py-2 font-semibold border-b border-slate-100 text-slate-600">Friends</Link>
          <Link href="/settings" onClick={() => setMobileMenuOpen(false)} className="py-2 font-semibold border-b border-slate-100 text-slate-600">Settings</Link>
          <div className="flex gap-4 pt-2">
            {user ? (
              <Link href="/chats" className="flex-1 text-center py-2.5 bg-emerald-500 text-white rounded-xl font-semibold text-xs shadow-sm">Logged in · Open Chats</Link>
            ) : (
              <>
                <Link href="/login" className="flex-1 text-center py-2.5 border border-slate-200 rounded-xl font-semibold text-xs">Log In</Link>
                <Link href="/signup" className="flex-1 text-center py-2.5 bg-emerald-500 text-white rounded-xl font-semibold text-xs shadow-sm">Sign Up</Link>
              </>
            )}
          </div>
        </motion.div>
      )}

      {/* Hero Section */}
      <section className="relative pt-20 pb-20 px-6 flex flex-col items-center text-center max-w-4xl mx-auto z-10">
        
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4 }}
          className="inline-flex items-center bg-emerald-500/10 border border-emerald-500/20 px-4 py-1.5 rounded-full text-emerald-600 font-extrabold text-[10px] tracking-wider uppercase mb-8"
        >
          Vibrant Social Experience
        </motion.div>

        <motion.h1 
          initial={{ opacity: 0, y: 25 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.05 }}
          className="font-plus-jakarta font-extrabold text-4xl sm:text-5xl md:text-[64px] leading-[1.1] md:leading-[72px] tracking-tight text-slate-900 mb-8"
        >
          Secure Connection.<br />
          <span className="italic font-bold text-emerald-500">
            Crystal Clear Calls.
          </span><br />
          Free for Everyone.
        </motion.h1>

        <motion.p 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.15 }}
          className="font-inter text-slate-500 text-sm sm:text-base max-w-xl mb-10 leading-relaxed"
        >
          Experience high-fidelity video calls, immersive audio rooms, and end-to-end encrypted chats on the world's most breathable social platform.
        </motion.p>

        <motion.div 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.25 }}
          className="flex flex-row gap-4 justify-center items-center w-full max-w-md"
        >
          <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
            <Link href={user ? "/chats" : "/signup"} className="px-6 py-3 bg-emerald-500 text-white font-bold text-[13px] rounded-full shadow-md hover:bg-emerald-600 transition-all flex items-center justify-center gap-2">
              {user ? "Open ZestChat" : "Create Free Account"}
            </Link>
          </motion.div>
          
          <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
            <Link href="/friends" className="px-6 py-3 bg-white border border-slate-200 text-slate-600 font-bold text-[13px] rounded-full hover:bg-slate-50 transition-all block text-center">
              Explore Communities
            </Link>
          </motion.div>
        </motion.div>
      </section>

      {/* Feature Cards Grid (3 Cards matching diagram styles) */}
      <section className="px-6 pb-24 max-w-5xl mx-auto w-full">
        <motion.div 
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          className="grid grid-cols-1 md:grid-cols-3 gap-6"
        >
          
          {/* Card 1: High-Def Video Calls */}
          <motion.div 
            variants={itemVariants}
            className="bg-white border border-slate-100 rounded-[32px] p-6 hover:shadow-xl hover:border-slate-200/50 transition-all flex flex-col justify-between h-[360px] relative overflow-hidden"
          >
            <div>
              <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-600 mb-6">
                <Video className="w-5 h-5 fill-emerald-600 text-emerald-600" />
              </div>
              <h3 className="font-plus-jakarta font-bold text-lg text-slate-900 mb-2">High-Def Video Calls</h3>
              <p className="text-slate-400 text-xs leading-relaxed">
                Low-latency 4K streaming for meetings, hangouts, and deep work sessions with crystal clarity.
              </p>
            </div>
            
            {/* Card Diagram: Desktop Screen with Circles */}
            <div className="h-28 bg-slate-50 border border-slate-100 rounded-2xl relative flex items-center justify-center overflow-hidden">
              <div className="w-24 h-16 bg-white border border-slate-200 rounded-xl relative shadow-sm flex flex-col p-1.5">
                <div className="w-full flex-1 bg-slate-50 rounded-lg flex items-end justify-end p-1 gap-1">
                  <div className="w-2.5 h-2.5 rounded-full bg-slate-200"></div>
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-400"></div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Card 2: Immersive Audio */}
          <motion.div 
            variants={itemVariants}
            className="bg-white border border-slate-100 rounded-[32px] p-6 hover:shadow-xl hover:border-slate-200/50 transition-all flex flex-col justify-between h-[360px] relative overflow-hidden"
          >
            <div>
              <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-600 mb-6">
                <Volume2 className="w-5 h-5 text-emerald-600" />
              </div>
              <h3 className="font-plus-jakarta font-bold text-lg text-slate-900 mb-2">Immersive Audio</h3>
              <p className="text-slate-400 text-xs leading-relaxed">
                Spatial audio technology that makes group conversations feel natural, like you're in the same room.
              </p>
            </div>
            
            {/* Card Diagram: Audio bar graph levels */}
            <div className="h-28 bg-slate-50 border border-slate-100 rounded-2xl relative flex items-end justify-center pb-6 gap-2">
              <div className="w-2 h-6 bg-emerald-500 rounded-full"></div>
              <div className="w-2 h-10 bg-emerald-500 rounded-full"></div>
              <div className="w-2 h-16 bg-emerald-500 rounded-full animate-pulse"></div>
              <div className="w-2 h-12 bg-emerald-500 rounded-full"></div>
              <div className="w-2 h-7 bg-emerald-500 rounded-full"></div>
            </div>
          </motion.div>

          {/* Card 3: Secure Messaging */}
          <motion.div 
            variants={itemVariants}
            className="bg-white border border-slate-100 rounded-[32px] p-6 hover:shadow-xl hover:border-slate-200/50 transition-all flex flex-col justify-between h-[360px] relative overflow-hidden"
          >
            <div>
              <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-600 mb-6">
                <Lock className="w-5 h-5 fill-emerald-600 text-emerald-600" />
              </div>
              <h3 className="font-plus-jakarta font-bold text-lg text-slate-900 mb-2">Secure Messaging</h3>
              <p className="text-slate-400 text-xs leading-relaxed">
                End-to-end encryption by default. Your private messages and data remain entirely your own.
              </p>
            </div>
            
            {/* Card Diagram: Chat bubbles */}
            <div className="h-28 bg-slate-50 border border-slate-100 rounded-2xl relative flex flex-col justify-center px-6 gap-3">
              <div className="w-28 h-4 bg-slate-200/60 rounded-full self-start"></div>
              <div className="w-36 h-4 bg-emerald-100 rounded-full self-end"></div>
            </div>
          </motion.div>

        </motion.div>
      </section>

      {/* Elevate Your Presence Section (Light blue background, asymmetric layout) */}
      <section className="py-24 bg-[#F5F7FB] border-y border-slate-100 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="font-plus-jakarta font-extrabold text-3xl md:text-[40px] text-slate-900 tracking-tight mb-3">
              Elevate Your Presence
            </h2>
            <p className="text-slate-500 text-sm">
              Communication designed for the modern mix—secure, vibrant, and distraction-free.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
            
            {/* Asymmetric Light Card - occupies 3 columns */}
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="md:col-span-3 bg-white border border-slate-100 rounded-[32px] p-8 md:p-10 flex flex-col justify-between h-[340px] relative overflow-hidden"
            >
              <div>
                <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-600 mb-6">
                  <Sparkles className="w-5 h-5 fill-emerald-600 text-emerald-600" />
                </div>
                <h3 className="font-plus-jakarta font-extrabold text-2xl text-slate-900 mb-4">Sophisticated Vitality</h3>
                <p className="text-slate-400 text-xs sm:text-sm leading-relaxed max-w-md">
                  Our interface uses breathable geometry and organic precision to reduce cognitive load, making long community discussions feel refreshing rather than exhausting.
                </p>
              </div>

              <Link href="/support" className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-500 hover:text-emerald-600 transition-colors mt-4">
                <span>Learn about our philosophy</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>

              {/* Decorative side leaf overlay */}
              <div className="absolute right-0 bottom-0 w-32 h-32 bg-emerald-50/40 rounded-tl-full -mr-8 -mb-8 pointer-events-none"></div>
            </motion.div>

            {/* Asymmetric Dark Card - occupies 2 columns */}
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="md:col-span-2 bg-[#1A2332] rounded-[32px] p-8 md:p-10 flex flex-col justify-between h-[340px] text-white relative overflow-hidden shadow-lg"
            >
              <div>
                <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center text-white mb-6">
                  <Shield className="w-5 h-5 text-white" />
                </div>
                <h3 className="font-plus-jakarta font-extrabold text-2xl mb-4">Always Encrypted</h3>
                <p className="text-slate-400 text-xs sm:text-sm leading-relaxed">
                  State-of-the-art E2E encryption for all calls and messages. Your private world stays private.
                </p>
              </div>

              {/* Watermark lock layout in background */}
              <div className="absolute right-6 bottom-6 opacity-[0.03] pointer-events-none">
                <Lock className="w-32 h-32 text-white" />
              </div>
            </motion.div>

          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 px-6 text-center max-w-3xl mx-auto">
        <h2 className="font-plus-jakarta font-extrabold text-3xl md:text-[40px] text-slate-900 tracking-tight mb-4">
          Ready for a better connection?
        </h2>
        <p className="text-slate-500 text-sm mb-10 max-w-lg mx-auto">
          Join over 2 million users enjoying high-fidelity calls and secure chats on ZestChat. It's free forever.
        </p>

        <div className="flex flex-row gap-4 justify-center items-center">
          <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
            <Link href="/signup" className="px-6 py-3 bg-[#004A26] hover:bg-[#00361C] text-white font-bold text-[13px] rounded-full shadow-md transition-all">
              Get ZestChat Free
            </Link>
          </motion.div>
          
          <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
            <Link href="/contact" className="px-6 py-3 bg-white border border-emerald-800/20 text-[#004A26] font-bold text-[13px] rounded-full hover:bg-slate-50 transition-all">
              Talk to Sales
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-100 py-16 px-6 bg-white text-slate-500 text-xs mt-auto">
        <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
          
          {/* Brand Col */}
          <div className="md:col-span-2 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-emerald-50 rounded-lg flex items-center justify-center text-emerald-600">
                <MessageSquare className="w-4 h-4 fill-emerald-600 text-emerald-600" />
              </div>
              <span className="font-plus-jakarta font-bold text-lg text-slate-900">ZestChat</span>
            </div>
            <p className="text-slate-400 leading-relaxed max-w-sm">
              Building the world's most vibrant and secure spaces for digital community life.
            </p>
            <div className="flex gap-4 text-slate-400">
              <motion.a href="#" whileHover={{ scale: 1.1 }} className="hover:text-emerald-500"><Share2 className="w-4 h-4" /></motion.a>
              <motion.a href="#" whileHover={{ scale: 1.1 }} className="hover:text-emerald-500"><Globe className="w-4 h-4" /></motion.a>
              <motion.a href="#" whileHover={{ scale: 1.1 }} className="hover:text-emerald-500"><Mail className="w-4 h-4" /></motion.a>
            </div>
          </div>

          {/* Platform Link Col */}
          <div>
            <h5 className="font-bold text-slate-900 mb-4 uppercase tracking-wider text-[10px]">Platform</h5>
            <ul className="space-y-3 font-semibold text-slate-400">
              <li><Link href="/chats" className="hover:text-slate-900 transition-colors">Download</Link></li>
              <li><Link href="/support" className="hover:text-slate-900 transition-colors">Status</Link></li>
              <li><Link href="/contact" className="hover:text-slate-900 transition-colors">Safety</Link></li>
            </ul>
          </div>

          {/* Company Link Col */}
          <div>
            <h5 className="font-bold text-slate-900 mb-4 uppercase tracking-wider text-[10px]">Company</h5>
            <ul className="space-y-3 font-semibold text-slate-400">
              <li><Link href="/contact" className="hover:text-slate-900 transition-colors">About</Link></li>
              <li><Link href="/contact" className="hover:text-slate-900 transition-colors">Jobs</Link></li>
            </ul>
          </div>

        </div>

        {/* Bottom Line */}
        <div className="max-w-5xl mx-auto border-t border-slate-100 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-slate-400">
          <div>
            <span>© {new Date().getFullYear()} ZestChat Inc. All rights reserved.</span>
          </div>
          <div className="flex gap-6 font-semibold">
            <Link href="/terms" className="hover:text-slate-900 transition-colors">Terms</Link>
            <Link href="/privacy" className="hover:text-slate-900 transition-colors">Privacy</Link>
            <span className="cursor-pointer hover:text-slate-900 flex items-center gap-1">
              <Globe className="w-3.5 h-3.5" /> English (US)
            </span>
          </div>
        </div>
      </footer>

    </div>
  );
}
