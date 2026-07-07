# Contributing to ZestChat

First off, thank you for taking the time to contribute! 🎉

ZestChat is a modern, real-time web community and chat platform built with Next.js, Supabase, Agora RTC, Tailwind CSS, and Framer Motion. We love community contributions and want to make the process as easy, transparent, and rewarding as possible.

This guide outlines how you can help improve ZestChat.

---

## Code of Conduct

By participating in this project, you agree to abide by our Code of Conduct:
- Be respectful and welcoming to all contributors.
- Focus on constructive feedback and collaboration.
- Ensure a safe, professional, and harassment-free environment for everyone.

---

## How Can I Contribute?

### 1. Reporting Bugs
If you find a bug in ZestChat, please open an Issue. Before doing so:
- **Search existing issues** to make sure it hasn't already been reported.
- If it's a new issue, use a clear, descriptive title.
- Include:
  - Steps to reproduce the bug.
  - Expected behavior vs. actual behavior.
  - Screenshots, code snippets, or console errors (if applicable).
  - Your environment details (OS, browser, node version).

### 2. Suggesting Enhancements
We are always open to new ideas and features! To propose a change:
- Open an Issue with the tag `enhancement`.
- Describe the feature you'd like to see, why it is useful, and how it could work.
- Let us discuss the design and scope before you start writing code, ensuring it aligns with the project goals.

### 3. Submitting Pull Requests (PRs)
Ready to make a change? Awesome! Please follow these steps:
1. **Fork** the repository and clone it to your local machine.
2. Create a new branch for your work:
   ```bash
   git checkout -b feature/your-feature-name
   # or
   git checkout -b bugfix/your-fix-name
   ```
3. Set up your local development environment (see [Local Setup](#local-setup) below).
4. Make your changes, keeping them clean, focused, and well-documented.
5. Commit your changes using descriptive commit messages (ideally adhering to [Conventional Commits](https://www.conventionalcommits.org/)):
   - `feat: add Agora voice calling status indicators`
   - `fix: resolve auth redirection loop on admin dashboard`
   - `docs: update setup steps in CONTRIBUTING.md`
6. Push to your fork and submit a Pull Request to our main branch.
7. Fill out the PR template, referencing any related issue number (e.g., `Closes #123`).

---

## Local Setup

To run ZestChat locally, you will need:
- **Node.js** (v18.x or v20.x recommended)
- **NPM** (or your preferred package manager like Yarn, PNPM, or Bun)
- A **Supabase** account/project
- (Optional) **Agora** app credentials for voice/video calls
- (Optional) **Firebase** credentials for push notifications or OTP setup
- (Optional) **Cloudflare R2** credentials for file and media storage

### Installation Steps

1. **Clone the Repository:**
   ```bash
   git clone https://github.com/your-username/zestchat.git
   cd zestchat
   ```

2. **Install Dependencies:**
   ```bash
   npm install
   ```

3. **Configure Environment Variables:**
   Copy the example environment file and fill in your keys:
   ```bash
   cp .env.example .env.local
   ```
   *For details on keys, refer to `.env.example`.*

4. **Database Migrations:**
   We use Supabase for our database. You can apply the migrations located in the `/supabase/migrations` directory to your Supabase instance:
   - Either run them manually via the Supabase Dashboard SQL Editor, or
   - Use the Supabase CLI to apply migrations locally or to a remote project:
     ```bash
     supabase link --project-ref your-project-ref
     supabase db push
     ```

5. **Start Development Server:**
   ```bash
   npm run dev
   ```
   Open `http://localhost:3000` in your browser.

---

## Style Guidelines

To keep the codebase maintainable and readable:

### Code Style
- **TypeScript:** Use proper typing. Avoid `any` unless absolutely necessary.
- **Next.js conventions:** Follow Next.js App Router conventions and handle server/client components correctly (`'use client'` directive where state/effects are used).
- **ESlint:** Run `npm run lint` before committing to catch static analysis errors.
- **Formatting:** Keep the code formatted and clean.
- **Cleanups:** Remove all debugging logs (e.g. `console.log`) and commented-out code before pushing your PR.

### Styling & CSS
- We use **Tailwind CSS** (v4.0+) for our styles.
- Avoid inline styles where possible; use Tailwind utility classes.
- Ensure all designs are fully responsive (working on mobile and desktop) and fit our rich dark/light mode aesthetics.

### Git Guidelines
- Keep your PRs small and focused. Avoid mixing multiple unrelated changes into a single PR.
- Make sure to rebase or merge the target branch into your branch regularly to avoid conflicts.

---

Thank you again for contributing! Your help keeps ZestChat growing. 🚀
