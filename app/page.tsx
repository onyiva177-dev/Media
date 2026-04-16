"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import DocCard from "@/components/DocCard";
import type { Post } from "@/lib/supabase";

const PAGE_SIZE = 10;

export default function DocsPage() {
  const [docs,        setDocs]        = useState<Post[]>([]);
  const [loading,     setLoading]     = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore,     setHasMore]     = useState(true);
  const [page,        setPage]        = useState(0);
  const sentinelRef = useRef<HTMLDivElement>(null);

  const fetchDocs = useCallback(async (pageIndex: number) => {
    const from = pageIndex * PAGE_SIZE;
    const res  = await fetch(`/api/posts?type=doc&from=${from}&to=${from + PAGE_SIZE - 1}`);
    if (!res.ok) return;
    const data: Post[] = await res.json();
    if (data.length < PAGE_SIZE) setHasMore(false);
    setDocs(prev => pageIndex === 0 ? data : [...prev, ...data]);
  }, []);

  useEffect(() => {
    setLoading(true);
    fetchDocs(0).finally(() => setLoading(false));
  }, [fetchDocs]);

  useEffect(() => {
    if (!hasMore) return;
    const sentinel = sentinelRef.current;
    if (!sentinel) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !loadingMore) {
          setLoadingMore(true);
          const next = page + 1;
          setPage(next);
          fetchDocs(next).finally(() => setLoadingMore(false));
        }
      },
      { rootMargin: "200px" }
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [hasMore, loadingMore, page, fetchDocs]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />
          <p className="text-white/30 text-sm">Loading documents...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-10 animate-fade-up">
        <h1
          className="text-4xl font-extrabold text-canvas leading-none tracking-tighter"
          style={{ fontFamily: "Syne, sans-serif" }}
        >
          Doc<span className="text-amber-400">uments</span>
        </h1>
        <p className="text-white/40 mt-2 text-sm">
          {docs.length > 0
            ? `${docs.length}${hasMore ? "+" : ""} files available to download`
            : "No documents uploaded yet."}
        </p>
      </div>

      {docs.length === 0 ? (
        <div className="text-center py-24">
          <div className="text-6xl mb-4">📂</div>
          <p className="text-white/40 text-lg" style={{ fontFamily: "Syne, sans-serif" }}>
            Nothing here yet
          </p>
          <p className="text-white/25 text-sm mt-1">Check back soon.</p>
        </div>
      ) : (
        <div className="space-y-4 stagger">
          {docs.map(doc => (
            <DocCard key={doc.id} post={doc} />
          ))}
        </div>
      )}

      {/* Infinite scroll sentinel */}
      <div ref={sentinelRef} className="h-8 mt-8 flex items-center justify-center">
        {loadingMore && (
          <div className="w-5 h-5 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />
        )}
        {!hasMore && docs.length > 0 && (
          <p className="text-white/20 text-xs">All documents loaded ✦</p>
        )}
      </div>
    </div>
  );
}
