
ALTER TABLE public.user_actions ADD CONSTRAINT user_actions_trend_user_unique UNIQUE (trend_id, user_id);
