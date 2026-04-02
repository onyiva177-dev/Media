"use client";

import { useState } from "react";
import { sharePost } from "@/lib/utils";

interface Props {
  postId: string;
  title: string;
}

export default function ShareButton({ postId, title }: Props) {
  const [copied, setCopied] = useState(false);

  async function handleShare() {
    const shared = await sharePost(postId, title);
    if (shared) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  return (
    <button
      onClick={handleShare}
      className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium border transition-all ${
        copied
          ? "bg-amber-400/10 border-amber-400/30 text-amber-400"
          : "bg-surface-raised border-white/10 text-white/50 hover:border-white/20 hover:text-white/70"
      }`}
    >
      <span>{copied ? "✓" : "↗"}</span>
      <span>{copied ? "Copied!" : "Share"}</span>
    </button>
  );
}
