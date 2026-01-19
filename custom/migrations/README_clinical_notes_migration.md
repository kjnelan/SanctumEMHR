# Clinical Notes Table Migration - Phase 4

## Overview
This migration upgrades the `clinical_notes` table from the legacy SOAP format to the new Phase 4 structure with support for:
- Multiple note types (Progress, Intake, Crisis, Discharge, Risk Assessment, etc.)
- Multiple templates (BIRP, PIRP, MSE, etc.)
- Risk tracking and assessment
- Supervision workflow
- Auto-save functionality
- UUID-based API security

## ⚠️ IMPORTANT: Backup First!

**ALWAYS backup your database before running migrations!**

```bash
# Create backup
mysqldump -u root -p openemr clinical_notes > clinical_notes_backup_$(date +%Y%m%d_%H%M%S).sql

# Or backup entire database
mysqldump -u root -p openemr > full_backup_$(date +%Y%m%d_%H%M%S).sql
```

## Running the Migration

### Option 1: Via MySQL Command Line
```bash
mysql -u root -p openemr < /path/to/upgrade_clinical_notes_phase4.sql
```

### Option 2: Via phpMyAdmin
1. Log into phpMyAdmin
2. Select the `openemr` database
3. Click the "SQL" tab
4. Copy and paste the contents of `upgrade_clinical_notes_phase4.sql`
5. Click "Go"

### Option 3: Via MySQL Client
```bash
mysql -u root -p
USE openemr;
SOURCE /path/to/upgrade_clinical_notes_phase4.sql;
```

## What This Migration Does

### 1. Adds New Columns
- `note_uuid` - UUID for API security
- `patient_id` - Replaces `client_id` (more consistent naming)
- `created_by` - Replaces `provider_id` (clearer purpose)
- `appointment_id` - Links notes to appointments
- `billing_id` - Links notes to billing transactions
- `template_type` - Supports BIRP, PIRP, SOAP, MSE, etc.
- `service_date`, `service_duration`, `service_location` - Service tracking
- `behavior_problem`, `intervention`, `response` - BIRP/PIRP fields
- `risk_present` - Boolean flag for risk tracking
- `goals_addressed`, `interventions_selected`, `client_presentation` - JSON structured data
- `diagnosis_codes` - ICD-10 codes as JSON
- `presenting_concerns`, `clinical_observations` - Additional documentation
- `symptoms_reported`, `symptoms_observed`, `clinical_justification` - Diagnosis note fields
- `differential_diagnosis`, `severity_specifiers`, `functional_impairment` - More diagnosis fields
- `supervisor_review_required`, `supervisor_reviewed_at`, etc. - Supervision workflow
- `last_autosave_at` - Auto-save timestamp

### 2. Migrates Existing Data
- Copies `client_id` → `patient_id`
- Copies `provider_id` → `created_by`
- Generates UUIDs for all existing notes
- Sets `service_date` from `created_at`
- Converts SOAP notes to BIRP format:
  - `subjective` + `objective` → `behavior_problem`
  - `assessment` → `response`
  - `plan` → `plan` (unchanged)

### 3. Preserves Legacy Columns
Old columns are renamed with `_legacy` suffix for backward compatibility:
- `client_id` → `client_id_legacy`
- `provider_id` → `provider_id_legacy`
- `encounter_id` → `encounter_id_legacy`
- `subjective` → `subjective_legacy`
- `objective` → `objective_legacy`
- `assessment` → `assessment_legacy`

**These can be dropped in a future migration once you're confident everything works.**

## Post-Migration Verification

After running the migration, verify the results:

```sql
-- Check that all notes have UUIDs
SELECT COUNT(*) as total_notes,
       COUNT(note_uuid) as notes_with_uuid,
       COUNT(patient_id) as notes_with_patient_id
FROM clinical_notes;

-- View sample of migrated data
SELECT id, note_uuid, patient_id, created_by, note_type,
       template_type, service_date, status
FROM clinical_notes
LIMIT 10;

-- Check for any NULL values in critical fields
SELECT COUNT(*) FROM clinical_notes WHERE note_uuid IS NULL;
SELECT COUNT(*) FROM clinical_notes WHERE patient_id IS NULL;
SELECT COUNT(*) FROM clinical_notes WHERE created_by IS NULL;
```

All three NULL checks should return 0.

## Testing After Migration

1. **Create a new note** - Try creating a Progress Note (BIRP)
2. **Auto-save** - Verify auto-save works
3. **Sign a note** - Try signing and finalizing a note
4. **View existing notes** - Check that old notes display correctly
5. **Risk Assessment** - Try creating a Risk Assessment note

## Rollback (If Needed)

If something goes wrong, restore from your backup:

```bash
# Drop the modified table
mysql -u root -p openemr -e "DROP TABLE clinical_notes;"

# Restore from backup
mysql -u root -p openemr < clinical_notes_backup_TIMESTAMP.sql
```

## Support

If you encounter any issues:
1. Check the error log: `tail -f /var/log/mysql/error.log`
2. Check column names: `DESCRIBE clinical_notes;`
3. Verify data migration: Run the verification queries above

## Next Steps After Migration

Once the migration is complete and tested:
1. Notes will save properly
2. Risk Assessment notes will work
3. You can proceed with integrating risk indicators into demographics
4. Future migrations can drop the `_legacy` columns

---
**Author:** Kenneth J. Nelan
**Copyright:** © 2026 Sacred Wandering
**License:** Proprietary and Confidential
