# OpenEMR to Mindline - Complete Table & Column Mapping
**For Migration of 49 API Files**
**Date**: 2026-01-17

---

## TABLE NAME MAPPINGS

### Core Tables

| OpenEMR Table | Mindline Table | Notes |
|---------------|----------------|-------|
| `users` | `users` | **NO CHANGE** - Same table name |
| `patient_data` | `clients` | ✅ Renamed - mental health terminology |
| `facility` | `facilities` | ✅ Plural form |

### Appointment Tables

| OpenEMR Table | Mindline Table | Notes |
|---------------|----------------|-------|
| `openemr_postcalendar_events` | `appointments` | ✅ Simplified |
| `openemr_postcalendar_categories` | `appointment_categories` | ✅ Simplified |
| (N/A - part of events table) | `appointment_recurrence` | ✅ NEW separate table |

### Insurance Tables

| OpenEMR Table | Mindline Table | Notes |
|---------------|----------------|-------|
| `insurance_companies` | `insurance_providers` | ✅ More accurate name |
| `insurance_data` | `client_insurance` | ✅ More descriptive |

### Clinical Tables

| OpenEMR Table | Mindline Table | Notes |
|---------------|----------------|-------|
| `form_encounter` | `encounters` | ✅ Simplified |
| `clinical_notes` | `clinical_notes` | **NO CHANGE** |
| (various form tables) | `clinical_note_addendums` | ✅ Standardized |

### Other Tables

| OpenEMR Table | Mindline Table | Notes |
|---------------|----------------|-------|
| `list_options` | `settings_lists` | ✅ Clearer purpose |
| `icd10_dx_order_code` | `diagnostic_codes` | ✅ Generic (supports ICD-10, ICD-11, DSM-5) |
| `billing` | `billing_transactions` | ✅ More descriptive |
| `payments` | `payments` | **NO CHANGE** |
| `ar_activity` | `payment_allocations` | ✅ Clearer name |
| `claims` | `claims` | **NO CHANGE** |
| `categories` | `document_categories` | ✅ More specific |
| `documents` | `documents` | **NO CHANGE** |

---

## COLUMN MAPPINGS BY TABLE

### 1. USERS Table
**Table Name**: `users` → `users` (NO CHANGE)

| OpenEMR Column | Mindline Column | Type Change | Notes |
|----------------|-----------------|-------------|-------|
| `id` | `id` | - | Same |
| `username` | `username` | - | Same |
| `password` | `password_hash` | - | Renamed for clarity |
| `fname` | `first_name` | - | Full words |
| `lname` | `last_name` | - | Full words |
| `mname` | `middle_name` | - | Full words |
| `email` | `email` | - | Same |
| `active` | `is_active` | VARCHAR→BOOLEAN | Boolean |
| `authorized` | `is_provider` | VARCHAR→BOOLEAN | Boolean |
| `npi` | `npi` | - | Same |
| `phone` | `phone` | - | Same |
| `phonecell` | `mobile` | - | Renamed |
| ❌ N/A | `user_type` | - | NEW ENUM field |
| ❌ N/A | `uuid` | - | NEW UUID field |

### 2. CLIENTS Table
**Table Name**: `patient_data` → `clients`

| OpenEMR Column | Mindline Column | Type Change | Notes |
|----------------|-----------------|-------------|-------|
| `pid` | `id` | - | Standard naming |
| `uuid` | `uuid` | - | Same |
| `fname` | `first_name` | - | Full words |
| `lname` | `last_name` | - | Full words |
| `mname` | `middle_name` | - | Full words |
| ❌ N/A | `preferred_name` | - | NEW field |
| `DOB` | `date_of_birth` | - | Full words |
| `sex` | `sex` | - | Same |
| `gender_identity` | `gender_identity` | - | Same |
| `sexual_orientation` | `sexual_orientation` | - | Same |
| `ss` | `ssn_encrypted` | - | Encrypted storage |
| `email` | `email` | - | Same |
| `phone_home` | `phone_home` | - | Same |
| `phone_cell` | `phone_mobile` | - | Renamed |
| `phone_biz` | `phone_work` | - | Renamed |
| `street` | `address_line1` | - | Renamed |
| `city` | `city` | - | Same |
| `state` | `state` | - | Same |
| `postal_code` | `zip` | - | Renamed |
| `county` | `county` | - | Same |
| `providerID` | `primary_provider_id` | - | More descriptive |
| `genericname1` | ❌ REMOVED | - | Generic fields removed |
| `genericval1` | ❌ REMOVED | - | Generic fields removed |
| ❌ N/A | `status` | - | NEW ENUM field |
| ❌ N/A | `intake_date` | - | NEW field |
| ❌ N/A | `discharge_date` | - | NEW field |

### 3. APPOINTMENTS Table
**Table Name**: `openemr_postcalendar_events` → `appointments`

| OpenEMR Column | Mindline Column | Type Change | Notes |
|----------------|-----------------|-------------|-------|
| `pc_eid` | `id` | - | Standard naming |
| `pc_eventDate` | `start_datetime` | DATE→TIMESTAMP | Combined with time |
| `pc_startTime` | `start_datetime` | TIME→TIMESTAMP | Part of datetime |
| `pc_endTime` | `end_datetime` | TIME→TIMESTAMP | Separate timestamp |
| `pc_duration` | `duration` | - | INT (minutes) |
| `pc_catid` | `category_id` | - | Standard FK naming |
| `pc_pid` | `client_id` | - | Renamed from patient |
| `pc_aid` | `provider_id` | - | Standard FK naming |
| `pc_facility` | `facility_id` | - | Standard FK naming |
| `pc_apptstatus` | `status` | VARCHAR→ENUM | ENUM type |
| `pc_title` | `title` | - | Same |
| `pc_hometext` | `notes` | - | Renamed |
| `pc_room` | ❌ REMOVED | - | Not in new schema |
| `pc_recurrtype` | (separate table) | - | Moved to `appointment_recurrence` |
| `pc_recurrspec` | (separate table) | - | Moved to `appointment_recurrence` |
| ❌ N/A | `appointment_type` | - | NEW field |
| ❌ N/A | `cancellation_reason` | - | NEW field |
| ❌ N/A | `cancelled_by` | - | NEW FK field |

**Status Value Mapping**:
- `-` (OpenEMR) → `scheduled` (Mindline)
- `*` → `confirmed`
- `@` → `arrived`
- `~` → `completed`
- `x` → `cancelled`
- `?` → `no_show`
- ❌ N/A → `in_session` (NEW)

### 4. APPOINTMENT_CATEGORIES Table
**Table Name**: `openemr_postcalendar_categories` → `appointment_categories`

| OpenEMR Column | Mindline Column | Type Change | Notes |
|----------------|-----------------|-------------|-------|
| `pc_catid` | `id` | - | Standard naming |
| `pc_catname` | `name` | - | Simplified |
| `pc_catcolor` | `color` | - | Simplified |
| `pc_catdesc` | `description` | - | Simplified |
| `pc_cattype` | `is_billable` | INT→BOOLEAN | Inverted logic |
| `pc_duration` | `default_duration` | - | More descriptive |
| `pc_active` | `is_active` | VARCHAR→BOOLEAN | Boolean |
| ❌ N/A | `sort_order` | - | NEW field |

**cattype mapping**:
- `0` (appointment) → `is_billable = TRUE`
- `1` (availability) → `is_billable = FALSE`

### 5. FACILITIES Table
**Table Name**: `facility` → `facilities`

| OpenEMR Column | Mindline Column | Type Change | Notes |
|----------------|-----------------|-------------|-------|
| `id` | `id` | - | Same |
| `name` | `name` | - | Same |
| `phone` | `phone` | - | Same |
| `fax` | `fax` | - | Same |
| `email` | `email` | - | Same |
| `street` | `address_line1` | - | Renamed |
| `city` | `city` | - | Same |
| `state` | `state` | - | Same |
| `postal_code` | `zip` | - | Renamed |
| `facility_npi` | `facility_npi` | - | Same |
| `tax_id_type` | ❌ REMOVED | - | Simplified |
| ❌ N/A | `facility_type` | - | NEW field |
| ❌ N/A | `is_primary` | - | NEW field |

### 6. INSURANCE_PROVIDERS Table
**Table Name**: `insurance_companies` → `insurance_providers`

| OpenEMR Column | Mindline Column | Type Change | Notes |
|----------------|-----------------|-------------|-------|
| `id` | `id` | - | Same |
| `name` | `name` | - | Same |
| `payer_id` | `payer_id` | - | Same |
| `phone` | `phone` | - | Same |
| `fax` | `fax` | - | Same |
| `x12_receiver_id` | ❌ REMOVED | - | EDI-specific |
| `x12_default_partner_id` | ❌ REMOVED | - | EDI-specific |
| ❌ N/A | `insurance_type` | - | NEW ENUM field |

### 7. CLIENT_INSURANCE Table
**Table Name**: `insurance_data` → `client_insurance`

| OpenEMR Column | Mindline Column | Type Change | Notes |
|----------------|-----------------|-------------|-------|
| `id` | `id` | - | Same |
| `pid` | `client_id` | - | Renamed |
| `provider` | `insurance_provider_id` | - | More specific |
| `type` | `priority` | VARCHAR→ENUM | Changed to priority |
| `policy_number` | `policy_number` | - | Same |
| `group_number` | `group_number` | - | Same |
| `subscriber_relationship` | `subscriber_relationship` | VARCHAR→ENUM | ENUM type |
| `subscriber_fname` / `subscriber_lname` | `subscriber_name` | - | Combined |
| `subscriber_DOB` | `subscriber_dob` | - | Same |
| `subscriber_ss` | `subscriber_ssn_encrypted` | - | Encrypted |
| `subscriber_sex` | `subscriber_sex` | VARCHAR→ENUM | ENUM type |
| `date` | `effective_date` | - | Renamed |
| `copay` | `copay_amount` | - | Renamed |
| ❌ N/A | `expiration_date` | - | NEW field |

### 8. ENCOUNTERS Table
**Table Name**: `form_encounter` → `encounters`

| OpenEMR Column | Mindline Column | Type Change | Notes |
|----------------|-----------------|-------------|-------|
| `encounter` | `id` | - | Standard naming |
| `pid` | `client_id` | - | Renamed |
| `provider_id` | `provider_id` | - | Same |
| `facility_id` | `facility_id` | - | Same |
| `date` | `encounter_date` | - | More specific |
| ❌ N/A | `encounter_datetime` | - | NEW TIMESTAMP |
| `reason` | `chief_complaint` | - | More clinical |
| ❌ N/A | `encounter_type` | - | NEW field |
| ❌ N/A | `status` | - | NEW ENUM field |
| ❌ N/A | `signed_at` | - | NEW field |
| ❌ N/A | `signed_by` | - | NEW FK field |

### 9. CLINICAL_NOTES Table
**Table Name**: `clinical_notes` → `clinical_notes` (NO CHANGE)

| OpenEMR Column | Mindline Column | Type Change | Notes |
|----------------|-----------------|-------------|-------|
| `id` | `id` | - | Same |
| `pid` | `client_id` | - | Renamed |
| `encounter_id` | `encounter_id` | - | Same |
| `provider_id` | `provider_id` | - | Same |
| `note_type` | `note_type` | - | Same |
| `subjective` | `subjective` | - | Same |
| `objective` | `objective` | - | Same |
| `assessment` | `assessment` | - | Same |
| `plan` | `plan` | - | Same |
| ❌ N/A | `mental_status_exam` | - | NEW JSON field |
| ❌ N/A | `risk_assessment` | - | NEW JSON field |
| ❌ N/A | `treatment_interventions` | - | NEW JSON field |

### 10. SETTINGS_LISTS Table
**Table Name**: `list_options` → `settings_lists`

| OpenEMR Column | Mindline Column | Type Change | Notes |
|----------------|-----------------|-------------|-------|
| `list_id` | `list_id` | - | Same |
| `option_id` | `option_id` | - | Same |
| `title` | `title` | - | Same |
| `notes` | `notes` | - | Same |
| `activity` | `is_active` | INT→BOOLEAN | Boolean |
| `seq` | `sort_order` | - | Renamed |
| ❌ N/A | `is_default` | - | NEW field |

---

## COMMON QUERY PATTERNS

### Pattern 1: Patient → Client Conversion

**OpenEMR**:
```sql
SELECT
    pd.pid,
    pd.fname,
    pd.lname,
    pd.DOB
FROM patient_data pd
WHERE pd.pid = ?
```

**Mindline**:
```sql
SELECT
    c.id,
    c.first_name,
    c.last_name,
    c.date_of_birth
FROM clients c
WHERE c.id = ?
```

### Pattern 2: Appointment Query with Date/Time

**OpenEMR**:
```sql
SELECT
    pc_eventDate,
    pc_startTime,
    pc_endTime
FROM openemr_postcalendar_events
WHERE pc_eventDate >= ? AND pc_eventDate <= ?
ORDER BY pc_eventDate, pc_startTime
```

**Mindline**:
```sql
SELECT
    start_datetime,
    end_datetime
FROM appointments
WHERE DATE(start_datetime) >= ? AND DATE(start_datetime) <= ?
ORDER BY start_datetime
```

### Pattern 3: Full Name Concatenation

**OpenEMR**:
```sql
CONCAT(pd.fname, ' ', pd.lname) AS patient_name
```

**Mindline**:
```sql
CONCAT(c.first_name, ' ', c.last_name) AS client_name
```

### Pattern 4: Status Filtering (Appointments)

**OpenEMR**:
```sql
WHERE pc_apptstatus IN ('-', '*', '@')  -- scheduled, confirmed, arrived
```

**Mindline**:
```sql
WHERE status IN ('scheduled', 'confirmed', 'arrived')
```

---

## DATABASE FUNCTION REPLACEMENTS

### Query Functions

| OpenEMR Function | Mindline Method | Notes |
|------------------|-----------------|-------|
| `sqlQuery($sql, $params)` | `$db->query($sql, $params)` | Single row |
| `sqlStatement($sql, $params)` | `$db->queryAll($sql, $params)` | All rows |
| `sqlFetchArray($result)` | Not needed | `queryAll()` returns array |
| `sqlInsert($sql, $params)` | `$db->insert($sql, $params)` | Returns last ID |
| `sqlNumRows($result)` | `count($rows)` | Count array |

### Session Functions

| OpenEMR Code | Mindline Code |
|--------------|---------------|
| `$_SESSION['authUserID']` | `$session->getUserId()` |
| `$_SESSION['authUser']` | `$session->get('username')` |
| `isset($_SESSION['authUserID'])` | `$session->isAuthenticated()` |

---

## REMOVED FIELDS/FEATURES

These fields from OpenEMR are **NOT** in Mindline:

1. **Appointment Rooms** (`pc_room`) - Removed for simplicity
2. **Generic Fields** (`genericname1-9`, `genericval1-9`) - Use proper fields
3. **EDI Fields** in insurance - Moved to billing module
4. **Multiple language fields** - Simplified to `primary_language`
5. **Old session tracking** - New session table

---

## MIGRATION CHECKLIST (Per File)

For each of the 49 API files:

- [ ] Replace `require_once globals.php` with `require_once init.php`
- [ ] Add `use` statements for Database/SessionManager
- [ ] Update table names (use table above)
- [ ] Update column names (use columns above)
- [ ] Fix date/time handling (separate → combined)
- [ ] Update status values (symbols → words)
- [ ] Replace `sqlQuery()` family with `$db->` methods
- [ ] Replace `$_SESSION` with `$session->` methods
- [ ] Remove references to removed fields (room, generic fields)
- [ ] Test endpoint after migration

---

**END OF MAPPING DOCUMENT**
**Use this as reference for all 49 API file migrations**
