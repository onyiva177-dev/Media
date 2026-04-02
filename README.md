# STREAM — Personal Media Site

A full-stack personal media platform built with Next.js 15, Supabase, and Tailwind CSS.

---

## Features

- 📹 Upload and share videos, images, and text posts
- ❤️ Like and comment on posts (no sign-in required for visitors)
- 👁 View tracking with deduplication
- 🔗 Unique shareable URLs per post
- 📊 Admin dashboard with analytics
- 🔐 Password-protected admin area
- 📱 Mobile-first, TikTok/Reels-inspired feed
- ♾️ Infinite scroll
- 🌑 Dark cinematic UI

---

## Tech Stack

| Layer      | Tech                          |
|------------|-------------------------------|
| Framework  | Next.js 15 (App Router)       |
| Styling    | Tailwind CSS                  |
| Database   | Supabase (PostgreSQL)         |
| Storage    | Supabase Storage              |
| Deployment | Vercel                        |

---

## Setup Instructions

### 1. Clone & install

```bash
git clone https://github.com/YOUR_USERNAME/media-site.git
cd media-site
npm install
```

### 2. Create Supabase project

1. Go to [supabase.com](https://supabase.com) → New project
2. Save your Project URL and keys from **Settings → API**
3. Open **SQL Editor** → paste and run the entire `supabase-setup.sql` file

### 3. Configure environment variables

```bash
cp .env.local.example .env.local
```

Edit `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGci...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGci...
ADMIN_PASSWORD=your-strong-password
ADMIN_TOKEN=any-random-secret-string-here
NEXT_PUBLIC_STORAGE_BUCKET=media
```

> **Note:** `ADMIN_TOKEN` can be any random string — it's used as the session cookie value. Generate one with `openssl rand -hex 32`.

### 4. Run locally

```bash
npm run dev
```

Visit:
- `http://localhost:3000` — Public feed
- `http://localhost:3000/admin` — Admin dashboard

### 5. Deploy to Vercel

1. Push to GitHub
2. Go to [vercel.com](https://vercel.com) → Import repository
3. Add all environment variables from `.env.local` in Vercel project settings
4. Deploy 🚀

---

## Pages

| Route         | Description                              |
|---------------|------------------------------------------|
| `/`           | Public feed with infinite scroll         |
| `/post/[id]`  | Single post — full media, comments, likes|
| `/admin`      | Admin dashboard (password protected)     |

---

## Admin Guide

1. Go to `/admin`
2. Enter your `ADMIN_PASSWORD`
3. Use **New Post** tab to upload media and create posts
4. Use **Posts & Analytics** tab to view stats and delete posts

---

## Environment Variables Reference

| Variable                       | Required | Description                              |
|--------------------------------|----------|------------------------------------------|
| `NEXT_PUBLIC_SUPABASE_URL`     | ✅        | Supabase project URL                     |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY`| ✅        | Supabase public anon key                 |
| `SUPABASE_SERVICE_ROLE_KEY`    | ✅        | Supabase service role key (server only)  |
| `ADMIN_PASSWORD`               | ✅        | Admin login password                     |
| `ADMIN_TOKEN`                  | ✅        | Session cookie secret (random string)    |
| `NEXT_PUBLIC_STORAGE_BUCKET`   | ✅        | Supabase storage bucket name (`media`)   |
