
-- Add tier enum
CREATE TYPE public.keyword_tier AS ENUM ('high', 'medium', 'low');

-- Add tier column with default 'medium'
ALTER TABLE public.keywords ADD COLUMN tier public.keyword_tier NOT NULL DEFAULT 'medium';

-- Update existing signal-phrase keywords to 'high' tier
UPDATE public.keywords SET tier = 'high' WHERE keyword IN (
  'restock alert', 'tiktok made me buy', 'back in stock', 
  'run don''t walk', 'sold out everywhere', 'limited drop'
);

-- Replace handle_new_user to seed better keywords with tiers
CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.profiles (user_id) VALUES (NEW.id);
  
  INSERT INTO public.keywords (user_id, keyword, sort_order, is_current, tier) VALUES
    -- High tier: signal phrases that catch broad viral activity
    (NEW.id, 'sold out everywhere', 0, true, 'high'),
    (NEW.id, 'restock alert', 1, false, 'high'),
    (NEW.id, 'tiktok made me buy', 2, false, 'high'),
    (NEW.id, 'run don''t walk', 3, false, 'high'),
    (NEW.id, 'worth the hype', 4, false, 'high'),
    (NEW.id, 'game changer', 5, false, 'high'),
    -- Medium tier: category-level discovery keywords
    (NEW.id, 'viral product', 6, false, 'medium'),
    (NEW.id, 'new launch', 7, false, 'medium'),
    (NEW.id, 'honest review', 8, false, 'medium'),
    (NEW.id, 'hidden gem', 9, false, 'medium'),
    (NEW.id, 'dupe alert', 10, false, 'medium'),
    (NEW.id, 'amazon must haves', 11, false, 'medium');
  
  RETURN NEW;
END;
$function$;
