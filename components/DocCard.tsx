"use client";

import Link from "next/link";
import { formatBytes, timeAgo, docLabel } from "@/lib/utils";
import { useSettings } from "@/lib/settings";
import type { Post } from "@/lib/supabase";
import ShareButton from "./ShareButton";

interface Props {
  post: Post;
}

export default function DocCard({ post }: Props) {
  const settings = useSettings();
  const { emoji, label } = docLabel(post.doc_filename);

  return (
    <article className="bg-surface rounded-2xl border border-white/5 hover:border-amber-400/20 transition-all duration-300 animate-fade-up overflow-hidden">
      {/* Header strip */}
      <div className="flex items-center gap-4 px-5 py-4 border-b border-white/5">
        {/* File type badge */}
        <div className="w-12 h-12 rounded-xl bg-amber-400/10 border border-amber-400/20 flex items-center justify-center text-2xl flex-shrink-0">
          {emoji}
        </div>

        <div className="flex-1 min-w-0">
          <Link href={`/docs/${post.id}`}>
            <h2
              className="text-base font-bold text-canvas hover:text-amber-400 transition-colors leading-snug truncate cursor-pointer"
              style={{ fontFamily: "Syne, sans-serif" }}
            >
              {post.title}
            </h2>
          </Link>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="text-xs text-amber-400/60">{label}</span>
            {post.doc_filename && (
              <>
                <span className="text-white/20 text-xs">·</span>
                <span className="text-xs text-white/30 truncate max-w-[180px]">
                  {post.doc_filename}
                </span>
              </>
            )}
            {post.doc_size != null && (
              <>
                <span className="text-white/20 text-xs">·</span>
                <span className="text-xs text-white/30">{formatBytes(post.doc_size)}</span>
              </>
            )}
          </div>
        </div>

        {/* Download button — always visible */}
        {post.media_url && (
          <a
            href={post.media_url}
            download={post.doc_filename ?? true}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-black text-xs font-semibold transition-all hover:scale-105 active:scale-95"
            title="Download file"
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
              <path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z" />
            </svg>
            Download
          </a>
        )}
      </div>

      {/* Body */}
      <div className="px-5 py-4">
        {post.description && (
          <p className="text-white/50 text-sm leading-relaxed line-clamp-2 mb-4">
            {post.description}
          </p>
        )}

        <div className="flex items-center justify-between">
          {/* Meta */}
          <div className="flex items-center gap-3 text-xs text-white/25">
            {settings.show_views && (
              <span>👁 {post.views}</span>
            )}
            {settings.show_views && <span>·</span>}
            <span>{timeAgo(post.created_at)}</span>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">
            <ShareButton postId={post.id} title={post.title} />
            <Link
              href={`/docs/${post.id}`}
              className="text-white/30 hover:text-amber-400 text-xs transition-colors"
            >
              Details →
            </Link>
          </div>
        </div>
      </div>
    </article>
  );
}
