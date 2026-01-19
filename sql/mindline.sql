-- ============================================
-- MINDLINE MENTAL HEALTH EHR
-- Complete Database Schema
-- ============================================
-- Version: 1.0.0
-- Date: 2026-01-16
-- Tables: 32
-- Description: Clean, purpose-built mental health EHR database
-- ============================================

SET FOREIGN_KEY_CHECKS=0;
SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
SET time_zone = "+00:00";

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

-- ============================================
-- Create Database (optional - uncomment if needed)
-- ============================================
-- CREATE DATABASE IF NOT EXISTS mindline CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
-- USE mindline;

-- ============================================
-- 1. USER MANAGEMENT TABLES
-- ============================================

-- Table: users
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

    npi VARCHAR(15),
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

-- Table: user_roles
CREATE TABLE user_roles (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(50) UNIQUE NOT NULL,
    description TEXT,
    permissions JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table: user_role_assignments
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

-- Table: user_supervisors
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

-- ============================================
-- 2. CLIENT MANAGEMENT TABLES
-- ============================================

-- Table: facilities (needed before clients for FK)
CREATE TABLE facilities (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

    name VARCHAR(200) NOT NULL,
    facility_type VARCHAR(50),

    phone VARCHAR(20),
    fax VARCHAR(20),
    email VARCHAR(255),
    website VARCHAR(255),

    address_line1 VARCHAR(255),
    address_line2 VARCHAR(255),
    city VARCHAR(100),
    state VARCHAR(2),
    zip VARCHAR(10),

    npi VARCHAR(15),
    tax_id VARCHAR(20),
    facility_npi VARCHAR(15),

    pos_code VARCHAR(10),

    is_active BOOLEAN DEFAULT TRUE,
    is_primary BOOLEAN DEFAULT FALSE,

    business_hours JSON,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    INDEX idx_name (name),
    INDEX idx_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table: clients
CREATE TABLE clients (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    uuid CHAR(36) UNIQUE,

    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    middle_name VARCHAR(100),
    preferred_name VARCHAR(100),

    date_of_birth DATE NOT NULL,
    sex ENUM('male', 'female', 'other', 'unknown') NOT NULL,
    gender_identity VARCHAR(50),
    sexual_orientation VARCHAR(50),

    ssn_encrypted VARCHAR(255),

    email VARCHAR(255),
    phone_home VARCHAR(20),
    phone_mobile VARCHAR(20),
    phone_work VARCHAR(20),
    preferred_contact_method ENUM('phone', 'email', 'text', 'mail'),

    address_line1 VARCHAR(255),
    address_line2 VARCHAR(255),
    city VARCHAR(100),
    state VARCHAR(2),
    zip VARCHAR(10),
    county VARCHAR(100),

    emergency_contact_name VARCHAR(200),
    emergency_contact_relation VARCHAR(50),
    emergency_contact_phone VARCHAR(20),

    primary_provider_id BIGINT UNSIGNED,
    facility_id BIGINT UNSIGNED,

    status ENUM('active', 'inactive', 'discharged', 'deceased') DEFAULT 'active',

    primary_language VARCHAR(50) DEFAULT 'English',
    needs_interpreter BOOLEAN DEFAULT FALSE,
    ethnicity VARCHAR(100),
    race VARCHAR(100),

    portal_access BOOLEAN DEFAULT FALSE,
    portal_username VARCHAR(100) UNIQUE,

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

-- Table: client_contacts
CREATE TABLE client_contacts (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    client_id BIGINT UNSIGNED NOT NULL,

    relationship VARCHAR(50) NOT NULL,
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

-- Table: insurance_providers (needed before client_insurance)
CREATE TABLE insurance_providers (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

    name VARCHAR(200) NOT NULL,
    payer_id VARCHAR(50),

    phone VARCHAR(20),
    fax VARCHAR(20),
    email VARCHAR(255),
    website VARCHAR(255),

    address_line1 VARCHAR(255),
    address_line2 VARCHAR(255),
    city VARCHAR(100),
    state VARCHAR(2),
    zip VARCHAR(10),

    claims_address TEXT,
    claims_phone VARCHAR(20),
    claims_email VARCHAR(255),

    insurance_type ENUM('commercial', 'medicare', 'medicaid', 'tricare', 'self_pay', 'other'),

    is_active BOOLEAN DEFAULT TRUE,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    INDEX idx_name (name),
    INDEX idx_payer_id (payer_id),
    INDEX idx_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table: client_insurance
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

-- Table: client_employers
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

-- Table: client_flags
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

-- ============================================
-- 3. SCHEDULING TABLES
-- ============================================

-- Table: appointment_categories
CREATE TABLE appointment_categories (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

    name VARCHAR(100) NOT NULL,
    description TEXT,
    color VARCHAR(7),

    default_duration INT DEFAULT 60,
    is_billable BOOLEAN DEFAULT TRUE,

    is_active BOOLEAN DEFAULT TRUE,
    sort_order INT DEFAULT 0,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    INDEX idx_name (name),
    INDEX idx_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table: appointments
CREATE TABLE appointments (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

    client_id BIGINT UNSIGNED NOT NULL,
    provider_id BIGINT UNSIGNED NOT NULL,
    facility_id BIGINT UNSIGNED NOT NULL,
    category_id BIGINT UNSIGNED,

    start_datetime TIMESTAMP NOT NULL,
    end_datetime TIMESTAMP NOT NULL,
    duration INT,

    status ENUM('scheduled', 'confirmed', 'arrived', 'in_session', 'completed', 'cancelled', 'no_show') DEFAULT 'scheduled',

    appointment_type VARCHAR(50),

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

-- Table: appointment_recurrence
CREATE TABLE appointment_recurrence (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

    parent_appointment_id BIGINT UNSIGNED NOT NULL,

    recurrence_pattern ENUM('daily', 'weekly', 'biweekly', 'monthly') NOT NULL,
    recurrence_count INT,
    recurrence_end_date DATE,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (parent_appointment_id) REFERENCES appointments(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- 4. CLINICAL DOCUMENTATION TABLES
-- ============================================

-- Table: encounters
CREATE TABLE encounters (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

    client_id BIGINT UNSIGNED NOT NULL,
    provider_id BIGINT UNSIGNED NOT NULL,
    facility_id BIGINT UNSIGNED NOT NULL,
    appointment_id BIGINT UNSIGNED,

    encounter_date DATE NOT NULL,
    encounter_datetime TIMESTAMP NOT NULL,

    encounter_type VARCHAR(50) NOT NULL,

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

-- Table: clinical_notes
CREATE TABLE clinical_notes (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

    encounter_id BIGINT UNSIGNED NOT NULL,
    client_id BIGINT UNSIGNED NOT NULL,
    provider_id BIGINT UNSIGNED NOT NULL,

    note_type VARCHAR(50) NOT NULL,

    subjective TEXT,
    objective TEXT,
    assessment TEXT,
    plan TEXT,

    mental_status_exam JSON,
    risk_assessment JSON,
    treatment_interventions JSON,
    treatment_goals JSON,
    progress_indicators JSON,

    status ENUM('draft', 'pending_review', 'signed', 'amended') DEFAULT 'draft',

    signed_at TIMESTAMP NULL,
    signed_by BIGINT UNSIGNED,
    signature_data TEXT,

    amended_at TIMESTAMP NULL,
    amendment_reason TEXT,

    billing_codes JSON,

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

-- Table: clinical_note_addendums
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

-- Table: diagnoses
CREATE TABLE diagnoses (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

    client_id BIGINT UNSIGNED NOT NULL,
    encounter_id BIGINT UNSIGNED,

    code VARCHAR(20) NOT NULL,
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

-- Table: diagnostic_codes
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

-- ============================================
-- 5. BILLING TABLES
-- ============================================

-- Table: billing_transactions
CREATE TABLE billing_transactions (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

    client_id BIGINT UNSIGNED NOT NULL,
    encounter_id BIGINT UNSIGNED,
    provider_id BIGINT UNSIGNED NOT NULL,
    facility_id BIGINT UNSIGNED NOT NULL,

    transaction_date DATE NOT NULL,
    service_date DATE NOT NULL,

    cpt_code VARCHAR(10) NOT NULL,
    icd_codes JSON,

    billed_amount DECIMAL(10, 2) NOT NULL,
    allowed_amount DECIMAL(10, 2),
    paid_amount DECIMAL(10, 2) DEFAULT 0.00,
    adjustment_amount DECIMAL(10, 2) DEFAULT 0.00,
    balance DECIMAL(10, 2),

    units INT DEFAULT 1,

    insurance_provider_id BIGINT UNSIGNED,
    claim_number VARCHAR(50),
    claim_status ENUM('pending', 'submitted', 'paid', 'denied', 'appealed') DEFAULT 'pending',

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

-- Table: payments
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

-- Table: payment_allocations
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

-- Table: claims
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

-- ============================================
-- 6. DOCUMENT MANAGEMENT TABLES
-- ============================================

-- Table: document_categories
CREATE TABLE document_categories (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

    name VARCHAR(100) NOT NULL,
    parent_id BIGINT UNSIGNED NULL,

    description TEXT,

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

-- Table: documents
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

-- Table: form_submissions
CREATE TABLE form_submissions (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

    client_id BIGINT UNSIGNED NOT NULL,
    encounter_id BIGINT UNSIGNED,

    form_type VARCHAR(100) NOT NULL,
    form_data JSON NOT NULL,

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

-- ============================================
-- 7. SYSTEM & CONFIGURATION TABLES
-- ============================================

-- Table: settings_lists
CREATE TABLE settings_lists (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

    list_id VARCHAR(50) NOT NULL,
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

-- Table: system_settings
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

-- Table: audit_logs
CREATE TABLE audit_logs (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

    user_id BIGINT UNSIGNED,

    event_type VARCHAR(50) NOT NULL,
    entity_type VARCHAR(50),
    entity_id BIGINT UNSIGNED,

    action_description TEXT,

    ip_address VARCHAR(45),
    user_agent TEXT,

    old_values JSON,
    new_values JSON,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,

    INDEX idx_user (user_id),
    INDEX idx_event_type (event_type),
    INDEX idx_entity (entity_type, entity_id),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table: sessions
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

-- Table: notifications
CREATE TABLE notifications (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

    user_id BIGINT UNSIGNED NOT NULL,

    notification_type VARCHAR(50) NOT NULL,
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

-- Table: messages
CREATE TABLE messages (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

    from_user_id BIGINT UNSIGNED NOT NULL,
    to_user_id BIGINT UNSIGNED NOT NULL,

    subject VARCHAR(200),
    message_body TEXT NOT NULL,

    related_client_id BIGINT UNSIGNED,

    is_read BOOLEAN DEFAULT FALSE,
    read_at TIMESTAMP NULL,

    parent_message_id BIGINT UNSIGNED,

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

-- ============================================
-- SEED DATA: Mental Health Lists
-- ============================================

-- Therapy Modalities
INSERT INTO settings_lists (list_id, option_id, title, notes, is_active, sort_order) VALUES
('therapy_modality', 'cbt', 'Cognitive Behavioral Therapy (CBT)', NULL, 1, 10),
('therapy_modality', 'dbt', 'Dialectical Behavior Therapy (DBT)', NULL, 1, 20),
('therapy_modality', 'psychodynamic', 'Psychodynamic Therapy', NULL, 1, 30),
('therapy_modality', 'humanistic', 'Humanistic Therapy', NULL, 1, 40),
('therapy_modality', 'emdr', 'EMDR (Eye Movement Desensitization)', NULL, 1, 50),
('therapy_modality', 'exposure', 'Exposure Therapy', NULL, 1, 60),
('therapy_modality', 'family', 'Family Therapy', NULL, 1, 70),
('therapy_modality', 'couples', 'Couples Therapy', NULL, 1, 80),
('therapy_modality', 'group', 'Group Therapy', NULL, 1, 90),
('therapy_modality', 'play', 'Play Therapy', NULL, 1, 100),
('therapy_modality', 'art', 'Art Therapy', NULL, 1, 110),
('therapy_modality', 'mindfulness', 'Mindfulness-Based Therapy', NULL, 1, 120),
('therapy_modality', 'act', 'Acceptance and Commitment Therapy (ACT)', NULL, 1, 130),
('therapy_modality', 'solution_focused', 'Solution-Focused Brief Therapy', NULL, 1, 140),
('therapy_modality', 'motivational', 'Motivational Interviewing', NULL, 1, 150),
('therapy_modality', 'trauma_focused', 'Trauma-Focused Therapy', NULL, 1, 160),
('therapy_modality', 'other', 'Other', NULL, 1, 999);

-- Treatment Goal Categories
INSERT INTO settings_lists (list_id, option_id, title, notes, is_active, sort_order) VALUES
('treatment_goal_category', 'mood', 'Mood Regulation', NULL, 1, 10),
('treatment_goal_category', 'anxiety', 'Anxiety Management', NULL, 1, 20),
('treatment_goal_category', 'depression', 'Depression Management', NULL, 1, 30),
('treatment_goal_category', 'trauma', 'Trauma Processing', NULL, 1, 40),
('treatment_goal_category', 'relationships', 'Relationship Skills', NULL, 1, 50),
('treatment_goal_category', 'communication', 'Communication Skills', NULL, 1, 60),
('treatment_goal_category', 'coping', 'Coping Strategies', NULL, 1, 70),
('treatment_goal_category', 'self_esteem', 'Self-Esteem/Self-Worth', NULL, 1, 80),
('treatment_goal_category', 'anger', 'Anger Management', NULL, 1, 90),
('treatment_goal_category', 'substance', 'Substance Use', NULL, 1, 100),
('treatment_goal_category', 'eating', 'Eating Behaviors', NULL, 1, 110),
('treatment_goal_category', 'sleep', 'Sleep Hygiene', NULL, 1, 120),
('treatment_goal_category', 'stress', 'Stress Management', NULL, 1, 130),
('treatment_goal_category', 'family', 'Family Dynamics', NULL, 1, 140),
('treatment_goal_category', 'work_school', 'Work/School Functioning', NULL, 1, 150),
('treatment_goal_category', 'social', 'Social Skills', NULL, 1, 160),
('treatment_goal_category', 'other', 'Other', NULL, 1, 999);

-- Risk Assessment Levels
INSERT INTO settings_lists (list_id, option_id, title, notes, is_active, sort_order) VALUES
('risk_level', 'none', 'No Risk', 'No identified risk', 1, 10),
('risk_level', 'low', 'Low Risk', 'Minimal risk factors present', 1, 20),
('risk_level', 'moderate', 'Moderate Risk', 'Some risk factors present', 1, 30),
('risk_level', 'high', 'High Risk', 'Significant risk factors', 1, 40),
('risk_level', 'imminent', 'Imminent Risk', 'Immediate intervention required', 1, 50);

-- Appointment Types
INSERT INTO settings_lists (list_id, option_id, title, notes, is_active, sort_order) VALUES
('appointment_type', 'intake', 'Initial Intake/Assessment', '90-minute initial evaluation', 1, 10),
('appointment_type', 'individual_60', 'Individual Therapy (60 min)', 'Standard individual session', 1, 20),
('appointment_type', 'individual_45', 'Individual Therapy (45 min)', 'Brief individual session', 1, 30),
('appointment_type', 'individual_90', 'Individual Therapy (90 min)', 'Extended individual session', 1, 40),
('appointment_type', 'couples', 'Couples Therapy', '60-90 minute couples session', 1, 50),
('appointment_type', 'family', 'Family Therapy', '60-90 minute family session', 1, 60),
('appointment_type', 'group', 'Group Therapy', 'Group therapy session', 1, 70),
('appointment_type', 'medication', 'Medication Management', 'Psychiatric medication review', 1, 80),
('appointment_type', 'crisis', 'Crisis Intervention', 'Emergency/crisis appointment', 1, 90),
('appointment_type', 'follow_up', 'Follow-Up', 'Brief follow-up appointment', 1, 100),
('appointment_type', 'telehealth', 'Telehealth Session', 'Video/phone session', 1, 110),
('appointment_type', 'testing', 'Psychological Testing', 'Assessment/testing session', 1, 120);

-- Mental Status Exam Components
INSERT INTO settings_lists (list_id, option_id, title, notes, is_active, sort_order) VALUES
-- Appearance
('mse_appearance', 'well_groomed', 'Well-groomed', NULL, 1, 10),
('mse_appearance', 'disheveled', 'Disheveled', NULL, 1, 20),
('mse_appearance', 'appropriate', 'Appropriate dress', NULL, 1, 30),
('mse_appearance', 'inappropriate', 'Inappropriate dress', NULL, 1, 40),
-- Behavior
('mse_behavior', 'cooperative', 'Cooperative', NULL, 1, 10),
('mse_behavior', 'uncooperative', 'Uncooperative', NULL, 1, 20),
('mse_behavior', 'agitated', 'Agitated', NULL, 1, 30),
('mse_behavior', 'calm', 'Calm', NULL, 1, 40),
('mse_behavior', 'withdrawn', 'Withdrawn', NULL, 1, 50),
-- Mood
('mse_mood', 'euthymic', 'Euthymic (normal)', NULL, 1, 10),
('mse_mood', 'depressed', 'Depressed', NULL, 1, 20),
('mse_mood', 'anxious', 'Anxious', NULL, 1, 30),
('mse_mood', 'angry', 'Angry/Irritable', NULL, 1, 40),
('mse_mood', 'elevated', 'Elevated', NULL, 1, 50),
('mse_mood', 'labile', 'Labile', NULL, 1, 60),
-- Affect
('mse_affect', 'appropriate', 'Appropriate', NULL, 1, 10),
('mse_affect', 'flat', 'Flat', NULL, 1, 20),
('mse_affect', 'blunted', 'Blunted', NULL, 1, 30),
('mse_affect', 'constricted', 'Constricted', NULL, 1, 40),
('mse_affect', 'labile', 'Labile', NULL, 1, 50),
-- Thought Process
('mse_thought_process', 'logical', 'Logical/Coherent', NULL, 1, 10),
('mse_thought_process', 'tangential', 'Tangential', NULL, 1, 20),
('mse_thought_process', 'circumstantial', 'Circumstantial', NULL, 1, 30),
('mse_thought_process', 'disorganized', 'Disorganized', NULL, 1, 40),
('mse_thought_process', 'racing', 'Racing thoughts', NULL, 1, 50),
-- Insight
('mse_insight', 'good', 'Good', NULL, 1, 10),
('mse_insight', 'fair', 'Fair', NULL, 1, 20),
('mse_insight', 'poor', 'Poor', NULL, 1, 30),
('mse_insight', 'absent', 'Absent', NULL, 1, 40),
-- Judgment
('mse_judgment', 'good', 'Good', NULL, 1, 10),
('mse_judgment', 'fair', 'Fair', NULL, 1, 20),
('mse_judgment', 'poor', 'Poor', NULL, 1, 30),
('mse_judgment', 'impaired', 'Impaired', NULL, 1, 40);

-- Progress Indicators
INSERT INTO settings_lists (list_id, option_id, title, notes, is_active, sort_order) VALUES
('progress_indicator', 'significant_improvement', 'Significant Improvement', NULL, 1, 10),
('progress_indicator', 'moderate_improvement', 'Moderate Improvement', NULL, 1, 20),
('progress_indicator', 'minimal_improvement', 'Minimal Improvement', NULL, 1, 30),
('progress_indicator', 'no_change', 'No Change', NULL, 1, 40),
('progress_indicator', 'regression', 'Regression/Decline', NULL, 1, 50);

-- Clinical Note Types
INSERT INTO settings_lists (list_id, option_id, title, notes, is_active, sort_order) VALUES
('note_type', 'progress_note', 'Progress Note', 'Standard therapy session note', 1, 10),
('note_type', 'intake', 'Intake Assessment', 'Initial evaluation', 1, 20),
('note_type', 'psychiatric_eval', 'Psychiatric Evaluation', 'Comprehensive psychiatric assessment', 1, 30),
('note_type', 'treatment_plan', 'Treatment Plan', 'Treatment planning document', 1, 40),
('note_type', 'discharge_summary', 'Discharge Summary', 'Summary at end of treatment', 1, 50),
('note_type', 'crisis_note', 'Crisis Note', 'Emergency/crisis documentation', 1, 60),
('note_type', 'phone_note', 'Phone Contact Note', 'Telephone contact documentation', 1, 70),
('note_type', 'collateral', 'Collateral Contact', 'Contact with family/others', 1, 80),
('note_type', 'supervision', 'Supervision Note', 'Clinical supervision documentation', 1, 90);

-- Discharge Reasons
INSERT INTO settings_lists (list_id, option_id, title, notes, is_active, sort_order) VALUES
('discharge_reason', 'goals_met', 'Treatment Goals Met', NULL, 1, 10),
('discharge_reason', 'mutual', 'Mutual Agreement', NULL, 1, 20),
('discharge_reason', 'client_request', 'Client Request', NULL, 1, 30),
('discharge_reason', 'no_show', 'Repeated No-Shows', NULL, 1, 40),
('discharge_reason', 'non_payment', 'Non-Payment', NULL, 1, 50),
('discharge_reason', 'relocation', 'Client Relocated', NULL, 1, 60),
('discharge_reason', 'higher_level', 'Referred to Higher Level of Care', NULL, 1, 70),
('discharge_reason', 'other', 'Other', NULL, 1, 999);

SET FOREIGN_KEY_CHECKS=1;

-- ============================================
-- VERIFICATION QUERIES
-- ============================================

-- Show all tables
SHOW TABLES;

-- Show settings_lists counts
SELECT list_id, COUNT(*) as count
FROM settings_lists
GROUP BY list_id
ORDER BY list_id;

-- Show table row counts
SELECT
    'users' as table_name, COUNT(*) as row_count FROM users
UNION ALL SELECT 'clients', COUNT(*) FROM clients
UNION ALL SELECT 'facilities', COUNT(*) FROM facilities
UNION ALL SELECT 'appointments', COUNT(*) FROM appointments
UNION ALL SELECT 'settings_lists', COUNT(*) FROM settings_lists;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;

-- ============================================
-- END OF MINDLINE DATABASE SCHEMA
-- ============================================
