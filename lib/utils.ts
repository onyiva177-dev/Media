import { v4 as uuidv4 } from "uuid";

export function getBrowserId(): string {
  if (typeof window === "undefined") return "";
  const key = "_mid";
  let id = localStorage.getItem(key);
  if (!id) { id = uuidv4(); localStorage.setItem(key, id); }
  return id;
}

export function formatCount(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000)     return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}

export function formatBytes(bytes: number): string {
  if (!bytes || bytes === 0) return "—";
  if (bytes < 1024)           return `${bytes} B`;
  if (bytes < 1024 * 1024)    return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 ** 3)      return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / 1024 ** 3).toFixed(1)} GB`;
}

export function timeAgo(dateStr: string): string {
  const diff = (Date.now() - new Date(dateStr).getTime()) / 1000;
  if (diff < 60)       return "just now";
  if (diff < 3600)     return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400)    return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 2592000)  return `${Math.floor(diff / 86400)}d ago`;
  return new Date(dateStr).toLocaleDateString();
}

export function detectMediaType(url: string): "video" | "image" | "text" {
  const ext = url.split(".").pop()?.toLowerCase() ?? "";
  const videos = ["mp4", "webm", "mov", "mkv", "avi", "m4v"];
  const images = ["jpg", "jpeg", "png", "gif", "webp", "avif", "svg"];
  if (videos.includes(ext)) return "video";
  if (images.includes(ext)) return "image";
  return "text";
}

/** Map MIME type or extension to a human label + emoji */
export function docLabel(filename: string | null, mimeOrExt?: string): { emoji: string; label: string } {
  const ext = (filename?.split(".").pop() ?? mimeOrExt ?? "").toLowerCase();
  const map: Record<string, { emoji: string; label: string }> = {
    pdf:  { emoji: "📄", label: "PDF Document" },
    doc:  { emoji: "📝", label: "Word Document" },
    docx: { emoji: "📝", label: "Word Document" },
    xls:  { emoji: "📊", label: "Excel Spreadsheet" },
    xlsx: { emoji: "📊", label: "Excel Spreadsheet" },
    ppt:  { emoji: "📊", label: "PowerPoint" },
    pptx: { emoji: "📊", label: "PowerPoint" },
    txt:  { emoji: "📃", label: "Text File" },
    csv:  { emoji: "📊", label: "CSV File" },
    zip:  { emoji: "🗜️", label: "ZIP Archive" },
    rar:  { emoji: "🗜️", label: "RAR Archive" },
  };
  return map[ext] ?? { emoji: "📦", label: "File" };
}

export async function sharePost(id: string, title: string): Promise<boolean> {
  const url = `${window.location.origin}/post/${id}`;
  if (navigator.share) {
    try { await navigator.share({ title, url }); return true; }
    catch { return false; }
  }
  await navigator.clipboard.writeText(url);
  return true;
}
