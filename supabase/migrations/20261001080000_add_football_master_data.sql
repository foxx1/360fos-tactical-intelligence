-- Football Master Data v1
DO $$ BEGIN
  CREATE TYPE public.team_gender AS ENUM ('MEN','WOMEN','MIXED');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE public.team_category AS ENUM ('FIRST_TEAM','U23','U21','U20','U19','U18','U17','U16','U15','U14','ACADEMY','OTHER');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE public.teams
  ADD COLUMN IF NOT EXISTS short_name text,
  ADD COLUMN IF NOT EXISTS country text,
  ADD COLUMN IF NOT EXISTS club_name text,
  ADD COLUMN IF NOT EXISTS gender public.team_gender NOT NULL DEFAULT 'MEN',
  ADD COLUMN IF NOT EXISTS category public.team_category NOT NULL DEFAULT 'FIRST_TEAM',
  ADD COLUMN IF NOT EXISTS aliases text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS active boolean NOT NULL DEFAULT true;

CREATE INDEX IF NOT EXISTS teams_org_category_gender_active_idx
  ON public.teams (organization_id, category, gender, active);

CREATE TABLE IF NOT EXISTS public.team_competitions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id uuid NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  competition_id uuid NOT NULL REFERENCES public.competitions(id) ON DELETE CASCADE,
  season_id uuid NOT NULL REFERENCES public.seasons(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT team_competitions_unique UNIQUE (team_id, competition_id, season_id)
);

CREATE INDEX IF NOT EXISTS team_competitions_competition_season_idx
  ON public.team_competitions (competition_id, season_id);

CREATE INDEX IF NOT EXISTS team_competitions_team_season_idx
  ON public.team_competitions (team_id, season_id);

ALTER TABLE public.opponents
  ADD COLUMN IF NOT EXISTS team_id uuid REFERENCES public.teams(id) ON DELETE SET NULL;

CREATE UNIQUE INDEX IF NOT EXISTS opponents_org_team_unique
  ON public.opponents (organization_id, team_id)
  WHERE team_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS opponents_team_id_idx
  ON public.opponents (team_id);

ALTER TABLE public.team_competitions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "members can view team competitions" ON public.team_competitions;
CREATE POLICY "members can view team competitions"
  ON public.team_competitions
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.teams t
      WHERE t.id = team_competitions.team_id
        AND public.is_org_member(t.organization_id)
    )
  );

DROP POLICY IF EXISTS "members can view team competitions by competition" ON public.team_competitions;
CREATE POLICY "members can view team competitions by competition"
  ON public.team_competitions
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.competitions c
      WHERE c.id = team_competitions.competition_id
        AND public.is_org_member(c.organization_id)
    )
  );
