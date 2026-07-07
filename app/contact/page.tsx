"use client";

import { useState } from "react";
import Link from "next/link";
import { MessageSquare, ArrowLeft, Send, Sparkles, MapPin, Mail, ShieldAlert } from "lucide-react";

export default function ContactPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [inquiryType, setInquiryType] = useState("general");
  const [message, setMessage] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !message) return;

    // Simulate contact submission
    setSubmitted(true);
    setName("");
    setEmail("");
    setMessage("");
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col font-sans relative overflow-x-hidden">
      
      {/* Background Glow */}
      <div className="absolute top-[-10%] left-[-15%] w-[50vw] h-[50vw] rounded-full bg-primary/5 blur-[120px] pointer-events-none -z-10"></div>
      
      {/* Header */}
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

      {/* Main Content Grid */}
      <main className="flex-1 max-w-5xl mx-auto py-16 px-6 grid grid-cols-1 lg:grid-cols-2 gap-12 items-start w-full">
        
        {/* Left Column: Legal Info & Details */}
        <section className="space-y-8">
          <div>
            <h1 className="font-plus-jakarta font-extrabold text-4xl mb-4">Legal & Contact</h1>
            <p className="text-on-surface-variant leading-relaxed text-sm md:text-base">
              For corporate inquiries, legal notices, dispute resolutions, and trademark details, please review our coordinates below or complete the inquiry form.
            </p>
          </div>

          <div className="space-y-6">
            <div className="flex gap-4 items-start">
              <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary shrink-0">
                <MapPin className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-sm">Registered Corporate Headquarters</h4>
                <p className="text-xs text-on-surface-variant mt-1 leading-relaxed">
                  ZestChat Communication Systems Inc.<br />
                  1209 Orange Street, Suite 400<br />
                  Wilmington, DE 19801
                </p>
              </div>
            </div>

            <div className="flex gap-4 items-start">
              <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary shrink-0">
                <Mail className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-sm">Digital Communications</h4>
                <p className="text-xs text-on-surface-variant mt-1">
                  General Queries: <span className="text-primary hover:underline cursor-pointer">info@zestchat.app</span><br />
                  Legal Inquiries: <span className="text-primary hover:underline cursor-pointer">legal@zestchat.app</span>
                </p>
              </div>
            </div>

            <div className="flex gap-4 items-start">
              <div className="w-10 h-10 bg-red-500/10 rounded-xl flex items-center justify-center text-red-600 shrink-0">
                <ShieldAlert className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-sm">Dispute Resolutions</h4>
                <p className="text-xs text-on-surface-variant mt-1 leading-relaxed">
                  Disputes regarding account security breaches, content removals, or billing reviews must be submitted in writing to our Legal Affairs Division at the address listed above.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Right Column: Contact Form Card */}
        <section className="bg-white dark:bg-surface-container-lowest border border-outline-variant/30 rounded-3xl p-6 md:p-8 shadow-xl flex flex-col gap-6">
          <div>
            <h2 className="font-plus-jakarta font-bold text-xl">Submit Inbound Query</h2>
            <p className="text-xs text-on-surface-variant mt-1">Select your subject and complete the information fields.</p>
          </div>

          {submitted && (
            <div className="bg-primary/10 border border-primary/20 text-primary p-4 rounded-2xl text-xs flex items-center gap-3">
              <Sparkles className="w-5 h-5 shrink-0" />
              <div>
                <p className="font-semibold">Message Received</p>
                <p className="mt-0.5 text-on-surface-variant">We will process your request and respond shortly.</p>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">Your Name</label>
                <input 
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="John Doe"
                  className="w-full bg-surface border border-outline-variant/20 rounded-xl px-4 py-3 text-xs focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">Email Address</label>
                <input 
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="john@example.com"
                  className="w-full bg-surface border border-outline-variant/20 rounded-xl px-4 py-3 text-xs focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                />
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">Inquiry Department</label>
              <select
                value={inquiryType}
                onChange={(e) => setInquiryType(e.target.value)}
                className="w-full bg-surface border border-outline-variant/20 rounded-xl px-4 py-3 text-xs focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
              >
                <option value="general">General Corporate Inquiry</option>
                <option value="legal">Legal & Regulatory Affairs</option>
                <option value="partnership">Business Partnerships</option>
                <option value="abuse">Report Abuse / Moderation Review</option>
              </select>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">Detailed Message</label>
              <textarea 
                required
                rows={5}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Enter details of your query..."
                className="w-full bg-surface border border-outline-variant/20 rounded-xl px-4 py-3 text-xs focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all resize-none"
              />
            </div>

            <button 
              type="submit"
              className="w-full py-3.5 bg-primary text-white font-semibold text-xs rounded-xl shadow-md hover:bg-primary/95 transition-all flex items-center justify-center gap-2"
            >
              <span>Send Message</span>
              <Send className="w-3.5 h-3.5" />
            </button>

          </form>
        </section>

      </main>

      {/* Footer */}
      <footer className="border-t border-outline-variant/20 py-8 px-6 text-center text-on-surface-variant text-xs bg-surface-container-lowest">
        <span>© {new Date().getFullYear()} ZestChat. All rights reserved.</span>
      </footer>

    </div>
  );
}
