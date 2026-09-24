create table if not exists public.training_session_assessments (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null unique references public.training_sessions(id) on delete cascade,
  overall_score double precision,
  transfer_rating text,
  coach_assessment text,
  strengths text,
  issues text,
  next_action text,
  match_readiness text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.training_behaviour_results (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.training_sessions(id) on delete cascade,
  exercise_id uuid references public.training_exercises(id) on delete set null,
  behaviour text not null,
  target_kpi text,
  successful_reps integer not null default 0,
  failed_reps integer not null default 0,
  success_rate double precision,
  coach_rating double precision,
  observation text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.training_learning_actions (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.training_sessions(id) on delete cascade,
  source_priority_id uuid references public.training_priorities(id) on delete set null,
  source_gap_id uuid references public.tactical_gaps(id) on delete set null,
  result text not null,
  recommendation text not null,
  created_at timestamptz not null default now()
);

create index if not exists training_behaviour_results_session_idx on public.training_behaviour_results (session_id);
create index if not exists training_behaviour_results_exercise_idx on public.training_behaviour_results (exercise_id);
create index if not exists training_learning_actions_session_idx on public.training_learning_actions (session_id);

alter table public.training_session_assessments enable row level security;
alter table public.training_behaviour_results enable row level security;
alter table public.training_learning_actions enable row level security;

create policy "training assessments org access" on public.training_session_assessments
for all to authenticated
using (exists (
  select 1 from public.training_sessions ts
  join public.matches m on m.id=ts.match_id
  join public.teams t on t.id=m.team_id
  where ts.id=training_session_assessments.session_id
    and public.is_org_member(t.organization_id)
))
with check (exists (
  select 1 from public.training_sessions ts
  join public.matches m on m.id=ts.match_id
  join public.teams t on t.id=m.team_id
  where ts.id=training_session_assessments.session_id
    and public.is_org_member(t.organization_id)
));

create policy "training behaviour results org access" on public.training_behaviour_results
for all to authenticated
using (exists (
  select 1 from public.training_sessions ts
  join public.matches m on m.id=ts.match_id
  join public.teams t on t.id=m.team_id
  where ts.id=training_behaviour_results.session_id
    and public.is_org_member(t.organization_id)
))
with check (exists (
  select 1 from public.training_sessions ts
  join public.matches m on m.id=ts.match_id
  join public.teams t on t.id=m.team_id
  where ts.id=training_behaviour_results.session_id
    and public.is_org_member(t.organization_id)
));

create policy "training learning actions org access" on public.training_learning_actions
for all to authenticated
using (exists (
  select 1 from public.training_sessions ts
  join public.matches m on m.id=ts.match_id
  join public.teams t on t.id=m.team_id
  where ts.id=training_learning_actions.session_id
    and public.is_org_member(t.organization_id)
))
with check (exists (
  select 1 from public.training_sessions ts
  join public.matches m on m.id=ts.match_id
  join public.teams t on t.id=m.team_id
  where ts.id=training_learning_actions.session_id
    and public.is_org_member(t.organization_id)
));

grant select, insert, update, delete on public.training_session_assessments,
  public.training_behaviour_results,
  public.training_learning_actions to authenticated;
