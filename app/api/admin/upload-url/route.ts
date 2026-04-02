import { NextRequest, NextResponse } from "next/server";
import { getAdminSupabase } from "@/lib/supabase";
import { v4 as uuidv4 } from "uuid";

// POST /api/admin/upload-url
// Body: { filename: string, contentType: string }
// Returns: { signedUrl, path, publicUrl }
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

  // Validate allowed file types
  const allowedTypes = [
    "video/mp4",
    "video/webm",
    "video/quicktime",
    "video/x-msvideo",
    "image/jpeg",
    "image/png",
    "image/gif",
    "image/webp",
    "image/avif",
  ];

  if (!allowedTypes.includes(contentType)) {
    return NextResponse.json(
      { error: `File type not allowed: ${contentType}` },
      { status: 400 }
    );
  }

  // Max file size: 500MB for videos, 20MB for images
  const isVideo = contentType.startsWith("video/");
  const maxSize = isVideo ? 500 * 1024 * 1024 : 20 * 1024 * 1024;

  const ext = filename.split(".").pop() ?? "";
  const uniqueFilename = `${uuidv4()}.${ext}`;
  const bucket = process.env.NEXT_PUBLIC_STORAGE_BUCKET ?? "media";

  const db = getAdminSupabase();

  // Create signed upload URL (valid for 60 minutes)
  const { data, error } = await db.storage
    .from(bucket)
    .createSignedUploadUrl(uniqueFilename);

  if (error || !data) {
    return NextResponse.json({ error: error?.message ?? "Upload URL failed" }, { status: 500 });
  }

  // Public URL for the file
  const { data: publicData } = db.storage
    .from(bucket)
    .getPublicUrl(uniqueFilename);

  return NextResponse.json({
    signedUrl: data.signedUrl,
    token: data.token,
    path: uniqueFilename,
    publicUrl: publicData.publicUrl,
    maxSize,
  });
}
