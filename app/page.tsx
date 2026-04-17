"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import PostCard from "@/components/PostCard";
import type { Post } from "@/lib/supabase";

const PAGE_SIZE = 6;

export default function FeedPage() {
  const [posts,       setPosts]       = useState<Post[]>([]);
  const [loading,     setLoading]     = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore,     setHasMore]     = useState(true);
  const [page,        setPage]        = useState(0);
  const sentinelRef = useRef<HTMLDivElement>(null);

  const fetchPosts = useCallback(async (pageIndex: number) => {
    const from = pageIndex * PAGE_SIZE;
    // type=media excludes doc posts so only videos/images appear in the feed
    const res = await fetch(`/api/posts?type=media&from=${from}&to=${from + PAGE_SIZE - 1}`);
    if (!res.ok) return;
    const data: Post[] = await res.json();
    if (data.length < PAGE_SIZE) setHasMore(false);
    if (pageIndex === 0) {
      setPosts(data);
    } else {
      setPosts((prev) => [...prev, ...data]);
    }
  }, []);

  useEffect(() => {
    setLoading(true);
    fetchPosts(0).finally(() => setLoading(false));
  }, [fetchPosts]);

  useEffect(() => {
    if (!hasMore) return;
    const sentinel = sentinelRef.current;
    if (!sentinel) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !loadingMore) {
          setLoadingMore(true);
          const nextPage = page + 1;
          setPage(nextPage);
          fetchPosts(nextPage).finally(() => setLoadingMore(false));
        }
      },
      { rootMargin: "200px" }
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [hasMore, loadingMore, page, fetchPosts]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />
          <p className="text-white/30 text-sm font-body">Loading feed...</p>
        </div>
      </div>
    );
  }

  if (posts.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">📭</div>
          <p
            className="text-2xl text-white/60 mb-2"
            style={{ fontFamily: "Syne, sans-serif" }}
          >
            Nothing here yet
          </p>
          <p className="text-white/30 text-sm">Check back soon.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="mb-10 animate-fade-up">
        <h1
          className="text-4xl font-extrabold text-canvas leading-none tracking-tighter"
          style={{ fontFamily: "Syne, sans-serif" }}
        >
          Latest <span className="text-amber-400">Posts</span>
        </h1>
        <p className="text-white/40 mt-2 text-sm">
          {posts.length}+ pieces of content
        </p>
      </div>

      <div className="space-y-6 stagger">
        {posts.map((post) => (
          <PostCard key={post.id} post={post} />
        ))}
      </div>

      <div ref={sentinelRef} className="h-8 mt-8 flex items-center justify-center">
        {loadingMore && (
          <div className="w-5 h-5 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />
        )}
        {!hasMore && posts.length > 0 && (
          <p className="text-white/20 text-xs">You&apos;re all caught up ✦</p>
        )}
      </div>
    </div>
  );
}
