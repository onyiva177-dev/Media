"use client";

import { useEffect, useState } from "react";
import { getBrowserId, formatCount } from "@/lib/utils";

interface Props {
  postId: string;
  initialLikes: number;
}

export default function LikeButton({ postId, initialLikes }: Props) {
  const [liked, setLiked] = useState(false);
  const [count, setCount] = useState(initialLikes);
  const [loading, setLoading] = useState(false);
  const [bounce, setBounce] = useState(false);

  // Check if already liked
  useEffect(() => {
    const id = getBrowserId();
    fetch(`/api/posts/${postId}/like?identifier=${id}`)
      .then((r) => r.json())
      .then((data) => setLiked(data.liked))
      .catch(() => {});
  }, [postId]);

  async function toggle() {
    if (loading) return;
    setLoading(true);

    const id = getBrowserId();
    const optimistic = !liked;
    setLiked(optimistic);
    setCount((c) => c + (optimistic ? 1 : -1));
    setBounce(true);
    setTimeout(() => setBounce(false), 400);

    try {
      const res = await fetch(`/api/posts/${postId}/like`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier: id }),
      });
      const data = await res.json();
      setLiked(data.liked);
      // Sync with server count if mismatch
    } catch {
      // Rollback on error
      setLiked(!optimistic);
      setCount((c) => c + (optimistic ? -1 : 1));
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      onClick={toggle}
      disabled={loading}
      className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all border ${
        liked
          ? "bg-red-500/10 border-red-500/30 text-red-400 hover:bg-red-500/20"
          : "bg-surface-raised border-white/10 text-white/50 hover:border-white/20 hover:text-white/70"
      }`}
    >
      <span
        className={bounce ? "like-bounce" : ""}
        style={{ display: "inline-block" }}
      >
        {liked ? "❤️" : "🤍"}
      </span>
      <span>{formatCount(count)}</span>
    </button>
  );
}
