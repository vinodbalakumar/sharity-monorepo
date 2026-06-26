# Windows QA Database

Windows hosts the primary QA MySQL database for Sharity.

## Rules

- The Windows QA database is the primary QA database.
- QA deployment nodes connect to it through the approved private network path.
- The database is not exposed publicly.
- No replica or cluster is introduced by this repository.

## Network model

- Windows remains the database anchor for QA.
- Mac and Linux QA nodes reference the Windows database using the approved internal connectivity path.
- Tailscale or an equivalent controlled path is used when required by the environment.

## Notes

- The repository only documents the integration points.
- It does not change database schema, data, or access policies.
