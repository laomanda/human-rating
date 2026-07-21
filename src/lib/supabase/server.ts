import { createClient } from '@supabase/supabase-js'

export const createServerClient = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

  // Note: For SSR auth with cookies, @supabase/ssr is recommended.
  // We use standard supabase-js for basic server connection in Phase 1.
  return createClient(supabaseUrl, supabaseAnonKey)
}
