'use client';

import { createBrowserClient } from '@supabase/ssr';

export function getSupabaseBrowser() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  // Support both legacy (anon JWT) and new (sb_publishable_…) key naming.
  const key =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!;
  return createBrowserClient(url, key);
}
