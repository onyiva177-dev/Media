"use client";

import { useState, useRef } from "react";
import { detectMediaType, docLabel } from "@/lib/utils";
import type { Post } from "@/lib/supabase";

interface Props {
  onSuccess: (post: Post) => void;
}

type UploadState = "idle" | "uploading" | "creating" | "done" | "error";
type PostMode    = "media" | "doc";

const DOC_ACCEPT = [
  ".pdf", ".doc", ".docx", ".xls", ".xlsx", ".ppt", ".pptx",
  ".txt", ".csv", ".zip", ".rar",
].join(",");

export default function AdminUploadForm({ onSuccess }: Props) {
  const [mode,        setMode]        = useState<PostMode>("media");
  const [title,       setTitle]       = useState("");
  const [description, setDescription] = useState("");
  const [file,        setFile]        = useState<File | null>(null);
  const [preview,     setPreview]     = useState<string | null>(null);
  const [mediaType,   setMediaType]   = useState<"video" | "image" | "text">("text");
  const [state,       setState]       = useState<UploadState>("idle");
  const [progress,    setProgress]    = useState(0);
  const [errorMsg,    setErrorMsg]    = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    setFile(f);

    if (mode === "media") {
      const detected = f.type.startsWith("video/") ? "video"
                     : f.type.startsWith("image/") ? "image"
                     : "text";
      setMediaType(detected);
      setPreview(URL.createObjectURL(f));
    }
  }

  function clearFile() {
    setFile(null);
    setPreview(null);
    if (fileRef.current) fileRef.current.value = "";
    setMediaType("text");
  }

  function switchMode(m: PostMode) {
    setMode(m);
    clearFile();
    setErrorMsg("");
  }

  async function uploadFile(f: File): Promise<{ url: string; isDoc: boolean }> {
    const urlRes = await fetch("/api/admin/upload-url", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ filename: f.name, contentType: f.type }),
    });

    if (!urlRes.ok) {
      const d = await urlRes.json();
      throw new Error(d.error ?? "Failed to get upload URL");
    }

    const { signedUrl, publicUrl, maxSize, isDoc } = await urlRes.json();

    if (f.size > maxSize) {
      const mb = Math.round(maxSize / 1024 / 1024);
      throw new Error(`File too large. Maximum is ${mb} MB`);
    }

    await new Promise<void>((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open("PUT", signedUrl);
      xhr.setRequestHeader("Content-Type", f.type);
      xhr.upload.onprogress = (ev) => {
        if (ev.lengthComputable)
          setProgress(Math.round((ev.loaded / ev.total) * 90));
      };
      xhr.onload  = () => (xhr.status >= 200 && xhr.status < 300) ? resolve() : reject(new Error(`Upload failed: ${xhr.statusText}`));
      xhr.onerror = () => reject(new Error("Upload network error"));
      xhr.send(f);
    });

    return { url: publicUrl, isDoc };
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;

    setState("uploading");
    setErrorMsg("");
    setProgress(0);

    try {
      let media_url:   string | null = null;
      let final_type:  string        = "text";
      let doc_filename: string | null = null;
      let doc_size:    number | null = null;

      if (file) {
        const { url } = await uploadFile(file);
        media_url = url;

        if (mode === "doc") {
          final_type   = "doc";
          doc_filename = file.name;
          doc_size     = file.size;
        } else {
          final_type = detectMediaType(url);
        }
      }

      setProgress(95);
      setState("creating");

      const res = await fetch("/api/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title:       title.trim(),
          description: description.trim() || null,
          media_url,
          media_type:  final_type,
          doc_filename,
          doc_size,
        }),
      });

      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error ?? "Failed to create post");
      }

      const post: Post = await res.json();
      setProgress(100);
      setState("done");

      setTimeout(() => {
        setTitle(""); setDescription(""); clearFile();
        setState("idle"); setProgress(0);
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
        className="text-xl font-bold text-canvas mb-5"
        style={{ fontFamily: "Syne, sans-serif" }}
      >
        Create New Post
      </h2>

      {/* Mode tabs */}
      <div className="flex gap-2 mb-6 p-1 bg-surface-raised rounded-xl w-fit">
        <button
          type="button"
          onClick={() => switchMode("media")}
          className={`px-4 py-2 rounded-lg text-xs font-medium transition-all ${
            mode === "media"
              ? "bg-amber-400 text-black"
              : "text-white/40 hover:text-white/70"
          }`}
        >
          🎬 Video / Image
        </button>
        <button
          type="button"
          onClick={() => switchMode("doc")}
          className={`px-4 py-2 rounded-lg text-xs font-medium transition-all ${
            mode === "doc"
              ? "bg-amber-400 text-black"
              : "text-white/40 hover:text-white/70"
          }`}
        >
          📄 Document / File
        </button>
      </div>

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
            placeholder={mode === "doc" ? "Document title..." : "Post title..."}
            maxLength={120}
            required
            className="w-full px-4 py-3 rounded-xl text-sm placeholder:text-white/20 bg-surface-raised border border-white/5 text-canvas focus:border-amber-400/50 outline-none transition-colors"
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
            placeholder={
              mode === "doc"
                ? "Describe this document — what it contains, who it's for..."
                : "Add some context, caption, or story..."
            }
            rows={3}
            maxLength={2000}
            className="w-full px-4 py-3 rounded-xl text-sm resize-none placeholder:text-white/20 bg-surface-raised border border-white/5 text-canvas focus:border-amber-400/50 outline-none transition-colors"
          />
          <p className="text-white/20 text-xs text-right mt-1">
            {description.length}/2000
          </p>
        </div>

        {/* File upload */}
        <div>
          <label className="block text-xs text-white/40 mb-1.5 font-medium">
            {mode === "doc" ? "File *" : "Media (optional)"}
          </label>

          {!file ? (
            <label className="block w-full border-2 border-dashed border-white/10 hover:border-amber-400/40 rounded-xl p-8 text-center cursor-pointer transition-colors group">
              <input
                ref={fileRef}
                type="file"
                accept={mode === "doc" ? DOC_ACCEPT : "video/*,image/*"}
                onChange={onFileChange}
                className="hidden"
              />
              <div className="text-3xl mb-2 group-hover:scale-110 transition-transform">
                {mode === "doc" ? "📁" : "📎"}
              </div>
              {mode === "doc" ? (
                <>
                  <p className="text-white/40 text-sm">Select a document or file</p>
                  <p className="text-white/20 text-xs mt-1">
                    PDF, Word, Excel, PowerPoint, CSV, ZIP · Up to 100 MB
                  </p>
                </>
              ) : (
                <>
                  <p className="text-white/40 text-sm">Drop a video or image here</p>
                  <p className="text-white/20 text-xs mt-1">
                    MP4, WebM, MOV, JPG, PNG, GIF, WebP · Videos up to 500 MB
                  </p>
                </>
              )}
            </label>
          ) : (
            <div className="rounded-xl overflow-hidden border border-white/10">
              {mode === "media" && mediaType === "video" && preview && (
                <video src={preview} className="w-full max-h-48 object-contain bg-black" muted controls />
              )}
              {mode === "media" && mediaType === "image" && preview && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={preview} alt="preview" className="w-full max-h-48 object-contain bg-black" />
              )}
              {mode === "doc" && (
                <div className="p-6 flex items-center gap-4 bg-surface-raised">
                  <div className="w-12 h-12 rounded-xl bg-amber-400/10 border border-amber-400/20 flex items-center justify-center text-2xl">
                    {docLabel(file.name).emoji}
                  </div>
                  <div>
                    <p className="text-sm text-canvas font-medium">{file.name}</p>
                    <p className="text-xs text-white/40">{docLabel(file.name).label} · {(file.size / 1024 / 1024).toFixed(1)} MB</p>
                  </div>
                </div>
              )}
              <div className="p-3 bg-surface-raised border-t border-white/5 flex items-center justify-between">
                <div className="text-xs text-white/50 truncate">
                  {mode === "media" ? `${file.name} · ${(file.size / 1024 / 1024).toFixed(1)} MB` : "Ready to upload"}
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

        {/* Progress */}
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
          disabled={busy || !title.trim() || (mode === "doc" && !file)}
          className="w-full py-3 rounded-xl bg-amber-400 hover:bg-amber-300 text-black text-sm font-semibold disabled:opacity-40 disabled:cursor-not-allowed transition-all hover:scale-[1.01] active:scale-[0.99]"
        >
          {state === "uploading"
            ? `Uploading... ${progress}%`
            : state === "creating"
            ? "Creating post..."
            : state === "done"
            ? "✓ Published!"
            : mode === "doc"
            ? file ? "Upload Document & Publish" : "Publish Post"
            : file ? "Upload & Publish" : "Publish Post"}
        </button>
      </form>
    </div>
  );
}
