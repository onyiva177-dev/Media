"use client";

import { useEffect } from "react";
import Link from "next/link";
import CommentSection from "@/components/CommentSection";
import ShareButton from "@/components/ShareButton";
import { getBrowserId, formatBytes, timeAgo, formatCount, docLabel } from "@/lib/utils";
import { useSettings } from "@/lib/settings";
import type { Post } from "@/lib/supabase";

interface Props {
  post: Post;
}

export default function DocDetailClient({ post }: Props) {
  const settings = useSettings();
  const { emoji, label } = docLabel(post.doc_filename);

  useEffect(() => {
    const identifier = getBrowserId();
    fetch(`/api/posts/${post.id}/view`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ identifier }),
    }).catch(() => {});
  }, [post.id]);

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <Link
        href="/docs"
        className="inline-flex items-center gap-2 text-white/40 hover:text-amber-400 text-sm mb-8 transition-colors group"
      >
        <span className="group-hover:-translate-x-1 transition-transform">←</span>
        Back to documents
      </Link>

      <article className="bg-surface rounded-2xl border border-white/5 overflow-hidden animate-fade-up">
        {/* Hero download block */}
        <div className="p-8 flex flex-col items-center text-center border-b border-white/5 bg-gradient-to-b from-amber-400/5 to-transparent">
          <div className="w-20 h-20 rounded-2xl bg-amber-400/10 border border-amber-400/25 flex items-center justify-center text-5xl mb-5">
            {emoji}
          </div>

          <h1
            className="text-2xl font-bold text-canvas leading-tight mb-2"
            style={{ fontFamily: "Syne, sans-serif" }}
          >
            {post.title}
          </h1>

          <div className="flex items-center gap-3 text-sm text-white/40 mb-1 flex-wrap justify-center">
            <span className="text-amber-400/70">{label}</span>
            {post.doc_filename && (
              <>
                <span>·</span>
                <span className="font-mono text-xs">{post.doc_filename}</span>
              </>
            )}
            {post.doc_size != null && (
              <>
                <span>·</span>
                <span>{formatBytes(post.doc_size)}</span>
              </>
            )}
          </div>

          <div className="text-xs text-white/25 mb-6">
            {timeAgo(post.created_at)}
            {settings.show_views && ` · ${formatCount(post.views)} views`}
          </div>

          {post.media_url ? (
            <a
              href={post.media_url}
              download={post.doc_filename ?? true}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2.5 px-8 py-3.5 bg-amber-400 hover:bg-amber-300 text-black font-bold rounded-2xl transition-all hover:scale-105 active:scale-95 shadow-lg shadow-amber-400/20 text-sm"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z" />
              </svg>
              Download File
            </a>
          ) : (
            <div className="px-6 py-3 rounded-2xl border border-white/10 text-white/30 text-sm">
              No file attached
            </div>
          )}
        </div>

        <div className="p-6">
          {post.description && (
            <p className="text-white/60 text-sm leading-relaxed whitespace-pre-wrap mb-6 pb-6 border-b border-white/5">
              {post.description}
            </p>
          )}

          <div className="flex items-center gap-3 mb-8">
            <ShareButton postId={post.id} title={post.title} />
            {post.media_url && (
              <a
                href={post.media_url}
                download={post.doc_filename ?? true}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-amber-400/30 text-amber-400 text-xs font-medium hover:bg-amber-400/10 transition-all"
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z" />
                </svg>
                Download
              </a>
            )}
          </div>

          <CommentSection postId={post.id} />
        </div>
      </article>
    </div>
  );
}
