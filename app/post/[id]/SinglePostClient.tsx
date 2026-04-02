"use client";

import { useEffect } from "react";
import Link from "next/link";
import VideoPlayer from "@/components/VideoPlayer";
import LikeButton from "@/components/LikeButton";
import ShareButton from "@/components/ShareButton";
import CommentSection from "@/components/CommentSection";
import { getBrowserId, timeAgo, formatCount } from "@/lib/utils";
import type { Post } from "@/lib/supabase";

interface Props {
  post: Post;
}

export default function SinglePostClient({ post }: Props) {
  // Track view on mount
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
      {/* Back */}
      <Link
        href="/"
        className="inline-flex items-center gap-2 text-white/40 hover:text-amber-400 text-sm mb-8 transition-colors group"
      >
        <span className="group-hover:-translate-x-1 transition-transform">←</span>
        Back to feed
      </Link>

      {/* Post card */}
      <article className="bg-surface rounded-2xl overflow-hidden border border-white/5 animate-fade-up">
        {/* Media */}
        {post.media_url && post.media_type === "video" && (
          <VideoPlayer src={post.media_url} />
        )}
        {post.media_url && post.media_type === "image" && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={post.media_url}
            alt={post.title}
            className="w-full max-h-[70vh] object-contain bg-black"
          />
        )}

        {/* Content */}
        <div className="p-6">
          <div className="flex items-start justify-between gap-4 mb-3">
            <h1
              className="text-2xl font-bold text-canvas leading-tight"
              style={{ fontFamily: "Syne, sans-serif" }}
            >
              {post.title}
            </h1>
            <span className="text-white/30 text-xs shrink-0 mt-1">
              {timeAgo(post.created_at)}
            </span>
          </div>

          {post.description && (
            <p className="text-white/60 text-sm leading-relaxed mb-6 whitespace-pre-wrap">
              {post.description}
            </p>
          )}

          {/* Stats row */}
          <div className="flex items-center gap-4 text-white/30 text-xs mb-6 pb-6 border-b border-white/5">
            <span>👁 {formatCount(post.views)} views</span>
            <span>❤️ {formatCount(post.likes)} likes</span>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3 mb-8">
            <LikeButton postId={post.id} initialLikes={post.likes} />
            <ShareButton postId={post.id} title={post.title} />
          </div>

          {/* Comments */}
          <CommentSection postId={post.id} />
        </div>
      </article>
    </div>
  );
}
