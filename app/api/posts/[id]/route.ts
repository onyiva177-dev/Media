import { NextRequest, NextResponse } from "next/server";
import { supabase, getAdminSupabase } from "@/lib/supabase";
import { cookies } from "next/headers";

type Params = { params: Promise<{ id: string }> };

// GET /api/posts/[id]
export async function GET(_req: NextRequest, { params }: Params) {
  const { id } = await params;

  const { data, error } = await supabase
    .from("posts")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !data) {
    return NextResponse.json({ error: "Post not found" }, { status: 404 });
  }

  return NextResponse.json(data);
}

// DELETE /api/posts/[id] — admin only
export async function DELETE(request: NextRequest, { params }: Params) {
  const cookieStore = await cookies();
  const session = cookieStore.get("admin_session");
  if (!session || session.value !== process.env.ADMIN_TOKEN) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const body = await request.json().catch(() => ({}));
  const { mediaUrl } = body as { mediaUrl?: string };

  const db = getAdminSupabase();

  // Delete from storage if there's a media file
  if (mediaUrl) {
    const bucket = process.env.NEXT_PUBLIC_STORAGE_BUCKET ?? "media";
    const path = mediaUrl.split(`/storage/v1/object/public/${bucket}/`)[1];
    if (path) {
      await db.storage.from(bucket).remove([path]);
    }
  }

  const { error } = await db.from("posts").delete().eq("id", id);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
