import { createClient } from "@supabase/supabase-js";

const supabaseUrl     = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export const getAdminSupabase = () =>
  createClient(supabaseUrl, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
    auth: { persistSession: false },
  });

export type Post = {
  id: string;
  title: string;
  description: string | null;
  media_url: string | null;
  /** 'video' | 'image' | 'text' | 'doc' */
  media_type: "video" | "image" | "text" | "doc";
  created_at: string;
  views: number;
  likes: number;
  comment_count?: number;
  /** Original filename — populated for doc posts */
  doc_filename: string | null;
  /** File size in bytes — populated for doc posts */
  doc_size: number | null;
};

export type Comment = {
  id: string;
  post_id: string;
  content: string;
  created_at: string;
};
