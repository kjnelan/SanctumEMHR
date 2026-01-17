# Mindline Database Migration - Changes Summary

**Date**: 2026-01-17
**Status**: IN PROGRESS
**Example File**: `custom/api/get_appointments.php` ✅ MIGRATED

---

## What Changed: OpenEMR → Mindline

### 1. Initialization (Every File)

**OLD (OpenEMR)**:
```php
require_once(__DIR__ . '/../../interface/globals.php');
```

**NEW (Mindline)**:
```php
require_once(__DIR__ . '/../init.php');

use Custom\Lib\Database\Database;
use Custom\Lib\Session\SessionManager;
```

---

### 2. Database Queries

**OLD (OpenEMR)**:
```php
$result = sqlStatement($sql, $params);
while ($row = sqlFetchArray($result)) {
    // Process row
}
```

**NEW (Mindline)**:
```php
$db = Database::getInstance();
$rows = $db->queryAll($sql, $params);
foreach ($rows as $row) {
    // Process row
}
```

**Other Database Method Replacements**:
- `sqlQuery($sql, $params)` → `$db->query($sql, $params)` (single row)
- `sqlStatement($sql, $params)` → `$db->queryAll($sql, $params)` (all rows)
- `sqlInsert($sql, $params)` → `$db->insert($sql, $params)` (returns ID)
- `sqlUpdate($sql, $params)` → `$db->execute($sql, $params)` (returns affected rows)

---

### 3. Session/Authentication

**OLD (OpenEMR)**:
```php
// Session started by globals.php automatically
if (!isset($_SESSION['authUserID']) || empty($_SESSION['authUserID'])) {
    // Not authenticated
}
$userId = $_SESSION['authUserID'];
```

**NEW (Mindline)**:
```php
$session = SessionManager::getInstance();
$session->start();

if (!$session->isAuthenticated()) {
    // Not authenticated
}
$userId = $session->getUserId();
```

---

### 4. Table Name Changes

| OpenEMR Table | Mindline Table | Notes |
|---------------|----------------|-------|
| `openemr_postcalendar_events` | `appointments` | Simplified name |
| `openemr_postcalendar_categories` | `appointment_categories` | Simplified name |
| `patient_data` | `clients` | Mental health terminology |
| `users` | `users` | **No change** |
| `facility` | `facilities` | Plural |
| `form_encounter` | `encounters` | Simplified |
| `insurance_data` | `client_insurance` | More descriptive |
| `insurance_companies` | `insurance_providers` | Clearer name |
| `list_options` | `settings_lists` | Clearer purpose |

---

### 5. Column Name Changes (Appointments Example)

| OpenEMR Column | Mindline Column | Type Change |
|----------------|-----------------|-------------|
| `pc_eid` | `id` | Same |
| `pc_eventDate` | `start_datetime` | DATE → TIMESTAMP (combined with time) |
| `pc_startTime` | `start_datetime` | TIME → part of TIMESTAMP |
| `pc_endTime` | `end_datetime` | TIME → TIMESTAMP |
| `pc_duration` | `duration` | INT (minutes) |
| `pc_catid` | `category_id` | Same |
| `pc_apptstatus` | `status` | VARCHAR → ENUM |
| `pc_title` | `title` | Same |
| `pc_hometext` | `notes` | Renamed |
| `pc_pid` | `client_id` | Renamed from patient |
| `pc_aid` | `provider_id` | Simplified |
| `pc_facility` | `facility_id` | Simplified |
| `pc_room` | ❌ REMOVED | Not in new schema |
| `pc_recurrtype` | → `appointment_recurrence` table | Moved to separate table |

---

### 6. Client (Patient) Table Changes

| OpenEMR Column | Mindline Column | Notes |
|----------------|-----------------|-------|
| `pid` | `id` | Standard naming |
| `fname` | `first_name` | Full words |
| `lname` | `last_name` | Full words |
| `mname` | `middle_name` | Full words |
| `DOB` | `date_of_birth` | Full words |
| `sex` | `sex` | No change |
| ❌ N/A | `gender_identity` | NEW - separate field |
| ❌ N/A | `sexual_orientation` | NEW - separate field |
| ❌ N/A | `preferred_name` | NEW field |

---

### 7. Date/Time Handling Changes

**OpenEMR** used separate DATE and TIME fields:
```sql
WHERE e.pc_eventDate >= ? AND e.pc_eventDate <= ?
ORDER BY e.pc_eventDate, e.pc_startTime
```

**Mindline** uses combined TIMESTAMP:
```sql
WHERE DATE(a.start_datetime) >= ? AND DATE(a.start_datetime) <= ?
ORDER BY a.start_datetime
```

**In PHP** - extract date and time:
```php
$startDT = new DateTime($row['start_datetime']);
$eventDate = $startDT->format('Y-m-d');
$startTime = $startDT->format('H:i:s');
```

---

### 8. Status Values Changed

**OpenEMR Appointment Statuses** (VARCHAR):
- `-` (dash) = not set
- `*` = confirmed
- `@` = arrived
- `~` = completed
- `x` = cancelled
- `?` = no show

**Mindline Appointment Statuses** (ENUM):
- `scheduled`
- `confirmed`
- `arrived`
- `in_session`
- `completed`
- `cancelled`
- `no_show`

**Migration**: May need mapping function if frontend still expects old values.

---

### 9. Removed Features/Fields

These OpenEMR features are **NOT** in Mindline schema:

| Feature | Reason |
|---------|--------|
| Room selection in appointments | Removed for simplicity |
| Multiple facility users tables | Consolidated to single `users` table |
| `pc_cattype` (category type 0/1) | Now use `is_billable` boolean in categories |
| Portal-specific tables | Portal not part of initial Mindline release |

---

### 10. Query Example: Before & After

**BEFORE (OpenEMR)**:
```sql
SELECT
    e.pc_eid,
    e.pc_eventDate,
    e.pc_startTime,
    e.pc_endTime,
    e.pc_duration,
    e.pc_catid,
    e.pc_apptstatus,
    pd.fname AS patient_fname,
    pd.lname AS patient_lname,
    CONCAT(u.fname, ' ', u.lname) AS provider_name
FROM openemr_postcalendar_events e
LEFT JOIN patient_data pd ON e.pc_pid = pd.pid
LEFT JOIN users u ON e.pc_aid = u.id
WHERE e.pc_eventDate >= ? AND e.pc_eventDate <= ?
ORDER BY e.pc_eventDate, e.pc_startTime
```

**AFTER (Mindline)**:
```sql
SELECT
    a.id,
    a.start_datetime,
    a.end_datetime,
    a.duration,
    a.category_id,
    a.status,
    CONCAT(cl.first_name, ' ', cl.last_name) AS client_name,
    CONCAT(u.first_name, ' ', u.last_name) AS provider_name
FROM appointments a
LEFT JOIN clients cl ON a.client_id = cl.id
LEFT JOIN users u ON a.provider_id = u.id
WHERE DATE(a.start_datetime) >= ? AND DATE(a.start_datetime) <= ?
ORDER BY a.start_datetime
```

---

## Migration Checklist (Per File)

For each API file being migrated:

- [ ] Replace `globals.php` with `init.php`
- [ ] Add `use` statements for Database and SessionManager
- [ ] Replace all `sqlQuery()` / `sqlStatement()` calls
- [ ] Update table names (openemr_* → mindline names)
- [ ] Update column names (pc_* → descriptive names)
- [ ] Update client references (patient_* → client_*)
- [ ] Fix date/time field handling (separate → combined TIMESTAMP)
- [ ] Update session auth to use SessionManager
- [ ] Test endpoint with Postman/curl
- [ ] Verify frontend still works

---

## Files Migration Status

### ✅ Completed (2)
1. `custom/api/session_user.php` - Already migrated
2. `custom/api/get_appointments.php` - **JUST MIGRATED** (template/example)

### 🔄 In Progress (0)

### ⏳ Pending (49)
See full list in `/MIGRATION_PLAN_CLEAN_START.md`

---

## Next Steps

1. **Test** `get_appointments.php` endpoint
2. **Verify** React frontend still loads appointments
3. **Migrate** next 5-10 similar files
4. **Batch migrate** remaining files
5. **Final testing** of all endpoints

---

## Key Lessons Learned

1. **Mindline uses cleaner naming** - no prefixes like `pc_`, `openemr_`
2. **Timestamps instead of separate date/time** - more modern approach
3. **ENUMs for status values** - type safety and clarity
4. **"Client" terminology** - better for mental health context than "patient"
5. **Rooms removed** - simplified scheduling model

---

## Breaking Changes for Frontend

The React frontend may need updates if it expects:
- Old status values (`*`, `@`, `~` → `confirmed`, `arrived`, `completed`)
- Separate `eventDate` and `startTime` fields (currently converted in API response)
- Room information (now returns `null`)

Check: `/react-frontend/src/components/Calendar/` for any hardcoded assumptions.

---

## Database Connection Check

Verify `config/database.php` points to **Mindline** database:
```php
'database' => 'mindline',  // NOT 'openemr'
```

Verify no code references `/sqlconf.php` (OpenEMR config).

---

**End of Summary** | Updated: 2026-01-17 by Claude
