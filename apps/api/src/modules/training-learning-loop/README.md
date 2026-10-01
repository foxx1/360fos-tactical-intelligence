# Training ↔ Match Learning Loop v1

The v1 loop closes the tactical learning cycle without introducing a new database migration.

Flow:
1. TrainingSession and TrainingBehaviourResult define the behaviours trained.
2. TrainingExercise.matchBehaviour provides an additional target when no behaviour result was recorded.
3. Completed match evidence with analysisType=OUR_TEAM validates whether the trained behaviour appeared in the match.
4. Each tracked behaviour receives TRANSFERRED, PARTIAL, NOT_TRANSFERRED, or INSUFFICIENT_EVIDENCE.
5. The response includes traceable evidence and next coaching actions.

The model is intentionally rule-based and auditable. It does not claim causality; it measures observable alignment between training targets and match evidence.
