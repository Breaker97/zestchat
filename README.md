# 💬 ZestChat - Vibrant Social Web Community & Chat Platform

[![License: GPL v3](https://img.shields.io/badge/License-GPLv3-blue.svg)](LICENSE)
[![Next.js](https://img.shields.io/badge/Framework-Next.js%2016-black?logo=next.js)](https://nextjs.org/)
[![Tailwind CSS](https://img.shields.io/badge/Styling-Tailwind%20CSS-38B2AC?logo=tailwind-css)](https://tailwindcss.com/)
[![Supabase](https://img.shields.io/badge/Backend-Supabase-3ECF8E?logo=supabase)](https://supabase.com/)
[![Agora RTC](https://img.shields.io/badge/Calling-Agora%20RTC-blue)](https://www.agora.io/en/)

ZestChat is a premium, modern, real-time social web community and communication platform built with Next.js App Router, Tailwind CSS, Supabase, Agora RTC, and Framer Motion. It delivers high-fidelity audio/video calls, real-time messaging, community management, and a robust admin moderation system.

---

## ✨ Features

- **💬 Real-Time Chat Communities:** Create channels, send instant text, media, emojis, and coordinate in active threads.
- **📞 Audio & Video Rooms:** Crystal clear, low-latency calls powered by Agora RTC.
- **🛡️ Secure Authentication:** Secure login, sign-up, email confirmations, password reset, and optional SMS OTP validation.
- **📁 Rich Media Storage:** Upload media files, images, and audio seamlessly via Cloudflare R2 bucket integration.
- **👥 Friends & Presence System:** Send/accept friend requests, see online status, block users, and manage friendships.
- **⚙️ Dynamic Admin Moderation Console:** Dedicated admin space to toggle verification policies, review flagged users, and manage appeals.
- **🎨 Premium Visual Experience:** Immersive HSL-harmonized design featuring glassmorphism, responsive navigation, and smooth Framer Motion animations.

---

## 🛠️ Tech Stack

- **Frontend:** Next.js (App Router, Server Actions, Middleware), React 19, TypeScript
- **Styling & Animations:** Tailwind CSS (v4), Framer Motion, Lucide React
- **Backend & Database:** Supabase (PostgreSQL, Realtime, Row Level Security, Client SSR)
- **Voice/Video Calling:** Agora RTC Web SDK (`agora-rtc-sdk-ng`) & Agora Token Generator
- **Storage:** Cloudflare R2 (S3-compatible API)
- **Notifications:** Firebase Cloud Messaging (FCM) / Push Notifications

---

## 🚀 Getting Started

Follow these steps to set up ZestChat on your machine:

### 1. Prerequisites
Ensure you have the following installed:
- [Node.js](https://nodejs.org/) (v18.x or v20.x recommended)
- [NPM](https://www.npmjs.com/) or another package manager (Yarn, PNPM, Bun)
- A Supabase project initialized

### 2. Installation
Clone the repository:
```bash
git clone https://github.com/your-username/zestchat.git
cd zestchat
```

Install dependencies:
```bash
npm install
```

### 3. Setup Environment Variables
Create a local environment file by copying the example:
```bash
cp .env.example .env.local
```
Open `.env.local` and fill in the corresponding keys for **Supabase**, **Agora**, **Cloudflare R2**, and **Firebase**.

### 4. Database Setup (Migrations)
Apply database schema migrations located in the `/supabase/migrations` folder:
- **Supabase Dashboard:** Copy the contents of the files in `/supabase/migrations` into the Supabase SQL Editor and run them sequentially, OR
- **Supabase CLI:** Run the following commands:
  ```bash
  supabase link --project-ref your-supabase-project-ref
  supabase db push
  ```

### 5. Running the Application
Start the development server:
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser to view ZestChat.

---

## 🤝 Contributing & Open Source

We welcome and encourage contributions from everyone! ZestChat is an open-source project designed to be built together with the developer community.

If you are interested in fixing bugs, proposing features, or helping with design improvements:
1. Review the [Contributing Guidelines](CONTRIBUTING.md) to understand the setup and pull request process.
2. Familiarize yourself with the [Code of Conduct](CONTRIBUTING.md#code-of-conduct).
3. Browse the issue tracker to see what needs work, or open a new issue.

Thank you for helping us make ZestChat the best social web community platform! 🚀

---

## ⚖️ License

ZestChat is distributed under the terms of the **GNU General Public License v3.0 (GPL-3.0)**. 

See the [LICENSE](LICENSE) file for the full license text.
