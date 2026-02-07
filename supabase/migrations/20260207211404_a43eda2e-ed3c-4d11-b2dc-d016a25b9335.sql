
-- Create enums
CREATE TYPE public.scan_mode AS ENUM ('recent', 'popular');
CREATE TYPE public.scan_status AS ENUM ('pending', 'running', 'completed', 'failed');
CREATE TYPE public.entity_type AS ENUM ('brand', 'product');
CREATE TYPE public.trend_label AS ENUM ('low', 'medium', 'high');
CREATE TYPE public.user_action_type AS ENUM ('saved', 'ignored', 'shortlisted', 'archived');
CREATE TYPE public.watchlist_type AS ENUM ('brand', 'ticker');

-- Profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  timezone TEXT DEFAULT 'UTC',
  notify_high_confidence BOOLEAN DEFAULT true,
  min_confidence_score INTEGER DEFAULT 50,
  scan_frequency_minutes INTEGER DEFAULT 5,
  scan_mode scan_mode DEFAULT 'recent',
  min_likes INTEGER DEFAULT 0,
  min_comments INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = user_id);

-- Keywords table
CREATE TABLE public.keywords (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  keyword TEXT NOT NULL,
  active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);
ALTER TABLE public.keywords ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own keywords" ON public.keywords FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Scans table
CREATE TABLE public.scans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  keyword_id UUID REFERENCES public.keywords(id) ON DELETE SET NULL,
  keyword_text TEXT NOT NULL,
  mode scan_mode DEFAULT 'recent',
  status scan_status DEFAULT 'pending',
  videos_found INTEGER DEFAULT 0,
  entities_extracted INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  completed_at TIMESTAMPTZ
);
ALTER TABLE public.scans ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own scans" ON public.scans FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Videos table
CREATE TABLE public.videos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  scan_id UUID REFERENCES public.scans(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  video_id TEXT NOT NULL,
  url TEXT,
  caption TEXT,
  author TEXT,
  posted_at TIMESTAMPTZ,
  likes INTEGER DEFAULT 0,
  comments INTEGER DEFAULT 0,
  shares INTEGER DEFAULT 0,
  keyword TEXT,
  captured_at TIMESTAMPTZ DEFAULT now() NOT NULL
);
ALTER TABLE public.videos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own videos" ON public.videos FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Extracted entities table
CREATE TABLE public.extracted_entities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  video_id UUID REFERENCES public.videos(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  entity_text TEXT NOT NULL,
  entity_type entity_type NOT NULL,
  confidence NUMERIC(3,2) DEFAULT 0.5,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);
ALTER TABLE public.extracted_entities ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own entities" ON public.extracted_entities FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Trend items table
CREATE TABLE public.trend_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  primary_entity TEXT NOT NULL,
  entity_type entity_type DEFAULT 'brand',
  summary TEXT,
  score INTEGER DEFAULT 0 CHECK (score >= 0 AND score <= 100),
  label trend_label DEFAULT 'low',
  signal_phrases TEXT[] DEFAULT '{}',
  first_seen TIMESTAMPTZ DEFAULT now() NOT NULL,
  last_seen TIMESTAMPTZ DEFAULT now() NOT NULL,
  video_count INTEGER DEFAULT 1,
  total_likes INTEGER DEFAULT 0,
  total_comments INTEGER DEFAULT 0,
  total_shares INTEGER DEFAULT 0,
  status TEXT DEFAULT 'new' CHECK (status IN ('new', 'reviewing', 'shortlisted', 'archived')),
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);
ALTER TABLE public.trend_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own trends" ON public.trend_items FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Trend-video links (many-to-many)
CREATE TABLE public.trend_video_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trend_id UUID REFERENCES public.trend_items(id) ON DELETE CASCADE NOT NULL,
  video_id UUID REFERENCES public.videos(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  UNIQUE(trend_id, video_id)
);
ALTER TABLE public.trend_video_links ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own trend links" ON public.trend_video_links FOR ALL
  USING (EXISTS (SELECT 1 FROM public.trend_items WHERE id = trend_id AND user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.trend_items WHERE id = trend_id AND user_id = auth.uid()));

-- Company matches table
CREATE TABLE public.company_matches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trend_id UUID REFERENCES public.trend_items(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  company_name TEXT NOT NULL,
  ticker TEXT,
  exchange TEXT,
  match_confidence NUMERIC(3,2) DEFAULT 0.5,
  reasoning TEXT,
  source TEXT DEFAULT 'ai',
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);
ALTER TABLE public.company_matches ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own matches" ON public.company_matches FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- User actions table
CREATE TABLE public.user_actions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trend_id UUID REFERENCES public.trend_items(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  action user_action_type NOT NULL,
  notes TEXT,
  tags TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);
ALTER TABLE public.user_actions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own actions" ON public.user_actions FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Watchlist table
CREATE TABLE public.watchlist (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  type watchlist_type NOT NULL,
  value TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  UNIQUE(user_id, type, value)
);
ALTER TABLE public.watchlist ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own watchlist" ON public.watchlist FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Trigger for updated_at on profiles
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_trend_items_updated_at BEFORE UPDATE ON public.trend_items FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_user_actions_updated_at BEFORE UPDATE ON public.user_actions FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id) VALUES (NEW.id);
  
  -- Insert default keywords
  INSERT INTO public.keywords (user_id, keyword, sort_order) VALUES
    (NEW.id, 'restock alert', 0),
    (NEW.id, 'tiktok made me buy', 1),
    (NEW.id, 'back in stock', 2),
    (NEW.id, 'run don''t walk', 3),
    (NEW.id, 'sold out everywhere', 4),
    (NEW.id, 'limited drop', 5);
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Indexes for performance
CREATE INDEX idx_videos_user_keyword ON public.videos(user_id, keyword);
CREATE INDEX idx_videos_posted_at ON public.videos(posted_at);
CREATE INDEX idx_trend_items_user_score ON public.trend_items(user_id, score DESC);
CREATE INDEX idx_trend_items_user_status ON public.trend_items(user_id, status);
CREATE INDEX idx_trend_items_last_seen ON public.trend_items(last_seen DESC);
CREATE INDEX idx_extracted_entities_video ON public.extracted_entities(video_id);
CREATE INDEX idx_company_matches_trend ON public.company_matches(trend_id);
CREATE INDEX idx_user_actions_trend ON public.user_actions(trend_id, user_id);
CREATE INDEX idx_watchlist_user ON public.watchlist(user_id);
CREATE INDEX idx_scans_user ON public.scans(user_id, created_at DESC);
