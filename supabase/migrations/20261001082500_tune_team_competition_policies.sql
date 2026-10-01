DROP POLICY IF EXISTS "members can view team competitions by competition" ON public.team_competitions;

CREATE INDEX IF NOT EXISTS team_competitions_season_idx
  ON public.team_competitions (season_id);
