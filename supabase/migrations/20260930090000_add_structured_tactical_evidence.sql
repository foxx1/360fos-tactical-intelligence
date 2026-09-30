alter table public.evidence
  add column if not exists principle text,
  add column if not exists sub_principle text,
  add column if not exists behaviour text,
  add column if not exists actor text,
  add column if not exists target text,
  add column if not exists trigger text,
  add column if not exists outcome text;

create index if not exists evidence_match_phase_principle_idx
  on public.evidence (match_id, phase, principle);

create index if not exists evidence_match_analysis_outcome_idx
  on public.evidence (match_id, analysis_type, outcome);
