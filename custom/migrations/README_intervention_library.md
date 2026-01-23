# Intervention Library Migration

## Overview
This migration adds the intervention library system to support clinical note documentation with pre-defined intervention options organized by tier and modality.

## Tables Created

1. **treatment_goals** - Stores patient treatment goals for carry-forward
2. **intervention_library** - Contains pre-defined interventions organized by tier and modality
3. **user_favorite_interventions** - Tracks user's favorite interventions for quick access
4. **clinical_settings** - System settings for clinical documentation

## What Gets Seeded

### Clinical Settings (Default Values)
- `default_note_template`: 'BIRP'
- `require_supervisor_review`: 'false'
- `auto_lock_notes_after_days`: '7'
- `allow_post_signature_edits`: 'true'

### Intervention Library (52 Pre-defined Interventions)

**Tier 1: Core Interventions (12)** - Always visible
- Psychoeducation, Cognitive restructuring, Behavioral activation, etc.

**Tier 2: Modality-Specific (18)** - Organized by therapy type
- CBT (3 interventions)
- DBT (3 interventions)
- ACT (3 interventions)
- EMDR (3 interventions)
- IFS (3 interventions)
- Solution-Focused (3 interventions)

**Tier 3: Crisis/Risk (5)** - Shown when risk is flagged
- Suicide risk assessment, Crisis de-escalation, etc.

**Tier 4: Administrative (5)** - Clinical process interventions
- Coordination of care, Documentation review, etc.

## Running the Migration

### Option 1: Via MySQL Command Line
```bash
mysql -u root -p mindline < /home/user/Mindline/custom/migrations/add_intervention_library.sql
```

### Option 2: Via phpMyAdmin
1. Log into phpMyAdmin
2. Select the `mindline` database
3. Click the "SQL" tab
4. Copy and paste the contents of `add_intervention_library.sql`
5. Click "Go"

### Option 3: Via MySQL Client
```bash
mysql -u root -p
USE mindline;
SOURCE /home/user/Mindline/custom/migrations/add_intervention_library.sql;
```

## Verification

After running the migration, the script will automatically show:

1. **Tables Created** - Confirms all 4 tables were created
2. **Intervention Count by Tier** - Shows how many interventions per tier/modality

You should see:
- Tier 1, NULL: 12 interventions
- Tier 2, ACT: 3 interventions
- Tier 2, CBT: 3 interventions
- Tier 2, DBT: 3 interventions
- Tier 2, EMDR: 3 interventions
- Tier 2, IFS: 3 interventions
- Tier 2, Solution-Focused: 3 interventions
- Tier 3, NULL: 5 interventions
- Tier 4, NULL: 5 interventions

Total: 40 interventions

## Safety Notes

- Uses `CREATE TABLE IF NOT EXISTS` - safe to run multiple times
- Uses `INSERT ... ON DUPLICATE KEY UPDATE` - won't create duplicates
- No destructive operations
- Safe to run even if some tables already exist

## Next Steps

Once the migration is complete:
1. Intervention dropdowns in notes will populate automatically
2. Users can favorite specific interventions for quick access
3. Tier 3 (Crisis/Risk) interventions only appear when risk is flagged
4. Admins can add custom interventions via the system

---
**Author:** Kenneth J. Nelan
**Copyright:** © 2026 Sacred Wandering
**License:** Proprietary and Confidential
