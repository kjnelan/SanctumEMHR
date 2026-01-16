# Mindline Mental Health EHR - New Database Schema Design
**Date**: 2026-01-16
**Status**: Planning Phase - Database Redesign

## Executive Summary

**Decision**: Replace OpenEMR database schema with clean, purpose-built mental health EHR schema.

**Current State**:
- Using 30+ OpenEMR tables
- 56+ PHP files depend on OpenEMR database functions
- Legacy schema from 20+ years of OpenEMR evolution

**New Approach**:
- Design modern, normalized schema
- Mental health EHR specific
- Clean architecture
- PostgreSQL or MySQL/MariaDB

---

## Current OpenEMR Table Usage

From analysis of `/custom/api/*.php`:

| Table | Usage Count | Purpose | New Table(s) |
|-------|-------------|---------|--------------|
| users | 28 | System users, providers | users, providers |
| patient_data | 18 | Patient demographics | clients |
| list_options | 15 | Dropdown values | settings_lists |
| openemr_postcalendar_events | 13 | Appointments | appointments |
| facility | 11 | Facilities/locations | facilities |
| categories | 10 | Document categories | document_categories |
| openemr_postcalendar_categories | 8 | Appointment categories | appointment_categories |
| form_encounter | 5 | Encounters/visits | encounters |
| user_supervisors | 4 | Supervisor relationships | user_supervisors (keep) |
| log | 4 | Audit trail | audit_logs |
| insurance_data | 4 | Patient insurance | client_insurance |
| contact_relation | 4 | Related persons | client_contacts |
| codes | 4 | ICD-10, CPT codes | diagnostic_codes |
| clinical_notes | 2 | Clinical documentation | clinical_notes (keep) |
| documents | 3 | Document storage | documents |
| insurance_companies | 2 | Insurance companies | insurance_providers |
| forms | 2 | Form tracking | form_submissions |
| billing | 2 | Billing records | billing_transactions |
| payments | 1 | Payment records | payments |
| form_vitals | 1 | Vital signs | vitals |
| employer_data | 1 | Employer info | client_employers |

---

## New Schema Design

### Naming Conventions

- **Tables**: `snake_case`, plural nouns (e.g., `users`, `appointments`)
- **Primary Keys**: Always `id` (BIGINT UNSIGNED AUTO_INCREMENT)
- **Foreign Keys**: `{table_singular}_id` (e.g., `user_id`, `client_id`)
- **Timestamps**: `created_at`, `updated_at`, `deleted_at` (for soft deletes)
- **UUIDs**: Optional `uuid` column for external references
- **Indexes**: On all foreign keys, common query fields

### Schema Categories

1. **User Management** (4 tables)
2. **Client Management** (6 tables)
3. **Scheduling** (4 tables)
4. **Clinical Documentation** (5 tables)
5. **Billing & Insurance** (5 tables)
6. **System & Configuration** (6 tables)
7. **Document Management** (3 tables)

**Total: ~33 tables** (vs 30+ OpenEMR tables we're using)

---

## 1. USER MANAGEMENT

### Table: users
```sql
CREATE TABLE users (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    uuid CHAR(36) UNIQUE,
    username VARCHAR(100) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    middle_name VARCHAR(100),

    user_type ENUM('admin', 'provider', 'staff', 'billing') NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    is_provider BOOLEAN DEFAULT FALSE,

    npi VARCHAR(15),  -- National Provider Identifier
    license_number VARCHAR(50),
    license_state VARCHAR(2),
    dea_number VARCHAR(20),

    phone VARCHAR(20),
    mobile VARCHAR(20),
    fax VARCHAR(20),

    last_login_at TIMESTAMP NULL,
    password_changed_at TIMESTAMP NULL,
    failed_login_attempts INT DEFAULT 0,
    locked_until TIMESTAMP NULL,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL,

    INDEX idx_username (username),
    INDEX idx_email (email),
    INDEX idx_user_type (user_type),
    INDEX idx_is_provider (is_provider),
    INDEX idx_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

### Table: user_roles
```sql
CREATE TABLE user_roles (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(50) UNIQUE NOT NULL,
    description TEXT,
    permissions JSON,  -- Store permissions as JSON array
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

### Table: user_role_assignments
```sql
CREATE TABLE user_role_assignments (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT UNSIGNED NOT NULL,
    role_id BIGINT UNSIGNED NOT NULL,
    assigned_by BIGINT UNSIGNED,
    assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (role_id) REFERENCES user_roles(id) ON DELETE CASCADE,
    FOREIGN KEY (assigned_by) REFERENCES users(id) ON DELETE SET NULL,
    UNIQUE KEY uk_user_role (user_id, role_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

### Table: user_supervisors
```sql
CREATE TABLE user_supervisors (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT UNSIGNED NOT NULL,
    supervisor_id BIGINT UNSIGNED NOT NULL,
    relationship_type ENUM('direct', 'clinical', 'administrative') DEFAULT 'direct',
    started_at DATE NOT NULL,
    ended_at DATE NULL,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (supervisor_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user (user_id),
    INDEX idx_supervisor (supervisor_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

---

## 2. CLIENT MANAGEMENT

### Table: clients
```sql
CREATE TABLE clients (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    uuid CHAR(36) UNIQUE,

    -- Name
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    middle_name VARCHAR(100),
    preferred_name VARCHAR(100),

    -- Demographics
    date_of_birth DATE NOT NULL,
    sex ENUM('male', 'female', 'other', 'unknown') NOT NULL,
    gender_identity VARCHAR(50),
    sexual_orientation VARCHAR(50),

    ssn_encrypted VARCHAR(255),  -- Encrypted SSN

    -- Contact
    email VARCHAR(255),
    phone_home VARCHAR(20),
    phone_mobile VARCHAR(20),
    phone_work VARCHAR(20),
    preferred_contact_method ENUM('phone', 'email', 'text', 'mail'),

    -- Address
    address_line1 VARCHAR(255),
    address_line2 VARCHAR(255),
    city VARCHAR(100),
    state VARCHAR(2),
    zip VARCHAR(10),
    county VARCHAR(100),

    -- Emergency Contact
    emergency_contact_name VARCHAR(200),
    emergency_contact_relation VARCHAR(50),
    emergency_contact_phone VARCHAR(20),

    -- Clinical
    primary_provider_id BIGINT UNSIGNED,
    facility_id BIGINT UNSIGNED,

    -- Status
    status ENUM('active', 'inactive', 'discharged', 'deceased') DEFAULT 'active',

    -- Language & Culture
    primary_language VARCHAR(50) DEFAULT 'English',
    needs_interpreter BOOLEAN DEFAULT FALSE,
    ethnicity VARCHAR(100),
    race VARCHAR(100),

    -- Portal Access
    portal_access BOOLEAN DEFAULT FALSE,
    portal_username VARCHAR(100) UNIQUE,

    -- Timestamps
    intake_date DATE,
    discharge_date DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL,

    FOREIGN KEY (primary_provider_id) REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY (facility_id) REFERENCES facilities(id) ON DELETE SET NULL,

    INDEX idx_last_name (last_name),
    INDEX idx_dob (date_of_birth),
    INDEX idx_status (status),
    INDEX idx_provider (primary_provider_id),
    INDEX idx_facility (facility_id),
    FULLTEXT idx_name_search (first_name, last_name, preferred_name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

### Table: client_contacts
```sql
CREATE TABLE client_contacts (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    client_id BIGINT UNSIGNED NOT NULL,

    relationship VARCHAR(50) NOT NULL,  -- 'spouse', 'parent', 'guardian', etc.
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,

    phone VARCHAR(20),
    email VARCHAR(255),
    address TEXT,

    is_emergency_contact BOOLEAN DEFAULT FALSE,
    is_authorized_contact BOOLEAN DEFAULT FALSE,
    can_receive_information BOOLEAN DEFAULT FALSE,

    notes TEXT,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE,
    INDEX idx_client (client_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

### Table: client_insurance
```sql
CREATE TABLE client_insurance (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    client_id BIGINT UNSIGNED NOT NULL,
    insurance_provider_id BIGINT UNSIGNED NOT NULL,

    priority ENUM('primary', 'secondary', 'tertiary') NOT NULL,

    policy_number VARCHAR(50) NOT NULL,
    group_number VARCHAR(50),

    subscriber_relationship ENUM('self', 'spouse', 'child', 'other') NOT NULL,
    subscriber_name VARCHAR(200),
    subscriber_dob DATE,
    subscriber_ssn_encrypted VARCHAR(255),
    subscriber_sex ENUM('male', 'female', 'other'),

    effective_date DATE,
    expiration_date DATE,

    copay_amount DECIMAL(10, 2),

    is_active BOOLEAN DEFAULT TRUE,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE,
    FOREIGN KEY (insurance_provider_id) REFERENCES insurance_providers(id) ON DELETE RESTRICT,

    INDEX idx_client (client_id),
    INDEX idx_provider (insurance_provider_id),
    INDEX idx_priority (priority)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

### Table: client_employers
```sql
CREATE TABLE client_employers (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    client_id BIGINT UNSIGNED NOT NULL,

    employer_name VARCHAR(200) NOT NULL,
    occupation VARCHAR(100),

    phone VARCHAR(20),
    address TEXT,

    start_date DATE,
    end_date DATE,
    is_current BOOLEAN DEFAULT TRUE,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE,
    INDEX idx_client (client_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

### Table: client_flags
```sql
CREATE TABLE client_flags (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    client_id BIGINT UNSIGNED NOT NULL,

    flag_type ENUM('alert', 'warning', 'note', 'risk') NOT NULL,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    severity ENUM('low', 'medium', 'high', 'critical'),

    is_active BOOLEAN DEFAULT TRUE,
    expires_at TIMESTAMP NULL,

    created_by BIGINT UNSIGNED,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,

    INDEX idx_client (client_id),
    INDEX idx_active (is_active),
    INDEX idx_severity (severity)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

### Table: vitals
```sql
CREATE TABLE vitals (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    client_id BIGINT UNSIGNED NOT NULL,
    encounter_id BIGINT UNSIGNED,

    recorded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    recorded_by BIGINT UNSIGNED,

    -- Vital Signs
    height_inches DECIMAL(5, 2),
    weight_pounds DECIMAL(6, 2),
    bmi DECIMAL(5, 2),

    blood_pressure_systolic INT,
    blood_pressure_diastolic INT,
    heart_rate INT,
    respiratory_rate INT,
    temperature_f DECIMAL(5, 2),
    oxygen_saturation INT,

    pain_scale INT,  -- 0-10

    notes TEXT,

    FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE,
    FOREIGN KEY (encounter_id) REFERENCES encounters(id) ON DELETE SET NULL,
    FOREIGN KEY (recorded_by) REFERENCES users(id) ON DELETE SET NULL,

    INDEX idx_client (client_id),
    INDEX idx_encounter (encounter_id),
    INDEX idx_recorded_at (recorded_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

---

## 3. SCHEDULING

### Table: facilities
```sql
CREATE TABLE facilities (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

    name VARCHAR(200) NOT NULL,
    facility_type VARCHAR(50),

    -- Contact
    phone VARCHAR(20),
    fax VARCHAR(20),
    email VARCHAR(255),
    website VARCHAR(255),

    -- Address
    address_line1 VARCHAR(255),
    address_line2 VARCHAR(255),
    city VARCHAR(100),
    state VARCHAR(2),
    zip VARCHAR(10),

    -- Identifiers
    npi VARCHAR(15),
    tax_id VARCHAR(20),
    facility_npi VARCHAR(15),

    -- POS Code (Place of Service)
    pos_code VARCHAR(10),

    -- Settings
    is_active BOOLEAN DEFAULT TRUE,
    is_primary BOOLEAN DEFAULT FALSE,

    -- Hours
    business_hours JSON,  -- Store hours as JSON

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    INDEX idx_name (name),
    INDEX idx_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

### Table: appointment_categories
```sql
CREATE TABLE appointment_categories (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

    name VARCHAR(100) NOT NULL,
    description TEXT,
    color VARCHAR(7),  -- Hex color code

    default_duration INT DEFAULT 60,  -- Minutes
    is_billable BOOLEAN DEFAULT TRUE,

    is_active BOOLEAN DEFAULT TRUE,
    sort_order INT DEFAULT 0,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    INDEX idx_name (name),
    INDEX idx_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

### Table: appointments
```sql
CREATE TABLE appointments (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

    client_id BIGINT UNSIGNED NOT NULL,
    provider_id BIGINT UNSIGNED NOT NULL,
    facility_id BIGINT UNSIGNED NOT NULL,
    category_id BIGINT UNSIGNED,

    start_datetime TIMESTAMP NOT NULL,
    end_datetime TIMESTAMP NOT NULL,
    duration INT,  -- Minutes

    status ENUM('scheduled', 'confirmed', 'arrived', 'in_session', 'completed', 'cancelled', 'no_show') DEFAULT 'scheduled',

    appointment_type VARCHAR(50),  -- 'intake', 'follow-up', 'crisis', etc.

    title VARCHAR(200),
    notes TEXT,

    cancellation_reason TEXT,
    cancelled_at TIMESTAMP NULL,
    cancelled_by BIGINT UNSIGNED,

    reminder_sent BOOLEAN DEFAULT FALSE,
    reminder_sent_at TIMESTAMP NULL,

    created_by BIGINT UNSIGNED,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE,
    FOREIGN KEY (provider_id) REFERENCES users(id) ON DELETE RESTRICT,
    FOREIGN KEY (facility_id) REFERENCES facilities(id) ON DELETE RESTRICT,
    FOREIGN KEY (category_id) REFERENCES appointment_categories(id) ON DELETE SET NULL,
    FOREIGN KEY (cancelled_by) REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,

    INDEX idx_client (client_id),
    INDEX idx_provider (provider_id),
    INDEX idx_facility (facility_id),
    INDEX idx_start_datetime (start_datetime),
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

### Table: appointment_recurrence
```sql
CREATE TABLE appointment_recurrence (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

    parent_appointment_id BIGINT UNSIGNED NOT NULL,

    recurrence_pattern ENUM('daily', 'weekly', 'biweekly', 'monthly') NOT NULL,
    recurrence_count INT,
    recurrence_end_date DATE,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (parent_appointment_id) REFERENCES appointments(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

---

## 4. CLINICAL DOCUMENTATION

### Table: encounters
```sql
CREATE TABLE encounters (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

    client_id BIGINT UNSIGNED NOT NULL,
    provider_id BIGINT UNSIGNED NOT NULL,
    facility_id BIGINT UNSIGNED NOT NULL,
    appointment_id BIGINT UNSIGNED,

    encounter_date DATE NOT NULL,
    encounter_datetime TIMESTAMP NOT NULL,

    encounter_type VARCHAR(50) NOT NULL,  -- 'intake', 'individual_therapy', 'group_therapy', etc.

    chief_complaint TEXT,

    status ENUM('open', 'signed', 'billed', 'archived') DEFAULT 'open',

    signed_at TIMESTAMP NULL,
    signed_by BIGINT UNSIGNED,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE,
    FOREIGN KEY (provider_id) REFERENCES users(id) ON DELETE RESTRICT,
    FOREIGN KEY (facility_id) REFERENCES facilities(id) ON DELETE RESTRICT,
    FOREIGN KEY (appointment_id) REFERENCES appointments(id) ON DELETE SET NULL,
    FOREIGN KEY (signed_by) REFERENCES users(id) ON DELETE SET NULL,

    INDEX idx_client (client_id),
    INDEX idx_provider (provider_id),
    INDEX idx_date (encounter_date),
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

### Table: clinical_notes
```sql
CREATE TABLE clinical_notes (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

    encounter_id BIGINT UNSIGNED NOT NULL,
    client_id BIGINT UNSIGNED NOT NULL,
    provider_id BIGINT UNSIGNED NOT NULL,

    note_type VARCHAR(50) NOT NULL,  -- 'progress_note', 'psychiatric_eval', 'treatment_plan', etc.

    -- Note Content
    subjective TEXT,
    objective TEXT,
    assessment TEXT,
    plan TEXT,

    -- Additional Fields for Mental Health
    mental_status_exam JSON,
    risk_assessment JSON,
    treatment_interventions JSON,
    treatment_goals JSON,
    progress_indicators JSON,

    -- Status
    status ENUM('draft', 'pending_review', 'signed', 'amended') DEFAULT 'draft',

    -- Signing
    signed_at TIMESTAMP NULL,
    signed_by BIGINT UNSIGNED,
    signature_data TEXT,  -- Electronic signature metadata

    -- Amendments
    amended_at TIMESTAMP NULL,
    amendment_reason TEXT,

    -- Billing
    billing_codes JSON,  -- Array of CPT codes

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    FOREIGN KEY (encounter_id) REFERENCES encounters(id) ON DELETE CASCADE,
    FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE,
    FOREIGN KEY (provider_id) REFERENCES users(id) ON DELETE RESTRICT,
    FOREIGN KEY (signed_by) REFERENCES users(id) ON DELETE SET NULL,

    INDEX idx_encounter (encounter_id),
    INDEX idx_client (client_id),
    INDEX idx_provider (provider_id),
    INDEX idx_status (status),
    FULLTEXT idx_content (subjective, objective, assessment, plan)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

### Table: clinical_note_addendums
```sql
CREATE TABLE clinical_note_addendums (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

    clinical_note_id BIGINT UNSIGNED NOT NULL,

    addendum_text TEXT NOT NULL,
    reason VARCHAR(200),

    added_by BIGINT UNSIGNED NOT NULL,
    added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (clinical_note_id) REFERENCES clinical_notes(id) ON DELETE CASCADE,
    FOREIGN KEY (added_by) REFERENCES users(id) ON DELETE RESTRICT,

    INDEX idx_note (clinical_note_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

### Table: diagnoses
```sql
CREATE TABLE diagnoses (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

    client_id BIGINT UNSIGNED NOT NULL,
    encounter_id BIGINT UNSIGNED,

    code VARCHAR(20) NOT NULL,  -- ICD-10 code
    code_type ENUM('ICD10', 'ICD11', 'DSM5') DEFAULT 'ICD10',
    description TEXT NOT NULL,

    diagnosis_date DATE NOT NULL,
    resolution_date DATE,

    is_primary BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,

    diagnosed_by BIGINT UNSIGNED,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE,
    FOREIGN KEY (encounter_id) REFERENCES encounters(id) ON DELETE SET NULL,
    FOREIGN KEY (diagnosed_by) REFERENCES users(id) ON DELETE SET NULL,

    INDEX idx_client (client_id),
    INDEX idx_code (code),
    INDEX idx_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

### Table: diagnostic_codes
```sql
CREATE TABLE diagnostic_codes (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

    code VARCHAR(20) UNIQUE NOT NULL,
    code_type ENUM('ICD10', 'ICD11', 'DSM5', 'CPT') NOT NULL,
    description TEXT NOT NULL,
    category VARCHAR(100),

    is_active BOOLEAN DEFAULT TRUE,

    effective_date DATE,
    termination_date DATE,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    INDEX idx_code (code),
    INDEX idx_type (code_type),
    INDEX idx_active (is_active),
    FULLTEXT idx_description (description)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

---

## 5. BILLING & INSURANCE

### Table: insurance_providers
```sql
CREATE TABLE insurance_providers (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

    name VARCHAR(200) NOT NULL,
    payer_id VARCHAR(50),

    -- Contact
    phone VARCHAR(20),
    fax VARCHAR(20),
    email VARCHAR(255),
    website VARCHAR(255),

    -- Address
    address_line1 VARCHAR(255),
    address_line2 VARCHAR(255),
    city VARCHAR(100),
    state VARCHAR(2),
    zip VARCHAR(10),

    -- Claims Address
    claims_address TEXT,
    claims_phone VARCHAR(20),
    claims_email VARCHAR(255),

    -- Type
    insurance_type ENUM('commercial', 'medicare', 'medicaid', 'tricare', 'self_pay', 'other'),

    is_active BOOLEAN DEFAULT TRUE,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    INDEX idx_name (name),
    INDEX idx_payer_id (payer_id),
    INDEX idx_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

### Table: billing_transactions
```sql
CREATE TABLE billing_transactions (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

    client_id BIGINT UNSIGNED NOT NULL,
    encounter_id BIGINT UNSIGNED,
    provider_id BIGINT UNSIGNED NOT NULL,
    facility_id BIGINT UNSIGNED NOT NULL,

    transaction_date DATE NOT NULL,
    service_date DATE NOT NULL,

    -- Codes
    cpt_code VARCHAR(10) NOT NULL,
    icd_codes JSON,  -- Array of ICD-10 codes

    -- Amounts
    billed_amount DECIMAL(10, 2) NOT NULL,
    allowed_amount DECIMAL(10, 2),
    paid_amount DECIMAL(10, 2) DEFAULT 0.00,
    adjustment_amount DECIMAL(10, 2) DEFAULT 0.00,
    balance DECIMAL(10, 2),

    -- Units
    units INT DEFAULT 1,

    -- Insurance
    insurance_provider_id BIGINT UNSIGNED,
    claim_number VARCHAR(50),
    claim_status ENUM('pending', 'submitted', 'paid', 'denied', 'appealed') DEFAULT 'pending',

    -- Status
    billing_status ENUM('unbilled', 'billed', 'paid', 'partial_paid', 'denied', 'written_off') DEFAULT 'unbilled',

    notes TEXT,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE,
    FOREIGN KEY (encounter_id) REFERENCES encounters(id) ON DELETE SET NULL,
    FOREIGN KEY (provider_id) REFERENCES users(id) ON DELETE RESTRICT,
    FOREIGN KEY (facility_id) REFERENCES facilities(id) ON DELETE RESTRICT,
    FOREIGN KEY (insurance_provider_id) REFERENCES insurance_providers(id) ON DELETE SET NULL,

    INDEX idx_client (client_id),
    INDEX idx_encounter (encounter_id),
    INDEX idx_provider (provider_id),
    INDEX idx_service_date (service_date),
    INDEX idx_status (billing_status),
    INDEX idx_claim_status (claim_status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

### Table: payments
```sql
CREATE TABLE payments (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

    client_id BIGINT UNSIGNED NOT NULL,
    billing_transaction_id BIGINT UNSIGNED,

    payment_date DATE NOT NULL,
    amount DECIMAL(10, 2) NOT NULL,

    payment_method ENUM('cash', 'check', 'credit_card', 'insurance', 'other') NOT NULL,
    payment_source ENUM('patient', 'insurance', 'other') NOT NULL,

    reference_number VARCHAR(100),
    check_number VARCHAR(50),

    notes TEXT,

    processed_by BIGINT UNSIGNED,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE,
    FOREIGN KEY (billing_transaction_id) REFERENCES billing_transactions(id) ON DELETE SET NULL,
    FOREIGN KEY (processed_by) REFERENCES users(id) ON DELETE SET NULL,

    INDEX idx_client (client_id),
    INDEX idx_transaction (billing_transaction_id),
    INDEX idx_payment_date (payment_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

### Table: payment_allocations
```sql
CREATE TABLE payment_allocations (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

    payment_id BIGINT UNSIGNED NOT NULL,
    billing_transaction_id BIGINT UNSIGNED NOT NULL,

    allocated_amount DECIMAL(10, 2) NOT NULL,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (payment_id) REFERENCES payments(id) ON DELETE CASCADE,
    FOREIGN KEY (billing_transaction_id) REFERENCES billing_transactions(id) ON DELETE CASCADE,

    INDEX idx_payment (payment_id),
    INDEX idx_transaction (billing_transaction_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

### Table: claims
```sql
CREATE TABLE claims (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

    client_id BIGINT UNSIGNED NOT NULL,
    insurance_provider_id BIGINT UNSIGNED NOT NULL,

    claim_number VARCHAR(50) UNIQUE,

    submission_date DATE,
    service_from_date DATE NOT NULL,
    service_to_date DATE NOT NULL,

    total_billed DECIMAL(10, 2) NOT NULL,
    total_paid DECIMAL(10, 2) DEFAULT 0.00,

    status ENUM('draft', 'ready', 'submitted', 'accepted', 'rejected', 'paid', 'appealed') DEFAULT 'draft',

    rejection_reason TEXT,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE,
    FOREIGN KEY (insurance_provider_id) REFERENCES insurance_providers(id) ON DELETE RESTRICT,

    INDEX idx_client (client_id),
    INDEX idx_provider (insurance_provider_id),
    INDEX idx_claim_number (claim_number),
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

---

## 6. DOCUMENT MANAGEMENT

### Table: document_categories
```sql
CREATE TABLE document_categories (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

    name VARCHAR(100) NOT NULL,
    parent_id BIGINT UNSIGNED NULL,

    description TEXT,

    -- Nested Set Model for hierarchy
    lft INT NOT NULL,
    rght INT NOT NULL,

    is_active BOOLEAN DEFAULT TRUE,
    sort_order INT DEFAULT 0,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    FOREIGN KEY (parent_id) REFERENCES document_categories(id) ON DELETE SET NULL,

    INDEX idx_parent (parent_id),
    INDEX idx_lft (lft),
    INDEX idx_rght (rght),
    INDEX idx_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

### Table: documents
```sql
CREATE TABLE documents (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

    client_id BIGINT UNSIGNED NOT NULL,
    category_id BIGINT UNSIGNED,

    title VARCHAR(255) NOT NULL,
    description TEXT,

    file_name VARCHAR(255) NOT NULL,
    file_path VARCHAR(500) NOT NULL,
    file_size BIGINT,
    mime_type VARCHAR(100),

    document_date DATE,

    uploaded_by BIGINT UNSIGNED,
    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    is_active BOOLEAN DEFAULT TRUE,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE,
    FOREIGN KEY (category_id) REFERENCES document_categories(id) ON DELETE SET NULL,
    FOREIGN KEY (uploaded_by) REFERENCES users(id) ON DELETE SET NULL,

    INDEX idx_client (client_id),
    INDEX idx_category (category_id),
    INDEX idx_uploaded_at (uploaded_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

### Table: form_submissions
```sql
CREATE TABLE form_submissions (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

    client_id BIGINT UNSIGNED NOT NULL,
    encounter_id BIGINT UNSIGNED,

    form_type VARCHAR(100) NOT NULL,  -- 'intake', 'consent', 'assessment', etc.
    form_data JSON NOT NULL,  -- Store form data as JSON

    submitted_by BIGINT UNSIGNED,
    submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    status ENUM('draft', 'submitted', 'reviewed', 'archived') DEFAULT 'draft',

    reviewed_by BIGINT UNSIGNED,
    reviewed_at TIMESTAMP NULL,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE,
    FOREIGN KEY (encounter_id) REFERENCES encounters(id) ON DELETE SET NULL,
    FOREIGN KEY (submitted_by) REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY (reviewed_by) REFERENCES users(id) ON DELETE SET NULL,

    INDEX idx_client (client_id),
    INDEX idx_encounter (encounter_id),
    INDEX idx_form_type (form_type),
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

---

## 7. SYSTEM & CONFIGURATION

### Table: settings_lists
```sql
CREATE TABLE settings_lists (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

    list_id VARCHAR(50) NOT NULL,  -- 'appointment_types', 'therapy_modalities', etc.
    option_id VARCHAR(50) NOT NULL,

    title VARCHAR(200) NOT NULL,
    notes TEXT,

    is_active BOOLEAN DEFAULT TRUE,
    is_default BOOLEAN DEFAULT FALSE,
    sort_order INT DEFAULT 0,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    UNIQUE KEY uk_list_option (list_id, option_id),
    INDEX idx_list_id (list_id),
    INDEX idx_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

### Table: system_settings
```sql
CREATE TABLE system_settings (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

    setting_key VARCHAR(100) UNIQUE NOT NULL,
    setting_value TEXT,
    setting_type ENUM('string', 'integer', 'boolean', 'json') DEFAULT 'string',

    description TEXT,
    category VARCHAR(50),

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    INDEX idx_key (setting_key),
    INDEX idx_category (category)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

### Table: audit_logs
```sql
CREATE TABLE audit_logs (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

    user_id BIGINT UNSIGNED,

    event_type VARCHAR(50) NOT NULL,  -- 'login', 'logout', 'create', 'update', 'delete', 'view'
    entity_type VARCHAR(50),  -- 'client', 'appointment', 'clinical_note', etc.
    entity_id BIGINT UNSIGNED,

    action_description TEXT,

    -- Request details
    ip_address VARCHAR(45),
    user_agent TEXT,

    -- Changes (for update/delete)
    old_values JSON,
    new_values JSON,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,

    INDEX idx_user (user_id),
    INDEX idx_event_type (event_type),
    INDEX idx_entity (entity_type, entity_id),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

### Table: sessions
```sql
CREATE TABLE sessions (
    id VARCHAR(255) PRIMARY KEY,

    user_id BIGINT UNSIGNED,

    payload LONGTEXT NOT NULL,
    last_activity INT NOT NULL,

    ip_address VARCHAR(45),
    user_agent TEXT,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,

    INDEX idx_user (user_id),
    INDEX idx_last_activity (last_activity)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

### Table: notifications
```sql
CREATE TABLE notifications (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

    user_id BIGINT UNSIGNED NOT NULL,

    notification_type VARCHAR(50) NOT NULL,  -- 'appointment_reminder', 'task_assigned', etc.
    title VARCHAR(200) NOT NULL,
    message TEXT,

    link_url VARCHAR(500),

    is_read BOOLEAN DEFAULT FALSE,
    read_at TIMESTAMP NULL,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,

    INDEX idx_user (user_id),
    INDEX idx_is_read (is_read),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

### Table: messages
```sql
CREATE TABLE messages (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

    from_user_id BIGINT UNSIGNED NOT NULL,
    to_user_id BIGINT UNSIGNED NOT NULL,

    subject VARCHAR(200),
    message_body TEXT NOT NULL,

    related_client_id BIGINT UNSIGNED,

    is_read BOOLEAN DEFAULT FALSE,
    read_at TIMESTAMP NULL,

    parent_message_id BIGINT UNSIGNED,  -- For threading

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (from_user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (to_user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (related_client_id) REFERENCES clients(id) ON DELETE SET NULL,
    FOREIGN KEY (parent_message_id) REFERENCES messages(id) ON DELETE CASCADE,

    INDEX idx_from_user (from_user_id),
    INDEX idx_to_user (to_user_id),
    INDEX idx_client (related_client_id),
    INDEX idx_is_read (is_read),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

---

## Schema Statistics

**Total Tables**: 33

**By Category**:
- User Management: 4 tables
- Client Management: 6 tables
- Scheduling: 4 tables
- Clinical Documentation: 5 tables
- Billing & Insurance: 5 tables
- Document Management: 3 tables
- System & Configuration: 6 tables

**Key Features**:
- ✅ Proper foreign key constraints
- ✅ Indexes on all query-heavy columns
- ✅ Soft deletes (deleted_at) where appropriate
- ✅ Audit timestamps (created_at, updated_at)
- ✅ JSON fields for flexible data
- ✅ Full-text search on appropriate fields
- ✅ UUID support for external APIs
- ✅ Encrypted fields (SSN, sensitive data)
- ✅ Proper ENUM types for status fields
- ✅ Nested set model for hierarchical data

---

## Next Steps

1. **Review & Approve Schema**
2. **Generate Migration Files**
3. **Create Database Abstraction Layer**
4. **Data Migration Plan** (from OpenEMR tables)
5. **Update API Files** (replace OpenEMR functions)
6. **Testing Strategy**

Would you like me to proceed with creating:
1. The database migration files?
2. The new Database abstraction class?
3. A data migration script from OpenEMR to new schema?
