import { createClient, SupabaseClient } from "@supabase/supabase-js";

// Only set up when both env vars are present. Locally, and in CI where
// `npx vitest run` has to pass with no network access, this stays null and
// lib/store.ts falls back to its in-memory implementation instead.
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const supabase: SupabaseClient | null =
  supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey) : null;
