"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { signInAction } from "@/lib/supabase/actions";
import { MessageSquare, Lock, Mail, Loader2, CheckCircle2, ArrowRight, Check, Eye, EyeOff } from "lucide-react";
import { Suspense } from "react";
import { useSearchParams } from "next/navigation";

function LoginForm() {
  const [state, formAction, isPending] = useActionState(signInAction, null);
  const searchParams = useSearchParams();
  const resetSuccess = searchParams.get("resetSuccess");
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex lg:grid lg:grid-cols-12 font-sans overflow-hidden">
      
      {/* Features Column (Visible on PC/Desktop, hidden on mobile) */}
      <div className="hidden lg:flex lg:col-span-5 bg-gradient-to-tr from-primary to-indigo-600 text-white p-12 flex-col justify-between relative overflow-hidden">
        {/* Decorative background shapes */}
        <div className="absolute -top-20 -left-20 w-80 h-80 bg-white/10 rounded-full blur-2xl"></div>
        <div className="absolute -bottom-40 -right-20 w-[400px] h-[400px] bg-indigo-500/30 rounded-full blur-3xl"></div>

        {/* Brand Header */}
        <Link href="/" className="flex items-center gap-2 relative z-10 hover:opacity-90 transition-opacity">
          <div className="w-10 h-10 bg-white/10 backdrop-blur-md border border-white/20 rounded-xl flex items-center justify-center text-white">
            <MessageSquare className="w-5 h-5" />
          </div>
          <span className="font-plus-jakarta font-extrabold text-xl tracking-tight">ZestChat</span>
        </Link>

        {/* Feature Highlights */}
        <div className="my-auto space-y-8 relative z-10">
          <div className="space-y-2">
            <span className="text-xs font-extrabold uppercase tracking-wider text-indigo-200">Premium Communication</span>
            <h1 className="text-4xl font-extrabold tracking-tight leading-tight">Connect with your community instantly.</h1>
          </div>

          <div className="space-y-6">
            <div className="flex gap-4">
              <div className="w-10 h-10 shrink-0 bg-white/10 rounded-xl flex items-center justify-center border border-white/10">
                <Check className="w-5 h-5 text-indigo-200 stroke-[3]" />
              </div>
              <div>
                <h3 className="font-bold text-base">Sub-Second Video & Audio Rooms</h3>
                <p className="text-sm text-indigo-100">Crystal-clear conference calls with ultra-low latency and HD stream quality.</p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="w-10 h-10 shrink-0 bg-white/10 rounded-xl flex items-center justify-center border border-white/10">
                <Check className="w-5 h-5 text-indigo-200 stroke-[3]" />
              </div>
              <div>
                <h3 className="font-bold text-base">End-to-End Encrypted Secure Chat</h3>
                <p className="text-sm text-indigo-100">Your privacy is guaranteed with our state-of-the-art secure chat vault.</p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="w-10 h-10 shrink-0 bg-white/10 rounded-xl flex items-center justify-center border border-white/10">
                <Check className="w-5 h-5 text-indigo-200 stroke-[3]" />
              </div>
              <div>
                <h3 className="font-bold text-base">Verified Badges & Moderation</h3>
                <p className="text-sm text-indigo-100">Engage in trusted workspaces with legal guidelines and green-tick verified profiles.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer info */}
        <div className="text-xs text-indigo-200 relative z-10">
          © {new Date().getFullYear()} ZestChat. All rights reserved.
        </div>
      </div>

      {/* Form Column */}
      <div className="flex-1 lg:col-span-7 flex items-center justify-center p-6 lg:p-12 relative bg-slate-50">
        {/* Background Animated Blobs (Light Theme) */}
        <div className="absolute inset-0 -z-10 flex items-center justify-center pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-[450px] h-[450px] bg-primary/8 rounded-full blur-[120px] animate-pulse"></div>
          <div className="absolute bottom-1/4 right-1/4 w-[350px] h-[350px] bg-indigo-600/5 rounded-full blur-[100px] animate-pulse duration-5000"></div>
        </div>

        <div className="w-full max-w-md bg-white/90 backdrop-blur-2xl border border-slate-200/80 rounded-3xl p-8 shadow-xl flex flex-col gap-6 transform hover:scale-[1.01] transition-all duration-500">
          
          {/* Header */}
          <div className="flex flex-col items-center gap-2 text-center">
            <Link href="/" className="w-12 h-12 bg-primary/10 border border-primary/20 rounded-2xl flex items-center justify-center text-primary shadow-sm hover:scale-105 hover:bg-primary/20 transition-all duration-300">
              <MessageSquare className="w-6 h-6 text-primary" />
            </Link>
            <h2 className="font-plus-jakarta font-extrabold text-2xl mt-4 tracking-tight text-slate-800">Welcome Back</h2>
            <p className="text-slate-500 text-sm">Sign in to resume chatting in ZestChat Communities</p>
          </div>

          {/* Success Alert */}
          {resetSuccess && (
            <div className="bg-emerald-55 border border-emerald-200 text-emerald-600 p-4 rounded-xl flex items-center gap-3 text-sm">
              <CheckCircle2 className="w-5 h-5 shrink-0" />
              <span>Password reset successfully. You can now log in.</span>
            </div>
          )}

          {/* Error Alert */}
          {state?.error && (
            <div className="bg-rose-50 border border-rose-200 text-rose-600 p-4 rounded-xl text-sm font-semibold">
              {state.error}
            </div>
          )}

          {/* Login Form */}
          <form action={formAction} className="flex flex-col gap-5">
            <div className="flex flex-col gap-2">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Email Address</label>
              <div className="relative group">
                <Mail className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors" />
                <input 
                  name="email"
                  type="email"
                  required
                  placeholder="name@company.com"
                  className="w-full bg-slate-100/50 border border-slate-200 hover:border-slate-300 focus:border-primary focus:bg-white rounded-xl pl-12 pr-4 py-3.5 text-sm outline-none focus:ring-4 focus:ring-primary/10 transition-all placeholder:text-slate-400 font-medium text-slate-800"
                />
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <div className="flex justify-between items-center">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Password</label>
                <Link href="/forgot-password" className="text-xs font-bold text-primary hover:text-primary/80 transition-colors">
                  Forgot Password?
                </Link>
              </div>
              <div className="relative group">
                <Lock className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors" />
                <input 
                  name="password"
                  type={showPassword ? "text" : "password"}
                  required
                  placeholder="••••••••"
                  className="w-full bg-slate-100/50 border border-slate-200 hover:border-slate-300 focus:border-primary focus:bg-white rounded-xl pl-12 pr-12 py-3.5 text-sm outline-none focus:ring-4 focus:ring-primary/10 transition-all placeholder:text-slate-400 font-medium text-slate-800"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <button 
              type="submit"
              disabled={isPending}
              className="w-full py-4 bg-primary text-white font-bold rounded-xl shadow-lg shadow-primary/20 hover:shadow-primary/30 hover:bg-primary/95 hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 disabled:scale-100 transition-all flex items-center justify-center gap-2 mt-2"
            >
              {isPending ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Accessing Hub...</span>
                </>
              ) : (
                <>
                  <span>Sign In to ZestChat</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <div className="text-center text-sm text-slate-500 mt-2">
            <span>Don&apos;t have an account yet? </span>
            <Link href="/signup" className="font-bold text-primary hover:text-primary/80 hover:underline transition-all">
              Create Account
            </Link>
          </div>

        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-slate-50 text-slate-900 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    }>
      <LoginForm />
    </Suspense>
  );
}
