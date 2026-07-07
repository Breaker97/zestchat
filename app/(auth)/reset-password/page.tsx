"use client";

import { useActionState } from "react";
import { resetPasswordAction } from "@/lib/supabase/actions";
import { Lock, Loader2, ArrowRight } from "lucide-react";
import { Suspense } from "react";

function ResetPasswordForm() {
  const [state, formAction, isPending] = useActionState(resetPasswordAction, null);

  return (
    <div className="min-h-screen bg-background text-foreground flex items-center justify-center p-6 relative font-sans">
      <div className="w-full max-w-md bg-white dark:bg-surface-container-lowest border border-outline-variant/30 rounded-3xl p-8 shadow-xl flex flex-col gap-6">
        
        <div>
          <h2 className="font-plus-jakarta font-extrabold text-2xl">New Password</h2>
          <p className="text-on-surface-variant text-sm mt-1">Please enter your new password to secure your account</p>
        </div>

        {/* Error Alert */}
        {state?.error && (
          <div className="bg-error/10 border border-error/20 text-error p-4 rounded-xl text-sm">
            {state.error}
          </div>
        )}

        <form action={formAction} className="flex flex-col gap-5">
          
          <div className="flex flex-col gap-2">
            <label className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant">New Password</label>
            <div className="relative">
              <Lock className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-outline-variant" />
              <input 
                name="password"
                type="password"
                required
                minLength={8}
                placeholder="Min. 8 characters"
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
                <span>Resetting...</span>
              </>
            ) : (
              <>
                <span>Save Password</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    }>
      <ResetPasswordForm />
    </Suspense>
  );
}
