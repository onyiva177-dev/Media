import { NextRequest, NextResponse } from "next/server";
import { getAdminSupabase } from "@/lib/supabase";
import { v4 as uuidv4 } from "uuid";

// Document MIME types the site accepts
const DOC_TYPES: Record<string, string> = {
  "application/pdf":  "pdf",
  "application/msword": "doc",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "docx",
  "application/vnd.ms-excel": "xls",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": "xlsx",
  "application/vnd.ms-powerpoint": "ppt",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation": "pptx",
  "text/plain":  "txt",
  "text/csv":    "csv",
  "application/zip": "zip",
  "application/x-zip-compressed": "zip",
  "application/x-rar-compressed": "rar",
  "application/octet-stream": "bin",
};

const MEDIA_TYPES = [
  "video/mp4", "video/webm", "video/quicktime", "video/x-msvideo",
  "image/jpeg", "image/png", "image/gif", "image/webp", "image/avif",
];

// POST /api/admin/upload-url
export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}));
  const { filename, contentType } = body as {
    filename?: string;
    contentType?: string;
  };

  if (!filename || !contentType) {
    return NextResponse.json(
      { error: "filename and contentType required" },
      { status: 400 }
    );
  }

  const isMedia = MEDIA_TYPES.includes(contentType);
  const isDoc   = contentType in DOC_TYPES;

  if (!isMedia && !isDoc) {
    return NextResponse.json(
      { error: `File type not allowed: ${contentType}` },
      { status: 400 }
    );
  }

  // Size limits: video 500MB, images 20MB, docs 100MB
  let maxSize: number;
  if (contentType.startsWith("video/"))  maxSize = 500 * 1024 * 1024;
  else if (contentType.startsWith("image/")) maxSize = 20 * 1024 * 1024;
  else maxSize = 100 * 1024 * 1024;

  const ext = filename.split(".").pop() ?? DOC_TYPES[contentType] ?? "bin";
  const uniqueFilename = `${uuidv4()}.${ext}`;
  const bucket = process.env.NEXT_PUBLIC_STORAGE_BUCKET ?? "media";

  const db = getAdminSupabase();

  const { data, error } = await db.storage
    .from(bucket)
    .createSignedUploadUrl(uniqueFilename);

  if (error || !data) {
    return NextResponse.json(
      { error: error?.message ?? "Upload URL failed" },
      { status: 500 }
    );
  }

  const { data: publicData } = db.storage
    .from(bucket)
    .getPublicUrl(uniqueFilename);

  return NextResponse.json({
    signedUrl:   data.signedUrl,
    token:       data.token,
    path:        uniqueFilename,
    publicUrl:   publicData.publicUrl,
    maxSize,
    isDoc,
  });
}
