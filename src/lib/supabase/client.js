import { createBrowserClient } from '@supabase/ssr';

let browserClient;

export function createClient() {
  if (typeof window === 'undefined') {
    return null;
  }

  if (!browserClient) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const publishableKey =
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

    if (!supabaseUrl || !publishableKey) {
      throw new Error('Supabase environment variables are missing.');
    }

    browserClient = createBrowserClient(
      supabaseUrl,
      publishableKey
    );
  }

  return browserClient;
}
