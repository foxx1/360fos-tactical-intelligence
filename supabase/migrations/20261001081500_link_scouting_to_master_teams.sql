ALTER TABLE public.opponent_scouting_matches
  ADD COLUMN IF NOT EXISTS external_opponent_team_id uuid REFERENCES public.teams(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS opponent_scouting_matches_external_team_idx
  ON public.opponent_scouting_matches (external_opponent_team_id);
