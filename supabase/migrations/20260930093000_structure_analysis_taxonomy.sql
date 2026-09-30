alter table public.analyses
  add column if not exists principle text,
  add column if not exists sub_principle text,
  add column if not exists actor text,
  add column if not exists target text,
  add column if not exists trigger text,
  add column if not exists outcome text,
  add column if not exists zone text;

create index if not exists analyses_match_type_principle_idx
  on public.analyses (match_id, type, principle);

create index if not exists analyses_match_type_outcome_idx
  on public.analyses (match_id, type, outcome);
