
CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.profiles (user_id) VALUES (NEW.id);
  
  INSERT INTO public.keywords (user_id, keyword, sort_order, is_current) VALUES
    (NEW.id, 'restock alert', 0, true),
    (NEW.id, 'tiktok made me buy', 1, false),
    (NEW.id, 'back in stock', 2, false),
    (NEW.id, 'run don''t walk', 3, false),
    (NEW.id, 'sold out everywhere', 4, false),
    (NEW.id, 'limited drop', 5, false);
  
  RETURN NEW;
END;
$function$;
