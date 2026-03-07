# Relationship Session Lifecycle Contract

## Intent

Pairing is modeled as explicit relationship sessions so link, unlink, and relink behavior is deterministic.

## Session Model

- active relationship is represented by one active session
- unlink ends the active session
- relink creates a new session, never reopens old sessions

## Pair History

- pair-history is retained indefinitely
- after unlink, pair-history is archived/hidden from active product flows
- archived history remains available for compliance/export/recovery paths

## Collaboration Scope

Collaboration artifacts include:

- word requests
- gift words
- tutor challenges
- challenge results
- love notes
- pair activity events

New collaboration writes must be associated with the active relationship session where supported.

## Unlink Behavior

- end active session timestamped
- shared subscription overlay removed immediately
- pending pair actions are expired where applicable

## Relink Behavior

- new active session created
- archived history does not reappear in active UI

## Acceptance Scenarios

1. Link creates an active session.
2. Unlink ends that session and removes shared overlay.
3. Relink creates a different session ID and active UI shows fresh pair timeline.
