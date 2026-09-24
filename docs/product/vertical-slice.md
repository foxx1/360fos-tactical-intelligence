# First Vertical Slice

## Goal

Prove the core 360FOS tactical workflow with the smallest end-to-end feature set.

## Flow

1. Create a match.
2. Add opponent analysis.
3. Add evidence with minute, phase, zone and note.
4. Classify a finding as strength or weakness.
5. Create a tactical gap.
6. Convert the gap into a training priority.

## Acceptance Criteria

- A user can create and view a match.
- Analysis belongs to a match and identifies OUR_TEAM or OPPONENT.
- Evidence is linked to the match and can reference a video timestamp.
- A tactical gap records opportunity/threat context and priority.
- A training priority records problem, diagnosis, objective and KPI.
- The UI exposes the workflow without requiring spreadsheet-style data entry.
- API responses use a consistent success/data/error contract.

## Out of Scope

- Automated video analysis
- Computer vision
- AI-generated tactical decisions
- GPS/wearables
- Advanced xG models
