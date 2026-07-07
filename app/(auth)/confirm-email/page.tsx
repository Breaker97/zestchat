import Link from "next/link";
import { MessageSquare, MailOpen } from "lucide-react";

export default function ConfirmEmailPage() {
  return (
    <div className="min-h-screen bg-background text-foreground flex items-center justify-center p-6 relative font-sans">
      <div className="w-full max-w-md bg-white dark:bg-surface-container-lowest border border-outline-variant/30 rounded-3xl p-8 shadow-xl flex flex-col gap-6 text-center">
        <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center text-primary mx-auto">
          <MailOpen className="w-8 h-8" />
        </div>

        <h2 className="font-plus-jakarta font-extrabold text-2xl">Check your inbox</h2>
        <p className="text-on-surface-variant text-sm leading-relaxed">
          We&apos;ve sent a verification link to your email address. Please click the link to confirm your account and activate your ZestChat access.
        </p>

        <div className="h-px bg-outline-variant/20 my-2"></div>

        <div className="flex flex-col gap-3">
          <Link href="/login" className="w-full py-3 bg-primary text-white font-semibold rounded-xl shadow-md hover:bg-primary/95 transition-all">
            Return to Login
          </Link>
          <Link href="/" className="text-sm font-semibold text-on-surface-variant hover:text-primary transition-colors">
            Back Home
          </Link>
        </div>
      </div>
    </div>
  );
}
