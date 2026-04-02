"use client";

import Link from "next/link";
import { formatCount, timeAgo } from "@/lib/utils";
import type { Post } from "@/lib/supabase";
import LikeButton from "./LikeButton";
import ShareButton from "./ShareButton";
import CommentSection from "./CommentSection";

interface Props {
  post: Post;
}

export default function PostCard({ post }: Props) {
  return (
    <article className="bg-surface rounded-2xl overflow-hidden border border-white/5 hover:border-white/10 transition-all duration-300 animate-fade-up">
      {/* Media */}
      {post.media_url && post.media_type === "video" && (
        <Link href={`/post/${post.id}`}>
          <div className="relative w-full bg-black group cursor-pointer">
            <video
              src={post.media_url}
              className="w-full max-h-[55vh] object-contain"
              preload="metadata"
              muted
              playsInline
              onMouseEnter={(e) => (e.currentTarget as HTMLVideoElement).play().catch(() => {})}
              onMouseLeave={(e) => {
                const v = e.currentTarget as HTMLVideoElement;
                v.pause();
                v.currentTime = 0;
              }}
            />
            <div className="absolute inset-0 flex items-center justify-center opacity-80 group-hover:opacity-0 transition-opacity pointer-events-none">
              <div className="w-12 h-12 rounded-full bg-amber-400/90 flex items-center justify-center shadow-lg">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="black">
                  <path d="M8 5v14l11-7z" />
                </svg>
              </div>
            </div>
            <div className="absolute top-3 right-3 bg-black/60 text-white/70 text-xs px-2 py-0.5 rounded-full">
              🎬 Video
            </div>
          </div>
        </Link>
      )}

      {post.media_url && post.media_type === "image" && (
        <Link href={`/post/${post.id}`}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={post.media_url}
            alt={post.title}
            className="w-full max-h-[55vh] object-contain bg-black cursor-pointer hover:opacity-95 transition-opacity"
            loading="lazy"
          />
        </Link>
      )}

      {/* Post body */}
      <div className="p-5">
        {/* Title */}
        <Link href={`/post/${post.id}`}>
          <h2
            className="text-lg font-bold text-canvas hover:text-amber-400 transition-colors leading-snug mb-1 cursor-pointer"
            style={{ fontFamily: "Syne, sans-serif" }}
          >
            {post.title}
          </h2>
        </Link>

        {/* Description preview */}
        {post.description && (
          <p className="text-white/50 text-sm leading-relaxed line-clamp-2 mb-4">
            {post.description}
          </p>
        )}

        {/* Meta */}
        <div className="flex items-center gap-3 text-xs text-white/25 mb-4">
          <span>👁 {formatCount(post.views)}</span>
          <span>·</span>
          <span>{timeAgo(post.created_at)}</span>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 mb-4">
          <LikeButton postId={post.id} initialLikes={post.likes} />
          <ShareButton postId={post.id} title={post.title} />
          <Link
            href={`/post/${post.id}`}
            className="ml-auto text-white/30 hover:text-amber-400 text-xs transition-colors"
          >
            View post →
          </Link>
        </div>

        {/* Comments */}
        <div className="border-t border-white/5 pt-4">
          <CommentSection postId={post.id} />
        </div>
      </div>
    </article>
  );
}
