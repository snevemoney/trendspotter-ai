
-- Add rotation tracking to keywords
ALTER TABLE public.keywords ADD COLUMN IF NOT EXISTS is_current boolean DEFAULT false;
ALTER TABLE public.keywords ADD COLUMN IF NOT EXISTS cycles_completed integer DEFAULT 0;

-- Add cycles_per_keyword setting to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS cycles_per_keyword integer DEFAULT 12;

-- Enable pg_cron and pg_net extensions for scheduled scans
CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA pg_catalog;
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;
