"use client";

import Link from "next/link";
import { useActionState } from "react";
import { forgotPasswordAction } from "@/lib/supabase/actions";
import { Mail, ArrowLeft, Loader2 } from "lucide-react";

export default function ForgotPasswordPage() {
  const [state, formAction, isPending] = useActionState(forgotPasswordAction, null);

  return (
    <div className="min-h-screen bg-background text-foreground flex items-center justify-center p-6 relative font-sans">
      <div className="w-full max-w-md bg-white dark:bg-surface-container-lowest border border-outline-variant/30 rounded-3xl p-8 shadow-xl flex flex-col gap-6">
        
        {/* Back Link */}
        <Link href="/login" className="inline-flex items-center gap-2 text-sm font-semibold text-on-surface-variant hover:text-primary transition-colors">
          <ArrowLeft className="w-4 h-4" />
          Back to Login
        </Link>

        <div>
          <h2 className="font-plus-jakarta font-extrabold text-2xl">Reset Password</h2>
          <p className="text-on-surface-variant text-sm mt-1">We will send a secure password-reset link to your email</p>
        </div>

        {/* Error Alert */}
        {state?.error && (
          <div className="bg-error/10 border border-error/20 text-error p-4 rounded-xl text-sm">
            {state.error}
          </div>
        )}
        {state?.success && (
          <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 p-4 rounded-xl text-sm">
            {state.success}
          </div>
        )}

        <form action={formAction} className="flex flex-col gap-5">
          <div className="flex flex-col gap-2">
            <label className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant">Email Address</label>
            <div className="relative">
              <Mail className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-outline-variant" />
              <input 
                name="email"
                type="email"
                required
                placeholder="elena@zestchat.com"
                className="w-full bg-surface-container-low border border-outline-variant/20 rounded-xl pl-12 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
              />
            </div>
          </div>

          <button 
            type="submit"
            disabled={isPending}
            className="w-full py-3.5 bg-primary text-white font-semibold rounded-xl shadow-md hover:bg-primary/95 hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 disabled:scale-100 transition-all flex items-center justify-center gap-2"
          >
            {isPending ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Generating OTP...</span>
              </>
            ) : (
              <span>Send OTP Code</span>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
