"use client";

import { useState } from "react";
import { 
  HelpCircle, 
  Search, 
  ChevronDown, 
  ChevronUp, 
  Send, 
  Sparkles,
  Info
} from "lucide-react";

interface FAQItem {
  question: string;
  answer: string;
}

export default function SupportPage() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);
  const [ticketSubject, setTicketSubject] = useState("");
  const [ticketMessage, setTicketMessage] = useState("");
  const [ticketSubmitted, setTicketSubmitted] = useState(false);

  const faqs: FAQItem[] = [
    {
      question: "How do I secure my ZestChat account with 2FA?",
      answer: "Navigate to Settings -> Security and toggle 'Multi-factor authentication'. Scan the QR code using your preferred authenticator app (Google Authenticator, Authy, etc.) and input the verified OTP."
    },
    {
      question: "How does the Agora call system handle screen sharing?",
      answer: "During any active video room call, tap the 'Share Screen' button at the bottom navigation drawer. Ensure you grant browser permissions to share your screen or selected window."
    },
    {
      question: "What is the maximum file size for Cloudflare R2 uploads?",
      answer: "The current premium community limit is 100MB per file. Accepted formats include PDF, doc/docx, image (PNG/JPEG/GIF), audio (MP3/WAV/AAC), and video (MP4/WebM)."
    },
    {
      question: "Why am I seeing a 'suspended' status alert on login?",
      answer: "Accounts are suspended when they trigger multiple warning flags from message reports (e.g. spamming or toxic conduct). You can submit a dispute using the 'Submit Appeal' button on the suspension page, which goes directly to the Admin console review queue."
    }
  ];

  const handleTicketSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!ticketSubject || !ticketMessage) return;

    // Simulate sending ticket
    setTicketSubmitted(true);
    setTicketSubject("");
    setTicketMessage("");
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-surface-container-lowest overflow-y-auto scrollbar-hide">
      
      {/* Header */}
      <header className="p-8 pb-4 shrink-0">
        <h1 className="font-plus-jakarta font-extrabold text-3xl text-on-surface">Help & Support</h1>
        <p className="text-on-surface-variant text-sm mt-1">Get instant answers or send a direct support ticket to active moderators.</p>
      </header>

      {/* Grid Content */}
      <main className="flex-1 p-8 grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
        
        {/* Left Col: FAQ Accordion */}
        <section className="space-y-6">
          <h2 className="font-plus-jakarta font-bold text-lg flex items-center gap-2">
            <HelpCircle className="w-5 h-5 text-primary" />
            <span>Frequently Asked Questions</span>
          </h2>

          <div className="space-y-3">
            {faqs.map((faq, idx) => {
              const isOpen = openIndex === idx;
              return (
                <div 
                  key={idx}
                  className="bg-white dark:bg-surface-container-lowest border border-outline-variant/30 rounded-2xl overflow-hidden shadow-sm"
                >
                  <button 
                    onClick={() => setOpenIndex(isOpen ? null : idx)}
                    className="w-full px-6 py-4 flex items-center justify-between font-semibold text-sm text-left hover:bg-surface-container-low transition-colors"
                  >
                    <span>{faq.question}</span>
                    {isOpen ? <ChevronUp className="w-4 h-4 text-outline" /> : <ChevronDown className="w-4 h-4 text-outline" />}
                  </button>
                  {isOpen && (
                    <div className="px-6 pb-5 text-xs text-on-surface-variant leading-relaxed">
                      {faq.answer}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>

        {/* Right Col: Support Ticket Form */}
        <section className="bg-white dark:bg-surface-container-lowest border border-outline-variant/30 rounded-3xl p-6 shadow-sm flex flex-col gap-6">
          
          <div>
            <h2 className="font-plus-jakarta font-bold text-lg">Submit Support Ticket</h2>
            <p className="text-xs text-on-surface-variant mt-1">Our support agents typically respond in under 2 hours.</p>
          </div>

          {ticketSubmitted && (
            <div className="bg-primary/10 border border-primary/20 text-primary p-4 rounded-2xl text-xs flex items-center gap-3">
              <Sparkles className="w-5 h-5 shrink-0" />
              <div>
                <p className="font-semibold">Ticket Submitted Successfully!</p>
                <p className="mt-0.5 text-on-surface-variant">Check your updates channel or registered email for replies.</p>
              </div>
            </div>
          )}

          <form onSubmit={handleTicketSubmit} className="flex flex-col gap-4">
            
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">Ticket Subject</label>
              <input 
                type="text"
                required
                value={ticketSubject}
                onChange={(e) => setTicketSubject(e.target.value)}
                placeholder="e.g. Trouble connecting to Agora call channel"
                className="w-full bg-surface border border-outline-variant/20 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all placeholder:text-outline-variant"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">Detail Description</label>
              <textarea 
                required
                rows={5}
                value={ticketMessage}
                onChange={(e) => setTicketMessage(e.target.value)}
                placeholder="Please describe your problem in detail, including any error logs..."
                className="w-full bg-surface border border-outline-variant/20 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all resize-none placeholder:text-outline-variant"
              />
            </div>

            <button 
              type="submit"
              className="w-full py-3 bg-primary text-white font-semibold text-sm rounded-xl shadow-md hover:bg-primary/95 transition-all flex items-center justify-center gap-2"
            >
              <span>Submit Inquiry</span>
              <Send className="w-4 h-4" />
            </button>

          </form>

        </section>

      </main>

    </div>
  );
}
