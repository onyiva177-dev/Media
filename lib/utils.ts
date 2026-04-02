import { v4 as uuidv4 } from "uuid";

/** Get or create a persistent browser identifier stored in localStorage */
export function getBrowserId(): string {
  if (typeof window === "undefined") return "";
  const key = "_mid";
  let id = localStorage.getItem(key);
  if (!id) {
    id = uuidv4();
    localStorage.setItem(key, id);
  }
  return id;
}

/** Format numbers like 1200 → 1.2K */
export function formatCount(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}

/** Format relative time */
export function timeAgo(dateStr: string): string {
  const diff = (Date.now() - new Date(dateStr).getTime()) / 1000;
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 2592000) return `${Math.floor(diff / 86400)}d ago`;
  return new Date(dateStr).toLocaleDateString();
}

/** Detect media type from URL extension */
export function detectMediaType(url: string): "video" | "image" | "text" {
  const ext = url.split(".").pop()?.toLowerCase() ?? "";
  const videos = ["mp4", "webm", "mov", "mkv", "avi", "m4v"];
  const images = ["jpg", "jpeg", "png", "gif", "webp", "avif", "svg"];
  if (videos.includes(ext)) return "video";
  if (images.includes(ext)) return "image";
  return "text";
}

/** Share a post URL using Web Share API or clipboard fallback */
export async function sharePost(id: string, title: string): Promise<boolean> {
  const url = `${window.location.origin}/post/${id}`;
  if (navigator.share) {
    try {
      await navigator.share({ title, url });
      return true;
    } catch {
      return false;
    }
  }
  await navigator.clipboard.writeText(url);
  return true;
}
