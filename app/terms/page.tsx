import Link from "next/link";
import { MessageSquare, ArrowLeft } from "lucide-react";

export default function TermsPage() {
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
        <h1 className="font-plus-jakarta font-extrabold text-4xl mb-4">Terms of Service</h1>
        <p className="text-on-surface-variant mb-8 text-sm">Last updated: July 6, 2026</p>

        <div className="prose prose-slate max-w-none space-y-6 text-on-surface-variant text-sm leading-relaxed">
                  <section>
            <h2 className="font-plus-jakarta font-bold text-xl text-foreground mb-3">1. Acceptance of Terms</h2>
            <p>
              By registering, accessing, or using the ZestChat Premium platform, you agree to comply with and be bound by these Terms of Service. If you do not agree, you must immediately terminate use.
            </p>
          </section>

          <section>
            <h2 className="font-plus-jakarta font-bold text-xl text-foreground mb-3">2. Age Requirement and Eligibility</h2>
            <p>
              You must be at least 18 years of age to register or use ZestChat. Registering an account or using the platform if you are under 18 is strictly prohibited. If we discover that a user is under 18, we will immediately ban and delete their account.
            </p>
          </section>

          <section>
            <h2 className="font-plus-jakarta font-bold text-xl text-foreground mb-3">3. Account Safety and Credentials</h2>
            <p>
              You are responsible for keeping your email, password, and reset OTP credentials secure. Sharing account credentials is strictly prohibited. ZestChat reserves the right to suspend accounts with suspicious authorization patterns.
            </p>
          </section>

          <section>
            <h2 className="font-plus-jakarta font-bold text-xl text-foreground mb-3">4. Messaging and Code of Conduct</h2>
            <p>
              ZestChat reserves the right to moderate content. Spam, harassment, phishing, or distributing inappropriate media files will result in account restriction, bans, and reporting to legal authorities.
            </p>
          </section>

          <section>
            <h2 className="font-plus-jakarta font-bold text-xl text-foreground mb-3">5. Media and File Storage</h2>
            <p>
              All files uploaded to our secure file storage via ZestChat are subject to automated security checking. Users retain ownership of their uploaded files but grant ZestChat a license to host and transmit this content.
            </p>
          </section>

          <section>
            <h2 className="font-plus-jakarta font-bold text-xl text-foreground mb-3">6. Limitation of Liability and Non-Responsibility</h2>
            <p>
              ZestChat acts strictly as an intermediary real-time communication platform. We are not responsible or liable for any user-generated content, messages, audio/video rooms, shared links, or third-party actions. Users are solely responsible for their interactions on the platform.
            </p>
          </section>

          <section>
            <h2 className="font-plus-jakarta font-bold text-xl text-foreground mb-3">7. Disclaimer of Warranties</h2>
            <p>
              ZestChat is provided &quot;as is&quot; without warranties of any kind, either express or implied, including the availability of sub-second video/audio streams or database connectivity.
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
