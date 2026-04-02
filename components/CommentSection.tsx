"use client";

import { useEffect, useState } from "react";
import { timeAgo } from "@/lib/utils";
import type { Comment } from "@/lib/supabase";

interface Props {
  postId: string;
}

export default function CommentSection({ postId }: Props) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [text, setText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [open, setOpen] = useState(false);

  useEffect(() => {
    fetch(`/api/posts/${postId}/comments`)
      .then((r) => r.json())
      .then((data) => setComments(Array.isArray(data) ? data : []))
      .finally(() => setLoading(false));
  }, [postId]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!text.trim() || submitting) return;
    setSubmitting(true);
    setError("");

    try {
      const res = await fetch(`/api/posts/${postId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: text.trim() }),
      });

      if (!res.ok) {
        const d = await res.json();
        setError(d.error ?? "Failed to post comment");
        return;
      }

      const newComment: Comment = await res.json();
      setComments((prev) => [...prev, newComment]);
      setText("");
      setOpen(true);
    } catch {
      setError("Something went wrong");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div>
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-2 text-white/40 hover:text-white/70 text-sm transition-colors mb-4"
      >
        <span>💬</span>
        <span>
          {comments.length > 0
            ? `${comments.length} comment${comments.length !== 1 ? "s" : ""}`
            : "No comments yet"}
        </span>
        <span className="text-xs opacity-60">{open ? "▲" : "▼"}</span>
      </button>

      {open && (
        <div className="animate-fade-up">
          {/* Comment list */}
          {loading ? (
            <div className="flex justify-center py-4">
              <div className="w-4 h-4 border border-amber-400 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : comments.length > 0 ? (
            <div className="space-y-3 mb-4 max-h-64 overflow-y-auto pr-1">
              {comments.map((c) => (
                <div key={c.id} className="flex gap-3">
                  <div className="w-7 h-7 rounded-full bg-surface-raised border border-white/10 flex items-center justify-center text-xs shrink-0">
                    👤
                  </div>
                  <div className="flex-1">
                    <div className="bg-surface-raised rounded-xl px-3 py-2">
                      <p className="text-sm text-white/80 leading-relaxed">{c.content}</p>
                    </div>
                    <p className="text-xs text-white/20 mt-1 ml-2">
                      {timeAgo(c.created_at)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-white/20 text-sm mb-4 text-center py-3">
              Be the first to comment
            </p>
          )}

          {/* Add comment form */}
          <form onSubmit={submit} className="flex gap-2">
            <div className="w-7 h-7 rounded-full bg-amber-400/10 border border-amber-400/20 flex items-center justify-center text-xs shrink-0 mt-1">
              ✍️
            </div>
            <div className="flex-1">
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Add a comment..."
                rows={2}
                maxLength={500}
                className="w-full px-3 py-2 rounded-xl text-sm bg-surface-raised border border-white/10 focus:border-amber-400/50 resize-none outline-none transition-colors placeholder:text-white/20"
              />
              {error && <p className="text-red-400 text-xs mt-1">{error}</p>}
              <div className="flex items-center justify-between mt-2">
                <span className="text-xs text-white/20">{text.length}/500</span>
                <button
                  type="submit"
                  disabled={submitting || !text.trim()}
                  className="px-4 py-1.5 rounded-lg btn-amber text-xs disabled:opacity-40 disabled:cursor-not-allowed disabled:transform-none"
                >
                  {submitting ? "Posting..." : "Post"}
                </button>
              </div>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
