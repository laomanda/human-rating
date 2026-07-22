import { createBrowserClient } from "@supabase/ssr";

import { getSupabaseConfig } from "@/lib/supabase/env";

let browserClient: ReturnType<typeof createBrowserClient> | undefined;

export function createClient() {
  const { url, publishableKey } = getSupabaseConfig();

  if (browserClient) {
    return browserClient;
  }

  browserClient = createBrowserClient(url, publishableKey);

  return browserClient;
}