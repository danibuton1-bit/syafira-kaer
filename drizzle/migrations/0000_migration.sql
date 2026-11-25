CREATE TABLE public.site_settings (
  id int PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  theme text NOT NULL DEFAULT 'pink',
  marquee_text text NOT NULL DEFAULT '💖 Selamat datang di dunia Syafira Kaer 💖 Kamu adalah yang terindah ✨',
  marquee_speed int NOT NULL DEFAULT 20,
  marquee_rainbow boolean NOT NULL DEFAULT true,
  music_url text,
  music_title text,
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.site_settings TO anon, authenticated;
GRANT ALL ON public.site_settings TO service_role;
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read settings" ON public.site_settings FOR SELECT TO anon, authenticated USING (true);
INSERT INTO public.site_settings (id) VALUES (1);

CREATE TABLE public.media_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  kind text NOT NULL CHECK (kind IN ('image','video')),
  url text NOT NULL,
  path text,
  caption text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.media_items TO anon, authenticated;
GRANT ALL ON public.media_items TO service_role;
ALTER TABLE public.media_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read media" ON public.media_items FOR SELECT TO anon, authenticated USING (true);