"use client";

import { useState, useEffect } from "react";
import AdminUploadForm from "@/components/AdminUploadForm";
import type { Post } from "@/lib/supabase";
import { formatCount, timeAgo } from "@/lib/utils";

export default function AdminPage() {
  const [authed, setAuthed] = useState<boolean | null>(null);
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [posts, setPosts] = useState<Post[]>([]);
  const [loadingPosts, setLoadingPosts] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"upload" | "analytics">("upload");

  // Check auth state on mount
  useEffect(() => {
    fetch("/api/admin/verify")
      .then((r) => setAuthed(r.ok))
      .catch(() => setAuthed(false));
  }, []);

  // Load posts when authed
  useEffect(() => {
    if (!authed) return;
    setLoadingPosts(true);
    fetch("/api/posts?from=0&to=99")
      .then((r) => r.json())
      .then((data) => setPosts(data))
      .finally(() => setLoadingPosts(false));
  }, [authed]);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoginError("");
    const res = await fetch("/api/admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });
    if (res.ok) {
      setAuthed(true);
    } else {
      const data = await res.json();
      setLoginError(data.error ?? "Invalid password");
    }
  }

  async function handleLogout() {
    await fetch("/api/admin/logout", { method: "POST" });
    setAuthed(false);
  }

  async function handleDelete(id: string, mediaUrl: string | null) {
    if (!confirm("Delete this post permanently?")) return;
    setDeletingId(id);
    await fetch(`/api/posts/${id}`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mediaUrl }),
    });
    setPosts((prev) => prev.filter((p) => p.id !== id));
    setDeletingId(null);
  }

  // Loading auth check
  if (authed === null) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // Login form
  if (!authed) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="w-full max-w-sm animate-fade-up">
          <div className="mb-8 text-center">
            <div
              className="text-3xl font-extrabold text-canvas mb-1"
              style={{ fontFamily: "Syne, sans-serif" }}
            >
              Admin <span className="text-amber-400">Access</span>
            </div>
            <p className="text-white/30 text-sm">Enter your password to continue</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 rounded-xl text-sm bg-surface-raised border border-white/10 focus:border-amber-400/50 outline-none transition-colors placeholder:text-white/20"
              autoFocus
            />
            {loginError && (
              <p className="text-red-400 text-xs text-center">{loginError}</p>
            )}
            <button
              type="submit"
              className="w-full py-3 rounded-xl btn-amber text-sm font-semibold"
            >
              Sign In →
            </button>
          </form>
        </div>
      </div>
    );
  }

  // Totals for analytics
  const totalViews = posts.reduce((s, p) => s + p.views, 0);
  const totalLikes = posts.reduce((s, p) => s + p.likes, 0);

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-10 animate-fade-up">
        <div>
          <h1
            className="text-3xl font-extrabold text-canvas"
            style={{ fontFamily: "Syne, sans-serif" }}
          >
            Admin <span className="text-amber-400">Dashboard</span>
          </h1>
          <p className="text-white/30 text-sm mt-1">{posts.length} posts total</p>
        </div>
        <button
          onClick={handleLogout}
          className="text-white/30 hover:text-red-400 text-xs transition-colors px-3 py-2 rounded-lg border border-white/5 hover:border-red-400/30"
        >
          Sign out
        </button>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-3 gap-3 mb-8 animate-fade-up">
        {[
          { label: "Total Views", value: formatCount(totalViews), icon: "👁" },
          { label: "Total Likes", value: formatCount(totalLikes), icon: "❤️" },
          { label: "Posts", value: posts.length, icon: "📄" },
        ].map((stat) => (
          <div
            key={stat.label}
            className="bg-surface rounded-xl p-4 border border-white/5"
          >
            <div className="text-xl mb-1">{stat.icon}</div>
            <div
              className="text-2xl font-bold text-amber-400"
              style={{ fontFamily: "Syne, sans-serif" }}
            >
              {stat.value}
            </div>
            <div className="text-white/30 text-xs mt-0.5">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 bg-surface rounded-xl p-1 border border-white/5">
        {(["upload", "analytics"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all capitalize ${
              activeTab === tab
                ? "bg-amber-400 text-black"
                : "text-white/40 hover:text-white/60"
            }`}
            style={activeTab === tab ? { fontFamily: "Syne, sans-serif" } : {}}
          >
            {tab === "upload" ? "📤 New Post" : "📊 Posts & Analytics"}
          </button>
        ))}
      </div>

      {/* Upload tab */}
      {activeTab === "upload" && (
        <div className="animate-fade-up">
          <AdminUploadForm
            onSuccess={(newPost) => {
              setPosts((prev) => [newPost, ...prev]);
              setActiveTab("analytics");
            }}
          />
        </div>
      )}

      {/* Analytics tab */}
      {activeTab === "analytics" && (
        <div className="animate-fade-up">
          {loadingPosts ? (
            <div className="flex justify-center py-12">
              <div className="w-6 h-6 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : posts.length === 0 ? (
            <div className="text-center py-12 text-white/30">
              No posts yet. Create your first one!
            </div>
          ) : (
            <div className="space-y-3">
              {posts.map((post) => (
                <div
                  key={post.id}
                  className="bg-surface rounded-xl p-4 border border-white/5 flex items-start gap-4 group"
                >
                  {/* Thumbnail / type indicator */}
                  <div className="w-14 h-14 rounded-lg overflow-hidden shrink-0 bg-surface-raised flex items-center justify-center">
                    {post.media_url && post.media_type === "image" ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={post.media_url}
                        alt=""
                        className="w-full h-full object-cover"
                      />
                    ) : post.media_type === "video" ? (
                      <span className="text-2xl">🎬</span>
                    ) : (
                      <span className="text-2xl">📝</span>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <a
                      href={`/post/${post.id}`}
                      target="_blank"
                      className="font-semibold text-canvas text-sm hover:text-amber-400 transition-colors line-clamp-1"
                      style={{ fontFamily: "Syne, sans-serif" }}
                    >
                      {post.title}
                    </a>
                    <p className="text-white/30 text-xs mt-0.5">
                      {timeAgo(post.created_at)}
                    </p>

                    <div className="flex gap-4 mt-2 text-xs text-white/40">
                      <span>👁 {formatCount(post.views)}</span>
                      <span>❤️ {formatCount(post.likes)}</span>
                    </div>
                  </div>

                  <button
                    onClick={() => handleDelete(post.id, post.media_url)}
                    disabled={deletingId === post.id}
                    className="shrink-0 text-white/20 hover:text-red-400 transition-colors text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100"
                  >
                    {deletingId === post.id ? "..." : "Delete"}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
