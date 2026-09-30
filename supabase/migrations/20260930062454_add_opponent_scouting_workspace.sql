create table if not exists public.opponent_scouting_matches (
  id uuid primary key default gen_random_uuid(),
  upcoming_match_id uuid not null references public.matches(id) on delete cascade,
  opponent_id uuid not null references public.opponents(id) on delete cascade,
  opponent_name text not null,
  external_opponent_name text not null,
  match_date timestamptz not null,
  opponent_score integer,
  external_score integer,
  opponent_home boolean not null default true,
  video_ref text,
  notes text,
  sequence integer not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(upcoming_match_id, sequence)
);

create index if not exists opponent_scouting_matches_upcoming_date_idx
  on public.opponent_scouting_matches(upcoming_match_id, match_date);
create index if not exists opponent_scouting_matches_opponent_date_idx
  on public.opponent_scouting_matches(opponent_id, match_date);

create table if not exists public.opponent_scouting_evidence (
  id uuid primary key default gen_random_uuid(),
  scouting_match_id uuid not null references public.opponent_scouting_matches(id) on delete cascade,
  minute double precision not null,
  phase public.tactical_phase not null,
  principle text,
  sub_principle text,
  behaviour text,
  actor text,
  target text,
  trigger text,
  outcome text,
  zone text,
  impact integer,
  note text not null,
  video_ref text,
  created_at timestamptz not null default now()
);

create index if not exists opponent_scouting_evidence_match_minute_idx
  on public.opponent_scouting_evidence(scouting_match_id, minute);
create index if not exists opponent_scouting_evidence_match_phase_principle_idx
  on public.opponent_scouting_evidence(scouting_match_id, phase, principle);
create index if not exists opponent_scouting_evidence_match_outcome_idx
  on public.opponent_scouting_evidence(scouting_match_id, outcome);

alter table public.opponent_scouting_matches enable row level security;
alter table public.opponent_scouting_evidence enable row level security;

drop policy if exists "opponent_scouting_matches_org_select" on public.opponent_scouting_matches;
create policy "opponent_scouting_matches_org_select" on public.opponent_scouting_matches
for select to authenticated using (
  exists (select 1 from public.matches m join public.teams t on t.id=m.team_id
  where m.id=upcoming_match_id and public.is_org_member(t.organization_id))
);
drop policy if exists "opponent_scouting_matches_org_insert" on public.opponent_scouting_matches;
create policy "opponent_scouting_matches_org_insert" on public.opponent_scouting_matches
for insert to authenticated with check (
  exists (select 1 from public.matches m join public.teams t on t.id=m.team_id
  where m.id=upcoming_match_id and public.is_org_member(t.organization_id))
);
drop policy if exists "opponent_scouting_matches_org_update" on public.opponent_scouting_matches;
create policy "opponent_scouting_matches_org_update" on public.opponent_scouting_matches
for update to authenticated using (
  exists (select 1 from public.matches m join public.teams t on t.id=m.team_id
  where m.id=upcoming_match_id and public.is_org_member(t.organization_id))
) with check (
  exists (select 1 from public.matches m join public.teams t on t.id=m.team_id
  where m.id=upcoming_match_id and public.is_org_member(t.organization_id))
);
drop policy if exists "opponent_scouting_matches_org_delete" on public.opponent_scouting_matches;
create policy "opponent_scouting_matches_org_delete" on public.opponent_scouting_matches
for delete to authenticated using (
  exists (select 1 from public.matches m join public.teams t on t.id=m.team_id
  where m.id=upcoming_match_id and public.is_org_member(t.organization_id))
);

drop policy if exists "opponent_scouting_evidence_org_select" on public.opponent_scouting_evidence;
create policy "opponent_scouting_evidence_org_select" on public.opponent_scouting_evidence
for select to authenticated using (
  exists (select 1 from public.opponent_scouting_matches sm
  join public.matches m on m.id=sm.upcoming_match_id join public.teams t on t.id=m.team_id
  where sm.id=scouting_match_id and public.is_org_member(t.organization_id))
);
drop policy if exists "opponent_scouting_evidence_org_insert" on public.opponent_scouting_evidence;
create policy "opponent_scouting_evidence_org_insert" on public.opponent_scouting_evidence
for insert to authenticated with check (
  exists (select 1 from public.opponent_scouting_matches sm
  join public.matches m on m.id=sm.upcoming_match_id join public.teams t on t.id=m.team_id
  where sm.id=scouting_match_id and public.is_org_member(t.organization_id))
);
drop policy if exists "opponent_scouting_evidence_org_update" on public.opponent_scouting_evidence;
create policy "opponent_scouting_evidence_org_update" on public.opponent_scouting_evidence
for update to authenticated using (
  exists (select 1 from public.opponent_scouting_matches sm
  join public.matches m on m.id=sm.upcoming_match_id join public.teams t on t.id=m.team_id
  where sm.id=scouting_match_id and public.is_org_member(t.organization_id))
) with check (
  exists (select 1 from public.opponent_scouting_matches sm
  join public.matches m on m.id=sm.upcoming_match_id join public.teams t on t.id=m.team_id
  where sm.id=scouting_match_id and public.is_org_member(t.organization_id))
);
drop policy if exists "opponent_scouting_evidence_org_delete" on public.opponent_scouting_evidence;
create policy "opponent_scouting_evidence_org_delete" on public.opponent_scouting_evidence
for delete to authenticated using (
  exists (select 1 from public.opponent_scouting_matches sm
  join public.matches m on m.id=sm.upcoming_match_id join public.teams t on t.id=m.team_id
  where sm.id=scouting_match_id and public.is_org_member(t.organization_id))
);