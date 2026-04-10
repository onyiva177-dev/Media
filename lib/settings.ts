/**
 * lib/settings.ts
 *
 * Fetches site_settings from the shared Supabase portfolio database.
 * Settings are cached for the lifetime of the page to avoid repeated
 * round-trips. Server and client callers both use the same anon key.
 */

import { supabase } from "./supabase";

export interface SiteSettings {
  show_views: boolean;
  show_likes: boolean;
  // extend here if more settings are needed by the media site
}

const DEFAULTS: SiteSettings = {
  show_views: true,
  show_likes: true,
};

// Module-level cache — one fetch per page load on the server,
// one fetch per browser session on the client.
let cached: SiteSettings | null = null;

export async function getSettings(): Promise<SiteSettings> {
  if (cached) return cached;

  try {
    const { data, error } = await supabase
      .from("site_settings")
      .select("key, value")
      .in("key", ["show_views", "show_likes"]);

    if (error || !data) {
      cached = DEFAULTS;
      return DEFAULTS;
    }

    const settings: SiteSettings = { ...DEFAULTS };
    data.forEach((row) => {
      const key = row.key as keyof SiteSettings;
      if (key in settings) {
        // Supabase stores jsonb — value may be boolean or "true"/"false" string
        settings[key] =
          row.value === true || row.value === "true" || row.value === 1;
      }
    });

    cached = settings;
    return settings;
  } catch {
    cached = DEFAULTS;
    return DEFAULTS;
  }
}

/** Client-side hook — returns settings reactively (fetches once on mount). */
import { useEffect, useState } from "react";

export function useSettings(): SiteSettings {
  const [settings, setSettings] = useState<SiteSettings>(DEFAULTS);

  useEffect(() => {
    // Use the module-level cache so all components on the page share one fetch
    getSettings().then(setSettings).catch(() => {});
  }, []);

  return settings;
}
