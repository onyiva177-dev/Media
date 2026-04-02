import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Browser/public client
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Server-side admin client (service role — never expose to browser)
export const getAdminSupabase = () =>
  createClient(supabaseUrl, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
    auth: { persistSession: false },
  });

export type Post = {
  id: string;
  title: string;
  description: string | null;
  media_url: string | null;
  media_type: "video" | "image" | "text";
  created_at: string;
  views: number;
  likes: number;
  comment_count?: number;
};

export type Comment = {
  id: string;
  post_id: string;
  content: string;
  created_at: string;
};
