-- Portal v2: Goals, Achievements, Investor Achievements
-- Run this in your Supabase SQL editor

-- Goals table
CREATE TABLE IF NOT EXISTS public.goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'otro',
  target_amount NUMERIC(12,2) NOT NULL DEFAULT 0,
  current_amount NUMERIC(12,2) NOT NULL DEFAULT 0,
  deadline DATE,
  completed BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.goals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own goals"
  ON public.goals FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Achievement definitions (admin-managed)
CREATE TABLE IF NOT EXISTS public.achievement_definitions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  icon TEXT NOT NULL DEFAULT '⭐',
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.achievement_definitions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read achievement definitions"
  ON public.achievement_definitions FOR SELECT
  USING (TRUE);

-- Investor achievements (unlocked by users)
CREATE TABLE IF NOT EXISTS public.investor_achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  achievement_id UUID NOT NULL REFERENCES public.achievement_definitions(id) ON DELETE CASCADE,
  unlocked_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, achievement_id)
);

ALTER TABLE public.investor_achievements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read their own achievements"
  ON public.investor_achievements FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own achievements"
  ON public.investor_achievements FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Pre-populate achievement definitions
INSERT INTO public.achievement_definitions (icon, title, description, sort_order) VALUES
  ('🌱', 'Primer Paso', 'Realiza tu primera inversión', 1),
  ('💰', 'Inversor Activo', 'Acumula 1.000€ en ganancias', 2),
  ('📈', 'Racha Ganadora', 'Recibe cobros 6 meses seguidos', 3),
  ('🏆', 'Rentabilista', 'Alcanza 5.000€ en ganancias', 4),
  ('💎', 'Inversor Élite', 'Acumula 10.000€ en ganancias', 5),
  ('🎯', 'Meta Cumplida', 'Completa tu primera meta', 6),
  ('🔥', 'En Racha', '12 meses consecutivos con cobros', 7),
  ('🌟', 'Cartera Diversificada', 'Invierte en 3 préstamos distintos', 8)
ON CONFLICT DO NOTHING;
