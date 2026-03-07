# Apple Revocation and Deletion Contract

## Intent

Apple-linked account deletion must follow a deterministic server-side revocation path.

## Storage Contract

- provider revocation inputs (including refresh token/state) must live in server-private storage
- schema, runtime code, and types must agree on storage fields

## Deletion Behavior

Delete-account flow must handle and report:

- revoke succeeded
- revoke attempted but provider failed
- required revoke state missing

Missing required revoke state is a defect, not acceptable silent fallback.

## Logging and Safety

- logs may include outcome class but not raw provider secrets
- client responses should use safe error categories

## Acceptance Scenarios

1. Apple-linked delete path attempts revoke using server-private state.
2. Missing revoke state is surfaced explicitly.
3. Database schema and runtime code stay in sync for revocation fields.
