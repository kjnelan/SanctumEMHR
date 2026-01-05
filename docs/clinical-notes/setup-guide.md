# Clinical Notes Setup Guide

**Document Version:** 1.0
**Last Updated:** 2026-01-05
**Audience:** System Administrators, IT Staff

---

## Overview

This guide walks through the complete setup process for Mindline EMHR Clinical Notes system, including database schema, ICD-10 code loading, and system verification.

---

## Prerequisites

### System Requirements
- ✅ OpenEMR 7.0+ installed and configured
- ✅ MySQL/MariaDB 5.7+ or 10.2+
- ✅ PHP 8.0+
- ✅ React frontend deployed
- ✅ Web server (Apache/Nginx) configured

### Access Requirements
- ✅ Database admin credentials
- ✅ Server shell/SSH access
- ✅ Admin account in Mindline EMHR

---

## Step 1: Database Schema Setup

### 1.1 Verify Clinical Notes Table

The `clinical_notes` table should already exist from Phase 4 setup. Verify:

```sql
SHOW TABLES LIKE 'clinical_notes';
```

If missing, run the full schema from `/database/clinical_notes_schema.sql`

### 1.2 Add Diagnosis-Specific Fields

Run this migration to add diagnosis note fields:

```sql
ALTER TABLE clinical_notes ADD COLUMN IF NOT EXISTS (
  -- Diagnosis-specific fields (NULL for other note types)
  symptoms_reported TEXT NULL,
  symptoms_observed TEXT NULL,
  clinical_justification TEXT NULL,
  differential_diagnosis TEXT NULL,
  severity_specifiers TEXT NULL,
  functional_impairment TEXT NULL,
  duration_of_symptoms TEXT NULL,
  previous_diagnoses TEXT NULL
);
```

**Verification:**
```sql
DESC clinical_notes;
```

You should see all 8 new columns listed.

---

## Step 2: ICD-10 Code Loading

**CRITICAL REQUIREMENT**: Diagnosis notes require ICD-10 codes in the `codes` table.

### Option A: Mindline EMHR Frontend (Recommended for New Installs)

**Coming in Phase 4B.1** - Built-in ICD-10 importer

1. Navigate to **Admin → System Setup → ICD-10 Codes**
2. Click **Import ICD-10 Codes**
3. Upload CMS ICD-10-CM file (see Section 2.3 for file sources)
4. Monitor progress bar
5. Verify import completion

**Advantages:**
- ✅ No OpenEMR admin access needed
- ✅ Works for hosted/SaaS installs
- ✅ Progress tracking
- ✅ Automatic validation

### Option B: OpenEMR Admin Interface (Legacy Method)

If you have OpenEMR admin access:

1. Log into OpenEMR (not Mindline frontend)
2. Navigate to: **Administration → Other → External Data Loads**
3. Select **ICD-10** from the dropdown
4. Click **Execute**
5. Wait for completion (may take 5-10 minutes)

**Advantages:**
- ✅ Official OpenEMR loader
- ✅ Handles licensing automatically

**Disadvantages:**
- ❌ Requires OpenEMR admin access
- ❌ Not available in all deployment scenarios

### 2.3 ICD-10 Code Sources

**Official CMS ICD-10-CM Codes:**
- **URL:** https://www.cms.gov/medicare/coding-billing/icd-10-codes
- **Format:** Tab-delimited text file
- **Update Frequency:** Annually (October 1)
- **File Size:** ~90,000 codes, ~15 MB

**2026 ICD-10-CM File:**
- Effective: October 1, 2025 - September 30, 2026
- Download: CMS website → ICD-10-CM Code Descriptions
- File: `icd10cm_order_2026.txt`

### 2.4 Manual Import (Advanced)

If you need to manually import the ICD-10 codes:

**File Format:**
```
ORDER  CODE     VALID  SHORT DESCRIPTION              LONG DESCRIPTION
00001  A000     1      Cholera due to Vibrio...       Cholera due to Vibrio cholerae 01, biovar cholerae
00002  A0000    0      Cholera due to Vibrio...       [inactive code]
```

**Import SQL Script:**
```sql
-- Prepare codes table
DELETE FROM codes WHERE code_type = 'ICD10';

-- Load data (adjust file path)
LOAD DATA LOCAL INFILE '/path/to/icd10cm_order_2026.txt'
INTO TABLE codes
FIELDS TERMINATED BY '\t'
LINES TERMINATED BY '\n'
IGNORE 1 ROWS  -- Skip header
(
  @order,
  @code,
  @valid,
  @short_desc,
  @long_desc
)
SET
  code_type = 'ICD10',
  code = @code,
  code_text = @long_desc,
  active = @valid;
```

### 2.5 Verification

**Check code count:**
```sql
SELECT COUNT(*) as total_codes
FROM codes
WHERE code_type = 'ICD10' AND active = 1;
```

**Expected:** ~72,000 active codes

**Sample codes:**
```sql
SELECT code, code_text
FROM codes
WHERE code_type = 'ICD10'
AND code LIKE 'F41%'
AND active = 1
LIMIT 10;
```

**Expected Output:**
```
F41.0   Panic disorder [episodic paroxysmal anxiety]
F41.1   Generalized anxiety disorder
F41.3   Other mixed anxiety disorders
F41.8   Other specified anxiety disorders
F41.9   Anxiety disorder, unspecified
```

---

## Step 3: API Configuration

### 3.1 Verify search_codes.php API

File location: `/custom/api/search_codes.php`

**Test the API:**
```bash
curl -X GET "http://your-domain/custom/api/search_codes.php?search=anxiety&code_type=ICD10" \
  --cookie "OpenEMR=your_session_id"
```

**Expected Response:**
```json
{
  "success": true,
  "codes": [
    {
      "code": "F41.1",
      "description": "Generalized anxiety disorder",
      "code_type": "ICD10",
      "active": true
    },
    ...
  ],
  "count": 15,
  "search_term": "anxiety",
  "code_type": "ICD10"
}
```

### 3.2 Verify File Permissions

```bash
chmod 644 /path/to/custom/api/search_codes.php
chown www-data:www-data /path/to/custom/api/search_codes.php
```

---

## Step 4: Frontend Verification

### 4.1 Test Diagnosis Note Creation

1. Log into Mindline EMHR
2. Navigate to any patient
3. Go to **Clinical Notes** tab
4. Click **+ New Note**
5. Verify **🏥 Diagnosis Note** appears in "Most Common" section
6. Click **Diagnosis Note**
7. Test ICD-10 search:
   - Type "F41.1" → Should show Generalized Anxiety Disorder
   - Type "anxiety" → Should show multiple anxiety codes
   - Type "depression" → Should show depression codes

### 4.2 Test Code Selection

1. Add 2-3 diagnoses
2. Toggle "Billable" checkboxes
3. Select primary diagnosis (radio button)
4. Choose severity from dropdown
5. Reorder using ▲▼ arrows
6. Remove a diagnosis (✕)
7. Verify all functions work

### 4.3 Verify Note Save

1. Fill in clinical assessment fields
2. Click **Save Draft**
3. Verify auto-save works (check "Saving..." indicator)
4. Refresh page
5. Verify draft was restored

---

## Step 5: System Health Checks

### 5.1 Database Integrity

**Check for orphaned records:**
```sql
-- Notes without patients
SELECT COUNT(*)
FROM clinical_notes cn
LEFT JOIN patient_data pd ON cn.patient_id = pd.pid
WHERE pd.pid IS NULL;
```

**Expected:** 0

**Check diagnosis_codes JSON validity:**
```sql
SELECT id, patient_id, diagnosis_codes
FROM clinical_notes
WHERE note_type = 'diagnosis'
AND diagnosis_codes IS NOT NULL
AND JSON_VALID(diagnosis_codes) = 0;
```

**Expected:** 0 rows (all JSON should be valid)

### 5.2 Performance Check

**Index verification:**
```sql
SHOW INDEX FROM clinical_notes;
```

**Expected indexes:**
- idx_patient
- idx_provider
- idx_note_type
- idx_service_date
- idx_status

**Query performance test:**
```sql
EXPLAIN SELECT *
FROM clinical_notes
WHERE patient_id = 8
AND note_type = 'diagnosis'
AND status = 'signed'
ORDER BY service_date DESC
LIMIT 1;
```

**Expected:** Should use `idx_patient` and `idx_note_type`

---

## Step 6: User Training Setup

### 6.1 Create Test Patient

For training purposes, create a test patient:

```sql
-- Use OpenEMR patient creation interface
-- Or insert test patient (be careful in production!)
```

### 6.2 Create Sample Diagnosis Note

Have trainers create a sample diagnosis note with:
- 2 billable diagnoses (F41.1, F33.1)
- 1 non-billable Z-code (Z63.0)
- Full clinical documentation
- All fields completed

This serves as a reference for new users.

---

## Troubleshooting

### Problem: ICD-10 Search Returns No Results

**Cause:** Codes table is empty or not loaded

**Solution:**
1. Check codes table:
   ```sql
   SELECT COUNT(*) FROM codes WHERE code_type = 'ICD10';
   ```
2. If 0, import ICD-10 codes (Section 2)
3. Clear browser cache
4. Retry search

### Problem: "Not Authenticated" Error on Search

**Cause:** Session expired or API permissions

**Solution:**
1. Verify user is logged in
2. Check search_codes.php has correct session handling
3. Verify CORS headers if cross-origin

### Problem: Diagnosis Codes Not Saving

**Cause:** JSON serialization error or field too small

**Check:**
```sql
SELECT
  id,
  LENGTH(diagnosis_codes) as json_length,
  JSON_VALID(diagnosis_codes) as is_valid
FROM clinical_notes
WHERE note_type = 'diagnosis'
LIMIT 10;
```

**Fix:**
- Ensure diagnosis_codes is TEXT or JSON type (not VARCHAR)
- Check for special characters in descriptions

### Problem: Slow Search Performance

**Cause:** Missing indexes on codes table

**Solution:**
```sql
CREATE INDEX idx_codes_search
ON codes(code_type, code, code_text(100));

ANALYZE TABLE codes;
```

---

## Maintenance

### Annual ICD-10 Update

**When:** Every October 1
**What:** CMS releases updated ICD-10-CM codes

**Process:**
1. Download new ICD-10-CM file from CMS
2. Backup existing codes:
   ```sql
   CREATE TABLE codes_backup_2026 AS
   SELECT * FROM codes WHERE code_type = 'ICD10';
   ```
3. Mark old codes inactive:
   ```sql
   UPDATE codes
   SET active = 0
   WHERE code_type = 'ICD10';
   ```
4. Import new codes (Section 2)
5. Verify import
6. Update documentation

### Database Backups

**Recommended Schedule:**
- Full backup: Daily
- Transaction log backup: Hourly
- Test restore: Monthly

**Critical Tables:**
- clinical_notes
- note_drafts
- codes
- patient_data

---

## Security Considerations

### Access Control

- ✅ Diagnosis notes contain PHI - restrict access
- ✅ Only authenticated providers can search codes
- ✅ Session validation required on all APIs
- ✅ HIPAA audit logging enabled

### Data Retention

- ✅ Diagnosis notes: Permanent (7+ years legally required)
- ✅ Drafts: 30 days retention recommended
- ✅ Deleted notes: Mark inactive, don't hard delete

---

## Related Documentation

- [Diagnosis Note User Guide](./diagnosis-note.md) - For clinicians
- [Technical Architecture](./technical-architecture.md) - For developers
- [Clinical Notes README](./README.md) - Phase overview

---

**Setup Complete!** Your Mindline EMHR Clinical Notes system is ready for diagnosis documentation.
