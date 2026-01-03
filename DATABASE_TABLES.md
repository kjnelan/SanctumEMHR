# Mindline EMHR - Database Tables Documentation

**Database Name:** `mindline_emhr` (currently using OpenEMR schema)
**Purpose:** Documentation for migration planning away from OpenEMR backend
**Last Updated:** 2026-01-03

---

## Executive Summary

This document catalogs all database tables currently used by the Mindline EMHR application. This inventory is essential for planning the migration from OpenEMR's backend to a custom database schema.

**Total Tables in Use:** 26 core tables
**Most Frequently Accessed:** `openemr_postcalendar_events`, `patient_data`, `users`, `list_options`

---

## Core Tables by Functional Area

### 1. CALENDAR & SCHEDULING (High Priority for Migration)

#### `openemr_postcalendar_events` ⭐ CRITICAL
**Usage Frequency:** Very High (10+ queries)
**Used By:**
- `get_appointments.php` - Fetch appointments and availability blocks
- `create_appointment.php` - Create new appointments/blocks
- `update_appointment.php` - Update appointments/blocks (including recurring series)
- `delete_appointment.php` - Delete appointments/blocks (including recurring series)

**Key Fields:**
- `pc_eid` - Event ID (primary key)
- `pc_eventDate` - Appointment date
- `pc_startTime` - Start time
- `pc_endTime` - End time
- `pc_duration` - Duration in seconds
- `pc_catid` - Category ID (links to calendar categories)
- `pc_pid` - Patient ID
- `pc_aid` - Provider ID (user ID)
- `pc_room` - Room/location
- `pc_title` - Appointment title
- `pc_hometext` - Comments/notes
- `pc_apptstatus` - Appointment status
- `pc_recurrtype` - Recurrence type (0=none, 1=recurring)
- `pc_recurrspec` - Recurrence ID (links series)
- `pc_facility` - Facility ID

**Operations:** SELECT, INSERT, UPDATE, DELETE
**Migration Priority:** ⭐⭐⭐ CRITICAL - Custom schema needed

---

#### `openemr_postcalendar_categories` ⭐ HIGH
**Usage Frequency:** High (8 queries)
**Used By:**
- `get_appointment_categories.php` - Fetch available categories
- `get_appointments.php` - Join for category names/colors
- `create_appointment.php` - Validate category IDs
- `update_appointment.php` - Validate category IDs

**Key Fields:**
- `pc_catid` - Category ID (primary key)
- `pc_catname` - Category name
- `pc_catcolor` - Color for calendar display
- `pc_cattype` - Type (0=appointment, 1=availability block)
- `pc_active` - Active status

**Operations:** SELECT
**Migration Priority:** ⭐⭐⭐ HIGH - Needed for calendar functionality

---

### 2. PATIENT DATA (High Priority)

#### `patient_data` ⭐ CRITICAL
**Usage Frequency:** Very High (16 queries - JOIN + FROM)
**Used By:**
- `client_list.php` - Patient list and search
- `client_detail.php` - Patient demographics
- `client_demographics.php` - Demographics display/update
- `update_demographics.php` - Update patient info
- `create_client.php` - Create new patients
- `get_appointments.php` - Patient names in appointments
- `patient_search.php` - Patient search

**Key Fields:**
- `pid` - Patient ID (primary key)
- `fname`, `lname` - Patient name
- `DOB` - Date of birth
- `sex` - Gender
- `phone_home`, `phone_cell` - Contact numbers
- `email` - Email address
- `street`, `city`, `state`, `postal_code` - Address
- `status` - Patient status
- Many other demographic fields

**Operations:** SELECT, INSERT, UPDATE
**Migration Priority:** ⭐⭐⭐ CRITICAL - Core patient data

---

#### `insurance_data`
**Usage Frequency:** Medium (4 queries)
**Used By:**
- `client_demographics.php` - Display insurance info
- `update_insurance.php` - Update insurance records

**Key Fields:**
- `id` - Insurance record ID
- `pid` - Patient ID
- `type` - Primary/Secondary/Tertiary
- `provider` - Insurance company ID
- `policy_number` - Policy number
- `group_number` - Group number
- `subscriber_relationship` - Relationship to subscriber

**Operations:** SELECT, INSERT, UPDATE
**Migration Priority:** ⭐⭐ MEDIUM - Important for billing

---

#### `insurance_companies`
**Usage Frequency:** Low (2 queries)
**Used By:**
- `get_insurance_companies.php` - Fetch list of insurers
- Insurance forms JOIN

**Key Fields:**
- `id` - Company ID
- `name` - Insurance company name
- Address and contact fields

**Operations:** SELECT
**Migration Priority:** ⭐ LOW - Reference data

---

#### `employer_data`
**Usage Frequency:** Low (1 query)
**Used By:**
- `client_demographics.php` - Display employer info

**Key Fields:**
- `id` - Record ID
- `pid` - Patient ID
- `name` - Employer name
- Address fields

**Operations:** SELECT
**Migration Priority:** ⭐ LOW - Supplementary data

---

### 3. CONTACT RELATIONSHIPS (Related Persons)

#### `contact_relation`
**Usage Frequency:** Medium (4 queries)
**Used By:**
- `get_related_persons.php` - Fetch related persons
- `save_related_person.php` - Create/update related persons
- `delete_related_person.php` - Delete relationships

**Key Fields:**
- `id` - Relation ID
- `patient_id` - Patient ID
- `person_id` - Person record ID
- `relationship_type` - Type of relationship

**Operations:** SELECT, INSERT, UPDATE
**Migration Priority:** ⭐⭐ MEDIUM - Important for emergency contacts

---

#### `person`
**Usage Frequency:** Low (2 queries)
**Used By:**
- Related persons functionality

**Key Fields:**
- `id` - Person ID
- `fname`, `lname` - Person name
- Contact information

**Operations:** SELECT, INSERT, UPDATE
**Migration Priority:** ⭐⭐ MEDIUM - Supports contact_relation

---

### 4. USER MANAGEMENT & AUTHENTICATION

#### `users` ⭐ CRITICAL
**Usage Frequency:** Very High (16 queries - JOIN + FROM)
**Used By:**
- `login.php` - User authentication
- `session_login.php` - Session login
- `session_user.php` - Current user info
- `get_providers.php` - Provider list
- All appointment queries (provider names)

**Key Fields:**
- `id` - User ID (primary key)
- `username` - Login username
- `password` - Hashed password
- `fname`, `lname` - User name
- `authorized` - Provider status (0/1)
- `calendar` - Calendar admin status (0/1)
- `active` - Active status
- `facility_id` - Default facility

**Operations:** SELECT
**Migration Priority:** ⭐⭐⭐ CRITICAL - Authentication & provider data

---

### 5. CLINICAL ENCOUNTERS & FORMS

#### `form_encounter`
**Usage Frequency:** Medium (5 queries)
**Used By:**
- `encounter_detail.php` - Encounter information
- `billing.php` - Billing linked to encounters

**Key Fields:**
- `id` - Encounter ID
- `pid` - Patient ID
- `encounter` - Encounter number
- `date` - Encounter date
- `reason` - Chief complaint
- `facility_id` - Facility where encounter occurred

**Operations:** SELECT
**Migration Priority:** ⭐⭐ MEDIUM - Clinical documentation

---

#### `forms`
**Usage Frequency:** Low (2 queries)
**Used By:**
- Form management queries

**Key Fields:**
- `id` - Form ID
- `form_id` - Specific form record ID
- `form_name` - Type of form
- `pid` - Patient ID
- `encounter` - Encounter number

**Operations:** SELECT
**Migration Priority:** ⭐ LOW - Form metadata

---

#### `form_vitals`
**Usage Frequency:** Low (1 query)
**Used By:**
- Vitals display (if implemented)

**Key Fields:**
- Vital sign measurements
- `pid` - Patient ID
- Date/time fields

**Operations:** SELECT
**Migration Priority:** ⭐ LOW - Clinical data

---

### 6. BILLING & PAYMENTS

#### `billing`
**Usage Frequency:** Low (2 queries)
**Used By:**
- `billing.php` - Billing records

**Key Fields:**
- `id` - Billing ID
- `pid` - Patient ID
- `encounter` - Encounter number
- `code` - Billing code
- `fee` - Charge amount

**Operations:** SELECT
**Migration Priority:** ⭐⭐ MEDIUM - Financial data

---

#### `payments`
**Usage Frequency:** Low (1 query)
**Used By:**
- Payment tracking queries

**Key Fields:**
- Payment records
- `pid` - Patient ID

**Operations:** SELECT
**Migration Priority:** ⭐ LOW - Financial data

---

### 7. CONFIGURATION & REFERENCE DATA

#### `list_options` ⭐ HIGH
**Usage Frequency:** High (14 queries)
**Used By:**
- `get_rooms.php` - Room/location options
- `get_list_options.php` - Generic list fetching
- `get_appointments.php` - Room name lookup
- Demographics forms - Various dropdowns

**Key Fields:**
- `list_id` - Which list this belongs to
- `option_id` - Option value/ID
- `title` - Display label
- `seq` - Sort order
- `is_default` - Default option flag
- `activity` - Active status

**Common Lists Used:**
- `rooms` - Room/location options
- `yesno` - Yes/No dropdowns
- `maritalstatus` - Marital status
- `sex` - Gender options
- Many others for dropdowns

**Operations:** SELECT, INSERT, UPDATE
**Migration Priority:** ⭐⭐⭐ HIGH - Critical for dropdowns and lookups

---

#### `lists`
**Usage Frequency:** Low (2 queries)
**Used By:**
- List metadata queries

**Key Fields:**
- List definitions
- Metadata about list_options lists

**Operations:** SELECT
**Migration Priority:** ⭐ LOW - Reference data

---

#### `facility`
**Usage Frequency:** Medium (5 queries)
**Used By:**
- Appointment queries - Facility names
- User facility lookups

**Key Fields:**
- `id` - Facility ID
- `name` - Facility name
- Address and contact fields

**Operations:** SELECT
**Migration Priority:** ⭐⭐ MEDIUM - Multi-facility support

---

#### `globals`
**Usage Frequency:** Low (2 queries)
**Used By:**
- `get_calendar_settings.php` - Calendar configuration
- `update_calendar_settings.php` - Update settings

**Key Fields:**
- `gl_name` - Setting name
- `gl_value` - Setting value

**Operations:** SELECT, INSERT, UPDATE
**Migration Priority:** ⭐⭐ MEDIUM - Application settings

---

### 8. DOCUMENTS & ATTACHMENTS

#### `documents`
**Usage Frequency:** Low (1 query)
**Used By:**
- `client_documents.php` - Document management

**Key Fields:**
- `id` - Document ID
- `url` - File path
- Document metadata

**Operations:** SELECT
**Migration Priority:** ⭐ LOW - Document storage

---

#### `categories`
**Usage Frequency:** Low (1 query)
**Used By:**
- Document categorization

**Operations:** SELECT
**Migration Priority:** ⭐ LOW - Document metadata

---

#### `categories_to_documents`
**Usage Frequency:** Low (2 queries)
**Used By:**
- Document-category mapping

**Operations:** SELECT
**Migration Priority:** ⭐ LOW - Document organization

---

### 9. PRESCRIPTIONS (Minimal Use)

#### `prescriptions`
**Usage Frequency:** Low (1 query)
**Used By:**
- Prescription queries (if implemented)

**Operations:** SELECT
**Migration Priority:** ⭐ LOW - May not be needed

---

### 10. AUDIT & LOGGING

#### `log`
**Usage Frequency:** Medium (4 inserts)
**Used By:**
- Various audit logging operations
- OpenEMR's built-in logging

**Operations:** INSERT
**Migration Priority:** ⭐⭐ MEDIUM - Audit trail important

---

## Migration Strategy Recommendations

### Phase 1: Critical Tables (Immediate Priority)
1. ⭐⭐⭐ `openemr_postcalendar_events` → New schema: `appointments`
2. ⭐⭐⭐ `openemr_postcalendar_categories` → New schema: `appointment_categories`
3. ⭐⭐⭐ `patient_data` → New schema: `patients`
4. ⭐⭐⭐ `users` → New schema: `users` or `staff`
5. ⭐⭐⭐ `list_options` → New schema: `lookup_values`

### Phase 2: Important Tables
6. ⭐⭐ `insurance_data` → New schema: `patient_insurance`
7. ⭐⭐ `contact_relation` + `person` → New schema: `emergency_contacts`
8. ⭐⭐ `form_encounter` → New schema: `encounters`
9. ⭐⭐ `billing` → New schema: `billing_records`
10. ⭐⭐ `facility` → New schema: `facilities`
11. ⭐⭐ `globals` → New schema: `app_settings`
12. ⭐⭐ `log` → New schema: `audit_log`

### Phase 3: Lower Priority Tables
- Insurance companies
- Employer data
- Forms metadata
- Documents
- Other reference tables

---

## Key Relationships

```
patients (patient_data)
├── appointments (openemr_postcalendar_events) - pc_pid
├── insurance_data - pid
├── contact_relation - patient_id
│   └── person - person_id
├── form_encounter - pid
├── billing - pid
└── documents - (patient reference)

users
├── appointments - pc_aid (provider)
└── facility - facility_id

appointment_categories (openemr_postcalendar_categories)
└── appointments - pc_catid

list_options
├── rooms - Used in appointments
├── marital_status - Used in demographics
├── sex - Used in demographics
└── (many other lookup lists)
```

---

## Current Database Constraints

### Foreign Keys Currently Enforced
Most relationships in OpenEMR are NOT enforced by foreign keys but by application logic.

### Indexes We Depend On
- `openemr_postcalendar_events`: pc_eventDate, pc_aid (provider), pc_pid (patient)
- `patient_data`: pid (primary key)
- `users`: id, username

---

## Notes for Migration

1. **No Foreign Key Constraints**: OpenEMR uses application-level referential integrity, not database constraints. When migrating, you'll want to add proper FK constraints.

2. **Data Types**: OpenEMR uses generic VARCHAR for many fields. Consider using proper data types (DATE, TIME, DECIMAL) in new schema.

3. **Naming Conventions**: OpenEMR uses prefixes (pc_, gl_). Consider cleaner names in new schema.

4. **Normalization**: Some tables are under-normalized. Consider proper normalization in migration.

5. **JSON Storage**: Modern approach might store some flexible data (like recurring patterns) as JSON rather than complex table structures.

6. **Soft Deletes**: Consider adding soft delete flags (deleted_at) instead of hard deletes.

7. **Timestamps**: Add created_at, updated_at to all tables.

8. **UUIDs**: Consider using UUIDs instead of auto-increment IDs for better distribution/merging.

---

## Tables NOT Currently Used

These OpenEMR tables exist but are not referenced in your current API:
- `immunizations`
- `drug_*` tables
- `transactions`
- `amendments`
- `ar_*` tables (accounts receivable)
- `issue_*` tables (problem lists)
- `clinical_*` tables
- Many others

**Action**: These can be ignored during initial migration.

---

## Recommended New Schema Preview

```sql
-- Example of cleaner schema for appointments

CREATE TABLE appointments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    provider_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    category_id UUID NOT NULL REFERENCES appointment_categories(id),
    facility_id UUID REFERENCES facilities(id),
    room_id UUID REFERENCES rooms(id),

    appointment_date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    duration_minutes INTEGER NOT NULL,

    title VARCHAR(255),
    notes TEXT,
    status VARCHAR(50) NOT NULL DEFAULT 'scheduled',

    -- Recurring appointment fields
    is_recurring BOOLEAN DEFAULT FALSE,
    recurrence_pattern JSONB,  -- Store recurrence rules as JSON
    recurrence_parent_id UUID REFERENCES appointments(id),

    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    deleted_at TIMESTAMP,  -- Soft delete

    INDEX idx_date (appointment_date),
    INDEX idx_provider (provider_id, appointment_date),
    INDEX idx_patient (patient_id, appointment_date)
);
```

---

## Questions for Migration Planning

1. **Timeline**: When do you want to start migration?
2. **Cutover Strategy**: Big bang or gradual table-by-table?
3. **Data Migration**: Keep historical data or fresh start?
4. **Database Engine**: PostgreSQL, MySQL, or other?
5. **ORM**: Will you use an ORM (TypeScript/Prisma, PHP/Laravel)?
6. **API Rewrite**: REST, GraphQL, or other?

---

**End of Document**
For questions or updates, contact development team.
