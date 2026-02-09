# Orphaned / Removable Files

Audit date: 2026-02-09

These files are not referenced by any frontend code, backend include, or routing
configuration. They can be safely deleted without affecting application functionality.
The full SQL backup already captures any schema state these debug scripts were checking.

## Backend API Endpoints (custom/api/)

| File | Purpose | Why orphaned |
|------|---------|-------------|
| `check_calendar_schema.php` | Dev tool — checks calendar table schema | One-time diagnostic, never called from app |
| `debug_diagnosis_codes.php` | Dev tool — dumps diagnosis code lookups | Debug-only, never called from app |
| `diagnose_db.php` | Dev tool — database connectivity diagnostic | One-time diagnostic, never called from app |
| `session_login.php` | Alternative login endpoint | Superseded by `login.php` (which the frontend uses) |
| `supervisors.php` | Supervisor management CRUD | Supervisor features handled through `users.php` instead |
| `facility_types.php` | Facility types CRUD | Complete implementation but never wired to frontend |
| `notes/supervisor_cosign.php` | Alternative note co-signing (marked ALPHA) | Superseded by `sign_note.php` |

## Backend Library Files (custom/Lib/)

| File | Purpose | Why orphaned |
|------|---------|-------------|
| `ReferenceData.php` | Static reference data (US states, marital status, etc.) | Never imported or required by any file |

## Maintenance Scripts (custom/trash_bin/)

| File | Purpose | Why orphaned |
|------|---------|-------------|
| `check_supervisors.php` | CLI script to check supervisor assignments | Not part of app, manual maintenance tool |
| `unlock_accounts.php` | CLI script to unlock locked user accounts | Not part of app, manual maintenance tool |

## Notes

- `get_rooms.php` is still actively used (GET only, for calendar and facilities display).
  Room create/update/delete now routes through `settings_lists.php?list_id=rooms`.
- All files under `custom/Lib/` other than `ReferenceData.php` are actively used
  (loaded via `init.php` autoloader).
- All ~60 remaining API endpoints under `custom/api/` are actively called.
