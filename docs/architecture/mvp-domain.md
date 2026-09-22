# 360FOS Tactical Intelligence — MVP Domain Model

## Core Flow

Match
→ Analysis
→ Evidence
→ Strengths / Weaknesses
→ Tactical Gap
→ Training Priority
→ Match Plan
→ Post-Match Validation

## Core Aggregates

### Organization
Tenant boundary for all club data.

### Team
The club/team being analyzed.

### Match
The primary tactical workspace. Analysis, evidence, gaps and training priorities are attached to a match.

### Analysis
A structured observation about either our team or the opponent.

### Evidence
The atomic, traceable observation from a match/video timeline.

### Tactical Gap
The relationship between our capability and an opponent characteristic. A gap becomes either an opportunity or a threat.

### Training Priority
A diagnosed problem/opportunity converted into a training objective with measurable transfer to the match.

## Tactical Phases

- IN_POSSESSION
- OUT_OF_POSSESSION
- ATTACKING_TRANSITION
- DEFENSIVE_TRANSITION
- SET_PIECE

## MVP Rule

No recommendation should exist without an evidence or analysis basis. The coach can override any system recommendation.

## Multi-Tenancy

Every organization-owned aggregate is scoped to an organization. Future RLS policies must enforce organization isolation at the database layer.
