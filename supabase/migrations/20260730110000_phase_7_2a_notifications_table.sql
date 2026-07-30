-- Phase 7.2A: Notifications Inbox Table Migration

CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('daily_reminder', 'rating_completed', 'achievement_unlocked', 'system')),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  is_read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications (user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON public.notifications (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread ON public.notifications (user_id, is_read) WHERE is_read = false;

-- Enable Row Level Security
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can only view their own notifications
CREATE POLICY "Users can view own notifications"
  ON public.notifications
  FOR SELECT
  USING (auth.uid() = user_id);

-- RLS Policy: Users can update is_read on their own notifications
CREATE POLICY "Users can update own notification is_read"
  ON public.notifications
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
