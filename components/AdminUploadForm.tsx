"use client";

import { useState, useRef } from "react";
import { detectMediaType } from "@/lib/utils";
import type { Post } from "@/lib/supabase";

interface Props {
  onSuccess: (post: Post) => void;
}

type UploadState = "idle" | "uploading" | "creating" | "done" | "error";

export default function AdminUploadForm({ onSuccess }: Props) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [state, setState] = useState<UploadState>("idle");
  const [progress, setProgress] = useState(0);
  const [errorMsg, setErrorMsg] = useState("");
  const [mediaType, setMediaType] = useState<"video" | "image" | "text">("text");
  const fileRef = useRef<HTMLInputElement>(null);

  function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;

    const detected = f.type.startsWith("video/")
      ? "video"
      : f.type.startsWith("image/")
      ? "image"
      : "text";
    setMediaType(detected);
    setFile(f);

    // Preview
    const url = URL.createObjectURL(f);
    setPreview(url);
  }

  function clearFile() {
    setFile(null);
    setPreview(null);
    if (fileRef.current) fileRef.current.value = "";
    setMediaType("text");
  }

  async function uploadFile(f: File): Promise<string> {
    // Step 1: Get signed upload URL
    const urlRes = await fetch("/api/admin/upload-url", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ filename: f.name, contentType: f.type }),
    });

    if (!urlRes.ok) {
      const d = await urlRes.json();
      throw new Error(d.error ?? "Failed to get upload URL");
    }

    const { signedUrl, publicUrl, maxSize } = await urlRes.json();

    if (f.size > maxSize) {
      const mb = Math.round(maxSize / 1024 / 1024);
      throw new Error(`File too large. Maximum size is ${mb}MB`);
    }

    // Step 2: Upload directly to Supabase Storage using XHR for progress
    await new Promise<void>((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open("PUT", signedUrl);
      xhr.setRequestHeader("Content-Type", f.type);
      xhr.upload.onprogress = (ev) => {
        if (ev.lengthComputable) {
          setProgress(Math.round((ev.loaded / ev.total) * 90));
        }
      };
      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) resolve();
        else reject(new Error(`Upload failed: ${xhr.statusText}`));
      };
      xhr.onerror = () => reject(new Error("Upload network error"));
      xhr.send(f);
    });

    return publicUrl;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;

    setState("uploading");
    setErrorMsg("");
    setProgress(0);

    try {
      let media_url: string | null = null;

      if (file) {
        media_url = await uploadFile(file);
      }

      setProgress(95);
      setState("creating");

      const res = await fetch("/api/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim() || null,
          media_url,
          media_type: media_url ? detectMediaType(media_url) : "text",
        }),
      });

      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error ?? "Failed to create post");
      }

      const post: Post = await res.json();
      setProgress(100);
      setState("done");

      // Reset form
      setTimeout(() => {
        setTitle("");
        setDescription("");
        clearFile();
        setState("idle");
        setProgress(0);
        onSuccess(post);
      }, 800);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Something went wrong");
      setState("error");
    }
  }

  const busy = state === "uploading" || state === "creating";

  return (
    <div className="bg-surface rounded-2xl border border-white/5 p-6">
      <h2
        className="text-xl font-bold text-canvas mb-6"
        style={{ fontFamily: "Syne, sans-serif" }}
      >
        Create New Post
      </h2>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Title */}
        <div>
          <label className="block text-xs text-white/40 mb-1.5 font-medium">
            Title *
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Post title..."
            maxLength={120}
            required
            className="w-full px-4 py-3 rounded-xl text-sm placeholder:text-white/20"
          />
        </div>

        {/* Description */}
        <div>
          <label className="block text-xs text-white/40 mb-1.5 font-medium">
            Description
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Add some context, caption, or story..."
            rows={3}
            maxLength={2000}
            className="w-full px-4 py-3 rounded-xl text-sm resize-none placeholder:text-white/20"
          />
          <p className="text-white/20 text-xs text-right mt-1">
            {description.length}/2000
          </p>
        </div>

        {/* File upload */}
        <div>
          <label className="block text-xs text-white/40 mb-1.5 font-medium">
            Media (optional)
          </label>

          {!file ? (
            <label className="block w-full border-2 border-dashed border-white/10 hover:border-amber-400/40 rounded-xl p-8 text-center cursor-pointer transition-colors group">
              <input
                ref={fileRef}
                type="file"
                accept="video/*,image/*"
                onChange={onFileChange}
                className="hidden"
              />
              <div className="text-3xl mb-2 group-hover:scale-110 transition-transform">
                📎
              </div>
              <p className="text-white/40 text-sm">
                Drop a video or image here
              </p>
              <p className="text-white/20 text-xs mt-1">
                MP4, WebM, MOV, JPG, PNG, GIF, WebP · Videos up to 500MB
              </p>
            </label>
          ) : (
            <div className="rounded-xl overflow-hidden border border-white/10 relative">
              {mediaType === "video" && preview && (
                <video
                  src={preview}
                  className="w-full max-h-48 object-contain bg-black"
                  muted
                  controls
                />
              )}
              {mediaType === "image" && preview && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={preview}
                  alt="preview"
                  className="w-full max-h-48 object-contain bg-black"
                />
              )}
              <div className="p-3 bg-surface-raised flex items-center justify-between">
                <div className="text-xs text-white/50 truncate">
                  {file.name} · {(file.size / 1024 / 1024).toFixed(1)}MB
                </div>
                <button
                  type="button"
                  onClick={clearFile}
                  className="text-white/30 hover:text-red-400 text-xs ml-3 shrink-0 transition-colors"
                >
                  Remove
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Progress bar */}
        {busy && (
          <div className="rounded-xl overflow-hidden bg-surface-raised h-2">
            <div
              className="h-full bg-amber-400 transition-all duration-300 rounded-xl"
              style={{ width: `${progress}%` }}
            />
          </div>
        )}

        {/* Error */}
        {state === "error" && errorMsg && (
          <p className="text-red-400 text-sm bg-red-400/10 rounded-xl px-4 py-3 border border-red-400/20">
            ⚠️ {errorMsg}
          </p>
        )}

        {/* Submit */}
        <button
          type="submit"
          disabled={busy || !title.trim()}
          className="w-full py-3 rounded-xl btn-amber text-sm font-semibold disabled:opacity-40 disabled:cursor-not-allowed disabled:transform-none"
        >
          {state === "uploading"
            ? `Uploading media... ${progress}%`
            : state === "creating"
            ? "Creating post..."
            : state === "done"
            ? "✓ Published!"
            : file
            ? "Upload & Publish"
            : "Publish Post"}
        </button>
      </form>
    </div>
  );
}
