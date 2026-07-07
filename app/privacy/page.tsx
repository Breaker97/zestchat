import Link from "next/link";
import { MessageSquare, ArrowLeft } from "lucide-react";

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col font-sans">
      <header className="sticky top-0 z-50 glass border-b border-outline-variant/20 px-6 py-4 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-3">
          <div className="w-10 h-10 bg-primary-container rounded-xl flex items-center justify-center text-on-primary-container shadow-md">
            <MessageSquare className="w-6 h-6 text-primary" />
          </div>
          <span className="font-plus-jakarta font-extrabold text-2xl tracking-tight bg-gradient-to-r from-primary to-primary-container bg-clip-text text-transparent">
            ZestChat
          </span>
        </Link>
        <Link href="/" className="flex items-center gap-2 hover:text-primary transition-colors text-sm font-semibold">
          <ArrowLeft className="w-4 h-4" />
          Back Home
        </Link>
      </header>

      <main className="flex-1 max-w-3xl mx-auto py-16 px-6">
        <h1 className="font-plus-jakarta font-extrabold text-4xl mb-4">Privacy Policy</h1>
        <p className="text-on-surface-variant mb-8 text-sm">Last updated: July 6, 2026</p>

        <div className="prose prose-slate max-w-none space-y-6 text-on-surface-variant text-sm leading-relaxed">
          <section>
            <h2 className="font-plus-jakarta font-bold text-xl text-foreground mb-3">1. Information We Collect</h2>
            <p>
              We collect user account information (email, password, profile metadata like full name and username), message logs, call events, and files uploaded to our secure file vaults.
            </p>
          </section>

          <section>
            <h2 className="font-plus-jakarta font-bold text-xl text-foreground mb-3">2. Data Isolation and Access Control</h2>
            <p>
              We ensure strict database isolation. The database uses Row-Level security constraints. Other users cannot query your private chats, messages, or friends list unless explicitly permitted through system rules (e.g., accepted friendships).
            </p>
          </section>

          <section>
            <h2 className="font-plus-jakarta font-bold text-xl text-foreground mb-3">3. Audio and Video Streams</h2>
            <p>
              Call channels are generated and encrypted via our real-time media streams engine. ZestChat does not store active video or audio call data on its servers. Only metadata logs (call starts, call ends, and participants) are captured.
            </p>
          </section>

          <section>
            <h2 className="font-plus-jakarta font-bold text-xl text-foreground mb-3">4. Push Notifications</h2>
            <p>
              When push notifications are configured, device push tokens are registered in your profile devices table and transmitted to the notification delivery network to send alerts.
            </p>
          </section>

          <section>
            <h2 className="font-plus-jakarta font-bold text-xl text-foreground mb-3">5. Deletion of Account and Media</h2>
            <p>
              Users can request account deletion, which cascades through the database to delete all profiles, chats, friendships, and associated files in our media storage.
            </p>
          </section>
        </div>
      </main>

      <footer className="border-t border-outline-variant/20 py-8 px-6 text-center text-on-surface-variant text-xs bg-surface-container-lowest">
        <span>© {new Date().getFullYear()} ZestChat. All rights reserved.</span>
      </footer>
    </div>
  );
}
